/**
__        __   _     ____       _     
\ \      / /__| |__ |  _ \ _ __(_)_ __ ___   ___ 
 \ \ /\ / / _ \ '_ \| |_) | '__| | '_ ` _ \ / _ \
  \ V  V /  __/ |_) |  __/| |  | | | | | | |  __/
   \_/\_/ \___|_.__/|_|   |_|  |_|_| |_| |_|\___| 
                                                                                    
Pump It Up: Prime Web Version
Copyright (C) 2015  HUEBR's Team

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

Please notice that this license only applies for the codes of Pump It Up Visualizer.
The assets from Pump It Up Fiesta 2 are NOT licensed here and their copyrights are
holded by Andamiro. Also there is a few libraries that is used on Piuvisual that
may have different license including but not limited to JPAK, jQuery and others.

*/


(function () {
  'use strict';

  var GLBackground = {};


  GLBackground.GenerateNoiseTexture = function(gl, width, height)    {
    var DataBuff = new Uint8Array(width*height*4);
    var i=0, len=width*height*4;
    while(i<len)    {
      DataBuff[i+0] = Math.random()*256;
      DataBuff[i+1] = Math.random()*256;
      DataBuff[i+2] = Math.random()*256;
      DataBuff[i+3] = 255;
      i+=4;
    }
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, DataBuff);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return texture;
  };

  GLBackground.PIUBGAOFF = function(gl, width, height)   {
    this.gl = gl;
    
    this.vertexShader               = PrimeGL.Tools.compileShader(this.gl, PrimeGL.Shaders.NullVertexShader, this.gl.VERTEX_SHADER);
    this.fragmentShader             = PrimeGL.Tools.compileShader(this.gl, PrimeGL.Shaders.PIUBGAOffFragment /*LaserBubblesFragment*/, this.gl.FRAGMENT_SHADER);
    this.programShader              = PrimeGL.Tools.createProgram(this.gl, this.vertexShader, this.fragmentShader);
    
    this.gl.useProgram(this.programShader);
    
    this.programShader.time         = this.gl.getUniformLocation( this.programShader, "time" );
    this.programShader.resolution   = this.gl.getUniformLocation( this.programShader, "resolution" );
    this.programShader.uSampler     = this.gl.getUniformLocation( this.programShader, "uSampler");
    this.programShader.position     = this.gl.getAttribLocation ( this.programShader, "position" );
    this.gl.enableVertexAttribArray(this.programShader.position);
    
    this.NoiseTexture = GLBackground.GenerateNoiseTexture(this.gl, 256,256);
    
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
     
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    this.texture.width = width; 
    this.texture.height = height; 
    this.texture.rwidth = width;
    this.texture.rheight = height;  
    
    this.RenderBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(gl.RENDERBUFFER, this.RenderBuffer);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
    this.FrameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.FrameBuffer);
    this.FrameBuffer.width = width;
    this.FrameBuffer.height = height;    
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.RenderBuffer);
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    
    this.resolution = 2;
    this.startTime = Date.now();
    this.time = 0;
    
    this.VertexBuffer = this.gl.createBuffer();
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array( new Float32Array( [ - 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0 ] ) ) , this.gl.STATIC_DRAW);    
  };

  GLBackground.PIUBGAOFF.prototype.Render = function() {
    this.time = Date.now() - this.startTime;
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.FrameBuffer);
    
    this.gl.viewport(0,0, this.FrameBuffer.width, this.FrameBuffer.height);
    
    this.gl.useProgram(this.programShader);
    this.gl.uniform1f(this.programShader.time, this.time / 1000);
    this.gl.uniform2f(this.programShader.resolution, this.FrameBuffer.width, this.FrameBuffer.height);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VertexBuffer);
    this.gl.vertexAttribPointer(this.programShader.position, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D,  this.NoiseTexture);
    this.gl.uniform1i(this.programShader.uSampler, 0);
    
    this.gl.drawArrays( this.gl.TRIANGLES, 0, 6 );
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  };

  GLBackground.LaserBubblesRender = function(gl, width, height)   {
    this.gl = gl;
    
    this.vertexShader               = PrimeGL.Tools.compileShader(this.gl, PrimeGL.Shaders.NullVertexShader, this.gl.VERTEX_SHADER);
    this.fragmentShader             = PrimeGL.Tools.compileShader(this.gl, PrimeGL.Shaders.LaserBubblesFragment /*LaserBubblesFragment*/, this.gl.FRAGMENT_SHADER);
    this.programShader              = PrimeGL.Tools.createProgram(this.gl, this.vertexShader, this.fragmentShader);
    
    this.gl.useProgram(this.programShader);
    
    this.programShader.time         = this.gl.getUniformLocation( this.programShader, "time" );
    this.programShader.resolution   = this.gl.getUniformLocation( this.programShader, "resolution" );
    this.programShader.position     = this.gl.getAttribLocation ( this.programShader, "position" );
    
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
     
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    this.texture.width = width; 
    this.texture.height = height; 
    this.texture.rwidth = width;
    this.texture.rheight = height;  
    
    this.RenderBuffer = this.gl.createRenderbuffer();
    this.gl.bindRenderbuffer(gl.RENDERBUFFER, this.RenderBuffer);
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);
    this.FrameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.FrameBuffer);
    this.FrameBuffer.width = width;
    this.FrameBuffer.height = height;    
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
    this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.RenderBuffer);
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    
    this.resolution = 2;
    this.startTime = Date.now();
    this.time = 0;
    
    this.VertexBuffer           = this.gl.createBuffer();
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array( new Float32Array( [ - 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0 ] ) ) , this.gl.STATIC_DRAW);
  };

  GLBackground.LaserBubblesRender.prototype.Render = function() {
    this.time = Date.now() - this.startTime;
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.FrameBuffer);
    
    this.gl.viewport(0,0, this.FrameBuffer.width, this.FrameBuffer.height);
    //this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    this.gl.useProgram(this.programShader);
    this.gl.uniform1f(this.programShader.time, this.time / 1000);
    this.gl.uniform2f(this.programShader.resolution, this.FrameBuffer.width, this.FrameBuffer.height);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.VertexBuffer);
    this.gl.vertexAttribPointer(this.programShader.position, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays( this.gl.TRIANGLES, 0, 6 );
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  };

  GLBackground.BGD = {
    "BGA_OFF": GLBackground.PIUBGAOFF,
    "LaserBubbles": GLBackground.LaserBubblesRender
  };

  window.GLBackground = GLBackground;

}());