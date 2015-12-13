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

  var BaseDrawer = function(parameters) {
      this.skin               =   parameters.skin;
      this.canvas             =   parameters.canvas;
      this.SceneLayers        =   [ ];                              // PUMPER.SceneLayer
      this.lastDelta          =   Date.now();
      this.NoteBlock          =   [];
      this.HoldBuffer         =   [[],[],[],[],[],[],[],[],[],[]];  //  This is for making buffer of hold notes start and end
      this.webprime           =   parameters.webprime;
      this.InitLayers(this.webprime.config.width, this.webprime.config.height);
  };

  /*
   *  This creates the SceneLayers objects for drawing.
   *  Used for Software Z-Buffer drawing
   */
  BaseDrawer.prototype.InitLayers  =   function(width,height)  {
    var i   = 0, 
        len = 5;
    PrimeLog.d("Initializing "+len+" layers with size ("+width+","+height+")");
    while(i<len) {
      var lay = new SceneLayer({"width":width,"height":height, "webglmode": this.webprime.config.runningWebGL});
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
  BaseDrawer.prototype.AddObj      =   function(obj,layer) {
    layer = layer !== undefined ? layer : 2; 
    PrimeLog.d("Drawer::Adding AnimObj "+obj.id+" in layer "+layer);
    obj.Drawer = this;
    this.SceneLayers[layer].push(obj);
  };

  /*
   *  Removes an object from a given layer.
   */
  BaseDrawer.prototype.RemoveObj   =   function(objname,layer)  {  
    this.SceneLayers[layer].splice(this.SceneLayers[layer].indexOf(objname), 1);
  };

    /*
   *  This does the note drawing.
   *  The note layer is the default (2), all notes will be rendered on Layer 2
   *  This will basicly iterate over the noteblock adding the notes on the layer
   */
  BaseDrawer.prototype.DrawNotes   =   function() {
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
        if (note.type == PrimeConst.NoteHoldHead || note.type == PrimeConst.NoteHoldHeadFake)    {   //  First we will process the holds. The holds have start, body and end.
                                                                                                     //  So basicly we need to cache the start and see where it will end, so we can know how much we need to draw.
          if (this.HoldBuffer[n].length === 0) {                                                     //  We first search if there is any hold already on buffer. If not, we add the current one to buffer. 
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
                if (this.HoldBuffer[n][k].beatfrom == row.rowbeat)   {         
                  this.HoldBuffer[n][k].y = row.y;
                  found = true;
                  break;
                }
                ++k;
              }
              if (!found)                        //  If not, we need to add it to the buffer
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
        }else if (note.type == PrimeConst.NoteHoldBody)   {                                                      //  If its an hold body, we just need to check if its on CutZone (a.k.a. receiver). If so, we trigger the Receiver Effect for that note
          if (this.webprime.gameVariables.noteData.BeatInCutZone(row.rowbeat, row))     {                         //  In UCS and NX20 we draw the hold regardless if the body is defined or not. So we don't need to force it draw.
            this.webprime.gameVariables.effectBlock[n].Start(this.webprime.gameVariables.noteData.CurrentBeat);
            if(!row.comboed) {
              this.webprime.gameVariables.currentCombo++;
              row.comboed = true;
            }
          }
        }
        if (note.type == PrimeConst.NoteEffect)                                                                  //  If its an Effect (NX20 stuff), we trigger process the Effect
          this.ProcessEffect(ctx, note.opacity, n, row.y, note.rotation, note.seed, note.attr);
        else if (note.type != PrimeConst.NoteHoldBody && note.type != PrimeConst.NoteNull)  {                    //  If its not an Hold and not a Null Note, we just draw it.
          if (this.webprime.gameVariables.noteData.BeatInCutZone(row.rowbeat, row) && note.type != PrimeConst.NoteItemFake && note.type != PrimeConst.NoteFake)   {
            this.webprime.gameVariables.effectBlock[n].Start(this.webprime.gameVariables.noteData.CurrentBeat);
            if(!row.comboed) {
              this.webprime.gameVariables.currentCombo++;
              row.comboed = true;
            }
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

        if (Hold.beatend < this.webprime.gameVariables.noteData.CurrentBeat && Hold.beatend !== undefined)    {
          // You dont belong to us anymore!
          HoldK.splice(k, 1);
          --lenK;
          continue;
        }
        
        if (Hold.beatend === undefined)
            y = this.webprime.config.height;
        else
            y = this.webprime.gameVariables.noteData.GetBeatY(Hold.beatend);
        
        Hold.y = this.webprime.gameVariables.noteData.GetBeatY(Hold.beatfrom);
        
        if (Hold.y < this.webprime.gameVariables.offsetY)
          Hold.y = this.webprime.gameVariables.offsetY;
        
        this.DrawHoldBody(ctx, Hold.opacity, Hold.pos, Hold.y, Hold.seed, Hold.attr, y-Hold.y); 
        
        if ( Hold.y >= this.webprime.gameVariables.offsetY)   {
          this.DrawNote(ctx, PrimeConst.NoteTap, Hold.opacity, Hold.pos, Hold.y, 0, Hold.seed, Hold.attr);
        }else if ( Hold.y <= this.webprime.gameVariables.offsetY || ( Hold.y < this.webprime.gameVariables.offsetY-3 && y > this.webprime.gameVariables.offsetY-32) ) 
          this.DrawNote(ctx, PrimeConst.NoteTap, Hold.opacity, Hold.pos, this.webprime.gameVariables.offsetY, 0, Hold.seed, Hold.attr);
        
        ++k;
      }
      ++i;
    }
  };

  /*
   *  This updates the layers (and sentinel if enabled).
   *  In the layer updates usually it updates the Animations with the timeDelta since last update.
   *  It also clears the note layer that needs to be update every frame.
   */
  BaseDrawer.prototype.Update      =   function() {
    if (this.webprime.config.runningWebGL)
      this.Clear();
    
    if (this.webprime.gameVariables.sentinel.OK())    {
      var timeDelta   =   Date.now() - this.lastDelta, 
          i           =   0, 
          len         =   this.SceneLayers.length;
      this.lastDelta = Date.now();
      if (this.webprime.Loader.allObjectsLoaded)  {
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
   *  This function draws a Hold body given the paremeters.
   */
  BaseDrawer.prototype.DrawHoldBody    =   function(ctx, nopacity, notepos, y, seed, attr, height)   { 
    PrimeLog.e("Method DrawHoldBody not implemented! - This call must be overrided!");
    throw "MethodNotImplemented Exception";
  };

  /*
   *  This is for processing the effects. Usually this will be only for NX20 stuff.
   *  Maybe in the future we would need this for Stepmania Effects too.
   */
  BaseDrawer.prototype.ProcessEffect   =   function(ctx, nopacity, notepos, y, noterotation, seed, attr, time)   {
    PrimeLog.e("Method ProcessEffect not implemented! - This call must be overrided!");
    throw "MethodNotImplemented Exception";
  };

  /*
   *  This function draws a note with given parameters. 
   *  It also trims the y parameter if this.webprime.config.subPixelRender is false.
   *  It also has a Debug Parameter (this.webprime.config.drawAnchors) for drawing a red dot in the middle of note.
   */
  BaseDrawer.prototype.DrawNote    =   function(ctx, ntype, nopacity, notepos, y, noterotation, seed, attr)  {
    PrimeLog.e("Method DrawNote not implemented! - This call must be overrided!");
    throw "MethodNotImplemented Exception";
  };

  /*
   *  This function gets all the layers and draw on the main canvas given the layer order.
   *  It will use layer.blendtype parameter to blend the layer over the canvas.
   */
  BaseDrawer.prototype.DrawLayers  =   function()  {
    PrimeLog.e("Method DrawLayers not implemented! - This call must be overrided!");
    throw "MethodNotImplemented Exception";
  };

  /*
   *  This function draws the Loading screen.
   */
  BaseDrawer.prototype.DrawLoading =   function()   {
    PrimeLog.e("Method DrawLoading not implemented! - This call must be overrided!");
    throw "MethodNotImplemented Exception";
  };

  window.BaseDrawer = BaseDrawer;

}());