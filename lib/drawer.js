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

  var CanvasDrawer = function(parameters) {
    parameters.webglmode = false;
    BaseDrawer.call(this, parameters);
    this.ctx = this.canvas.getContext("2d");
  };

  CanvasDrawer.prototype =  Object.create(BaseDrawer.prototype);
  CanvasDrawer.prototype.constructor = CanvasDrawer;

  /*
   *  This function draws a Hold body given the paremeters.
   */
  CanvasDrawer.prototype.DrawHoldBody    =   function(ctx, nopacity, notepos, y, seed, attr, height)   { 
    if (nopacity !== 0 && height-this.webprime.gameVariables.arrowSize/2 > 0 && height > 0 && y > -200)  {
      if (!this.webprime.config.subPixelRender)  {
        y = y >> 0;
        height = height >> 0;
        height = (y<0)?height+y:height;
        y = (y<0)?0:y;
      }
      var oldAlpha    =   ctx.globalAlpha,
          img         =   this.skin.GetNoteImage(PrimeConst.NoteHoldBody, notepos%5, seed, attr),
          oldComp     =   ctx.globalCompositeOperation,
          pos         =   this.webprime.gameVariables.songIsDouble ? this.webprime.gameVariables.doubleNotesX[notepos] : this.webprime.gameVariables.singleNotesX[notepos];
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.globalAlpha = nopacity;
      ctx.drawImage(img,pos , y + this.webprime.gameVariables.arrowSize/2, this.webprime.gameVariables.arrowSize, height+11);
      ctx.globalAlpha = oldAlpha;
      ctx.globalCompositeOperation = oldComp;
      ctx.restore();
    }
  };

  /*
   *  This is for processing the effects. Usually this will be only for NX20 stuff.
   *  Maybe in the future we would need this for Stepmania Effects too.
   */
  CanvasDrawer.prototype.ProcessEffect   =   function(ctx, nopacity, notepos, y, noterotation, seed, attr, time)   {
    if (attr === 0 && seed === 22 && y <= this.webprime.gameVariables.offsetY / 2 )   {    //  Bomb Effect
      if (this.webprime.gameVariables.noteData.CurrentBeat >> 0 != this.webprime.sounds.Bomb.LastBeatPlay)   {
        this.webprime.sounds.Bomb.Play();  
        this.webprime.sounds.Bomb.LastBeatPlay = this.webprime.gameVariables.noteData.CurrentBeat >> 0;
      }
      this.webprime.gameVariables.effectBank.FlashEffect.Start(this.webprime.gameVariables.noteData.CurrentBeat);
    } else if (attr === 0 && seed === 17 && y <= this.webprime.gameVariables.offsetY)  {   // Flash Effect
      this.webprime.gameVariables.effectBank.Start(this.webprime.gameVariables.noteData.CurrentBeat);
      /*
       if (this.webprime.gameVariables.noteData.CurrentBeat >> 0 != .LastBeatPlay)   {
          this.webprime.sounds.Bomb.Play();  
          this.webprime.sounds.Bomb.LastBeatPlay = this.webprime.gameVariables.noteData.CurrentBeat >> 0;
      } */      
    }
    /*
      //  Few effects to add some time
    Effect 1 0 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 1 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 2 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 3 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 4 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 5 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 6 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 7 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 8 3.8826666666666663 0 17 0 undefined drawer.js:160
    Effect 1 9 3.8826666666666663 0 17 0 undefined drawer.js:160
    */
    //console.log("Effect", nopacity, notepos, y, noterotation, seed, attr, time);
  };

  /*
   *  This function draws a note with given parameters. 
   *  It also trims the y parameter if this.webprime.config.subPixelRender is false.
   *  It also has a Debug Parameter (this.webprime.config.drawAnchors) for drawing a red dot in the middle of note.
   */
  CanvasDrawer.prototype.DrawNote    =   function(ctx, ntype, nopacity, notepos, y, noterotation, seed, attr)  {
    if (nopacity !== 0 && ntype !== PrimeConst.NoteNull && (y > this.webprime.gameVariables.offsetY - 2 || ntype === PrimeConst.NoteFake || ntype === PrimeConst.NoteItemFake) )  {
      if (!this.webprime.config.subPixelRender)  {
        y = y >> 0;
      }
      //seed = (seed==0) ? this.webprime.config.defaultNoteSkin : seed;
      var oldAlpha    =   ctx.globalAlpha;
      var img = this.skin.GetNoteImage(ntype, notepos%5, seed, attr);
      var pos = this.webprime.gameVariables.songIsDouble ? this.webprime.gameVariables.doubleNotesX[notepos] : this.webprime.gameVariables.singleNotesX[notepos];
      ctx.save();
      ctx.globalAlpha = nopacity;
      //ctx.globalCompositeOperation = "destination-over";
      ctx.globalCompositeOperation = "source-over";
      ctx.translate(pos+this.webprime.gameVariables.arrowSize/2 , y+this.webprime.gameVariables.arrowSize/2);
      ctx.rotate(noterotation);
      ctx.drawImage(img,-this.webprime.gameVariables.arrowSize/2,-this.webprime.gameVariables.arrowSize/2, this.webprime.gameVariables.arrowSize, this.webprime.gameVariables.arrowSize);
      ctx.globalAlpha = oldAlpha;
      ctx.restore();
      if (this.webprime.config.drawAnchors)   {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos+this.webprime.gameVariables.arrowSize/2,y+this.webprime.gameVariables.arrowSize/2, 4, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  /*
   *  This function gets all the layers and draw on the main canvas given the layer order.
   *  It will use layer.blendtype parameter to blend the layer over the canvas.
   */
  CanvasDrawer.prototype.DrawLayers  =   function()  {
    if (!this.webprime.Loader.allObjectsLoaded)  {
      this.DrawLoading();
    }else{
      var i=0, len=this.SceneLayers.length-1;
      var orgblend = this.ctx.globalCompositeOperation;
      this.canvas.width = this.canvas.width;
      while(i<len)    {
        this.SceneLayers[i].UpdateCanvas();
        this.ctx.globalCompositeOperation = this.SceneLayers[i].blendtype;
        this.ctx.drawImage(this.SceneLayers[i].GetCanvas(),0,0);
        ++i;
      }
      this.ctx.globalCompositeOperation = orgblend;
      // Draw Effects
      this.SceneLayers[4].UpdateCanvas();
      i=0;
      len = this.SceneLayers[4].Objects.length;
      while(i<len)    {
        this.SceneLayers[4].Objects[i].Draw(this.ctx);
        ++i;       
      }
    }
  };

  /*
   *  This function draws the Loading screen.
   */
  CanvasDrawer.prototype.DrawLoading =   function()   {
    var targetX = ( this.webprime.config.width - 640 ) / 2;
    var targetY = ( this.webprime.config.height - 480 ) / 2;
    this.canvas.width = this.canvas.width;
    this.ctx.font = "bold 56px sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.fillText("Loading", targetX+320, targetY+200);
    var percent = Math.round(100 * (this.webprime.Loader.objectsLoaded /  this.webprime.Loader.objectsToLoad));
    this.ctx.fillText("Loaded: "+percent+"%", targetX+320, targetY+260);
    this.ctx.fillText("Files: "+this.webprime.Loader.objectsLoaded+"/"+this.webprime.Loader.objectsToLoad, targetX+320, targetY+320);
  };

  window.CanvasDrawer = CanvasDrawer;
}());