var sessionManagement = require('./sessionManagement');
var sockets = [];

function indexOf(socketId) {
		for (var i in sockets) {
			if (sockets[i] == socketId)
				return i;
		}
		return null;
}


module.exports = {
    listen : function(io){
	io.of('/grow').on('connection', function(socket) {
	console.log('websocket - Alguien inicio conexion con websockets');

	 var sessionId = socket.handshake.query.sessionId;

	    var session = sessionManagement.getSessionById(sessionId);
	    if (!session) {
		console.log('websocket - No existe sesion, no se establece conexion');
		socket.disconnect(true);
		return;
	    }


	    sockets.push(socket.id);

	    session.socketId = socket.id;
	    session.on('remove', () => {
		console.log('websocket - Sesion eliminada');
		var indexOfSocket = indexOf(socket.id);
		sockets.splice(indexOfSocket,1);
		socket.disconnect(true);
	    });

		var grow = session.getGrowProcess();
	if (grow != null) {
		var json = "";
		var sendData = (data) => {
		    if (data.toString() === 'END') {
			console.log("Envio de datos\n");
			socket.emit('dataSimulation',json);
			json = "";
		    } else {
			json += data.toString();
		    }
		};

	var defaultReadData = (data) => {};


	    socket.on('step', () => {
		grow.stdout.removeAllListeners('data');
		console.log(socket.id + " : " + 'step');
		grow.kill('SIGUSR1');

		grow.stdin.write("STEP\n", () => {
			   console.log('Se ha enviado "STEP" al proceso '+ grow.pid);
		});

		grow.stdout.on('data', sendData);

	    });

	    socket.on('play', () => {
		grow.stdout.removeAllListeners('data');
		console.log(socket.id + " : " + 'play');

		grow.kill('SIGUSR1');
		grow.stdout.on('data', sendData);

		grow.stdin.write("PLAY\n", () => {
			console.log('Se ha enviado "PLAY" al proceso '+ grow.pid);
		});

		

	    });

	    socket.on('pause', function(){
		console.log(socket.id + " : " + 'pause');
		grow.kill('SIGUSR1');

	//	grow.stdout.removeAllListeners('data');

	/*	grow.stdin.write("STOP\n", () => {
			console.log('Se ha enviado "STOP" al proceso '+ grow.pid);
		});
	*/	
	    });
	}
	    socket.on('disconnect', (reason) => {
		console.log('websocket - Socket disconected ' + reason);
		sessionManagement.remove(sessionId);
		socket.disconnect(true);
	    });

	});

	return io;
    },
    
    removeAll : function() {
		console.log('websocket - Remove all Sockets. Sockets length is ' + sockets.length);
		console.log(sockets);
		for (var i in sockets) {
		    var idSocket = sockets[i];
		    var session = sessionManagement.getSessionBySocketId(idSocket);
		    if (session !== null) {
			var sessionId = session.getSessiondId();
			sessionManagement.remove(sessionId);
		    }
		}
    }
}
