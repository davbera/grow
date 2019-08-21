
var Render = (function(){
	var render = {
		zoom : -800,
		viewCenter : {x:0.0, y:0.0}
    };
    var gl;

    var shaderProgram;
    var glBuffers = { };


    function initGL(canvas) {
		var newCanvas = canvas.cloneNode(false);
		canvas.parentNode.replaceChild(newCanvas, canvas);
		canvas = newCanvas;

		try {
		    gl = canvas.getContext('webgl2', {alpha: false});
			//gl = canvas.getContext('experimental-webgl');
		    //	gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		    gl.viewportWidth = canvas.width;
		    gl.viewportHeight = canvas.height;
		  //ext = gl.getExtension('OES_element_index_uint');
		} catch (e) {
		    console.log('Se ha producido un error al iniciar webGL');
		}
    }

    function initShaders() {
		if (gl !== null) {
		    var fragmentShader = getShader(gl, "shader-fs");
		    var vertexShader = getShader(gl, "shader-vs");

		    shaderProgram = gl.createProgram();

		    gl.attachShader(shaderProgram, vertexShader);
		    gl.attachShader(shaderProgram, fragmentShader);
		    gl.linkProgram(shaderProgram);

		    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
				alert("No pueden iniciarse los shaders");
				return false;
		    }

		    gl.useProgram(shaderProgram);

		    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

		    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
		}
    }

    function deleteBuffers() {
    	var buffers = Object.values(glBuffers);
    	buffers.forEach((buffer) => {
    		if (buffer instanceof  WebGLBuffer)
    			gl.deleteBuffer(buffer);
    	});
    	glBuffers = {};
    }


    render.webGLStart = function(canvas) {
		if (canvas != null) {
		    initGL(canvas);

		    if (!gl) {
				console.log('Se ha producido un error al iniciar webgl');
				return;
		    }
		    initShaders();
		}
    }


    render.initCellBuffers = function(cells){
    	deleteBuffers(); 

		if (gl != null) {
		    const PI = Math.PI;
		    const FINENESS = 7;
		    const DA = PI / FINENESS;
		    const OFFSET = DA * 0.5;

		    var vertex = [];
		    var colors = [];
		    var indexData = [];
		    var indexBorder = [];

		    for (var index=0; index<cells.length; index++) {
				//Obtiene posx, posy, height,width, angle
				var nVertexInserted = 1;
				var cell = cells[index];

				var radius = cell.width / 2;
				var hLength = cell.length / 2 - radius;
				var theta = cell.angle - PI * 0.5;
				var rotation = cell.angle;
				var x0 = cell.posx;
				var y0 = cell.posy;
				var r = cell.r;
				var g = cell.g;
				var b = cell.b;
				var saturation = 0.75;

				vertex.push(x0); vertex.push(y0);
				colors.push(r); colors.push(g),colors.push(b);colors.push(saturation);

				// rotacion sobre el propio eje
				var p1x = hLength*Math.cos(rotation)+x0;
				var p1y = hLength*Math.sin(rotation)+y0;
				var p2x = -hLength*Math.cos(rotation)+x0;
				var p2y = -hLength*Math.sin(rotation)+y0;

				// laterales de la celula
				for (var a = theta; a <= theta+PI+OFFSET; a+=DA, nVertexInserted++){
				    var cx = p1x + radius*Math.cos(a);
				    var cy = p1y + radius*Math.sin(a);
				    vertex.push(cx); vertex.push(cy);

				    colors.push(r); colors.push(g);colors.push(b);colors.push(saturation);
				}

				for (var a = theta+PI; a <= theta+2*PI+OFFSET; a+=DA,nVertexInserted++){
				    var cx = p2x + radius*Math.cos(a);
				    var cy = p2y + radius*Math.sin(a);
				    vertex.push(cx); vertex.push(cy);

				    colors.push(r); colors.push(g);colors.push(b);colors.push(saturation);
				}

				var first = index*nVertexInserted; //valor central
				for (var cont = 0; cont < nVertexInserted-2; cont++){
				    var second = first+cont+1;
				    var third = second+1;

				    indexData.push(first);
				    indexData.push(second);
				    indexData.push(third);

				    indexBorder.push(second);
				}


				var second = first+1;
				var third = first+nVertexInserted-1;
				indexData.push(first);
				indexData.push(second);
				indexData.push(third);

				indexBorder.push(third);
		    }

		    //Crea el buffer de vertices
		    glBuffers.vertexObject = gl.createBuffer();
		    //Linka el buffer al array adecuado
		    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.vertexObject);
		    //Almacena los datos en GPU
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.DYNAMIC_DRAW);
		    gl.bindBuffer(gl.ARRAY_BUFFER, null);

		    //Crea el buffer de colores
		    glBuffers.colorObject = gl.createBuffer();
		    //Linka el buffer al array adecuado
		    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.colorObject);
		    //Almacena los datos en GPU
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		    glBuffers.colorObject.numItems = 2*vertex.length;
		    gl.bindBuffer(gl.ARRAY_BUFFER, null);

		    //Crea el buffer de índices
		    glBuffers.numIndices = indexData.length;
		    glBuffers.indexObject = gl.createBuffer();
		    //Linka el buffer al array adecuado
		    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffers.indexObject);
		    //Almacena los datos en GPU
		    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indexData), gl.STREAM_DRAW);
		    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


		    //Crea el buffer de indices de bordes
		    glBuffers.numIndicesBordes = indexBorder.length;
		    glBuffers.cellsLength = cells.length;
		    glBuffers.indexBorderObject = gl.createBuffer();
		    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffers.indexBorderObject);
		    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indexBorder), gl.STREAM_DRAW);
		    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}
    }

   render.initSignalsBuffers = function(signals) {
		if (gl !== null) {	

		    var vertex = [];
		    var colors = [];
		    var indexVertex = [];

		    for (var index=0; index<signals.length; index++) {
				var iIVertex = index*4;
				var signal = signals[index];
				var x = signal.x;
				var y = signal.y;
				var height = signal.h;
				var width = signal.w;
				var saturation = Math.max(signal.r, signal.g, signal.b);
				var r = signal.r / saturation;
				var g = signal.g / saturation;
				var b = signal.b / saturation;
			//	var saturation = 1;

				vertex.push(x); vertex.push(y);
				vertex.push(x+width); vertex.push(y);
				vertex.push(x); vertex.push(y-height);
				vertex.push(x+width); vertex.push(y-height);

				for (var j=0; j<4; j++) {
					colors.push(r); colors.push(g); colors.push(b);colors.push(saturation);
				}
				indexVertex.push(iIVertex,iIVertex+1,iIVertex+2,iIVertex+1,iIVertex+2,iIVertex+3);
		    }

		    //Crea el buffer de vertices
		    glBuffers.vertexSignals = gl.createBuffer();
		    //Linka el buffer al array adecuado
		    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.vertexSignals);
		    //Almacena los datos en GPU
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.DYNAMIC_DRAW);
		    gl.bindBuffer(gl.ARRAY_BUFFER, null);

		    //Crea el buffer de colores
		    glBuffers.colorSignals = gl.createBuffer();
		    //Linka el buffer al array adecuado
		    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.colorSignals);
		    //Almacena los datos en GPU
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		    gl.bindBuffer(gl.ARRAY_BUFFER, null);

		    //Crea el buffer de índices
			glBuffers.numIndicesSignal = indexVertex.length;
		    glBuffers.indexSignals = gl.createBuffer();
		    //Linka el buffer al array adecuado
		    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffers.indexSignals);
		    //Almacena los datos en GPU
		    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indexVertex), gl.STREAM_DRAW);
		    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);	
		}
    }



    render.drawScene = function (){

		if (gl != null) {
		    // Set clear color to black, fully opaque
		    gl.clearColor(1 , 1, 1, 0);
		    // Enable depth testing
	//	    gl.enable(gl.DEPTH_TEST);
		    // Near things obscure far things
	//	    gl.depthFunc(gl.LEQUAL);
		    // Clear the color as well as the depth buffer.
	//	    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.clear(gl.COLOR_BUFFER_BIT );
			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);


		    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 50, 10000);

		    mat4.identity(mvMatrix);
		    mat4.translate(mvMatrix,mvMatrix,[render.viewCenter.x, render.viewCenter.y, render.zoom]);
  
		
			gl.disable(gl.DEPTH_TEST);			
    //		gl.blendEquation( gl.FUNC_ADD );
			gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.enable(gl.BLEND);
				
			drawSignals();
			drawCells();
			drawBorderSelectedCells();
			
		} else {
	    	console.log("No se ha definido gl");
		}
    }


    function drawCells() {	
		var numCells = glBuffers.cellsLength;
		gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.vertexObject);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER,glBuffers.colorObject);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

		setMatrixUniforms();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffers.indexObject);
		gl.drawElements(gl.TRIANGLES, glBuffers.numIndices, gl.UNSIGNED_INT, 0);


		gl.disableVertexAttribArray(shaderProgram.vertexColorAttribute);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffers.indexBorderObject);
		var numBordes = glBuffers.numIndicesBordes / numCells;
		for (var i = 0; i<numCells; i++) {
		    var offset=i*numBordes;
		    gl.drawElements(gl.LINE_LOOP, numBordes, gl.UNSIGNED_INT, offset*4); //se multiplica el offset por 2 porque se esta utilizando UNSIGNED_SHORT
		}

		gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}


	function drawSignals() {
		gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.vertexSignals);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER,glBuffers.colorSignals);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

		setMatrixUniforms();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffers.indexSignals);
		gl.drawElements(gl.TRIANGLES, glBuffers.numIndicesSignal, gl.UNSIGNED_INT, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }


    render.drawSelectedCells = function(selectedCells) {
    	initSelectedCells(selectedCells);
    	this.drawScene();
    }



    function initSelectedCells (selectedCells) {
    	delete glBuffers.vertexSelecBuffer;
    	delete glBuffers.borderSelecColor;
    	delete glBuffers.elemSelected;
    	delete glBuffers.numSelectedCells;

    	if (gl != null && selectedCells != null && selectedCells.length > 0) {
		    const PI = Math.PI;
		    const FINENESS = 7;
		    const DA = PI / FINENESS;
		    const OFFSET = DA * 0.5;

		    var vertex = [];
		   	var colors = [];

		    for (var index=0; index<selectedCells.length; index++) {
				//Obtiene posx, posy, height,width, angle
				var nVertexInserted = 0;
				var cell = selectedCells[index];

				var radius = cell.width / 2;
				var hLength = cell.length / 2 - radius;
				var theta = cell.angle - PI * 0.5;
				var rotation = cell.angle;
				var x0 = cell.posx;
				var y0 = cell.posy;

				// rotacion sobre el propio eje
				var p1x = hLength*Math.cos(rotation)+x0;
				var p1y = hLength*Math.sin(rotation)+y0;
				var p2x = -hLength*Math.cos(rotation)+x0;
				var p2y = -hLength*Math.sin(rotation)+y0;

				// laterales de la celula
				for (var a = theta; a <= theta+PI+OFFSET; a+=DA, nVertexInserted++){
				    var cx = p1x + radius*Math.cos(a);
				    var cy = p1y + radius*Math.sin(a);
				    vertex.push(cx); vertex.push(cy);
				    colors.push(1);colors.push(0);colors.push(0);colors.push(1);
				}

				for (var a = theta+PI; a <= theta+2*PI+OFFSET; a+=DA,nVertexInserted++){
				    var cx = p2x + radius*Math.cos(a);
				    var cy = p2y + radius*Math.sin(a);
				    vertex.push(cx); vertex.push(cy);
				    colors.push(1);colors.push(0);colors.push(0);colors.push(1);
				}
		    }

		    glBuffers.vertexSelecBuffer = gl.createBuffer();
		    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.vertexSelecBuffer);
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);
		    gl.bindBuffer(gl.ARRAY_BUFFER, null);
	    
		    glBuffers.borderSelecColor = gl.createBuffer();
		    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.borderSelecColor);
		    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		    gl.bindBuffer(gl.ARRAY_BUFFER, null);

		    glBuffers.elemSelected = vertex.length / (2*selectedCells.length);
		    glBuffers.numSelectedCells = selectedCells.length;
		}
    }

    function drawBorderSelectedCells() {
    	if (glBuffers.vertexSelecBuffer != null && glBuffers.borderSelecColor != null) {
		    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.borderSelecColor);
			gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);	

			gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.vertexSelecBuffer);
			gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);
			
			var tam =  glBuffers.elemSelected;
			var numSelectedCells = glBuffers.numSelectedCells;
			for (i=0; i<numSelectedCells;i++) {
				gl.drawArrays(gl.LINE_LOOP, i*tam, tam);
			}
		}
    }




    /***Funciones auxiliares***********/
    function getShader(gl, id) {
		var shaderScript = document.getElementById(id);
		if (!shaderScript) {
		    return null;
		}

		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
		    if (k.nodeType == 3) {
			str += k.textContent;
		    }
		    k = k.nextSibling;
		}

		var shader;
		if (shaderScript.type == "x-shader/x-fragment") {
		    shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
		    shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
		    return null;
		}

		gl.shaderSource(shader, str);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		    alert(gl.getShaderInfoLog(shader));
		    return null;
		}

		return shader;
    }



    /***Funciones con matrices *******/
    var mvMatrixStack = [];
    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    function setMatrixUniforms() {
		gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
		gl.uniform4fv(shaderProgram.borderColorLoc, [0.90, 0.90, 0.90, 1]);
		gl.uniform1f(shaderProgram.borderSizeLoc, 0.95);
    }

    function mvPushMatrix() {
		var copy = mat4.create();
		//	mat4.set(mvMatrix, copy);
		mat4.copy(mvMatrix, copy);
		mvMatrixStack.push(copy);
    }

    function mvPopMatrix() {
		if (mvMatrixStack.length == 0) {
		    throw "Invalid popMatrix!";
		}
		mvMatrix = mvMatrixStack.pop();
	}

	function degToRad(degrees) {
		return degrees * Math.PI / 180;
    }


    render.viewportToModelCoordinates = function (xViewPort,yViewPort) {
		var clipCoord = viewportToClipCoordinates(xViewPort,yViewPort);
		var modelCoordinates = clipToModelCoordinates(clipCoord.clipX,clipCoord.clipY);
		return ({'x':modelCoordinates.xModel, 'y':modelCoordinates.yModel});
    }

    function viewportToClipCoordinates(xViewport,yViewport) {
		clipX = xViewport / gl.canvas.clientWidth * 2 - 1;
		clipY = yViewport / gl.canvas.clientHeight * (-2) + 1;
		return({clipX,clipY});
    }

    function clipToModelCoordinates(xClip,yClip){
		var auxMatrix = mat4.create();
		var invPMVMatrix = mat4.create();

		mat4.mul(auxMatrix,pMatrix,mvMatrix);
		mat4.invert(invPMVMatrix,auxMatrix);

		xModel = invPMVMatrix[0]*xClip*render.zoom*(-1)-render.viewCenter.x;
		yModel = invPMVMatrix[5]*yClip*render.zoom*(-1)-render.viewCenter.y;

		return ({xModel,yModel});
    }



    return render;
});

