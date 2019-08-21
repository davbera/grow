#!/usr/local/nodejs/bin/node

var http = require('http');
var config = require ('./config/config');
var router = require ('./router/route');
const fs = require('fs');
const path = require('path');


var port = config.port;
var hostname = config.hostname || 'localhost';

var httpServer = http.createServer( router.handleRequest );


//var io = require('./websocket').listen(httpServer);

if (moduleAvailable('socket.io')) {
  var io = require('socket.io')(httpServer);
	require('./websocket').listen(io);
} else {
	console.log('ERROR: WebSocket not initalized');
}

/*Elimina los ficheros gro creados en ./tmp */
var tmpdir = '/home/grow/nodejs/GROserver/tmp';
fs.readdir(tmpdir, (err, files) => {
  console.log('Removing files from ' + tmpdir);
  if (err) throw error;

  for (const file of files) {
    fs.unlink(path.join(tmpdir, file), err => {
      if (err) throw error;
    });
  }
  console.log('SUCCESS: Files removed from ' + tmpdir);
});

process.on('SIGINT', function(){
  console.log('server - Se va a cerrar el servidor');
  require('./websocket').removeAll();
  process.exit();
});

httpServer.listen(port,hostname, function(){
  console.log('Server listening on '+httpServer.address().address + ":" + httpServer.address().port);
});


process.on('uncaughtException', function(error) {
console.error((new Date).toUTCString() + ' uncaughtException:', error.message)
console.error(error.stack);
})

/**************************************/

function moduleAvailable(name) {
    try {
        require.resolve(name);
        return true;
    } catch(e){}
    return false;
}
