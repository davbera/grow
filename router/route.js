var url = require('url');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable'); // Receive files
const spawn = require('child_process').spawn; //Create child
var baseDirectory = __dirname;

//var webContentFolder = baseDirectory + "/public"; -> Error devuelve: /home/grow/nodejs/GROserver/router/public/
var webContentFolder = '/home/grow/nodejs/GROserver/public/';
var sessionManagement = require('../sessionManagement');

var Router = module.exports = {
  handleRequest: function(request,response){

    try {
      var requestUrl = url.parse(request.url, true);
      var pathname = requestUrl.pathname;
      var method = request.method;

      response.writeHead(200, {'Content-Type':'text/html'});
      if (pathname === '/grow') {
        if (method === 'GET') {
          var fsPath = webContentFolder + '/index.html';
          var fileStream = fs.createReadStream(fsPath);
          fileStream.pipe(response);
          fileStream.on('error',function(e){
            response.writeHead(404);
            response.end();
            console.log(e);
          });
        } else if (method === 'POST'){
          var form = new formidable.IncomingForm();
          //	  form.encoding = 'utf-8';
          form.uploadDir = '/home/grow/nodejs/GROserver/tmp';
          form.keepExtensions = true;
          form.parse(request, function (err, fields, files) {
            if (!err){
              var groFilePath = files.file.path;

              try {
                var grow = spawn('/home/grow/workspace/gro-lia/gro_Release/grow',[groFilePath]);
                var session = sessionManagement.createSession();
                session.setGrowProcess(grow);

                var json = "";

                var sendGrowData = (data) => {
                  if (data.toString() === 'END') {
                    response.writeHead(200, {'Content-Type':'application/json', 'grow-session':session.getSessiondId()});
                    response.end(json);
                    grow.stdout.removeListener('data',sendGrowData);
                  } else {
                    json += data.toString();
                  }
                };

                grow.stdout.on('data', sendGrowData);

                /*No se utiliza porque el final del fichero o indica un END
                grow.stdout.on('end', () => {
                  console.log('end received');
                response.writeHead(200, {'Content-Type':'application/json', 'grow-session':session.getSessiondId()});
                  response.end(json);
                  json = "";
                });*/
               
                grow.on('readable', () => {
                  var data =  grow.stderr.read();
                  console.log(`stderr: ${data}`);
                });

                grow.on('exit',(code, signal) => {
                  console.log(`child process exited with code ${code}`);
                  console.log(`child error signal ${signal}`);
                  fs.unlink(groFilePath, err => {
                    if (err) console.log(err);
                  });
                  sessionManagement.remove(session.getSessiondId());
                });
              } catch (e){
                response.end();
              }
            } else {
              response.end();
            }
          });
        }
      } else if (/\.js$/i.test(pathname)) {
        response.writeHead(200, {'Content-Type':'text/javascript'});
        var fsPath = webContentFolder + "//"+ pathname;
        var fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(response);
        fileStream.on('error',function(e){
          response.writeHead(404);
          response.end();
          console.log(e);
        });
      } else if (/\.css$/i.test(pathname)) {
        response.writeHead(200, {'Content-Type':'text/css'});
        var fsPath = webContentFolder + "//"+ pathname;
        var fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(response);
        fileStream.on('error',function(e){
          response.writeHead(404);
          response.end();
          console.log(e);
        });
      } else if (/\.png$/i.test(pathname)) {
        var fsPath = webContentFolder + "//"+ pathname;
        var fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(response);
        fileStream.on('error',function(e){
          response.writeHead(404);
          response.end();
          console.log(e);
        });
      } else {
        response.writeHead(500);
        response.end();
      }

    } catch(e){
      response.writeHead(500);
      response.end();
      console.log(e.stack);
    }
  }
}
