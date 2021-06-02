// created by Thorsten Thormaehlen for educational purpose

function Renderer(canvasName, vertSrc, fragSrc)
{
  // public member
  this.t = 0.0;
  this.modeVal = 1;
  this.lightVec = new Float32Array(3);
  this.ambientColor = [0.2, 0.1, 0.0];
  this.diffuseColor = [0.8, 0.4, 0.0];
  this.specularColor = [1.0, 1.0, 1.0];
  this.clearColor = [0.0, 0.4, 0.7];
  this.attenuation = 0.01;
  this.lightType = 0; // 0 equals puntual
  this.angle = 0.0;
  this.exponent = 0.0;

  this.shininess = 80.0;
  this.kaVal = 1.0;
  this.kdVal = 1.0;
  this.ksVal = 1.0;
  this.tones = 4.0;
  this.specularTones = 2.0;

  // private members (inside closure)
  var canvasName = canvasName;
  var vertSrc = vertSrc;
  var fragSrc = fragSrc;
  var canvas;
  var gl;
  var sceneVertNo = 0;
  var bufID;
  var progID = 0;
  var vertID = 0;
  var fragID = 0;
  var vertexLoc = 0;
  var texCoordLoc = 0;
  var normalLoc = 0;
  var projectionLoc = 0;
  var modelviewLoc = 0;
  var lightsPositionLoc = 0;
  var lightsDirectionLoc = 0;
  var normalMatrixLoc = 0;
  var modeLoc = 0;
  var kaLoc = 0;
  var kdLoc = 0;
  var ksLoc = 0;
  var attenuationLoc = 0;
  var lightsNumLoc = 0;
  var selectedLightLoc = 0;
  var lightTypeLoc = 0; // 0 equals puntual
  var angleLoc = 0.0;
  var exponentLoc = 0.0;
  var shininessLoc = 0;
  var lightVecLoc = 0;
  var ambientColorLoc = 0;
  var diffuseColorLoc = 0;
  var specularColorLoc = 0;
  var tonesLoc = 0;
  var specularTonesLoc = 0;
  var projection = new Float32Array(16);
  var modelview = new Float32Array(16);
  var currentFileName = "./knot.txt";

  var currentAttributes = 0;

  // New lights attributes
  this.lightsNum = 3;
  this.selectedLight = 0;
  var lightsPosition = new Float32Array(9);
  var lightsDirection = new Float32Array(9);

  // public
  this.initLightsPos = function () {
    lightsPosition[0] = 1;
    lightsPosition[1] = 1;
    lightsPosition[2] = -1;
    lightsPosition[3] = 1;
    lightsPosition[4] = 1;
    lightsPosition[5] = -1;
    lightsPosition[6] = 1;
    lightsPosition[7] = 1;
    lightsPosition[8] = -1;
  }

  // public
  this.initLightsDir = function () {
    lightsDirection[0] = 0.4;
    lightsDirection[1] = 0.3;
    lightsDirection[2] = 0.6;
    lightsDirection[3] = 0.5;
    lightsDirection[4] = 0.5;
    lightsDirection[5] = 0.5;
    lightsDirection[6] = 1;
    lightsDirection[7] = 1;
    lightsDirection[8] = -1;
  }

  // public
  this.updateLightPos = function (index, x, y, z) {
    lightsPosition[index] = x;
    lightsPosition[index + 1] = y;
    lightsPosition[index + 2] = z;
  }

  // public
  this.updateLightDir = function (index, x, y, z) {
    lightsDirection[index] = x;
    lightsDirection[index + 1] = y;
    lightsDirection[index + 2] = z;
  }

  // public
  this.getLightsPos = function () {
    return lightsPosition;
  }

  // public
  this.getLightsDir = function () {
    return lightsDirection;
  }

  // public
  this.updateShader = function (newvertSrc, newfragSrc) {
    vertSrc = newvertSrc;
    fragSrc = newfragSrc;

    gl.deleteProgram(progID);
    gl.deleteShader(vertID);
    gl.deleteShader(fragID);

    setupShaders();
  }

  // public
  this.updateModel = function (newFileName, fov, zNear, zFar) {
    currentFileName = newFileName;

    gl.deleteProgram(progID);
    gl.deleteShader(vertID);
    gl.deleteShader(fragID);
    gl.deleteBuffer(bufID);

    this.init(fov, zNear, zFar);
  }

  // public
  this.init = function (fov, zNear, zFar) {
    this.canvas = window.document.getElementById(canvasName);
    try {
      gl = this.canvas.getContext("experimental-webgl");
    } catch (e) {}
    if (!gl) {
        window.alert("Error: Could not retrieve WebGL Context");
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    setupShaders();

    // generate a Vertex Buffer Object (VBO)
    bufID = gl.createBuffer();

    var sceneVertexData = loadVertexData(currentFileName);
    sceneVertNo = sceneVertexData.length / (3+2+3);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufID);
    gl.bufferData(gl.ARRAY_BUFFER, sceneVertexData, gl.STATIC_DRAW);

    if(vertexLoc != -1) {
      // position
      var offset = 0;
      var stride = (3+2+3)*Float32Array.BYTES_PER_ELEMENT;
      gl.vertexAttribPointer(vertexLoc, 3, gl.FLOAT, false, stride, offset);
      gl.enableVertexAttribArray(vertexLoc);
    }
    if(texCoordLoc != -1) {
      // texCoord
      offset = 0 + 3*Float32Array.BYTES_PER_ELEMENT;
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, stride, offset);
      gl.enableVertexAttribArray(texCoordLoc);
    }
    if(normalLoc != -1) {
      // normal
      offset = 0 + (3+2)*Float32Array.BYTES_PER_ELEMENT;
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, stride, offset);
      gl.enableVertexAttribArray(normalLoc);
    }
    this.resize(this.canvas.width, this.canvas.height, fov, zNear, zFar);
  }

  function loadVertexData(filename) {
    var data = new Float32Array(0);
    var request = new XMLHttpRequest();
    request.open('GET', filename, false);
    request.send(); //"false" above, will block

    if (request.status != 200) {
      alert("can not load file " + filename);

    }else{
      var floatVals = request.responseText.split('\n');
      var numFloats = parseInt(floatVals[0]);
      if(numFloats % (3+2+3) != 0) return data;
      data = new Float32Array(numFloats);
      for(var k = 0; k < numFloats; k++) {
        data[k] = floatVals[k+1];
      }
    }
    return data;
  }

  //public
  this.resize = function (w, h, fov, zNear, zFar) {
    gl.viewport(0, 0, w, h);

    // this function replaces gluPerspective
    mat4Perspective(projection, fov, w/h, zNear, zFar);
    //mat4Print(projection);
  }

  //public
  this.display = function () {
    gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // camera orbits in the z=1.5 plane
    // and looks at the origin
    // mat4LookAt replaces gluLookAt
    var rad = Math.PI / 180.0 * this.t;

    mat4LookAt(modelview,
               1.5*Math.cos(rad), 1.5*Math.sin(rad), 1.5, // eye
               0.0, 0.0, 0.0, // look at
               0.0, 0.0, 1.0); // up

    //mat4Print(modelview);

    var modelviewInv = new Float32Array(16);
    var normalmatrix = new Float32Array(16);
    mat4Invert(modelview, modelviewInv);
    mat4Transpose(modelviewInv, normalmatrix);

    gl.useProgram(progID);

    // load the current projection and modelview matrix into the
    // corresponding UNIFORM variables of the shader
    gl.uniformMatrix4fv(projectionLoc, false, projection);
    gl.uniformMatrix4fv(modelviewLoc, false, modelview);
    gl.uniformMatrix3fv(lightsPositionLoc, false, lightsPosition);
    gl.uniformMatrix3fv(lightsDirectionLoc, false, lightsDirection);
    if(normalMatrixLoc != -1) gl.uniformMatrix4fv(normalMatrixLoc, false, normalmatrix);
    if(modeLoc != -1) gl.uniform1i(modeLoc, this.modeVal);
    if(kaLoc != -1) gl.uniform1f(kaLoc, this.kaVal);
    if(kdLoc != -1) gl.uniform1f(kdLoc, this.kdVal);
    if(ksLoc != -1) gl.uniform1f(ksLoc, this.ksVal);
    if(attenuationLoc != -1) gl.uniform1f(attenuationLoc, this.attenuation);
    if(lightsNumLoc != -1) gl.uniform1i(lightsNumLoc, this.lightsNum);
    if(selectedLightLoc != -1) gl.uniform1i(selectedLightLoc, this.selectedLight);
    if(shininessLoc != -1) gl.uniform1f(shininessLoc, this.shininess);
    if(lightVecLoc != -1) gl.uniform3fv(lightVecLoc, this.lightVec);
    if(ambientColorLoc != -1) gl.uniform3fv(ambientColorLoc, this.ambientColor);
    if(diffuseColorLoc != -1) gl.uniform3fv(diffuseColorLoc, this.diffuseColor);
    if(specularColorLoc != -1) gl.uniform3fv(specularColorLoc, this.specularColor);
    if(tonesLoc != -1) gl.uniform1f(tonesLoc, this.tones);
    if(specularTonesLoc != -1) gl.uniform1f(specularTonesLoc, this.specularTones);
    if(lightTypeLoc != -1) gl.uniform1i(lightTypeLoc, this.lightType);
    if(angleLoc != -1) gl.uniform1f(angleLoc, this.angle);
    if(exponentLoc != -1) gl.uniform1f(exponentLoc, this.exponent);


    gl.bindBuffer(gl.ARRAY_BUFFER, bufID);
    gl.drawArrays(gl.TRIANGLES, 0, sceneVertNo);
  }

  // private
  function setupShaders() {
    // create shader
    vertID = gl.createShader(gl.VERTEX_SHADER);
    fragID = gl.createShader(gl.FRAGMENT_SHADER);

    // specify shader source
    gl.shaderSource(vertID, vertSrc);
    gl.shaderSource(fragID, fragSrc);

    // compile the shader
    gl.compileShader(vertID);
    gl.compileShader(fragID);

    var error = false;
    // check for errors
    if(!gl.getShaderParameter(vertID, gl.COMPILE_STATUS)) {
      document.getElementById("code_vert_error").innerHTML = "invalid vertex shader : " + gl.getShaderInfoLog(vertID);
      error = true;
    }
    else{
      document.getElementById("code_vert_error").innerHTML = "";
    }
    if(!gl.getShaderParameter(fragID, gl.COMPILE_STATUS)) {
      document.getElementById("code_frag_error").innerHTML = "invalid fragment shader : " + gl.getShaderInfoLog(fragID);
      error = true;
    }else{
      document.getElementById("code_frag_error").innerHTML = "";
    }

    if(error) return;

    // Gets the number of attributes in the current and new programs
    if (progID != 0)
    {
      currentAttributes = gl.getProgramParameter(progID, gl.ACTIVE_ATTRIBUTES);
    }
    // create program and attach shaders
    progID = gl.createProgram();

    gl.attachShader(progID, vertID);
    gl.attachShader(progID, fragID);

      // nUEVO
  var newAttributes = gl.getProgramParameter(progID, gl.ACTIVE_ATTRIBUTES);

  // Fortunately, in OpenGL, attribute index values are always assigned in the
// range [0, ..., NUMBER_OF_VERTEX_ATTRIBUTES - 1], so we can use that to
// enable or disable attributes
if (currentAttributes != 0)
{
if (newAttributes > currentAttributes) // We need to enable the missing attributes
{
  for (var i = currentAttributes; i < newAttributes; i++)
  {
      gl.enableVertexAttribArray(i);
  }
}
else if (newAttributes < currentAttributes) // We need to disable the extra attributes
{
  for (var i = newAttributes; i < currentAttributes; i++)
  {
      gl.disableVertexAttribArray(i);
  }
}
}

    // link the program
    gl.linkProgram(progID);

    
    if (!gl.getProgramParameter(progID, gl.LINK_STATUS)) {
      alert(gl.getProgramInfoLog(progID));
      return;
    }

    // retrieve the location of the IN variables of the vertex shader
    vertexLoc = gl.getAttribLocation(progID,   "position");
    texCoordLoc =  gl.getAttribLocation(progID,"texCoord");
    normalLoc = gl.getAttribLocation(progID,   "normal");

    // retrieve the location of the UNIFORM variables of the shader
    projectionLoc = gl.getUniformLocation(progID, "projection");
    modelviewLoc = gl.getUniformLocation(progID, "modelview");
    lightsPositionLoc = gl.getUniformLocation(progID, "lightsPos");
    lightsDirectionLoc = gl.getUniformLocation(progID, "lightsDir");
    normalMatrixLoc = gl.getUniformLocation(progID, "normalMat");
    modeLoc = gl.getUniformLocation(progID, "mode");
    lightVecLoc = gl.getUniformLocation(progID, "lightVec");
    ambientColorLoc = gl.getUniformLocation(progID, "ambientColor");
    diffuseColorLoc = gl.getUniformLocation(progID, "diffuseColor");
    specularColorLoc = gl.getUniformLocation(progID, "specularColor");
    shininessLoc = gl.getUniformLocation(progID, "shininessVal");
    attenuationLoc = gl.getUniformLocation(progID, "attenuationVal");
    lightsNumLoc = gl.getUniformLocation(progID, "lightsNum");
    selectedLightLoc = gl.getUniformLocation(progID, "actualLight");
    kaLoc = gl.getUniformLocation(progID, "Ka");
    kdLoc = gl.getUniformLocation(progID, "Kd");
    ksLoc = gl.getUniformLocation(progID, "Ks");
    tonesLoc = gl.getUniformLocation(progID, "uTones");
    specularTonesLoc = gl.getUniformLocation(progID, "uSpecularTones");
    lightTypeLoc = gl.getUniformLocation(progID, "lightType");
    angleLoc = gl.getUniformLocation(progID, "angle");
    exponentLoc = gl.getUniformLocation(progID, "exponent");
  }

  // the following functions are some matrix and vector helpers
  // they work for this demo but in general it is recommended
  // to use more advanced matrix libraries
  function vec3Dot(a, b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  }

  function vec3Cross(a, b, res) {
    res[0] = a[1] * b[2]  -  b[1] * a[2];
    res[1] = a[2] * b[0]  -  b[2] * a[0];
    res[2] = a[0] * b[1]  -  b[0] * a[1];
  }

  function vec3Normalize(a) {
    var mag = Math.sqrt(a[0] * a[0]  +  a[1] * a[1]  +  a[2] * a[2]);
    a[0] /= mag; a[1] /= mag; a[2] /= mag;
  }

  function mat4Identity(a) {
    a.length = 16;
    for (var i = 0; i < 16; ++i) a[i] = 0.0;
    for (var i = 0; i < 4; ++i) a[i + i * 4] = 1.0;
  }

  function mat4Multiply(a, b, res) {
    for (var i = 0; i < 4; ++i) {
      for (var j = 0; j < 4; ++j) {
        res[j*4 + i] = 0.0;
        for (var k = 0; k < 4; ++k) {
          res[j*4 + i] += a[k*4 + i] * b[j*4 + k];
        }
      }
    }
  }

  function mat4Perspective(a, fov, aspect, zNear, zFar) {
    var f = 1.0 / Math.tan (fov/2.0 * (Math.PI / 180.0));
    mat4Identity(a);
    a[0] = f / aspect;
    a[1 * 4 + 1] = f;
    a[2 * 4 + 2] = (zFar + zNear)  / (zNear - zFar);
    a[3 * 4 + 2] = (2.0 * zFar * zNear) / (zNear - zFar);
    a[2 * 4 + 3] = -1.0;
    a[3 * 4 + 3] = 0.0;
  }

  // public
  this.updatePerspective = function (fov, zNear, zFar) {
    this.canvas = window.document.getElementById(canvasName);
    this.resize(this.canvas.width, this.canvas.height, fov, zNear, zFar);
  }

  function  mat4LookAt(viewMatrix,
      eyeX, eyeY, eyeZ,
      centerX, centerY, centerZ,
      upX, upY, upZ) {

    var dir = new Float32Array(3);
    var right = new Float32Array(3);
    var up = new Float32Array(3);
    var eye = new Float32Array(3);

    up[0]=upX; up[1]=upY; up[2]=upZ;
    eye[0]=eyeX; eye[1]=eyeY; eye[2]=eyeZ;

    dir[0]=centerX-eyeX; dir[1]=centerY-eyeY; dir[2]=centerZ-eyeZ;
    vec3Normalize(dir);
    vec3Cross(dir,up,right);
    vec3Normalize(right);
    vec3Cross(right,dir,up);
    vec3Normalize(up);
    // first row
    viewMatrix[0]  = right[0];
    viewMatrix[4]  = right[1];
    viewMatrix[8]  = right[2];
    viewMatrix[12] = -vec3Dot(right, eye);
    // second row
    viewMatrix[1]  = up[0];
    viewMatrix[5]  = up[1];
    viewMatrix[9]  = up[2];
    viewMatrix[13] = -vec3Dot(up, eye);
    // third row
    viewMatrix[2]  = -dir[0];
    viewMatrix[6]  = -dir[1];
    viewMatrix[10] = -dir[2];
    viewMatrix[14] =  vec3Dot(dir, eye);
    // forth row
    viewMatrix[3]  = 0.0;
    viewMatrix[7]  = 0.0;
    viewMatrix[11] = 0.0;
    viewMatrix[15] = 1.0;
  }

  function mat4Print(a) {
    // opengl uses column major order
    var out = "";
    for (var i = 0; i < 4; ++i) {
      for (var j = 0; j < 4; ++j) {
        out += a[j * 4 + i] + " ";
      }
      out += "\n";
    }
    alert(out);
  }

  function mat4Transpose(a, transposed) {
    var t = 0;
    for (var i = 0; i < 4; ++i) {
      for (var j = 0; j < 4; ++j) {
        transposed[t++] = a[j * 4 + i];
      }
    }
  }

  function mat4Invert(m, inverse) {
    var inv = new Float32Array(16);
    inv[0] = m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+
             m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
    inv[4] = -m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-
             m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
    inv[8] = m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+
             m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
    inv[12]= -m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-
             m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
    inv[1] = -m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-
             m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
    inv[5] = m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+
             m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
    inv[9] = -m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-
             m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
    inv[13]= m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+
             m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
    inv[2] = m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+
             m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
    inv[6] = -m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-
             m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
    inv[10]= m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+
             m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
    inv[14]= -m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-
             m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
    inv[3] = -m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-
             m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
    inv[7] = m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+
             m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
    inv[11]= -m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-
             m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
    inv[15]= m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+
             m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];

    var det = m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];
    if (det == 0) return false;
    det = 1.0 / det;
    for (var i = 0; i < 16; i++) inverse[i] = inv[i] * det;
    return true;
  }


// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
this.loadTexture = function (url) 
{
  if (!url)
  {
    url = "./imgs/pruebaText.jpg"    

  }
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();

  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
}

