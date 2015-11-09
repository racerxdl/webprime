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

  /*
   *  The GL Drawer Class. This class works in the same way that Drawer class works.
   */
  PrimeGL.Drawer = function ( parameters )  {
    this.canvas             =   parameters.canvas;
    this.skin               =   parameters.skin;
    this.gl                 =   parameters.gl;
    this.SceneLayers        =   [ ];                          // PUMPER.SceneLayer
    this.lastDelta          =   Date.now();
    this.NoteBlock          =   [];
    this.HoldBuffer         =   [[],[],[],[],[],[],[],[],[],[]];
    
    this.Notes              =   [ [], [], [] ];
    this.NotesIdx           =   0;
    this.NotesTexture       =   undefined;
    this.Longs              =   [ [], [], [] ];
    this.LongsIdx           =   0;
    this.LongsTexture       =   undefined;
    this.Items              =   [ [], [], [] ];
    this.ItemsIdx           =   0;
    this.ItemsTexture       =   undefined;
    this.LayerObjects       =   [ [], [], [], [], [] ];

    this.webprime           =   parameters.webprime;
    this.Renderer           =   new PrimeGL.Renderer({"canvas": this.canvas, "gl": this.gl, "webprime": this.webprime});
    
    //this.InitLayers(this.canvas.width, this.canvas.height);
  };
/*
  PrimeGL.Drawer.prototype.InitLayers  =   function(width,height)  {
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
  };*/

  /*
   *  This clears all notes objects, items and so.
   */
  PrimeGL.Drawer.prototype.Clear        =   function()  {
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
   *  This adds a object to corresponding layer.
   *  If layer parameter is undefined, it will add to default layer (2)
   */
  PrimeGL.Drawer.prototype.AddObj      =   function(obj, layer) {
    layer = layer !== undefined ? layer : "2"; 
    //PrimeLog.d("PUMPER::Drawer::Adding AnimObj "+obj.id+" in layer "+layer);
    obj.Drawer = this;
    this.LayerObjects[layer].push(obj);
  };

  /*
   *  Removes an object from a given layer.
   */
  PrimeGL.Drawer.prototype.RemoveObj   =   function(objname,layer)  {  this.SceneLayers[layer].RemoveObject(objname); };

  /*
   *  This does the note drawing.
   *  The note layer is the default (2), all notes will be rendered on Layer 2
   *  This will basicly iterate over the noteblock adding the notes on the layer
   */
  PrimeGL.Drawer.prototype.DrawNotes   =   function() {
    var i           =   0, 
        len         =   this.NoteBlock.length,
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
          this.ProcessEffect(note.opacity, n, row.y, note.rotation, note.seed, note.attr);
        else if(note.type != PrimeConst.NoteHoldBody && note.type != PrimeConst.NoteNull)  {                    //  If its not an Hold and not a Null Note, we just draw it.
          if(this.webprime.gameVariables.noteData.BeatInCutZone(row.rowbeat, row) && note.type != PrimeConst.NoteItemFake && note.type != PrimeConst.NoteFake)   {
            this.webprime.gameVariables.effectBlock[n].Start(this.webprime.gameVariables.noteData.CurrentBeat);
          }else{
            this.DrawNote(note.type, note.opacity, n, row.y, note.rotation, note.seed, note.attr);
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
        
        this.DrawHoldBody(Hold.opacity, Hold.pos, Hold.y, Hold.seed, Hold.attr, y-Hold.y); 
        
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
   */
  PrimeGL.Drawer.prototype.DrawHoldBody    =   function(nopacity, notepos, y, seed, attr, height)   { 
    if(nopacity != 0 && height-this.webprime.gameVariables.arrowSize/2 > 0 && height > 0 && y > -200)  {
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
   *  I didnt implemented yet the Effects on WebGL. TODO: Make work like non WebGL
   */
  PrimeGL.Drawer.prototype.ProcessEffect   =   function(nopacity, notepos, y, noterotation, seed, attr, time)   {
    /*
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
  };

  /*
   *  This function draws a note with given parameters. 
   */
  PrimeGL.Drawer.prototype.DrawNote    =   function(ntype, nopacity, notepos, y, noterotation, seed, attr)  {
    if(nopacity != 0 && ntype != PrimeConst.NoteNull && (y > this.webprime.gameVariables.offsetY-2 || ntype == PrimeConst.NoteFake || ntype == PrimeConst.NoteItemFake) )  {
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
   *  This updates the layers (and sentinel if enabled).
   *  In the layer updates usually it updates the Animations with the timeDelta since last update.
   *  It also clears the note layer that needs to be update every frame.
   */
  PrimeGL.Drawer.prototype.Update      =   function() {
    this.Clear();
    if(this.webprime.gameVariables.sentinel.OK())    {
      var timeDelta   =   Date.now() - this.lastDelta, 
          i           =   0, 
          len         =   this.LayerObjects.length;
      this.lastDelta = Date.now();
      if(this.webprime.Loader.allObjectsLoaded)  {
      while(i<len)    {
        var j=0,jlen=this.LayerObjects[i].length;
        while(j<jlen)   {
          this.LayerObjects[i][j].Update(timeDelta);
          this.LayerObjects[i][j].GLUpdate();
          ++j;
        }
        ++i;
        }
        this.DrawNotes();
      }
    }
  };

  /*
   *  This function gets all the layers and draw on the main canvas given the layer order.
   *  It will use layer.blendtype parameter to blend the layer over the canvas.
   */
  PrimeGL.Drawer.prototype.DrawLayers  =   function()  {
    if(!this.webprime.Loader.allObjectsLoaded)  {
      this.DrawLoading();
    }else{
      this.Renderer.Clear();
      var i           =   0, 
          len         =   this.LayerObjects.length;
      var data = [];
      
      while(i<len)    {
        if(i == 2)  {
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
        var j=0,jlen=this.LayerObjects[i].length;
        while(j<jlen)   {
          this.Renderer.RenderObject(this.LayerObjects[i][j]);
          ++j;
        }
        ++i;
      }
    }
  };

  /*
   *  This function draws the Loading screen.
   *  TODO
   */
  PrimeGL.Drawer.prototype.DrawLoading =   function()   {
  /*
    this.ctx.font = "bold 56px sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.ctx.fillText("Loading", 320, 200);
    var percent = Math.round(100 * (this.webprime.Loader.objectsLoaded /  this.webprime.Loader.objectsToLoad));
    this.ctx.fillText("Loaded: "+percent+"%", 320, 260);
    this.ctx.fillText("Files: "+this.webprime.Loader.objectsLoaded+"/"+this.webprime.Loader.objectsToLoad, 320, 320);  */
  };

}());