var sc, render;
var world = new World;
var selectedCells = [];
var centerSelection = {};

window.onload = function(){
	startCanvas();
	//slider();
}


function startCanvas(){
	var canvasId = 'simulationContent';
	var canvas = document.getElementById(canvasId);
	if (canvas !== null) {
		var ctx = canvas.getContext("2d");

		if (ctx !== null){
			ctx.font = '14px Arial';
			ctx.textAlign = "center";
			//ctx.fillStyle = "#808080";
			ctx.fillStyle = "#000000"
			ctx.fillText('Click "Open" to open a program. Then click "Start".',canvas.width/2, canvas.height/2);
		}
	} else {
		console.log("%c Se ha producido un error al obtener el elemento canvas con identificador '" + canvasId + "'.",'color: red');
	}
}


/********************************/


function loadFile(){
	var canvas = document.getElementById('simulationContent');

	if (!canvas) {
		console.log('ERROR: Canvas no encontrado');
		return;
	}

	var url = '/grow';

	var formData = new FormData(document.querySelector("form"));
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);

	

	//onreadystatechange
	xhr.onload = function() {
		if(xhr.readyState == 4 && xhr.status == 200) {
			render = Render();
			render.webGLStart(canvas);

			var data = xhr.responseText; //json
			if (data != null) {
					Logger.empty();
				
					var oJson = parseJSON(data); //object json
					world.create(oJson);
					world.drawWorld();
					
					activarBoton('moveUp',moveUp);
					activarBoton('moveDown',moveDown);
					activarBoton('moveRight',moveRight);
					activarBoton('moveLeft',moveLeft);
					activarBoton('zoomIn',zoomIn);
					activarBoton('zoomOut',zoomOut);
					activarBoton('resetPosition',resetPosition);

					var idSession = xhr.getResponseHeader('grow-session');
					if (sc != null) {
						console.log("se va a procedes a desconectar");
						sc.disconnect();
					}
					sc = SocketClient();
					sc.initialize(idSession);
					var element;
					if (sc != null) {
						initCanvasSelection(document.getElementById('simulationContent'));
						activarBoton('step',nextStepSimulation);
						activarBoton('start',startSimulation);

					} else {
						Logger.write("Se ha producido un error al establecer conexión con el servidor");
					}


			} else {
				console.log('No se ha obtenido ningún dato en la respuesta');
			}
		} else {
			console.log('Se ha producido un error al recibir los datos');
		}
	}
	xhr.send(formData);
}


function nextStepSimulation(){
	sc.stepSimulation(function(data){
		if (data !== null) {
			var oJson;
			if (typeof data === 'object') {
				oJson = data;
			}
			else if (typeof data === 'string') {
				oJson = parseJSON(data); //object json
			}

			if (oJson !== null) {
				world.create(oJson);
				world.drawWorld();
			}
		}
	});
}

function startSimulation(){
	var play =  document.getElementById('start');
	if (play != null) {
		play.classList.add('hidden');
		play.classList.add('disable');
		play.removeEventListener("click", startSimulation);
	}

	var stop = document.getElementById('stop');
	if (stop != null) {
		stop.classList.remove("disable");
		stop.classList.remove("hidden");
		stop.addEventListener("click", pauseSimulation, false);
	}

	var step = document.getElementById('step');
	if (step != null) {
		step.classList.add("disable");
		step.removeEventListener("click", nextStepSimulation);
	}

	sc.play(function(data){
		if (data !== null) {
			var oJson;
			if (typeof data === 'object') {
				oJson = data;
			}
			else if (typeof data === 'string') {
				oJson = parseJSON(data); //object json
			}

			if (oJson !== null) { 
				world.create(oJson);
				world.drawWorld();
			}
		}
	});
}


function zoomIn(){
	if (render.zoom < -50) {
		render.zoom += (render.zoom < -100) ? 100 : 25;
		render.drawScene();
	}
}

function zoomOut(){
	if (render.zoom > -10000) {
		render.zoom -= (render.zoom < -5) ? 100 : 25;
		render.drawScene();
	}
}

function moveLeft(){
	render.viewCenter.x += 50;
	render.drawScene();
}

function moveRight(){
	render.viewCenter.x -= 50;
	render.drawScene();
}

function moveDown(){
	render.viewCenter.y += 50;
	render.drawScene();
}

function moveUp() {
	render.viewCenter.y -= 50;
	render.drawScene();
}

function resetPosition(){
	render.viewCenter.x = 0;
	render.viewCenter.y = 0;
	render.zoom = -800;
	render.drawScene();
}

function centerSelectionPosition() {
	render.viewCenter.x = centerSelection.x;
	render.viewCenter.y = centerSelection.y;
	render.drawScene();
}

function reLoadFile(){
}


function pauseSimulation(){
	sc.pause();

	var stop =  document.getElementById('stop');
	if (stop != null) {
		stop.classList.add('hidden');
		stop.classList.add('disable');
		stop.removeEventListener("click", pauseSimulation);
	}

	var start = document.getElementById('start');
	if (start != null) {
		start.classList.remove("disable");
		start.classList.remove("hidden");
		start.addEventListener("click", startSimulation, false);
	}

	activarBoton('step',nextStepSimulation);
}




/***Nuevas funcionalidades****/

function selectCells(X1, Y1, X2, Y2) {
	var p1 = render.viewportToModelCoordinates(X1,Y1);
	var p2 = render.viewportToModelCoordinates(X2,Y2);
	selectedCells = [];
	for (i in world.Cells) {
		var cell = world.Cells[i]
		if (cell.isInside(p1.x,p1.y, p2.x,p2.y)) {
			selectedCells.push(cell);
		}
	}
}

function getMousePosition(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function initCanvasSelection(canvas) {
	var viewportOffset = canvas.getBoundingClientRect();
	var top = viewportOffset.top;
	var left = viewportOffset.left;

	//Coordenadas del raton en el canvas (no en la ventana)
    var mouse = {
        x: 0,
        y: 0,
        startX: 0,
        startY: 0
    };

    function setMousePosition(e) {
        var ev = e || window.event; //Moz || IE
        var mousePos = getMousePosition(canvas,ev);
        mouse.x = mousePos.x;
        mouse.y = mousePos.y;
       
/*        if (ev.pageX) { //Moz
            mouse.x = ev.pageX + window.pageXOffset;
            mouse.y = ev.pageY + window.pageYOffset;
        } else if (ev.clientX) { //IE
            mouse.x = ev.clientX + document.body.scrollLeft;
            mouse.y = ev.clientY + document.body.scrollTop;
        } */
    };

    var element = null;
    var canvasParentBlock = canvas.parentElement;

    if (canvasParentBlock != null) {
	    canvasParentBlock.onmousemove = function (e) {
	        setMousePosition(e);
	        if (element !== null) {
	            element.style.width = Math.abs(mouse.x - mouse.startX ) + 'px';
	            element.style.height = Math.abs(mouse.y - mouse.startY ) + 'px';
	            element.style.left = (mouse.x - mouse.startX < 0) ? mouse.x + left + 'px' : mouse.startX + left + 'px';
	            element.style.top = (mouse.y - mouse.startY < 0) ? mouse.y  + top + 'px' : mouse.startY + top + 'px';
	        }
	    }

	    canvasParentBlock.onmousedown = function (e) {
	        if (element != null) {
				canvasParentBlock.removeChild(element);
	            element = null;
	        } else {
	            mouse.startX = mouse.x;
	            mouse.startY = mouse.y;
	            element = document.createElement('div');
	            element.style.left = mouse.x + left + 'px';
	            element.style.top = mouse.y + top + 'px';
				element.style.border = "3px dashed #FF0000";
				element.style.position = "absolute";

	            canvasParentBlock.appendChild(element);
	        }
	    }

	    canvasParentBlock.onmouseup = function (e) {
	        if (element != null) {     	
				canvasParentBlock.removeChild(element);
				var X1 = Math.min ( mouse.startX, mouse.x );
    			var X2 = Math.max ( mouse.startX, mouse.x );
    			var Y1 = Math.min( mouse.startY, mouse.y );
    			var Y2 = Math.max( mouse.startY, mouse.y ); 
				selectCells(X1, Y1, X2, Y2);
				render.drawSelectedCells(selectedCells);

				if (selectedCells.length > 0) {
					var p1 = render.viewportToModelCoordinates(X1,Y1);
					var p2 = render.viewportToModelCoordinates(X2,Y2);
					console.log(p1);
					console.log(p2);
					centerSelection.x = (p1.x - p2.x) / 2;
					centerSelection.y = (p1.y + p2.y) / 2;
					activarBoton('targetSel', centerSelectionPosition);
				} else {
					centerSelection.x = 0;
					centerSelection.y = 0;
					disableButton('targetSel', centerSelectionPosition);
				}
	            element = null;
	        }
	    }
	}
}




function disableButton(id, fun) {
	var button = document.getElementById(id);
	if (button != null) {
		button.classList.add("disable");
		button.removeEventListener("click", fun);
	}
}



function activarBoton (id, fun) {
	var element = document.getElementById(id);
	if (element != null && fun != null) {
		element.addEventListener('click', fun, false);
		if (element.classList.contains('disable'))
			element.classList.remove('disable');
	} else {
		console.log('No se ha podido activar el elemento ' + id);
	}
}

function slider(){
	var content = document.getElementById('content');
	var screen = document.getElementById('screen');
	var slider = document.querySelector('.slider');
	var logger = document.getElementById('logger');

	slider.addEventListener('mousedown', function() {
		content.addEventListener('mousemove', slideVentana = function (e){
			var position = e.pageY ;
			var screenHeight = window.screen.height;
			var percentage = ( screenHeight - position ) / screenHeight * 100 ;

			screen.style.height = 100 - percentage + '%';
			logger.style.height = percentage + '%';
		}, false);
	}, false);

	content.addEventListener('mouseup', function(e){
	//	if (content.hasAttribute('mousemove')) {
			content.removeEventListener('mousemove',slideVentana);
	//	}
	});
}





/*** JSON to javascript object ***/
function parseJSON(data){
	var obj;
	try {
		obj = JSON.parse(data);
	} catch(ex){

	}
	return obj;
}








/***Objets *********/
function World(){
	this.Cells = [];
	this.Signals = [];
}

World.prototype.create = function(data){
	if (data !== null && typeof data === 'object') {
		if (data.cells != null) {
			this.initCells(data.cells);
		}
		if (data.signals != null) {
			this.initSignals(data.signals);
		}
		if (data.information != null){
			var element = document.getElementById('informationPanel');
			if (element != null){
				var html = "<p>";
				html += "Cells: " + parseInt(data.information[0].population) + ", Max: " +
				 parseInt(data.information[0].max_population) + ", t = " + data.information[0].t + " min";
				html += "</p>";
				element.innerHTML = html;
			}
		}
		return this;
	}
}

World.prototype.initCells = function(cells) {
	this.Cells = [];
	for (var i=0; i < cells.length; i++){
		var cell = cells[i];
		var id = Number(cell.id);
		var posx = Number(cell.posx);
		var posy = Number(cell.posy);
		var length = Number(cell.length);
		var width = Number(cell.width);
		var angle = Number(cell.angle);//degToRad(Math.random()*100);
		var r = Number(cell.r);
		var g = Number(cell.g);
		var b = Number(cell.b);
		if (id != null && posx != null && posy != null && length != null && width != null && angle != null && r != null && g != null && b != null) {
		    this.Cells.push(new Cell(id, posx, posy, length, width, angle, r, g, b));
		}
	}
}

World.prototype.initSignals = function (signals) {
	this.Signals = [];
	for (var i = 0; i < signals.length; i++) {
		var signal = signals[i];
		var x = Number(signal.x);
		var y = Number(signal.y);
		var w = Number(signal.w);
		var h = Number(signal.h);
		var r = Number(signal.r);
		var g = Number(signal.g);
		var b = Number(signal.b);
		if (x != null && y != null && h != null && w != null && r != null && g != null && b != null) {
			this.Signals.push(new Signal(x, y, h, w, r, g, b));
		}
	}
}

World.prototype.drawWorld = function(){
	try {
		render.initCellBuffers(this.Cells);
	} catch(e){
		console.log('Error al iniciar el buffer de celulas');
		console.log(e);
	}
	try {
		render.initSignalsBuffers(this.Signals);
	} catch(e){
		console.log('Error al iniciar el buffer de señales');
		console.log(e);
	}
	try {
		render.drawScene();	
	} catch(e){
		console.log('Error al pintar el mundo');
		console.log(e);
	}
}



function Cell(id, posx, posy, length, width,angle, r, g, b){
	this.id = id;
	this.posx = posx;
	this.posy = posy;
	this.length = length;
	this.width = width;
	this.angle = angle;
	this.r = r;
	this.g = g;
	this.b = b;
	this.selected = false;
}

Cell.prototype.contains = function(mx, my) {
  var hLength = this.length/2;
  var lengthRight = this.posx + hLength;
  var lengthLeft = this.posx - hLength;

  var hWidth = this.width/2;
  var widthUp = this.posy + hWidth;
  var widthDown = this.posy - hWidth;

  return  (lengthLeft <= mx) && (lengthRight >= mx) &&
          (widthDown <= my) && (widthUp >= my);
}



/* Función que comprueba si la celula esta en el cuadrado 
	ix, iy son los vertices superiores izquierdo
	fx, fy son los vertices inferiores derecho
	ix, iy, fx, fy estan en medidas de la vista mundo

*/
Cell.prototype.isInside = function (ix, iy, fx, fy) {
	var hLength = this.length/2;
	var lengthRight = this.posx + hLength;
	var lengthLeft = this.posx - hLength;

	var hWidth = this.width/2;
	var widthUp = this.posy + hWidth;
	var widthDown = this.posy - hWidth;
//	console.log('ix=' + ix + ', iy=' + iy + ', fx=' + fx + ',fy=' + fy + ' | x=' + this.posx + ', y=' +this.posy);
    // (1) El centro de la célula se encuentra en el cuadrado
	if (ix <= this.posx && this.posx <= fx &&  fy <= this.posy && this.posy <= iy) {
//		console.log('La celula con id ' + this.id + " ha sido seleccionada");
		return true;
	}
	else {
		//Comprueba si un pico de la longitud esta en el cuadrado
		var p1x = this.posx+hLength*Math.cos(this.angle);
		var p1y = this.posy+hLength*Math.sin(this.angle);
		var p2x = this.posx-hLength*Math.cos(this.angle);
		var p2y = this.posy+hLength*Math.sin(this.angle);
		if ((ix <= p1x && p1x <= fx && fy <= p1y && p1y <= iy) || (ix <= p2x && p2x <= fx && fy <= p2y && p2y <= iy)) {
//			console.log('La celula con id ' + this.id + " ha sido seleccionada");
			return true;
		}
	}

	return false;
}


function Signal(x, y, h, w, r, g, b) {
	this.x = x;
	this.y = y;
	this.h = h;
	this.w = w;
	this.r = r;
	this.g = g;
	this.b = b;
}



var Logger = (function(){
	var logger;
	
	function getLogger(){
		logger = document.getElementById('logger');
	}
	return {
		writeHead: function(mensaje) {
			getLogger();
			if (logger != null && mensaje != null) {
				var para = document.createElement("h1");
				var node = document.createTextNode(mensaje);
				para.appendChild(node);

				logger.appendChild(para);
			}
		},
		
		write: function(mensaje){
			getLogger();
			if (logger != null && mensaje != null) {
				var para = document.createElement("p");
				var node = document.createTextNode(mensaje);
				para.appendChild(node);

			//	var html = "<p>" + mensaje + "</p>";
				logger.appendChild(para);
			}
		},

		empty: function(){
			getLogger();
			if (logger != null) {			
				logger.innerHTML = "";
			}
		}
	}	
})();
