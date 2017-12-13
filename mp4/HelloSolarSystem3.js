
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;


// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,6.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

// Force
var g = [0,-10,0];
var dragForce = 0.5;

// position, velocity
var particles = [];
var totalPNum = 0;

//-------------------------------------------------------------------------
function setupSphereBuffers() {
    
    var sphereSoup=[];
    var sphereNormals=[];
    var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
    console.log("Generated ", numT, " triangles"); 
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                  gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);     
}

//-------------------------------------------------------------------------
function drawSphere(){
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}

//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms(color) {
  // Set up light parameters
  var Ia = vec3.fromValues(0.0,0.0,0.0)
  var Id = vec3.fromValues(color[0],color[1],color[2]);
  var Is = vec3.fromValues(0.2,0.2,0.2);
  
  var lightPosEye = vec3.fromValues(0.0,0.0,-1.0);

  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  uploadProjectionMatrixToShader();
  uploadLightsToShader(lightPosEye,Ia,Id,Is);
}

//----------------------------------------------------------------------------------
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor"); 
    
}


//-------------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}



//----------------------------------------------------------------------------------
function setupBuffers() {
    setupSphereBuffers();     
}

//----------------------------------------------------------------------------------
function draw(p) { 
    var translateVec = vec3.create();
    var transformVec = vec3.create();
  
    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    
    mvPushMatrix();
    vec3.set(translateVec,p.position[0],p.position[1],p.position[2]);
    mat4.translate(mvMatrix, mvMatrix,translateVec);
    vec3.set(transformVec,0.05,0.05,0.05);
    mat4.scale(mvMatrix,mvMatrix,transformVec);  
    setMatrixUniforms(p.color);
    drawSphere();
    mvPopMatrix();
    

  
}


function init(){
  createParticles(50);
  keyboardBinding();
}

function createParticles(num){
  for(i=0 ; i<num ; i++){
    var p = new Object();
    p.position = [(Math.random()>0.5?1:-1)*Math.random(),(Math.random()>0.5?1:-1)*Math.random(),(Math.random()>0.5?1:-1)*Math.random()]; 
    p.velocity = [(Math.random()>0.5?1:-1)*Math.random(),(Math.random()>0.5?1:-1)*Math.random(),(Math.random()>0.5?1:-1)*Math.random()]; 
    p.color = [Math.random(),Math.random(),Math.random()];
    p.time = Date.now();
    particles.push(p);  
    
  }
  particles[0].color = [0,0,1];
  particles[1].color = [1,0,0];
  particles[2].color = [0,1,0];

  totalPNum += num;
}
  

//----------------------------------------------------------------------------------
function animate(p) {
  
  // position update
  for(d = 0; d<3 ; d++){
    var newTime = Date.now();
    p.position[d] +=  p.velocity[d] * (newTime - p.time) * 0.001;     
  }


  // collision onto x=1 
  if(p.position[0]>=1){
    p.velocity[0] = p.velocity[0] * -0.9;
    p.position[0] = 1;
  }
  // collision onto x=-1 
  else if ( p.position[0]<=-1){
    p.velocity[0] = p.velocity[0] * -0.9;
    p.position[0] = -1;
  }
  // collision onto y=1 
  if(p.position[1]>=1){
    p.velocity[1] = p.velocity[1] * -0.9;
    p.position[1] = 1;
  }
  // collision onto y=-1 
  else if ( p.position[1]<=-1){
    p.velocity[1] = p.velocity[1] * -0.9;
    p.position[1] = -1;
  }
  // collision onto z=1 
  if(p.position[2]>=1){
    p.velocity[2] = p.velocity[2] * -0.9;
    p.position[2] = 1;
  }
  // collision onto z=-1 
  else if ( p.position[2]<=-1){
    p.velocity[2] = p.velocity[2] * -0.9;
    p.position[2] = -1;
  }


  // velocity update
  for(d = 0 ; d<3 ; d++){
    // p.velocity[d] = p.velocity[d] + g[d]*(newTime-p.time) ;
    p.velocity[d] = p.velocity[d] + g[d]*(newTime-p.time) * 0.001;
    
  }

  p.time = newTime;
 


  
}

/**
 * Capture keyboard for control the movement of the plane.
 */
function keyboardBinding(){
  document.addEventListener('keydown', function(event) {
    // press enter
    if (event.keyCode == 13) {
      createParticles(5);
    }

}, true);
}

//----------------------------------------------------------------------------------
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  init();
  tick();
}

//----------------------------------------------------------------------------------
function tick() {
    requestAnimFrame(tick);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for(i=0 ; i<totalPNum ; i++){
      var p = particles[i]
      draw(p);
      animate(p);
    }
    // console.log(particles[0].velocity[1])
}

