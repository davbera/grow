/*var options = {
//		path : // (String) name of the path that is captured on the server side (/socket.io)
		multiplex:false,
//		reconnection: // (Boolean) whether to reconnect automatically (true)
		reconnectionAttempts : 5, //(Number) number of reconnection attempts before giving up (Infinity)
//		reconnectionDelay: // (Number) how long to initially wait before attempting a new reconnection (1000).
						   // Affected by +/- randomizationFactor, for example the default initial delay will be between 500 to 1500ms.
//		reconnectionDelayMax: // (Number) maximum amount of time to wait between reconnections (5000). Each attempt increases
							  //  the reconnection delay by 2x along with a randomization as above
//		randomizationFactor// // (Number) (0.5), 0 <= randomizationFactor <= 1
//		timeout: // (Number) connection timeout before a connect_error and connect_timeout events are emitted (20000)
//		autoConnect: // (Boolean) by setting this false, you have to call manager.open whenever you decide it's appropriate
	};
*/

var SocketClient = (function(){
	var socketclient = {};
	var socket;


	socketclient.initialize = function(sessionId) {
		try {
			var url = '/grow';
			var options = {
				multiplex:false,
				reconnectionAttempts : 5, //(Number) number of reconnection attempts before giving up (Infinity)
			};
			if (sessionId !== null) {
				options.query = "sessionId=" + sessionId;
			}
			socket = io(url,options);

		} catch(e){
			console.log('undefined io namespace');
		}
	}

/*	socketclient.connect = function () {
		try {
			socket.on('connect',function() {
				console.log(socket.id);
			});
		} catch (e){
			console.log('socket not initialized');
		}
	}
*/

	socketclient.play = function (func) {
		try {
			socket.emit('play');

			socket.on('dataSimulation', function(data){
				if (func != null && typeof func === 'function') {
					func(data);
				}
			});
		} catch (e){
			console.log('socket not initialized');
		}
	}

	socketclient.stepSimulation = function (func) {
		try {
			socket.emit('step');

			socket.on('dataSimulation', function(data){
				socket.removeListener('dataSimulation');
				if (func != null && typeof func === 'function') {
					func(data);
				}
			});
		} catch (e){
			console.log('socket not initialized');
		}
	}

	socketclient.pause = function () {
		try {
			socket.emit('pause');
			socket.removeListener('dataSimulation');
		} catch (e){
			console.log('socket not initialized');
		}
	}

	socketclient.disconnect = function () {
		try {
			socket.disconnect();
		} catch (e) {
			console.log(e);
		}

	}


	return socketclient;
});
