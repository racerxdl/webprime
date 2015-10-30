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

  var F2Skin = function(parameters)  {
    var _skin = this;
    this.NoteSkins      =   {};
    this.ItemSkin       =   [];
    this.ItemSkinCoord  =   [];
    this.NoteSkinCoord  =   [];
    this.canvas         =   parameters.canvas;
    this.gl             =   parameters.gl;
    this.webprime       =   parameters.webprime;


    //  TODO FLEXIBLE SD/HD
    this.NoteSkinWidth = PrimeGL.nextHighestPowerOfTwo(320);
    this.NoteSkinHeight = PrimeGL.nextHighestPowerOfTwo(192);
    this.NoteSkinXStep = 1.0 / this.NoteSkinWidth;  //  1 / above Width
    this.NoteSkinYStep = 1.0 / this.NoteSkinHeight;  

    this.ItemSkinWidth = PrimeGL.nextHighestPowerOfTwo(2048);
    this.ItemSkinHeight = PrimeGL.nextHighestPowerOfTwo(128);
    this.ItemSkinXStep = 1.0 / this.ItemSkinWidth;  //  1 / above Width
    this.ItemSkinYStep = 1.0 / this.ItemSkinHeight;  
    
    if(this.webprime.config.runningWebGL)
        this.DummyTexture = this.gl.createTexture();
        
    var c = this.webprime.config.runningWebGL ? 5 : 24;
    for(var i=0;i<c;i++)   
        this.ItemSkin.push({});

    this.ItemImage  =   [];
    var loader = new JPAK.jpakloader({"file":PrimeConst.ItemDataPack});

    loader.onload = function()  {

      function makeLoadHandler(n) {
          return function () {
            if(!_this.webprime.config.runningWebGL)   {
              for(var z=0;z<24;z++)   
               _skin.ItemSkin[z][n] = ImageTools.CropImage(this, 64*z,0,64,64);
            }else{
              _skin.ItemSkin[n] = _skin.gl.createTexture();
              _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, _skin.ItemSkin[n]);
              _skin.gl.pixelStorei(_skin.gl.UNPACK_FLIP_Y_WEBGL, true);
              _skin.gl.texImage2D(_skin.gl.TEXTURE_2D, 0, _skin.gl.RGBA, _skin.gl.RGBA, _skin.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(this));
              _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MAG_FILTER, _skin.gl.LINEAR);
              _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MIN_FILTER, _skin.gl.LINEAR_MIPMAP_NEAREST); 
              _skin.gl.generateMipmap(_skin.gl.TEXTURE_2D);
              _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, null);                 
              _skin.ItemSkin[n].width = PrimeGL.nextHighestPowerOfTwo(this.width); 
              _skin.ItemSkin[n].height = PrimeGL.nextHighestPowerOfTwo(this.height); 
              _skin.ItemSkin[n].rwidth = this.width;
              _skin.ItemSkin[n].rheight = this.height;
            }
            this.webprime.loader.objectsLoaded += 1;
            this.webprime.loader.checkLoaded();
          };
      }

      for(var i=0;i<6;i++)    {
        _skin.ItemImage[i]  =   new Image();
        _skin.ItemImage[i].n = i;
        _skin.ItemImage[i].onload = makeLoadHandler(i);

        this.webprime.loader.objectsToLoad += 1;
        _skin.ItemImage[i].src = this.GetHTMLDataURIFile("/"+i+PrimeConst.png,PrimeConst.mimepng); 
      }    
    };

    loader.Load();
    
    this.LoadedNoteSkins = 0;
    this.CurrentFrameF = 0;
    this.CurrentFrame = 0;
    this.MusicTime = 0;
    
    for(i=0;i<30;i++)   
      this.NoteSkins[i] = new NoteSkin({
        "path"    : NoteSkinPack + PrimeTools.Pad(i,2) + ".jpak", 
        "master"  : this, 
        "number"  : i
      });
       
    if(this.webprime.config.runningWebGL)    {
      for(i=0;i<6;i++)  
        this.NoteSkinCoord.push({x:i,y:0});    
    }

    this.LastAbsTime = Date.now();
    this.CurrentAbsFrameF = 0;
    this.CurrentAbsFrame = 0;
    this.AnimSpeed = 18;            //  1 / T
  };

  F2Skin.prototype.LoadNoteSkin = function ( id )  {
    if(!this.NoteSkins[id].Loaded || !this.NoteSkins[id].StartLoaded)   {
      PrimeLog.l("Loading noteskin ( "+id+" ) ");
      this.NoteSkins[id].Load();
      this.NoteSkins[id].StartLoaded = true;
    }
    return this.NoteSkins[id];
  };

  F2Skin.prototype.Update = function ( musicTime ) {
    var delta = musicTime - this.MusicTime,
        deltaAbs = (Date.now() - this.LastAbsTime)/1000;
    this.LastAbsTime = Date.now();
    this.MusicTime = musicTime;
    
    this.CurrentFrameF += (delta * this.webprime.gameVariables.currentBPM) / 15;
    this.CurrentAbsFrameF += (deltaAbs * this.AnimSpeed) ;
    if(this.CurrentFrameF > 5)  
        this.CurrentFrameF = 0;
    if(this.CurrentAbsFrameF > 6)  
        this.CurrentAbsFrameF = 0;
    
    this.CurrentFrame = this.CurrentFrameF >> 0;
    this.CurrentAbsFrame = this.CurrentAbsFrameF >> 0;
  };

  F2Skin.prototype.GetNoteImage = function ( ntype, notepos, seed, attr ) {
    seed = seed || 0;
    var orgseed = seed;

    if(ntype < 6 || ntype == PrimeConst.NoteHoldHeadFake  || ntype == PrimeConst.NoteHoldBodyFake || ntype == PrimeConst.NoteHoldTailFake)   
      seed = this.webprime.gameVariables.noteData.NoteSkinBank[seed];

    if((this.NoteSkins[seed].Loaded && ntype != PrimeConst.NoteItem) || ntype == PrimeConst.NoteItem || ntype == PrimeConst.NoteItemFake) {
      switch(ntype)   {
        case PrimeConst.NoteNull        :   /* Dafuq? */ return new Image();
        
        case PrimeConst.NoteFake        :
        case PrimeConst.NoteTap         :   return this.NoteSkins[seed].NoteFrames[notepos][this.CurrentAbsFrame];
        
        case PrimeConst.NoteHoldHeadFake:
        case PrimeConst.NoteHoldHead    :   return this.NoteSkins[seed].NoteFrames[notepos][this.CurrentAbsFrame];
        
        case PrimeConst.NoteHoldBodyFake:
        case PrimeConst.NoteHoldBody    :   return this.NoteSkins[seed].LongBodyFrames[notepos][this.CurrentAbsFrame];
        
        case PrimeConst.NoteHoldTailFake:
        case PrimeConst.NoteHoldTail    :   return this.NoteSkins[seed].LongTailFrames[notepos][this.CurrentAbsFrame];
        
        case PrimeConst.NoteItemFake    :   
        case PrimeConst.NoteItem        :   return this.ItemSkin[seed][this.CurrentAbsFrame];
        default                         :   PrimeLog.d("Error: Note Type not know: "+ntype); return new Image();
      }
    }else{
      PrimeLog.d("Error: We have problems ("+orgseed+","+seed+","+notepos+","+attr+")");
      return new Image();
    }
  };

  F2Skin.prototype.GLGetNoteImage = function ( ntype, notepos, seed, attr ) {
      seed = seed || 0;
      var orgseed = seed;
      if(ntype < 6 || ntype == PrimeConst.NoteHoldHeadFake  || ntype == PrimeConst.NoteHoldBodyFake || ntype == PrimeConst.NoteHoldTailFake)   
        seed = this.webprime.gameVariables.noteData.NoteSkinBank[seed];  
          
      var RetData = {
        texture   :   this.ItemSkin[0],
        x         :   0,
        y         :   0,
        u         :   this.ItemSkinXStep  *   this.webprime.gameVariables.arrowSize,
        v         :   this.ItemSkinYStep  *   this.webprime.gameVariables.arrowSize
      }; //  This is a blank space on item skin. TODO: Make this in the right way
      
      if(ntype == PrimeConst.NoteNull)
        return RetData;
           
      if((this.NoteSkins[seed].Loaded && ntype != PrimeConst.NoteItem) || ntype == PrimeConst.NoteItem || ntype == PrimeConst.NoteItemFake) {
        switch(ntype)   {
            case PrimeConst.NoteNull        :   /* Dafuq? */ break;
            
            case PrimeConst.NoteHoldHeadFake:
            case PrimeConst.NoteHoldHead    :
            case PrimeConst.NoteFake        :
            case PrimeConst.NoteTap         :   
                                              RetData.texture = this.NoteSkins[seed].NoteFrames[this.CurrentAbsFrame];//this.CurrentAbsFrame]; 
                                              RetData.x = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  notepos;
                                              RetData.y = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  2;
                                              RetData.u = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  (notepos+1);
                                              RetData.v = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  3;
                                              break;
            case PrimeConst.NoteHoldBodyFake:
            case PrimeConst.NoteHoldBody    :   
                                              RetData.texture = this.NoteSkins[seed].NoteFrames[this.CurrentAbsFrame]; 
                                              RetData.x = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  notepos;
                                              RetData.y = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  4 - 2*this.NoteSkinYStep;
                                              RetData.u = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  (notepos+1);
                                              RetData.v = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  4 - this.NoteSkinYStep;
                                              break;
            case PrimeConst.NoteHoldTailFake:
            case PrimeConst.NoteHoldTail    :   
                                              RetData.texture = this.NoteSkins[seed].NoteFrames[this.CurrentAbsFrame]; 
                                              RetData.x = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  notepos;
                                              RetData.y = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  3;
                                              RetData.u = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  (notepos+1);
                                              RetData.v = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  4 - this.NoteSkinYStep;
                                              break;
            case PrimeConst.NoteItemFake    :   
            case PrimeConst.NoteItem        : 
                                              seed %= 24;
                                              RetData.texture = this.ItemSkin[this.CurrentAbsFrame]; 
                                              RetData.x = this.ItemSkinXStep  *   this.webprime.gameVariables.arrowSize  *  seed;
                                              RetData.y = this.ItemSkinYStep  *   this.webprime.gameVariables.arrowSize;
                                              RetData.u = this.ItemSkinXStep  *   this.webprime.gameVariables.arrowSize  *  (seed+1);
                                              RetData.v = this.ItemSkinYStep  *   this.webprime.gameVariables.arrowSize  *  2;
                                              break; 
            default                         :   
                                              PrimeLog.d("Error: Note Type not know: "+ntype);
        }
      } else
        PrimeLog.d("Error: We have problems ("+ntype+","+orgseed+","+seed+","+notepos+","+attr+")");

      return RetData;
  };

  var NoteSkin = function(parameters)    {
    this.path           =   parameters.path;
    this.master         =   parameters.master;
    this.Base           =   new Image();
    this.BaseInactive   =   new Image();
    this.number         =   parameters.number;
    this.NoteFrames     =   {"0" : {}, "1" : {}, "2" : {}, "3" : {}, "4" : {}, "5" : {}};
    this.StompFrames    =   {"0" : {}, "1" : {}, "2" : {}, "3" : {}, "4" : {}, "5" : {}};
    this.LongBodyFrames =   {"0" : {}, "1" : {}, "2" : {}, "3" : {}, "4" : {}, "5" : {}};
    this.LongTailFrames =   {"0" : {}, "1" : {}, "2" : {}, "3" : {}, "4" : {}, "5" : {}}; 
    this.EffectFrames   =   {"0" : {}, "1" : {}, "2" : {}, "3" : {}, "4" : {}};
    this.LoadedImages   =   0;
    this.ImagesToLoad   =   1; // Just to not tell that is loaded
    this.Loaded         =   false;
    this.webprime       =   parameters.webprime;
    
    this.EffectFramesL  =   0;  //  Effect Frames Loaded
  };

  NoteSkin.ReceptorCoord = [32,0,290,64];
  NoteSkin.ReceptorCoordInactive = [32,64,290,128];

  NoteSkin.prototype.Load = function () {
    var BaseImage = new Image();
    var _this = this;
    var _skin = this.master;
    this.webprime.loader.objectsToLoad += 1;
    this.webprime.loader.objectsToLoad += 1;
    this.webprime.loader.objectsToLoad += 1;

    var loader = new JPAK.jpakloader({"file":this.path});
    loader.onload = function()  {
      BaseImage.onload = function() { 
        var Receptor, ReceptorA, Receptor2, ReceptorA2;
        if(!this.webprime.config.runningWebGL)   {
          _this.Base           =   ImageTools.CropImage(BaseImage,32,64,256,64); 
          _this.BaseInactive   =   ImageTools.CropImage(BaseImage,32,0,256,64); 
        }else{
          _this.Base = _skin.gl.createTexture();
          _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, _this.Base);
          _skin.gl.pixelStorei(_skin.gl.UNPACK_FLIP_Y_WEBGL, true);
          _skin.gl.texImage2D(_skin.gl.TEXTURE_2D, 0, _skin.gl.RGBA, _skin.gl.RGBA, _skin.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(this));
          _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MAG_FILTER, _skin.gl.LINEAR);
          _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MIN_FILTER, _skin.gl.LINEAR_MIPMAP_NEAREST); 
          _skin.gl.generateMipmap(_skin.gl.TEXTURE_2D);
          _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, null);  
          _this.Base.width = PrimeGL.nextHighestPowerOfTwo(this.width); 
          _this.Base.height = PrimeGL.nextHighestPowerOfTwo(this.height); 
          _this.Base.rwidth = this.width;
          _this.Base.rheight = this.height;
          _this.BaseInactive = _this.Base;  
        }
        if(!_this.webprime.gameVariables.songIsDouble)   {
          Receptor = new AnimatedObject({
            "image"     :   _this.BaseInactive,
            "x"         :   _this.webprime.gameVariables.singleReceptor.x,
            "y"         :   _this.webprime.gameVariables.singleReceptor.y,
            "opacity"   :   1,
            "gl"        :   _skin.gl,
            "coord"     :   NoteSkin.ReceptorCoordInactive
          });
          ReceptorA = new AnimatedObject({
            "image"     :   _this.Base, 
            "opacity"   :   0,
            "x"         :   _this.webprime.gameVariables.singleReceptor.x,
            "y"         :   _this.webprime.gameVariables.singleReceptor.y,
            "coord"     :   NoteSkin.ReceptorCoord,
            "Update"    :   function(timeDelta) {
                var delta = 0;
                if(this.MusicTime !== undefined) 
                  delta = _this.webprime.gameVariables.music.GetTime() - this.MusicTime;
                this.MusicTime = _this.webprime.gameVariables.music.GetTime();
                this.opacity -= (delta * _this.webprime.gameVariables.currentBPM) / 60;
                if(this.opacity < 0)
                  this.opacity = 1;
                this.NeedsRedraw = true;
            },
            "gl"        :   _skin.gl
          });
          if(_this.webprime.gameVariables.defaultNoteSkin === _this.number)  {
            _this.webprime.gameVariables.drawer.AddObj(Receptor, 1);
            _this.webprime.gameVariables.drawer.AddObj(ReceptorA, 1);
          }
        }else{
           Receptor = new PUMPER.AnimatedObject({
            "image"     :   _this.BaseInactive,
            "x"         :   _this.webprime.gameVariables.doubleReceptor.x,
            "y"         :   _this.webprime.gameVariables.doubleReceptor.y,
            "gl"        :   _skin.gl,
            "coord"     :   NoteSkin.ReceptorCoordInactive
          });
          ReceptorA = new PUMPER.AnimatedObject({
            "image"     :   _this.Base, 
            "opacity"   :   0,
            "x"         :   _this.webprime.gameVariables.doubleReceptor.x,
            "y"         :   _this.webprime.gameVariables.doubleReceptor.y,
            "coord"     :   NoteSkin.ReceptorCoord,
            "Update"    :   function(timeDelta) {
              var delta = 0;
              if(this.MusicTime !== undefined) 
                delta = _this.webprime.gameVariables.music.GetTime() - this.MusicTime;
              this.MusicTime = _this.webprime.gameVariables.music.GetTime();
              this.opacity -= (delta * _this.webprime.gameVariables.currentBPM) / 60;
              if(this.opacity < 0)
                this.opacity = 1;
              this.NeedsRedraw = true;
            },
            "gl"        :   _skin.gl
          });

          Receptor2 = Receptor.Clone();
          ReceptorA2 = ReceptorA.Clone();
          Receptor2.SetX(_this.webprime.gameVariables.doubleReceptor.x + 256);
          ReceptorA2.SetX(_this.webprime.gameVariables.doubleReceptor.x + 256);

          if(_this.webprime.gameVariables.defaultNoteSkin === _this.number)  {
            _this.webprime.gameVariables.drawer.AddObj(Receptor, 1);
            _this.webprime.gameVariables.drawer.AddObj(ReceptorA, 1);   
            _this.webprime.gameVariables.drawer.AddObj(Receptor2, 1);
            _this.webprime.gameVariables.drawer.AddObj(ReceptorA2, 1); 
          }      
        }    
        _this.LoadedImages++; 
        _this.UpdateLoaded();
        _this.webprime.loader.objectsLoaded += 1;
        _this.webprime.loader.checkLoaded();
      };
      //BaseImage.src = this.path+"BASE.PNG";
      BaseImage.src = this.GetHTMLDataURIFile(PrimeConst.BaseImage,PrimeConst.mimepng);
      //50x1
      function makeLoadHandler(n) {
        return function () {
          if(!_this.webprime.config.runningWebGL)   {
            for(var z=0;z<5;z++)    {
              _this.LongBodyFrames[z][n]     =   ImageTools.CropImage(this,z*64,0*64,64,1);
              //_this.LongTailFrames[z][n]     = ImageTools.CropImage(this,z*64,0*64,64,64);
              _this.LongTailFrames[z][n]     =   ImageTools.CropImageTarget(this,z*64,8,64,56,0,8,64,64);//targetx,targety,targetw,targeth
              _this.NoteFrames[z][n]         =   ImageTools.CropImage(this,z*64,1*64,64,64);
              _this.StompFrames[z][n]        =   ImageTools.CropImage(this,z*64,2*64,64,64);
            }
          }else{
            _this.NoteFrames[n] = _skin.gl.createTexture();
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, _this.NoteFrames[n]);
            _skin.gl.pixelStorei(_skin.gl.UNPACK_FLIP_Y_WEBGL, true);
            _skin.gl.texImage2D(_skin.gl.TEXTURE_2D, 0, _skin.gl.RGBA, _skin.gl.RGBA, _skin.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(this));
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MAG_FILTER, _skin.gl.LINEAR);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MIN_FILTER, _skin.gl.LINEAR_MIPMAP_NEAREST); 
            _skin.gl.generateMipmap(_skin.gl.TEXTURE_2D);
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, null); 
            _this.NoteFrames[n].width = PrimeGL.nextHighestPowerOfTwo(this.width); 
            _this.NoteFrames[n].height = PrimeGL.nextHighestPowerOfTwo(this.height); 
            _this.NoteFrames[n].rwidth = this.width;
            _this.NoteFrames[n].rheight = this.height;              
          }
          _this.LoadedImages++; 
          _this.UpdateLoaded();
          _this.webprime.loader.objectsLoaded += 1;
          _this.webprime.loader.checkLoaded();
        };
      }

      for(var i=0;i<6;i++)    {
        var Frame = new Image();
        Frame.n = i;
        Frame.onload = makeLoadHandler(i);
        //Frame.src = this.path+i+PrimeConst.png;
        Frame.src = this.GetHTMLDataURIFile("/"+i+PrimeConst.png,PrimeConst.mimepng);
      }

      function makeLoadHandler2(n) {
        return function () {
          _this.EffectFramesL++;
          if(!_this.webprime.config.runningWebGL)
            _this.EffectFrames[n] = ImageTools.ResizeImage(this,192,192);
          else{
            var tmpimg = ImageTools.ResizeImage(this,192,192);
            _this.EffectFrames[n] = _skin.gl.createTexture();
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, _this.EffectFrames[n]);
            _skin.gl.pixelStorei(_skin.gl.UNPACK_FLIP_Y_WEBGL, true);
            _skin.gl.texImage2D(_skin.gl.TEXTURE_2D, 0, _skin.gl.RGBA, _skin.gl.RGBA, _skin.gl.UNSIGNED_BYTE, tmpimg);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MAG_FILTER, _skin.gl.LINEAR);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MIN_FILTER, _skin.gl.LINEAR); 
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_WRAP_S, _skin.gl.CLAMP_TO_EDGE);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_WRAP_T, _skin.gl.CLAMP_TO_EDGE);
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, null);  
            _this.EffectFrames[n].width = tmpimg.width;  
            _this.EffectFrames[n].height = tmpimg.height;  
            _this.EffectFrames[n].rwidth = 192;
            _this.EffectFrames[n].rheight = 192;               
          }
          this.width = 192;
          this.height = 192;
          if(_this.EffectFramesL == 5)    {
            // Time to load effect object
            var i=0, len=(_this.webprime.songIsDouble)?10:5;
            while(i<len)    {
              var x = ((_this.webprime.songIsDouble) ? _this.webprime.gameVariables.doubleNotesX[i] :_this.webprime.gameVariables.singleNotesX[i]) - this.width / 2 + _this.webprime.gameVariables.showWidth / 2  +6;
              var y = ((_this.webprime.songIsDouble) ? _this.webprime.gameVariables.doubleReceptor.y:_this.webprime.gameVariables.singleReceptor.y) - this.height / 2 + _this.webprime.gameVariables.arrowSize / 2 ;
              
              var Frames    = [ _this.EffectFrames[0],_this.EffectFrames[1],_this.EffectFrames[2],_this.EffectFrames[3],_this.EffectFrames[4] ];
              var EffectPOS = new FrameObject({
                "frames"    :   Frames, 
                "frametime" :   20,
                "blendtype" :   "lighter",
                "runonce"   :   true,
                "visible"   :   false,
                "x"         :   x,
                "y"         :   y,
                "gl"        :   _skin.gl
              });
              if(_this.webprime.gameVariables.defaultNoteSkin == _this.number)  {
                _this.webprime.gameVariables.drawer.AddObj(EffectPOS, 4);   
                _this.webprime.gameVariables.effectBlock.push(EffectPOS);
              }
              ++i;   
            }
          }
          _this.LoadedImages++; 
          _this.UpdateLoaded();
          _this.webprime.loader.objectsLoaded += 1;
          _this.webprime.loader.checkLoaded();
        };
      }
      
      for(i=0;i<5;i++)    {
        var Frame2 = new Image();
        Frame2.n = i;
        Frame2.onload = makeLoadHandler2(i);

        Frame2.src = this.GetHTMLDataURIFile(PrimeConst.StepFXBase+PrimeTools.Pad(_this.number,2)+"_"+i+PrimeConst.png,PrimeConst.mimepng);
        //Frame2.src = this.path+"STEPFX"+PrimeTools.Pad(this.number,2)+"_"+i+PrimeConst.png;
        _this.EffectFrames[i] = Frame2;
      }    
    };

    loader.onprogress = function(progress)  {
      if(!_this.BaseAdded)    {
        _this.ImagesToLoad = progress.total;
        _this.LoadedImages = progress.loaded;
      }else
        _this.LoadedImages += progress.loaded - _this.LoadedImages;

      if(_this.LoadedImages == _this.ImagesToLoad)
          _this.Loaded = true;
    };

    loader.Load();
  };

  NoteSkin.prototype.UpdateLoaded = function() {
    //TODO: WARNING: BUG BUG BUG BUG BUG!
    this.webprime.loader.objectsToLoad = this.ImagesToLoad;
    this.webprime.loader.objectsLoaded = this.LoadedImages;
      
    if(this.ImagesToLoad == this.LoadedImages)  {
      this.master.LoadedNoteSkins++;
      this.Loaded = true;
     }
  };

  window.NoteSkin = NoteSkin;

}());