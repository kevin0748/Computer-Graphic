
var gl;
var canvas;

var shaderProgram;
var shaderProgramTea;

// Create a place to store the texture coords for the mesh
var cubeTCoordBuffer;

// Create a place to store terrain geometry
var cubeVertexBuffer;

// Create a place to store the triangles
var cubeTriIndexBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,1.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

// Create the normal
var nMatrix = mat3.create();

var mvMatrixStack = [];

var cubeImage1;
var cubeImage2;
var cubeImage3;
var cubeImage4;
var cubeImage5;
var cubeImage6;
var cubeTexture1;
var cubeTexture2;
var cubeTexture3;
var cubeTexture4;
var cubeTexture5;
var cubeTexture6;

// create array to store teapot information
var teapotVertex = [];
var teapotFaceIndex = [];
var teapotNormal = [];

var teapotVertexPositionBuffer;
var teapotVertexNormalBuffer;
var teapotVertexIndexBuffer;

// keep track of the status of loading teapot.obj
var loaded = false;

// draw cube and teapot or not
var useCube = true;
var useTeapot = true;


// For animation 
var then =0;
var modelXRotationRadians = degToRad(0);
var modelYRotationRadians = degToRad(0);

/**
 * store the teapot vertex, faceIndex, normal
 */
function storeTeapot(input) {
  var lines = input.match(/[^\n\r]+/gi);
  // console.log(lines);
  for(var i=0 ; i<lines.length ; i++){
    var line = lines[i];
    var words = line.split(/[ ]+/g);
    // console.log(words);
    if(words[0] == 'v'){
      teapotVertex.push(words[1]);
      teapotVertex.push(words[2]);
      teapotVertex.push(words[3]);
    }
    else if(words[0] == 'f'){
      teapotFaceIndex.push(words[1]-1);
      teapotFaceIndex.push(words[2]-1);
      teapotFaceIndex.push(words[3]-1);
    }
  }

  var numVertex = teapotVertex.length/3;
  var numTris = teapotFaceIndex.length/3;

  var triangleNormal = new Array(numTris);
  var vertexInTriangle = new Array(numVertex);
  for (var i = 0 ; i<numVertex ; i++){
    vertexInTriangle[i] = new Array();
  } 

  var u = vec3.create();
  var v = vec3.create();

  // calculate triangle normal vector
  for(var i = 0 ; i<teapotFaceIndex.length ; i+=3){
    var f1 = teapotFaceIndex[i];
    var f2 = teapotFaceIndex[i+1];
    var f3 = teapotFaceIndex[i+2];
    var v1 = vec3.fromValues(teapotVertex[ f1*3 ], teapotVertex[ f1*3 + 1], teapotVertex[ f1*3 + 2]);
    var v2 = vec3.fromValues(teapotVertex[ f2*3 ], teapotVertex[ f2*3 + 1], teapotVertex[ f2*3 + 2]);
    var v3 = vec3.fromValues(teapotVertex[ f3*3 ], teapotVertex[ f3*3 + 1], teapotVertex[ f3*3 + 2]);
    var normal = vec3.create();
    vec3.subtract(u,v2,v1);
    vec3.subtract(v,v3,v1);
    vec3.cross(normal,u,v);
    vec3.normalize(normal,normal);

    triangleNormal[i] = normal;
    vertexInTriangle[f1].push(i);
    vertexInTriangle[f2].push(i);
    vertexInTriangle[f3].push(i);

  }

  // initialize normal array
  for(var i=0 ; i<teapotVertex.length ; i++){
    teapotNormal.push(0);
  }

  // caucalte vertex normal vector
  for(var i=0 ; i<numVertex ; i++){
    var totalNormal = vec3.create();
    var temp = vec3.create();
    while(vertexInTriangle[i].length != 0){
      var current = vertexInTriangle[i].pop();
      vec3.add(temp, totalNormal, triangleNormal[current]);
      vec3.copy(totalNormal,temp);
    }
    var normalized = vec3.create();
    vec3.normalize(normalized,totalNormal);
    teapotNormal[i*3] = normalized[0];
    teapotNormal[i*3+1] = normalized[1];
    teapotNormal[i*3+2] = normalized[2];

  }

  setupTeapotBuffers();
  
  loaded = true;
  console.log("buffer loaded success.");

}

/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgramTea.nMatrixUniform, false, nMatrix);
}

/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

/**
 * Sends projection/modelview matrices to cube shader
 */
function setCubeMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
      false, pMatrix);
}

/**
 * Sends projection/modelview matrices to teapot shader
 */
function setTeapotMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgramTea.mvMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(shaderProgramTea.pMatrixUniform, 
      false, pMatrix);
  uploadNormalMatrixToShader();
}

/**
 * upload lights to shader in .html file
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgramTea.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgramTea.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgramTea.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgramTea.uniformSpecularLightColorLoc, s); 
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
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
 * set up cube and teapot shaders
 */
function setupShaders(){
  if(useCube)
    setupCubeShaders();
  if(useTeapot)
    setupTeapotShaders();
}

/**
 * set up teapot shaders
 */
function setupTeapotShaders(){
  vertexShader = loadShaderFromDOM("teapot_shader-vs");
  fragmentShader = loadShaderFromDOM("teapot_shader-fs");

  shaderProgramTea = gl.createProgram();
  gl.attachShader(shaderProgramTea, vertexShader);
  gl.attachShader(shaderProgramTea,fragmentShader);
  gl.linkProgram(shaderProgramTea);

  if (!gl.getProgramParameter(shaderProgramTea, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgramTea);

  shaderProgramTea.vertexPositionAttribute = gl.getAttribLocation(shaderProgramTea, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgramTea.vertexPositionAttribute);

  shaderProgramTea.vertexNormalAttribute = gl.getAttribLocation(shaderProgramTea, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgramTea.vertexNormalAttribute);

  shaderProgramTea.mvMatrixUniform = gl.getUniformLocation(shaderProgramTea, "uMVMatrix");
  shaderProgramTea.pMatrixUniform = gl.getUniformLocation(shaderProgramTea, "uPMatrix");
  shaderProgramTea.nMatrixUniform = gl.getUniformLocation(shaderProgramTea, "uNMatrix");
  shaderProgramTea.uniformLightPositionLoc = gl.getUniformLocation(shaderProgramTea, "uLightPosition");    
  shaderProgramTea.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgramTea, "uAmbientLightColor");  
  shaderProgramTea.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgramTea, "uDiffuseLightColor");
  shaderProgramTea.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgramTea, "uSpecularLightColor");

}
/**
 * Setup cube shaders
 */
function setupCubeShaders() {
  vertexShader = loadShaderFromDOM("cube_shader-vs");
  fragmentShader = loadShaderFromDOM("cube_shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  
  shaderProgram.texCoordAttribute = gl.getAttribLocation(shaderProgram, "aTexCoord");
  // console.log("Tex coord attrib: ", shaderProgram.texCoordAttribute);
  gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);
    
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  // console.log("Vertex attrib: ", shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Draw each side of the cube texture
 */
function drawCubeTexture(textureUnit, cubeTexture ,side){
  
  gl.activeTexture(textureUnit );
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), side);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12*(side-1) );
}

/**
 * Draw a cube based on buffers.
 */
function drawCube(){

  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.

  drawCubeTexture(gl.TEXTURE1, cubeTexture1, 1);
  drawCubeTexture(gl.TEXTURE2, cubeTexture2, 2);
  drawCubeTexture(gl.TEXTURE3, cubeTexture3, 3);
  drawCubeTexture(gl.TEXTURE4, cubeTexture4, 4);
  drawCubeTexture(gl.TEXTURE5, cubeTexture5, 5);
  drawCubeTexture(gl.TEXTURE6, cubeTexture6, 6);

}

function drawTeapot(){
  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgramTea.vertexPositionAttribute, teapotVertexPositionBuffer.itemSize, 
    gl.FLOAT, false, 0, 0);      

  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgramTea.vertexNormalAttribute, 
                              teapotVertexNormalBuffer.itemSize,
                              gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
  gl.drawElements(gl.TRIANGLES, teapotVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
 }

/**
 * Draw call that applies matrix transformations to cube
 */
function draw() { 

    if(!loaded)
      return;

    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
  
    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    

    // Draw Cube 
    if(useCube){
      setupCubeShaders();
      mvPushMatrix();
      vec3.set(transformVec,0.0,0.0,0.0);
      mat4.translate(mvMatrix, mvMatrix,transformVec);
      mat4.rotateX(mvMatrix,mvMatrix,modelXRotationRadians);
      mat4.rotateY(mvMatrix,mvMatrix,modelYRotationRadians);
    
      setCubeMatrixUniforms();    
      drawCube();
      mvPopMatrix();
    }
    
    // Draw teapot
    if(useTeapot){
      setupTeapotShaders();
      mvPushMatrix();
      uploadLightsToShader([1,1,1],[0.0,0.0,0.0],[0.8,1.0,1.0],[0.2,0.2,0.2]);
      vec3.set(transformVec,0.06,0.06,0.06);
      mat4.scale(mvMatrix, mvMatrix,transformVec);
      vec3.set(transformVec,0.0,-2.0,0.0);
      mat4.translate(mvMatrix, mvMatrix,transformVec);
      setTeapotMatrixUniforms();
      drawTeapot();
      mvPopMatrix();
    }
    
  
}

/**
 * Animation to be called from tick. Updates global rotation values.
 */
function animate() {
    if (then==0)
    {
        then = Date.now();
    }
    else
    {
      now=Date.now();
      // Convert to seconds
      now *= 0.001;
      // Subtract the previous time from the current time
      var deltaTime = now - then;
      // Remember the current time for the next frame.
      then = now;

      //Animate the rotation
      // modelXRotationRadians += 0.3 * deltaTime;
      // modelYRotationRadians += 0.3 * deltaTime;  
      var origin = vec3.create();
      vec3.set(origin,0.0,0.0,0.0);
      vec3.rotateY(eyePt,eyePt,origin,degToRad(1))
      vec3.subtract(viewDir,origin,eyePt);
    }
}

/**
 * Creates texture for application to cube.
 */
function setupTextures() {

  var imagesURL = [
    "canary/neg-z.png",
    "canary/pos-z.png",
    "canary/pos-y.png",
    "canary/neg-y.png",
    "canary/pos-x.png",
    "canary/neg-x.png"
  ];

  var red = new Uint8Array([255, 0, 0, 255]);
  var green = new Uint8Array([0, 255, 0, 255]);
  var blue = new Uint8Array([0, 0, 255, 255]);
  var cyan = new Uint8Array([0, 255, 255, 255]);
  var magenta = new Uint8Array([255, 0, 255, 255]);
  var yellow = new Uint8Array([255, 255, 0, 255]);
  

  cubeTexture1 = gl.createTexture();
  cubeTexture2 = gl.createTexture();
  cubeTexture3 = gl.createTexture();
  cubeTexture4 = gl.createTexture();
  cubeTexture5 = gl.createTexture();
  cubeTexture6 = gl.createTexture();

  // setupCubeEachSideColor(cubeTexture1, red );
  // setupCubeEachSideColor(cubeTexture2, green );
  // setupCubeEachSideColor(cubeTexture3, blue );
  // setupCubeEachSideColor(cubeTexture4, cyan );
  // setupCubeEachSideColor(cubeTexture5, magenta );
  // setupCubeEachSideColor(cubeTexture6, yellow );

  setupCubeEachSide(cubeTexture1, cubeImage1,imagesURL[0]);
  setupCubeEachSide(cubeTexture2, cubeImage2,imagesURL[1]);
  setupCubeEachSide(cubeTexture3, cubeImage3,imagesURL[2]);
  setupCubeEachSide(cubeTexture4, cubeImage4,imagesURL[3]);
  setupCubeEachSide(cubeTexture5, cubeImage5,imagesURL[4]);
  setupCubeEachSide(cubeTexture6, cubeImage6,imagesURL[5]);
  
}

function setupCubeEachSideColor(tex, color ){
  gl.bindTexture(gl.TEXTURE_2D, tex);
 // Fill the texture with a 1x1 blue pixel.
 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
}

/**
 * Set up texture at each side of the cube.
 */
function setupCubeEachSide(tex, cubeImage, imageURL){
  gl.bindTexture(gl.TEXTURE_2D, tex);
 // Fill the texture with a 1x1 blue pixel.
 gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
               new Uint8Array([0, 0, 255, 255]));
 
   cubeImage = new Image();
   cubeImage.onload = function() { handleTextureLoaded(cubeImage, tex); }
   cubeImage.src = imageURL;
    // https://goo.gl/photos/SUo7Zz9US1AKhZq49
}

/**
 * @param {number} value Value to determine whether it is a power of 2
 * @return {boolean} Boolean of whether value is a power of 2
 */
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

/**
 * Texture handling. Generates mipmap and sets texture parameters.
 * @param {Object} image Image for cube application
 * @param {Object} texture Texture for cube application
 */
function handleTextureLoaded(image, texture) {
  console.log("handleTextureLoaded, image = " + image);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  // Check if the image is a power of 2 in both dimensions.
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     // Yes, it's a power of 2. Generate mips.
     gl.generateMipmap(gl.TEXTURE_2D);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
     console.log("Loaded power of 2 texture");
  } else {
     // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     console.log("Loaded non-power of 2 texture");
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

/**
 * Set up the teapot buffers
 */
function setupTeapotBuffers(){
  
  teapotVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotVertex), gl.STATIC_DRAW);
  teapotVertexPositionBuffer.itemSize = 3;
  teapotVertexPositionBuffer.numItems = teapotVertex.length/3;
  console.log("vertices: ", teapotVertexPositionBuffer.numItems);
  
  teapotVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapotNormal), gl.STATIC_DRAW);
  teapotVertexNormalBuffer.itemSize = 3;
  teapotVertexNormalBuffer.numItems = teapotNormal.length/3;
  console.log("normal: ", teapotVertexNormalBuffer.numItems);

  teapotVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapotFaceIndex), gl.STATIC_DRAW);
  teapotVertexIndexBuffer.itemSize = 1;
  teapotVertexIndexBuffer.numItems = teapotFaceIndex.length;
  console.log("face indices: ", teapotVertexIndexBuffer.numItems);

}

/**
 * Sets up buffers for cube.
 */
/**
 * Populate buffers with data
 */
function setupCubeBuffers() {

  // Create a buffer for the cube's vertices.

  cubeVertexBuffer = gl.createBuffer();

  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Map the texture onto the cube's faces.

  cubeTCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);

  var textureCoordinates = [
    // Front
    
    1.0,  1.0,
    0.0,  1.0,
    0.0,  0.0,
    1.0,  0.0,
    // Back
    0.0,  1.0,
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    // Top
    0.0,  1.0,
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  1.0,
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    
    // Left
    1.0,  1.0,
    0.0,  1.0,
    0.0,  0.0,
    1.0,  0.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeTriIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ]

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

/**
 * Capture keyboard for control the movement of the plane.
 */
function keyboardBinding(){
  document.addEventListener('keydown', function(event) {
    // left
    if (event.keyCode == 37) {
      var origin = vec3.create();
      vec3.set(origin,0.0,0.0,0.0);
      vec3.rotateY(eyePt,eyePt,origin,degToRad(2))
      vec3.subtract(viewDir,origin,eyePt);
    }
    // right
    else if (event.keyCode == 39) {
      var origin = vec3.create();
      vec3.set(origin,0.0,0.0,0.0);
      vec3.rotateY(eyePt,eyePt,origin,degToRad(-2))
      vec3.subtract(viewDir,origin,eyePt);
    }
    
}, true);
}


/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  readTextFile("teapot_0.obj", storeTeapot)
  //setupShaders();
  setupCubeBuffers();
  setupTextures();
  keyboardBinding();
  tick();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
   //animate();
}

