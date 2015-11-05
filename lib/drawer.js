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
  /*
   *  PUMPER Drawer Class
   * 
   *  This class does the drawing of the Stuff on 2D Canvas Context
   */
  var Drawer = function ( parameters )  {
      this.canvas             =   parameters.canvas;
      this.skin               =   parameters.skin;
      this.ctx                =   this.canvas.getContext("2d");

      this.SceneLayers        =   [ ];                              // PUMPER.SceneLayer
      this.lastDelta          =   Date.now();
      this.NoteBlock          =   [];
      this.HoldBuffer         =   [[],[],[],[],[],[],[],[],[],[]];  //  This is for making buffer of hold notes start and end
      this.webprime           =   parameters.webprime;
      
      this.InitLayers(this.canvas.width, this.canvas.height);
  };

  /*
   *  This creates the SceneLayers objects for drawing.
   *  Used for Software Z-Buffer drawing
   */
  Drawer.prototype.InitLayers  =   function(width,height)  {
    var i   = 0, 
        len = 5;
    PrimeLog.d("Initializing "+len+" layers with size ("+width+","+height+")");
    while(i<len) {
      var lay = new SceneLayer({"width":width,"height":height});
      lay.InitLayer();
      this.SceneLayers.push(lay);
      ++i;
    }
    this.SceneLayers[4].blendtype = "lighter";
  };

  /*
   *  This adds a object to corresponding layer.
   *  If layer parameter is undefined, it will add to default layer (2)
   */
  Drawer.prototype.AddObj      =   function(obj,layer) {
    layer = layer !== undefined ? layer : 2; 
    PrimeLog.d("Drawer::Adding AnimObj "+obj.id+" in layer "+layer);
    obj.Drawer = this;
    this.SceneLayers[layer].AddObject(obj);
  };

  /*
   *  Removes an object from a given layer.
   */
  Drawer.prototype.RemoveObj   =   function(objname,layer)  {  this.SceneLayers[layer].RemoveObject(objname); };

  /*
   *  This does the note drawing.
   *  The note layer is the default (2), all notes will be rendered on Layer 2
   *  This will basicly iterate over the noteblock adding the notes on the layer
   */
  Drawer.prototype.DrawNotes   =   function() {
    var i           =   0, 
        len         =   this.NoteBlock.length,
        ctx         =   this.SceneLayers[2].GetContext(),
        k           =   0,
        klen        =   0;  
    while(i<len)    {
      var row = this.NoteBlock[i],
          n = 0, nlen = row.notes.length;
      while(n < nlen) {
        var note = row.notes[n];
        if(note.type == PrimeConst.NoteHoldHead || note.type == PrimeConst.NoteHoldHeadFake)    {   //  First we will process the holds. The holds have start, body and end.
                                                                                                    //  So basicly we need to cache the start and see where it will end, so we can know how much we need to draw.
          if(this.HoldBuffer[n].length === 0) {                                                     //  We first search if there is any hold already on buffer. If not, we add the current one to buffer. 
                                                                                                    //  This is necessary for broken/bad made charts that doesnt have start/end for longs.
            this.HoldBuffer[n].push({
              "beatfrom"  :   row.rowbeat, 
              "beatend"   :   note.beatend, 
              "pos"       :   n, 
              "opacity"   :   note.opacity, 
              "y"         :   row.y, 
              "seed"      :   note.seed, 
              "attr"      :   note.attr
            });
          }else{                                //  If it doesnt, it means we may have an delta to draw the hold.
              var found = false;                //  Lets see if we can find a hold in the same column we already found.
              klen=this.HoldBuffer[n].length;   //  If we find, we just update the Y 
              k=0;
              while(k<klen)   {
                if(this.HoldBuffer[n][k].beatfrom == row.rowbeat)   {         
                  this.HoldBuffer[n][k].y = row.y;
                  found = true;
                  break;
                }
                ++k;
              }
              if(!found)                        //  If not, we need to add it to the buffer
                this.HoldBuffer[n].push({
                  "beatfrom"  :   row.rowbeat, 
                  "beatend"   :   note.beatend, 
                  "pos"       :   n, 
                  "opacity"   :   note.opacity, 
                  "y"         :   row.y, 
                  "seed"      :   note.seed, 
                  "attr"      :   note.attr
                });
          }
        }else if(note.type == PrimeConst.NoteHoldBody)   {                                                      //  If its an hold body, we just need to check if its on CutZone (a.k.a. receiver). If so, we trigger the Receiver Effect for that note
          if(this.webprime.gameVariables.noteData.BeatInCutZone(row.rowbeat, row))                              //  In UCS and NX20 we draw the hold regardless if the body is defined or not. So we don't need to force it draw.
            this.webprime.gameVariables.effectBlock[n].Start(this.webprime.gameVariables.noteData.CurrentBeat);
        }
        if(note.type == PrimeConst.NoteEffect)                                                                  //  If its an Effect (NX20 stuff), we trigger process the Effect
          this.ProcessEffect(ctx, note.opacity, n, row.y, note.rotation, note.seed, note.attr);
        else if(note.type != PrimeConst.NoteHoldBody && note.type != PrimeConst.NoteNull)  {                    //  If its not an Hold and not a Null Note, we just draw it.
          if(this.webprime.gameVariables.noteData.BeatInCutZone(row.rowbeat, row) && note.type != PrimeConst.NoteItemFake && note.type != PrimeConst.NoteFake)   {
            this.webprime.gameVariables.effectBlock[n].Start(this.webprime.gameVariables.noteData.CurrentBeat);
          }else{
            this.DrawNote(ctx, note.type, note.opacity, n, row.y, note.rotation, note.seed, note.attr);
          }
        }
        ++n;
      }
      ++i;
    }
    i = 0;
    len = this.webprime.gameVariables.songIsDouble ? 10 : 5; //  Just how many notes we will iterate.
    /*
     *  This loop will iterate over the Hold Buffer and draw the holds.
     *  Basicly will draw the start, body and end.
     */
    while(i<len)    {
      var HoldK   =   this.HoldBuffer[i],
          lenK    =   HoldK.length,
          y       =   0;
      k = 0;
      while(k<lenK)   {

        var Hold = HoldK[k];

        if(Hold.beatend < this.webprime.gameVariables.noteData.CurrentBeat && Hold.beatend !== undefined)    {
          // You dont belong to us anymore!
          HoldK.splice(k, 1);
          --lenK;
          continue;
        }
        
        if(Hold.beatend === undefined)
            y = this.webprime.config.height;
        else
            y = this.webprime.gameVariables.noteData.GetBeatY(Hold.beatend);
        
        Hold.y = this.webprime.gameVariables.noteData.GetBeatY(Hold.beatfrom);
        
        if(Hold.y < this.webprime.gameVariables.offsetY)
          Hold.y = this.webprime.gameVariables.offsetY;
        
        this.DrawHoldBody(ctx, Hold.opacity, Hold.pos, Hold.y, Hold.seed, Hold.attr, y-Hold.y); 
        
        if( Hold.y >= this.webprime.gameVariables.offsetY)   {
          this.DrawNote(PrimeConst.NoteTap, Hold.opacity, Hold.pos, Hold.y, 0, Hold.seed, Hold.attr);
        }else if( Hold.y <= this.webprime.gameVariables.offsetY || ( Hold.y < this.webprime.gameVariables.offsetY-3 && y > this.webprime.gameVariables.offsetY-32) ) 
          this.DrawNote(PrimeConst.NoteTap, Hold.opacity, Hold.pos, this.webprime.gameVariables.offsetY, 0, Hold.seed, Hold.attr);
        
        ++k;
      }
      ++i;
    }
  };

  /*
   *  This function draws a Hold body given the paremeters.
   *  It also trims the float to int in height and y parameters if webprime.config.subPixelRender is disabled.
   */

  Drawer.prototype.DrawHoldBody    =   function(ctx, nopacity, notepos, y, seed, attr, height)   { 
    if(nopacity !== 0 && height-this.webprime.gameVariables.arrowSize/2 > 0 && height > 0 && y > -200)  {
      if(!this.webprime.config.subPixelRender)  {
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
  Drawer.prototype.ProcessEffect   =   function(ctx, nopacity, notepos, y, noterotation, seed, attr, time)   {
    if (attr === 0 && seed === 22 && y <= this.webprime.gameVariables.offsetY / 2 )   {    //  Bomb Effect
      if(this.webprime.gameVariables.noteData.CurrentBeat >> 0 != this.webprime.sounds.Bomb.LastBeatPlay)   {
        this.webprime.sounds.Bomb.Play();  
        this.webprime.sounds.Bomb.LastBeatPlay = this.webprime.gameVariables.noteData.CurrentBeat >> 0;
      }
      this.webprime.gameVariables.effectBank.FlashEffect.Start(this.webprime.gameVariables.noteData.CurrentBeat);
    } else if(attr === 0 && seed === 17 && y <= this.webprime.gameVariables.offsetY)  {   // Flash Effect
      this.webprime.gameVariables.effectBank.Start(this.webprime.gameVariables.noteData.CurrentBeat);
      /*
       if(this.webprime.gameVariables.noteData.CurrentBeat >> 0 != .LastBeatPlay)   {
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
  Drawer.prototype.DrawNote    =   function(ctx, ntype, nopacity, notepos, y, noterotation, seed, attr)  {
    if(nopacity !== 0 && ntype !== PrimeConst.NoteNull && (y > this.webprime.gameVariables.offsetY - 2 || ntype === PrimeConst.NoteFake || ntype === PrimeConst.NoteItemFake) )  {
      if(!this.webprime.config.subPixelRender)  {
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
      if(this.webprime.config.drawAnchors)   {
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
   *  This updates the layers (and sentinel if enabled).
   *  In the layer updates usually it updates the Animations with the timeDelta since last update.
   *  It also clears the note layer that needs to be update every frame.
   */
  Drawer.prototype.Update      =   function() {
    if(this.webprime.gameVariables.sentinel.OK())    {
      var timeDelta   =   Date.now() - this.lastDelta, 
          i           =   0, 
          len         =   this.SceneLayers.length;
      this.lastDelta = Date.now();
      if(this.webprime.Loader.allObjectsLoaded)  {
        while(i<len)    {
          this.SceneLayers[i].Update(timeDelta);
          ++i;
        }
        this.SceneLayers[2].ClearCanvas();
        this.DrawNotes();
      }
    }
  };

  /*
   *  This function gets all the layers and draw on the main canvas given the layer order.
   *  It will use layer.blendtype parameter to blend the layer over the canvas.
   */
  Drawer.prototype.DrawLayers  =   function()  {
    if(!this.webprime.Loader.allObjectsLoaded)  {
      this.DrawLoading();
    }else{
      var i=0, len=this.SceneLayers.length-1;
      var orgblend = this.ctx.globalCompositeOperation;
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
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
  Drawer.prototype.DrawLoading =   function()   {
    this.ctx.font = "bold 56px sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.ctx.fillText("Loading", 320, 200);
    var percent = Math.round(100 * (this.webprime.Loader.objectsLoaded /  this.webprime.Loader.objectsToLoad));
    this.ctx.fillText("Loaded: "+percent+"%", 320, 260);
    this.ctx.fillText("Files: "+this.webprime.Loader.objectsLoaded+"/"+this.webprime.Loader.objectsToLoad, 320, 320);
  };

  window.Drawer = Drawer;

}());