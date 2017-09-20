
var gl;
var canvas;
var shaderProgram;
var upVertexPositionBuffer;
var upVertexColorBuffer;
var downVertexPositionBuffer;
var downVertexColorBuffer;

var convertCoordinate = 12;

var mvMatrix = mat4.create();
var rotAngle = 0;
var lastTime = 0;

function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

}

/**
 * Populate buffers with data
 */
function setupBuffers() {
  upVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, upVertexPositionBuffer);
  var upVertices = [
         -10,11,0,
         10,11,0,
         -10,7,0,

         -10,7,0,
         10,11,0,
         10,7,0,

         -8,7,0,
         -4,7,0,
         -8,-4,0,

         -8,-4,0,
         -4,7,0,
         -4,-4,0,

         -4,4,0,
         -2,4,0,
         -4,-1,0,

         -4,-1,0,
         -2,4,0,
         -2,-1,0,

         4,7,0,
         8,7,0,
         8,-4,0,

         8,-4,0,
         4,7,0,
         4,-4,0,

         4,4,0,
         2,4,0,
         2,-1,0,

         2,-1,0,
         4,4,0,
         4,-1,0


  ];
  for(i=0 ; i<upVertices.length ; i+=3){
    upVertices[i] /= convertCoordinate;
    upVertices[i+1] /= convertCoordinate;
  }


  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(upVertices), gl.STATIC_DRAW);
  upVertexPositionBuffer.itemSize = 3;
  upVertexPositionBuffer.numberOfItems = 30;
    
  upVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, upVertexColorBuffer);
  var colors = [
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
        0.074, 0.157, 0.294, 1.0,
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  upVertexColorBuffer.itemSize = 4;
  upVertexColorBuffer.numItems = 30;  

  //////////down//////////////

  downVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, downVertexPositionBuffer);
  var downVertices = [
         -8,-5,0,
         -6,-5,0,
         -6,-7.5,0,

         -8,-5,0,
         -8,-6,0,
         -6,-7.5,0,

         -5.2,-5,0,
         -3.2,-5,0,
         -3.2,-9.5,0,

         -5.2,-5,0,
         -5.2,-8,0,
         -3.2,-9.5,0,

         -2.4,-5,0,
         -0.4,-5,0,
         -0.4,-11.5,0,

         -2.4,-5,0,
         -2.4,-10,0,
         -0.4,-11.5,0,

         8,-5,0,
         6,-5,0,
         6,-7.5,0,

         8,-5,0,
         8,-6,0,
         6,-7.5,0,

         5.2,-5,0,
         3.2,-5,0,
         3.2,-9.5,0,

         5.2,-5,0,
         5.2,-8,0,
         3.2,-9.5,0,

         2.4,-5,0,
         0.4,-5,0,
         0.4,-11.5,0,

         2.4,-5,0,
         2.4,-10,0,
         0.4,-11.5,0


  ];
  
  for(i=0 ; i<downVertices.length ; i+=3){
    downVertices[i] /= convertCoordinate;
    downVertices[i+1] /= convertCoordinate;
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(downVertices), gl.STATIC_DRAW);
  downVertexPositionBuffer.itemSize = 3;
  downVertexPositionBuffer.numberOfItems = 36;
    
  downVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, downVertexColorBuffer);
  var colorss = [
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,
        0.875,0.29,0.216,1,

    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorss), gl.STATIC_DRAW);
  downVertexColorBuffer.itemSize = 4;
  downVertexColorBuffer.numItems = 36;

}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
  gl.clearColor(0,0,0,0);
  mat4.identity(mvMatrix);
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle)); 

  gl.bindBuffer(gl.ARRAY_BUFFER, upVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         upVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, upVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            upVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
                          
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);


  gl.drawArrays(gl.TRIANGLES, 0, upVertexPositionBuffer.numberOfItems );
  
  ///////down part///////
  mat4.identity(mvMatrix);
  //mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle)); 
  gl.bindBuffer(gl.ARRAY_BUFFER, downVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         downVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, downVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            downVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
                          
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);


  gl.drawArrays(gl.TRIANGLES, 0, downVertexPositionBuffer.numberOfItems );




}

var sinscalar = 0;
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;    
        rotAngle= (rotAngle+1.0) % 360;
    }
    lastTime = timeNow;

    sinscalar += 0.05;

    gl.bindBuffer(gl.ARRAY_BUFFER, downVertexPositionBuffer);
    var downVertices = [
           -8,-5,0,
           -6,-5,0,
           -6,-7.5+Math.sin(sinscalar)*0.5,0,
  
           -8,-5,0,
           -8,-6+Math.sin(sinscalar)*0.8,0,
           -6,-7.5+Math.sin(sinscalar)*0.5,0,
  
           -5.2,-5,0,
           -3.2,-5,0,
           -3.2,-9.5+Math.sin(sinscalar+0.5)*0.5,0,
  
           -5.2,-5,0,
           -5.2,-8+Math.sin(sinscalar+0.5)*0.8,0,
           -3.2,-9.5+Math.sin(sinscalar+0.5)*0.5,0,
  
           -2.4,-5,0,
           -0.4,-5,0,
           -0.4,-11.5+Math.sin(sinscalar+1)*0.3,0,
  
           -2.4,-5,0,
           -2.4,-10+Math.sin(sinscalar+1)*0.8,0,
           -0.4,-11.5+Math.sin(sinscalar+1)*0.3,0,
  
           8,-5,0,
           6,-5,0,
           6,-7.5+Math.sin(sinscalar+1.5)*0.5,0,
  
           8,-5,0,
           8,-6+Math.sin(sinscalar+1.5)*0.8,0,
           6,-7.5+Math.sin(sinscalar+1.5)*0.5,0,
  
           5.2,-5,0,
           3.2,-5,0,
           3.2,-9.5+Math.sin(sinscalar+2)*0.5,0,
  
           5.2,-5,0,
           5.2,-8+Math.sin(sinscalar+2)*0.8,0,
           3.2,-9.5+Math.sin(sinscalar+2)*0.5,0,
  
           2.4,-5,0,
           0.4,-5,0,
           0.4,-11.5+Math.sin(sinscalar+2.5)*0.3,0,
  
           2.4,-5,0,
           2.4,-10+Math.sin(sinscalar+2.5)*0.8,0,
           0.4,-11.5+Math.sin(sinscalar+2.5)*0.3,0
  
  
    ];
    
    for(i=0 ; i<downVertices.length ; i+=3){
      downVertices[i] /= convertCoordinate;
      downVertices[i+1] /= convertCoordinate;
    }
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(downVertices), gl.STATIC_DRAW);
    downVertexPositionBuffer.itemSize = 3;
    downVertexPositionBuffer.numberOfItems = 36;
}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick(); 
}

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

