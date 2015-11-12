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

  /************************* Drawer **************************/
  /* Layers:
      0:  Background Layer
      1:  Background Sprite Layer
      2:  Game Note Layer
      3:  Sprite UI Layer
      4:  Effect Layer
      
  **Z NOT USED FOR NOW**  
      On WebGL Layers are defined by Z-index. So here is what I defined:
      
      0: -100
      1: -50
      2: -25
      3: -12.5
      4: 0  
      The Z distance between layers are for ordering locals.
  PrimeGL.LayerZ = { 
      "0" : -100,     //  Background Layer  
      "1" : -50,      //  Background Sprite Layer
      "2" : -25,      //  Game Note Layer
      "3" : -12.5,    //  Sprite UI Layer
      "4" : 0         //  Effect Layer
  }; 
  */

  var WebGLDrawer = function(parameters) {
    parameters.webglmode = true;
    BaseDrawer.call(this, parameters);

    this.gl                 =   parameters.gl;

    this.Notes              =   [ [], [], [] ];
    this.NotesIdx           =   0;
    this.NotesTexture       =   undefined;
    this.Longs              =   [ [], [], [] ];
    this.LongsIdx           =   0;
    this.LongsTexture       =   undefined;
    this.Items              =   [ [], [], [] ];
    this.ItemsIdx           =   0;
    this.ItemsTexture       =   undefined;

    this.Renderer           =   new PrimeGL.Renderer({"canvas": this.canvas, "gl": this.gl, "webprime": this.webprime});
    this.InitCanvasObject();
  };


  WebGLDrawer.prototype =  Object.create(BaseDrawer.prototype);
  WebGLDrawer.prototype.constructor = WebGLDrawer;

  WebGLDrawer.prototype.InitCanvasObject = function() {
    var canvas = document.createElement('canvas');
    canvas.width = PrimeGL.Tools.nextHighestPowerOfTwo(this.webprime.config.width);
    canvas.height = PrimeGL.Tools.nextHighestPowerOfTwo(this.webprime.config.height);

    var ctx = canvas.getContext("2d");
    var canvasTexture = this.gl.createTexture();

    this.gl.bindTexture(this.gl.TEXTURE_2D, canvasTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    canvasTexture.width = canvas.width;
    canvasTexture.height = canvas.height;
    canvasTexture.rwidth = canvas.width;
    canvasTexture.rheight = canvas.rheight;

    this.CanvasObject = new AnimatedObject({"image" : canvasTexture, "gl" : this.gl, "webprime" : this.webprime});
    this.CanvasObject.canvas = canvas;
    this.CanvasObject.ctx = ctx;
    this.CanvasObject.Drawer = this;
    this.CanvasObject.layer = 0;

    this.CanvasObject.UpdateCanvasTexture = function() {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.image);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.canvas);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    };
  };

  /*
   *  Clears the Index Buffers
   */
  WebGLDrawer.prototype.Clear = function()  {
    this.Notes[0].length = 0;
    this.Notes[1].length = 0;
    this.Notes[2].length = 0;
    this.NotesIdx = 0;
    this.Items[0].length = 0;
    this.Items[1].length = 0;
    this.Items[2].length = 0;
    this.ItemsIdx = 0;
  };

  /*
   *  This function draws a Hold body given the paremeters.
   */
  BaseDrawer.prototype.DrawHoldBody    =   function(ctx, nopacity, notepos, y, seed, attr, height)   { 
    if (nopacity !== 0 && height-this.webprime.gameVariables.arrowSize/2 > 0 && height > 0 && y > -200)  {
      height = (y<0)?height+y:height;
      y = (y<0)?0:y;
      var img = this.skin.GLGetNoteImage(PrimeConst.NoteHoldBody, notepos%5, seed, attr);
      var pos = this.webprime.gameVariables.songIsDouble ? this.webprime.gameVariables.doubleNotesX[notepos] : this.webprime.gameVariables.singleNotesX[notepos];
      var data = PrimeGL.Tools.genSprite(pos,y+this.webprime.gameVariables.arrowSize/2,this.webprime.gameVariables.arrowSize,height+11,img.x,img.y,img.u,img.v,1,this.NotesIdx);
      this.NotesTexture = img.texture;
      this.Notes[0] = this.Notes[0].concat(data[0]);
      this.Notes[1] = this.Notes[1].concat(data[1]);
      this.Notes[2] = data[2].concat(this.Notes[2]);//.concat(data[2]);
      this.NotesIdx+= data[0].length/3;
    }
  };

  /*
   *  This is for processing the effects. Usually this will be only for NX20 stuff.
   *  Maybe in the future we would need this for Stepmania Effects too.
   */
  BaseDrawer.prototype.ProcessEffect   =   function(ctx, nopacity, notepos, y, noterotation, seed, attr, time)   {
    // TODO
  };

  /*
   *  This function draws a note with given parameters. 
   *  It also trims the y parameter if this.webprime.config.subPixelRender is false.
   *  It also has a Debug Parameter (this.webprime.config.drawAnchors) for drawing a red dot in the middle of note.
   */
  BaseDrawer.prototype.DrawNote    =   function(ctx, ntype, nopacity, notepos, y, noterotation, seed, attr)  {
    if (nopacity !== 0 && ntype !== PrimeConst.NoteNull && (y > this.webprime.gameVariables.offsetY-2 || ntype === PrimeConst.NoteFake || ntype === PrimeConst.NoteItemFake) )  {
      var img = this.skin.GLGetNoteImage(ntype, notepos%5, seed, attr);
      var pos = this.webprime.gameVariables.songIsDouble ? this.webprime.gameVariables.doubleNotesX[notepos] : this.webprime.gameVariables.singleNotesX[notepos];
      var data = PrimeGL.Tools.genSprite(pos,y,this.webprime.gameVariables.arrowSize,this.webprime.gameVariables.arrowSize,img.x,img.y,img.u,img.v,1,this.NotesIdx);
      this.NotesTexture = img.texture;
      this.Notes[0] = this.Notes[0].concat(data[0]);
      this.Notes[1] = this.Notes[1].concat(data[1]);
      this.Notes[2] = this.Notes[2].concat(data[2]);
      this.NotesIdx+= (data[0].length/3);
    }
  };

  /*
   *  This function gets all the layers and draw on the main canvas given the layer order.
   *  It will use layer.blendtype parameter to blend the layer over the canvas.
   */
  BaseDrawer.prototype.DrawLayers  =   function()  {
    if (!this.webprime.Loader.allObjectsLoaded)  {
      this.DrawLoading();
    }else{
      this.Renderer.Clear();
      var i           =   0, 
          len         =   this.SceneLayers.length;
      var data = [];
      
      while(i<len)    {
        if (i == 2)  {
          if (this.longTexture !== undefined) {
            data =[
              { 
                texture     :   this.LongsTexture,
                vertex      :   this.Longs[0],
                texcoord    :   this.Longs[1],
                index       :   this.Longs[2],
                shdNum      :   0,
                scale       :   {x:1,y:1,z:1},
                opacity     :   1
              }
            ];
            this.Renderer.Render(data);  
          }
          if (this.NotesTexture !== undefined) {
            data =[
                { 
                  texture     :   this.NotesTexture,
                  vertex      :   this.Notes[0],
                  texcoord    :   this.Notes[1],
                  index       :   this.Notes[2],
                  shdNum      :   0,
                  scale       :   {x:1,y:1,z:1},
                  opacity     :   1
                }
            ];
            this.Renderer.Render(data);  
          }
          //TODO: ITEMS          
        }
        var j=0,jlen=this.SceneLayers[i].Objects.length;
        while(j<jlen)   {
          this.Renderer.RenderObject(this.SceneLayers[i].Objects[j]);
          ++j;
        }
        ++i;
      }
    }
  };

  /*
   *  This function draws the Loading screen.
   */
  BaseDrawer.prototype.DrawLoading =   function()   {
    this.Renderer.Clear();
    this.CanvasObject.ctx.font = "bold 56px sans-serif";
    this.CanvasObject.ctx.textAlign = 'center';
    this.CanvasObject.ctx.clearRect(0,0,this.CanvasObject.canvas.width,this.CanvasObject.canvas.height);
    this.CanvasObject.ctx.fillStyle = 'white';
    this.CanvasObject.ctx.fillText("Loading", 320, 200);
    var percent = Math.round(100 * (this.webprime.Loader.objectsLoaded /  this.webprime.Loader.objectsToLoad));
    this.CanvasObject.ctx.fillText("Loaded: "+percent+"%", 320, 260);
    this.CanvasObject.ctx.fillText("Files: "+this.webprime.Loader.objectsLoaded+"/"+this.webprime.Loader.objectsToLoad, 320, 320);
    this.CanvasObject.ctx.fillText("WebGL Mode", 320, 460);

    this.CanvasObject.GLUpdate();
    this.CanvasObject.UpdateCanvasTexture();
    this.Renderer.RenderObject(this.CanvasObject);
  };

  window.WebGLDrawer = WebGLDrawer;
}());