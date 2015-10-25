/**
__        __   _     ____       _     
\ \      / /__| |__ |  _ \ _ __(_)_ __ ___   ___ 
 \ \ /\ / / _ \ '_ \| |_) | '__| | '_ ` _ \ / _ \
  \ V  V /  __/ |_) |  __/| |  | | | | | | |  __/
   \_/\_/ \___|_.__/|_|   |_|  |_|_| |_| |_|\___| 
                                                                                    
Pump It Up: Prime Web Version
Copyright (C) 2014  HUEBR's Team

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

*/
(function () {
  'use strict';

  var PrimeGL = function() {};

  PrimeGL.ScreenWidth   = 2;    //  The ScreenWidth. Not the actually resolution, but the coordinates on GL Screen
  PrimeGL.ScreenHeight  = 2;    //  The ScreenHeight. Not the actually resolution, but the coordinates on GL Screen
  PrimeGL.ZDepth        = 1000; //  The Z Depth Range
  PrimeGL.Shaders       = {};   //  The Shaders holder
  PrimeGL.Tools         = {};   //  The WebGL Tools holder

  /*
   *  The Simple Vertex Shader to draw 2D Stuff on WebGL Context
   */
  PrimeGL.Shaders.SimpleVertexShader = [ 
    "attribute vec3 aVertexPosition;",
    "attribute vec2 aTextureCoord;",
    "uniform vec3 uScale;",
    "varying vec2 vTextureCoord;",
    "",
    "void main(void) {",
    "   vec3 scaledPos = aVertexPosition * uScale;",
    "   gl_Position = vec4(scaledPos, 1.0);",
    "   vTextureCoord = aTextureCoord;",
    "}"
  ].join("\n");

  /*
   *  The Simple Fragment Shader to draw 2D Stuff on WebGL Context
   */
  PrimeGL.Shaders.SimpleFragmentShader = [
    "precision mediump float;",
    "varying vec2 vTextureCoord;",
    "uniform sampler2D uSampler;",
    "uniform float uOpacity;  ",
    "",
    "void main(void) {",
    "   gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)) * vec4(1.0,1.0,1.0,uOpacity);",
    "}"
  ].join("\n");

  /*
   *  The Blend Vertex Shader used to blend the 2D Stuff over something that is on WebGL Context
   */
  PrimeGL.Shaders.BlendVertexShader = [
    "attribute vec3 aVertexPosition;",
    "attribute vec2 aTextureCoord;",
    "uniform vec3 uScale;",
    "varying vec2 vTextureCoord;",
    "",
    "",
    "void main(void) {",
    "    vec3 scaledPos = aVertexPosition * uScale;",
    "    gl_Position = vec4(scaledPos, 1.0);",
    "    vTextureCoord = aTextureCoord;",
    "}"
  ].join("\n");

  /*
   *  The Blend Fragment Shader used to blend the 2D Stuff over something that is on WebGL Context
   */
  PrimeGL.Shaders.BlendFragmentShader = [
    "precision mediump float;",
    "varying vec2 vTextureCoord;",
    "",
    "uniform sampler2D uSampler0;",
    "uniform sampler2D uSampler1;",
    "uniform float uBlendMode;",
    "uniform float uOpacity;",
    "",
    "void main(void) {",
    "    vec4 Sample0 = texture2D(uSampler0, vec2(vTextureCoord.s, vTextureCoord.t));",
    "    vec4 Sample1 = texture2D(uSampler1, vec2(vTextureCoord.s, vTextureCoord.t));",
    "    float alpha = max(Sample0.y,Sample0.z); ",
    "    gl_FragColor = vec4(1.0,1.0,1.0,alpha-0.2);",
    "}"
  ].join("\n");

  PrimeGL.Tools.webGLEnabled = function(webPrime) {
    var canvas = document.createElement('canvas');
    var gl = null;
    
    try { 
      gl = canvas.getContext("webgl", { failIfMajorPerformanceCaveat : true }); 
    } catch (x) { 
      gl = null; 
    }

    if (gl === null) {
      try { 
        gl = canvas.getContext("experimental-webgl", { failIfMajorPerformanceCaveat : true }); 
        if (webPrime)
          webPrime.config.webGLExperimental = true; 
      } catch (x) { 
        gl = null; 
      }
    }

    if (webPrime)
      webPrime.config.runningWebGL = gl !== null;

    return gl !== null;
  };

  /*
   *  This function checks if the value is power of 2
   */
  PrimeGL.Tools.isPowerOfTwo = function (x) { return (x & (x - 1)) === 0; };

  /*
   *  This function gets the next highest power of two value for X
   */
  PrimeGL.Tools.nextHighestPowerOfTwo = function (x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) 
      x = x | x >> i;
    return x + 1;
  };  

  /*
   *  This function scales the Texture to a Power of two.
   *  See: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences
   */
  PrimeGL.Tools.ToPowerOfTwo = function(image)    {
      if (!PrimeGL.Tools.isPowerOfTwo(image.width) || !PrimeGL.Tools.isPowerOfTwo(image.height)) {
          // Scale up the texture to the next highest power of two dimensions.
          var canvas = document.createElement("canvas");
          canvas.width = PrimeGL.Tools.nextHighestPowerOfTwo(image.width);
          canvas.height = PrimeGL.Tools.nextHighestPowerOfTwo(image.height);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, image.width, image.height);
          image = canvas;
      }
      return image;
  };

  /*
   *  This function compiles a shader code using WebGL Context. 
   */
  PrimeGL.Tools.compileShader = function (gl, shaderSource, shaderType) {
      // Create the shader object
      var shader = gl.createShader(shaderType);

      // Set the shader source code.
      gl.shaderSource(shader, shaderSource);

      // Compile the shader
      gl.compileShader(shader);

      // Check if it compiled
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
          // Something went wrong during compilation; get the error
          PrimeLog.d("PrimeGL::ShaderCompile Error: "+gl.getShaderInfoLog(shader));
      }

      return shader;
  };

  /*
   *  This function creates a shader program given a compiled vertexShader and fragmentShader codes.
   */
  PrimeGL.Tools.createProgram = function (gl, vertexShader, fragmentShader) {
      // create a program.
      var program = gl.createProgram();

      // attach the shaders.
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // link the program.
      gl.linkProgram(program);

      // Check if it linked.
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
          // something went wrong with the link
          PrimeLog.d("PrimeGL::ShaderCreateProgram Error: "+gl.getProgramInfoLog (program));
      }

      return program;
  };

  /*
   *  This function generates a sprite coordinate given parameters.
   *  The parameters is (in order):
   *  ScreenX, ScreenY, OnScreenWidth, OnScreenHeight, TextureX, TextureY, TextureU, OnTextureV, Z, TextureStepX, TextureStepY
   * 
   *  The texture coordinates are relative to 0 and 1
   */
  PrimeGL.Tools.GenSprite = function(sx,sy,sw,sh,tx,ty,tu,tv,z,offidx)    {
      var RetData = [ [], [], [] ];   //  VertexData, TextureData, IndexData
      var SXS = 2 / PrimeGL.ScreenWidth,
          SYS = 2 / PrimeGL.ScreenHeight;
      
      sy = PrimeGL.ScreenHeight - sy;   //  GL Coordinates are inverted
      
      offidx = (offidx===undefined)?0:offidx;
          
      z = z / PrimeGL.ZDepth;
      RetData[0].push( 
          -1.0 + SXS * sx         ,   -1.0 + SYS * (sy-sh)     ,   z,
          -1.0 + SXS * (sx+sw)    ,   -1.0 + SYS * (sy-sh)     ,   z,
          -1.0 + SXS * (sx+sw)    ,   -1.0 + SYS * (sy)        ,   z,
          -1.0 + SXS * sx         ,   -1.0 + SYS * (sy)        ,   z
      );
          
      RetData[1].push(
          tx, ty,
          tu, ty,
          tu, tv,
          tx, tv  
      );
      
      RetData[2].push(
          offidx+0, offidx+1, offidx+2,
          offidx+0, offidx+2, offidx+3    
      );
      return RetData;  
  };

  /*
   *  This creates a Canvas Context given an WebGL Texture.
   *  Used for getting texture images converted to Canvas images.
   */
  PrimeGL.Tools.createCanvasFromTexture = function (gl, texture, width, height) {
      // Create a framebuffer backed by the texture
      var framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      // Read the contents of the framebuffer
      var data = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

      gl.deleteFramebuffer(framebuffer);

      // Create a 2D canvas to store the result 
      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var context = canvas.getContext('2d');

      // Copy the pixels to a 2D canvas
      var imageData = context.createImageData(width, height);
      imageData.data.set(data);
      context.putImageData(imageData, 0, 0);

      return canvas;
  };

  PrimeGL.Renderer  =   function( parameters )  {
    var canvas  =   parameters.canvas,
        gl      =   parameters.gl;
    if(gl !== undefined)    {
      this.gl = gl;
      this.canvas = canvas;
      this.gl.viewportWidth = canvas.width;
      this.gl.viewportHeight = canvas.height;
      PrimeGL.ScreenWidth = canvas.width;
      PrimeGL.ScreenHeight = canvas.height;
      this.Shaders = [];
      
      if (!this.gl) 
        alert("Could not initialise WebGL.");
          
      this.InitShaders();                           //  Initialize the Basic Shaders
      
      this.gl.clearColor(0.1, 0.1, 0.1, 1.0);       //  Sets the clear color

      this.VertexBuffer       = gl.createBuffer();  //  Initialize Vertex Buffers
      this.TextureCoordBuffer = gl.createBuffer();  //  Initialize TextureCoordBuffer
      this.VertexIndexBuffer  = gl.createBuffer();  //  Initialize VertexIndexBuffer
      this.TempTexture        = gl.createTexture(); //  Initialize Temporary Texture
    }    
  };

  /*
   *  This function Initialize the Basic Shaders (Simple and Blend)
   *  It compiles the codes and creates the programs.
   */
  PrimeGL.Renderer.prototype.InitShaders    =   function()  {
    //  Compile the Shader Codes
      this.vertexShader           = PrimeGL.Tools.compileShader(this.gl, PrimeGL.Shaders.SimpleVertexShader, this.gl.VERTEX_SHADER);
      this.blendVertexShader      = PrimeGL.Tools.compileShader(this.gl, PrimeGL.Shaders.BlendVertexShader, this.gl.VERTEX_SHADER);
      this.fragmentShader         = PrimeGL.Tools.compileShader(this.gl, PrimeGL.Shaders.SimpleFragmentShader, this.gl.FRAGMENT_SHADER);
      this.blendFragmentShader    = PrimeGL.Tools.compileShader(this.gl, PrimeGL.Shaders.BlendFragmentShader, this.gl.FRAGMENT_SHADER);
      
      //  Create the programs
      this.Shaders.push(PrimeGL.Tools.createProgram(this.gl, this.vertexShader, this.fragmentShader));
      this.Shaders.push(PrimeGL.Tools.createProgram(this.gl, this.blendVertexShader, this.blendFragmentShader));
      
      //  Sets the Shader Attributes / Uniforms
      //  - Simple Shader
      this.gl.useProgram(this.Shaders[0]);

      this.Shaders[0].vertexPositionAttribute = this.gl.getAttribLocation(this.Shaders[0], "aVertexPosition");
      this.gl.enableVertexAttribArray(this.Shaders[0].vertexPositionAttribute);


      this.Shaders[0].textureCoordAttribute = this.gl.getAttribLocation(this.Shaders[0], "aTextureCoord");
      this.gl.enableVertexAttribArray(this.Shaders[0].textureCoordAttribute);

      this.Shaders[0].samplerUniform = this.gl.getUniformLocation(this.Shaders[0], "uSampler");
      this.Shaders[0].opacityUniform = this.gl.getUniformLocation(this.Shaders[0], "uOpacity");
      this.Shaders[0].scaleUniform = this.gl.getUniformLocation(this.Shaders[0], "uScale");
      
      //  - Blend Shader
          
      this.gl.useProgram(this.Shaders[1]);

      this.Shaders[1].vertexPositionAttribute = this.gl.getAttribLocation(this.Shaders[1], "aVertexPosition");
      this.gl.enableVertexAttribArray(this.Shaders[1].vertexPositionAttribute);


      this.Shaders[1].textureCoordAttribute = this.gl.getAttribLocation(this.Shaders[1], "aTextureCoord");
      this.gl.enableVertexAttribArray(this.Shaders[1].textureCoordAttribute);

      this.Shaders[1].sampler0Uniform = this.gl.getUniformLocation(this.Shaders[1], "uSampler0");
      this.Shaders[1].sampler1Uniform = this.gl.getUniformLocation(this.Shaders[1], "uSampler1");
      this.Shaders[1].opacityUniform = this.gl.getUniformLocation(this.Shaders[1], "uOpacity");
      this.Shaders[1].blendModeUniform = this.gl.getUniformLocation(this.Shaders[1], "uBlendMode");
      this.Shaders[1].scaleUniform = this.gl.getUniformLocation(this.Shaders[1], "uScale");
      
  };

  /*
   *  This is to clear the drawing screen.
   */
  PrimeGL.Renderer.prototype.Clear  =   function()      {
      this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.blendEquation( this.gl.FUNC_ADD );
      this.gl.blendFunc( this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA );
      this.gl.enable( this.gl.BLEND );
  };

  /*
   *  This is for render the following data.
   *  The data parameter is an array of elements that has following structure:
   *    - texture   =>  The object texture
   *    - vertex    =>  The vertex array
   *    - texcoord  =>  The texture coordinates array
   *    - index   =>  The vertex indexes
   *    - shdNum    =>  The shader program number to use
   *    - scale   =>  The scale to render
   *    - opacity   =>  The opacity of the object
   */
  PrimeGL.Renderer.prototype.Render =   function(data)  {
    var i=0,len=data.length;
    while(i<len)    {
      var d = data[i],
          texture     =   d.texture,
          vertex      =   d.vertex,
          texcoord    =   d.texcoord,
          indexes     =   d.index,
          shdNum      =   d.shdNum,
          scale       =   d.scale,
          opacity     =   d.opacity,
          shader      =   this.Shaders[shdNum];
        
      //  Enables the program - TODO: Make a cache of last shader number loaded, so we dont need to reload if its the same.
      this.gl.useProgram(shader);
      
      //  Bind the Vertex Buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertex) , this.gl.STATIC_DRAW);
      this.gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

      //  Bind the Texture Coordinate Buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.TextureCoordBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texcoord) , this.gl.STATIC_DRAW);
      this.gl.vertexAttribPointer(shader.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

      //  Bind the Texture
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D,  texture);
      this.gl.uniform1i(shader.samplerUniform, 0);

      //  Bind the opacity and scale values
      this.gl.uniform1f(shader.opacityUniform, opacity);
      this.gl.uniform3f(shader.scaleUniform, scale.x, scale.y, scale.z);
      
      //  Bind the Vertex Index Buffer
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.VertexIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), this.gl.STATIC_DRAW);
      
      //  Draw
      this.gl.drawElements(this.gl.TRIANGLES, indexes.length, this.gl.UNSIGNED_SHORT, 0);  
            
      ++i;
    }
  };

  /*
   *  The RenderObject Class
   *  This is a Renderable object class.
   */
  PrimeGL.Renderer.prototype.RenderObject =   function(data)  {
    var shader = this.Shaders[0];
    if(data.opacity > 0 && data.visible)    {
        var blend = 0 ;
        var textureToUse = data.image;
        switch(data.blendtype)  {
            case "lighter": blend = 1; break;
            default: blend = 0; break;
        }
        if(blend === 0)  {
            this.gl.useProgram(shader);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D,  textureToUse);
            this.gl.uniform1i(shader.samplerUniform, 0);
        }else{
            shader = this.Shaders[1];
            this.gl.useProgram(this.Shaders[1]);
            //  First the real texture
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D,  textureToUse);
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
            this.gl.uniform1i(shader.sampler0Uniform, 0);  
            this.gl.uniform1i(shader.blendModeUniform, blend);
        }   
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, data.VertexBuffer);
        this.gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, data.TextureCoordBuffer);
        this.gl.vertexAttribPointer(shader.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniform1f(shader.opacityUniform, data.opacity);
        this.gl.uniform3f(shader.scaleUniform, data.scale.x, data.scale.y, 1);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, data.VertexIndexBuffer);
        this.gl.drawElements(this.gl.TRIANGLES, data.VertexIndexArray.length, this.gl.UNSIGNED_SHORT, 0);
    }  
  };

  window.PrimeGL = PrimeGL;

}());