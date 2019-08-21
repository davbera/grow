'use strict';

/**
 * Module dependencies.
 */
const EventEmitter = require('events');


/**
 * Main session class. Each Session has a session identifier
 */
class Session extends EventEmitter {
	constructor(sessionId) {
		super();
    	this.sessionId = sessionId;
  	}
	getSessiondId() {
		return this.sessionId;
	}
}

class GrowSession extends Session {
	constructor(sessionId) {
		super(sessionId);
	}

	setGrowProcess(grow) {
		if (grow != null) 
			this.grow = grow;
	}
	setSocketId(socketId){
		if (socketId != null)
			this.socketId = socketId;
	}
	getGrowProcess() {
		return this.grow;
	}
	getSocketId() {
		return this.socketId;
	}
}

var GrowSessionManagement = (function(){
	var growSessionId = 1;
	var sessions = [];

	function indexOf (sessionId) {
		for (var i in sessions) {
			if (sessions[i].getSessiondId() == sessionId)
			return i;
		}
		return null;
	}

	function indexOfBySocketId(socketId) {
		for (var i in sessions){
			if (sessions[i].socketId == socketId)
			return i;
		}
		return null;
	}

	function add(session) {
		sessions.push(session);
	}

	return {
		createSession: function() {
			//var sessionId = generateId();
			var sessionId = growSessionId++;
			var session = new GrowSession(sessionId);

			add(session);
			console.log('sessionManagement - Se ha creado nueva sesion, el numero de sesiones es: '+ sessions.length);
			console.log('sessionManagement - Las sesiones existentes son: '); console.log(`${sessions}`);
			return session;
		},

		remove: function(sessionId) {
			console.log('sessionManagement - se va a proceder a eliminar la sesion ' + sessionId);
			var index = indexOf(sessionId);

			var session = this.getSessionById(sessionId);
			if (session != null) {
				if (session.grow != null) {
					console.log('sessionManagement - se va a eliminar el proceso grow ' + session.grow.pid);
					session.grow.kill('SIGTERM');
				}
//				session.emit('remove');
				if(index != null) {
					sessions.splice(index,1);
				} 
				console.log('sessionManagement - No se ha podido eliminar la sesion ' + sessionId + ' porque no existe.');
			}
			console.log('sessionManagement - El numero de sesiones tras la eliminacion es '+ sessions.length);
		},
		removeGrow: function (sessionId) {
			var index = indexOf(sessionId);
			var session = this.getSessionById(sessionId);
			if (session != null) {
				session.grow = null;
				if (session.socketId != null) {
					session.socketId = null;
				}  else if (index != null) {
					sessions.splice(index,1);
				}
			}
		},
		removeSocket: function (sessionId) {
			var session = this.getSessionById(sessionId);
			var index = indexOf(sessionId);
			if (session != null) {
				session.socketId = null;
				if (session.grow != null) {
					session.grow.kill('SIGTERM');
					session.grow = null;
				} else if (index != null) {
					sessions.splice(index,1);
				}
			}
		},
		getSessionById: function(sessionId) {
			var index = indexOf(sessionId);
			if(index != null) {
				return sessions[index];
			} else {
				return null;
			}
		},

		getSessionBySocketId: function(socketId) {
			var index = indexOfBySocketId(socketId);
			if(index != null) {
				return sessions[index];
			} else {
				return null;
			}
		},
		getSessions: function() {
			return sessions;
		}
	}
})();


module.exports = GrowSessionManagement;
