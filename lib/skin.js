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

    this.NoteSkinWidth  = PrimeGL.Tools.nextHighestPowerOfTwo(_skin.webprime.gameVariables.arrowSize * 5);
    this.NoteSkinHeight = PrimeGL.Tools.nextHighestPowerOfTwo(_skin.webprime.gameVariables.arrowSize * 3);

    this.NoteSkinXStep = 1.0 / this.NoteSkinWidth;  //  1 / above Width
    this.NoteSkinYStep = 1.0 / this.NoteSkinHeight; 

    this.ItemSkinWidth  = PrimeGL.Tools.nextHighestPowerOfTwo(_skin.webprime.gameVariables.arrowSize * 32);
    this.ItemSkinHeight = PrimeGL.Tools.nextHighestPowerOfTwo(_skin.webprime.gameVariables.arrowSize * 2);
    this.ItemSkinXStep  = 1.0 / this.ItemSkinWidth;  //  1 / above Width
    this.ItemSkinYStep  = 1.0 / this.ItemSkinHeight; 
    
    if (this.webprime.config.runningWebGL)
        this.DummyTexture = this.gl.createTexture();
        
    var c = this.webprime.config.runningWebGL ? 5 : 24;
    for (var i=0;i<c;i++)   
        this.ItemSkin.push({});

    this.ItemImage  =   [];
    var loader = new JPAK.Loader({"file":PrimeConst.ItemDataPack});
    loader.load().then(function() {

      function makeLoadHandler(n) {
        return function () {
          if (!_skin.webprime.config.runningWebGL) {
            for (var z=0;z<24;z++)   
             _skin.ItemSkin[z][n] = ImageTools.cropImage(this, _skin.webprime.gameVariables.arrowSize*z,0,_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize);
          } else {
            _skin.ItemSkin[n] = _skin.gl.createTexture();
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, _skin.ItemSkin[n]);
            _skin.gl.pixelStorei(_skin.gl.UNPACK_FLIP_Y_WEBGL, false);
            _skin.gl.texImage2D(_skin.gl.TEXTURE_2D, 0, _skin.gl.RGBA, _skin.gl.RGBA, _skin.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(this));
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MAG_FILTER, _skin.gl.LINEAR);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MIN_FILTER, _skin.gl.LINEAR_MIPMAP_NEAREST); 
            _skin.gl.generateMipmap(_skin.gl.TEXTURE_2D);
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, null);                 
            _skin.ItemSkin[n].width = PrimeGL.Tools.nextHighestPowerOfTwo(this.width); 
            _skin.ItemSkin[n].height = PrimeGL.Tools.nextHighestPowerOfTwo(this.height); 
          }
          _skin.webprime.Loader.objectsLoaded += 1;
          _skin.webprime.checkLoaded();
        };
      }

      function makeItemImageCB(i) {
        return function(url) {
          _skin.ItemImage[i] = new Image();
          _skin.ItemImage[i].n = i;
          _skin.ItemImage[i].onload = makeLoadHandler(i);
          _skin.webprime.Loader.objectsToLoad += 1;
          _skin.ItemImage[i].src = url; 
        };
      }

      for (var i=0;i<6;i++)
        loader.getFileURL("/"+(_skin.webprime.graphicalMode.toUpperCase())+"/"+i+PrimeConst.png,PrimeConst.mimepng).then(makeItemImageCB(i)); 
      
      _skin.webprime.Loader.objectsLoaded += 1;
    });

    this.webprime.Loader.objectsToLoad += 1;
    
    this.LoadedNoteSkins = 0;
    this.CurrentFrameF = 0;
    this.CurrentFrame = 0;
    this.MusicTime = 0;
    
    for (i=0;i<32;i++)   
      this.NoteSkins[i] = new NoteSkin({
        "path"    : PrimeConst.NoteSkinPack + PrimeTools.Pad(i,2) + ".jpak", 
        "master"  : this, 
        "number"  : i,
        "webprime": this.webprime
      });
       
    if (this.webprime.config.runningWebGL)    {
      for (i=0;i<6;i++)  
        this.NoteSkinCoord.push({x:i,y:0});    
    }

    this.LastAbsTime = Date.now();
    this.CurrentAbsFrameF = 0;
    this.CurrentAbsFrame = 0;
    this.AnimSpeed = 18;            //  1 / T
  };

  F2Skin.prototype.LoadNoteSkin = function ( id )  {
    if (!this.NoteSkins[id].Loaded || !this.NoteSkins[id].StartLoaded)   {
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
    if (this.CurrentFrameF > 5)  
        this.CurrentFrameF = 0;
    if (this.CurrentAbsFrameF > 6)  
        this.CurrentAbsFrameF = 0;
    
    this.CurrentFrame = this.CurrentFrameF >> 0;
    this.CurrentAbsFrame = this.CurrentAbsFrameF >> 0;
  };

  F2Skin.prototype.GetNoteImage = function ( ntype, notepos, seed, attr ) {
    seed = seed || 0;
    var orgseed = seed;

    if (this.webprime.config.overrideNoteskin !== null && this.NoteSkins.hasOwnProperty(this.webprime.config.overrideNoteskin))
      seed = this.webprime.config.overrideNoteskin;
    else if (ntype < 6 || ntype == PrimeConst.NoteHoldHeadFake  || ntype == PrimeConst.NoteHoldBodyFake || ntype == PrimeConst.NoteHoldTailFake)   
      seed = this.webprime.gameVariables.noteData.NoteSkinBank[seed];

    if ((this.NoteSkins[seed].Loaded && ntype != PrimeConst.NoteItem) || ntype == PrimeConst.NoteItem || ntype == PrimeConst.NoteItemFake) {
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
      if (ntype < 6 || ntype == PrimeConst.NoteHoldHeadFake  || ntype == PrimeConst.NoteHoldBodyFake || ntype == PrimeConst.NoteHoldTailFake)   
        seed = this.webprime.gameVariables.noteData.NoteSkinBank[seed];  
      else if (this.webprime.config.overrideNoteskin !== null && this.NoteSkins.hasOwnProperty(this.webprime.config.overrideNoteskin))
        seed = this.webprime.config.overrideNoteskin;
          
      var RetData = {
        texture   :   this.ItemSkin[0],
        x         :   0,
        y         :   0,
        u         :   this.ItemSkinXStep  *   this.webprime.gameVariables.arrowSize,
        v         :   this.ItemSkinYStep  *   this.webprime.gameVariables.arrowSize,
        textureId :   seed + "_" + this.CurrentAbsFrame
      }; //  This is a blank space on item skin. TODO: Make this in the right way
      
      if (ntype == PrimeConst.NoteNull)
        return RetData;
           
      if ((this.NoteSkins[seed].Loaded && ntype != PrimeConst.NoteItem) || ntype == PrimeConst.NoteItem || ntype == PrimeConst.NoteItemFake) {
        switch(ntype)   {
            case PrimeConst.NoteNull        :   /* Dafuq? */ break;
            
            case PrimeConst.NoteHoldHeadFake:
            case PrimeConst.NoteHoldHead    :
            case PrimeConst.NoteFake        :
            case PrimeConst.NoteTap         :   
                                              RetData.texture = this.NoteSkins[seed].NoteFrames[this.CurrentAbsFrame];  
                                              RetData.x = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  notepos;
                                              RetData.y = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  1;
                                              RetData.u = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  (notepos+1);
                                              RetData.v = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  2;
                                              break;
            case PrimeConst.NoteHoldBodyFake:
            case PrimeConst.NoteHoldBody    :   
                                              RetData.texture = this.NoteSkins[seed].NoteFrames[this.CurrentAbsFrame]; 
                                              RetData.x = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  notepos;
                                              RetData.y = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  0 + this.NoteSkinYStep;
                                              RetData.u = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  (notepos+1);
                                              RetData.v = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  0 + 2 * this.NoteSkinYStep;
                                              break;
            case PrimeConst.NoteHoldTailFake:
            case PrimeConst.NoteHoldTail    :   
                                              RetData.texture = this.NoteSkins[seed].NoteFrames[this.CurrentAbsFrame]; 
                                              RetData.x = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  notepos;
                                              RetData.y = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  0;
                                              RetData.u = this.NoteSkinXStep  *   this.webprime.gameVariables.arrowSize  *  (notepos+1);
                                              RetData.v = this.NoteSkinYStep  *   this.webprime.gameVariables.arrowSize  *  1 - this.NoteSkinYStep;
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

  window.F2Skin = F2Skin;

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
    this.ReceptorCoord = [
      this.master.webprime.gameVariables.arrowSize / 2,
      this.master.webprime.gameVariables.arrowSize,
      this.master.webprime.gameVariables.arrowSize * 4.5,
      this.master.webprime.gameVariables.arrowSize * 2
    ];

    this.ReceptorCoordInactive = [
      this.master.webprime.gameVariables.arrowSize / 2,
      0,
      this.master.webprime.gameVariables.arrowSize * 4.5,
      this.master.webprime.gameVariables.arrowSize
    ];
  };


  NoteSkin.prototype.Load = function () {
    var BaseImage = new Image();
    var _this = this;
    var _skin = this.master;

    _this.webprime.Loader.objectsToLoad += 1;
    var loader = new JPAK.Loader({"file":this.path});
    loader.load().then(function() {
      _this.webprime.Loader.objectsLoaded += 1;

      BaseImage.onload = function() { 
        var Receptor, ReceptorA, Receptor2, ReceptorA2;
        if (!_this.webprime.config.runningWebGL)   {
          _this.Base           =   ImageTools.cropImage(BaseImage,_skin.webprime.gameVariables.arrowSize / 2,_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize * 4,_skin.webprime.gameVariables.arrowSize); 
          _this.BaseInactive   =   ImageTools.cropImage(BaseImage,_skin.webprime.gameVariables.arrowSize / 2 ,0,_skin.webprime.gameVariables.arrowSize * 4,_skin.webprime.gameVariables.arrowSize); 
        }else{
          _this.Base = _skin.gl.createTexture();
          _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, _this.Base);
          _skin.gl.pixelStorei(_skin.gl.UNPACK_FLIP_Y_WEBGL, false);
          _skin.gl.texImage2D(_skin.gl.TEXTURE_2D, 0, _skin.gl.RGBA, _skin.gl.RGBA, _skin.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(this));
          _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MAG_FILTER, _skin.gl.LINEAR);
          _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MIN_FILTER, _skin.gl.LINEAR); 
          _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, null);  
          _this.Base.width = PrimeGL.Tools.nextHighestPowerOfTwo(this.width); 
          _this.Base.height = PrimeGL.Tools.nextHighestPowerOfTwo(this.height); 
          _this.BaseInactive = _this.Base;  
          _this.Base.flip = true;
        }

        if (!_this.webprime.gameVariables.songIsDouble)   {
          Receptor = new AnimatedObject({
            "image"     :   _this.BaseInactive,
            "x"         :   _this.webprime.gameVariables.singleReceptor.x,
            "y"         :   _this.webprime.gameVariables.singleReceptor.y,
            "opacity"   :   1,
            "gl"        :   _skin.gl,
            "coord"     :   _this.ReceptorCoordInactive,
            "webprime"  :   _this.webprime
          });
          ReceptorA = new AnimatedObject({
            "image"     :   _this.Base, 
            "opacity"   :   0,
            "x"         :   _this.webprime.gameVariables.singleReceptor.x,
            "y"         :   _this.webprime.gameVariables.singleReceptor.y-1,
            "coord"     :   _this.ReceptorCoord,
            "webprime"  :   _this.webprime,
            "Update"    :   function(timeDelta) {
                var delta = 0;
                if (this.MusicTime !== undefined) 
                  delta = _this.webprime.gameVariables.music.GetTime() - this.MusicTime;
                this.MusicTime = _this.webprime.gameVariables.music.GetTime();
                this.opacity -= (delta * _this.webprime.gameVariables.currentBPM) / 60;
                if (this.opacity < 0)
                  this.opacity = 1;
                this.NeedsRedraw = true;
            },
            "gl"        :   _skin.gl
          });
          if (_this.webprime.gameVariables.defaultNoteSkin === _this.number)  {
            _this.webprime.gameVariables.drawer.AddObj(Receptor, 1);
            _this.webprime.gameVariables.drawer.AddObj(ReceptorA, 1);
          }
        }else{
           Receptor = new AnimatedObject({
            "image"     :   _this.BaseInactive,
            "x"         :   _this.webprime.gameVariables.doubleReceptor.x,
            "y"         :   _this.webprime.gameVariables.doubleReceptor.y,
            "gl"        :   _skin.gl,
            "coord"     :   _this.ReceptorCoordInactive,
            "webprime"  :   _this.webprime
          });
          ReceptorA = new AnimatedObject({
            "image"     :   _this.Base, 
            "opacity"   :   0,
            "x"         :   _this.webprime.gameVariables.doubleReceptor.x,
            "y"         :   _this.webprime.gameVariables.doubleReceptor.y-1,
            "coord"     :   _this.ReceptorCoord,
            "webprime"  :   _this.webprime,
            "Update"    :   function(timeDelta) {
              var delta = 0;
              if (this.MusicTime !== undefined) 
                delta = _this.webprime.gameVariables.music.GetTime() - this.MusicTime;
              this.MusicTime = _this.webprime.gameVariables.music.GetTime();
              this.opacity -= (delta * _this.webprime.gameVariables.currentBPM) / 60;
              if (this.opacity < 0)
                this.opacity = 1;
              this.NeedsRedraw = true;
            },
            "gl"        :   _skin.gl
          });

          Receptor2 = Receptor.Clone();
          ReceptorA2 = ReceptorA.Clone();
          Receptor2.SetX(_this.webprime.gameVariables.doubleReceptor.x + _skin.webprime.gameVariables.arrowSize * 4);
          ReceptorA2.SetX(_this.webprime.gameVariables.doubleReceptor.x + _skin.webprime.gameVariables.arrowSize * 4);

          if (_this.webprime.gameVariables.defaultNoteSkin === _this.number)  {
            _this.webprime.gameVariables.drawer.AddObj(Receptor, 1);
            _this.webprime.gameVariables.drawer.AddObj(ReceptorA, 1);   
            _this.webprime.gameVariables.drawer.AddObj(Receptor2, 1);
            _this.webprime.gameVariables.drawer.AddObj(ReceptorA2, 1); 
          }      
        }    
        _this.LoadedImages++; 
        _this.UpdateLoaded();
        _this.webprime.Loader.objectsLoaded += 1;
        _this.webprime.checkLoaded();
      };
      //BaseImage.src = this.path+"BASE.PNG";
      _this.webprime.Loader.objectsToLoad += 1;
      loader.getHTMLDataURIFile("/"+(_skin.webprime.graphicalMode.toUpperCase())+PrimeConst.BaseImage,PrimeConst.mimepng).then(function(uri) {
        BaseImage.src = uri;
      });
      //50x1
      function makeLoadHandler(n) {
        return function () {
          if (!_this.webprime.config.runningWebGL)   {
            for (var z=0;z<5;z++)    {
              _this.LongBodyFrames[z][n]     =   ImageTools.cropImage(this,z*_skin.webprime.gameVariables.arrowSize,0*_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize,1);
              //_this.LongTailFrames[z][n]     = ImageTools.cropImage(this,z*_skin.webprime.gameVariables.arrowSize,0*_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize);
              _this.LongTailFrames[z][n]     =   ImageTools.cropImageTarget(this,z*_skin.webprime.gameVariables.arrowSize,8,_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize-8,0,8,_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize);//targetx,targety,targetw,targeth
              _this.NoteFrames[z][n]         =   ImageTools.cropImage(this,z*_skin.webprime.gameVariables.arrowSize,1*_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize);
              _this.StompFrames[z][n]        =   ImageTools.cropImage(this,z*_skin.webprime.gameVariables.arrowSize,2*_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize,_skin.webprime.gameVariables.arrowSize);
            }
          }else{
            _this.NoteFrames[n] = _skin.gl.createTexture();
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, _this.NoteFrames[n]);
            _skin.gl.pixelStorei(_skin.gl.UNPACK_FLIP_Y_WEBGL, false);
            _skin.gl.texImage2D(_skin.gl.TEXTURE_2D, 0, _skin.gl.RGBA, _skin.gl.RGBA, _skin.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(this));
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MAG_FILTER, _skin.gl.LINEAR);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MIN_FILTER, _skin.gl.LINEAR); 
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, null); 
            _this.NoteFrames[n].width = PrimeGL.Tools.nextHighestPowerOfTwo(this.width); 
            _this.NoteFrames[n].height = PrimeGL.Tools.nextHighestPowerOfTwo(this.height); 
          }
          _this.LoadedImages++; 
          _this.UpdateLoaded();
          _this.webprime.Loader.objectsLoaded += 1;
          _this.webprime.checkLoaded();
        };
      }

      function makeFrameCB(i) {
        return function(url) {
          var Frame = new Image();
          Frame.n = i;
          Frame.onload = makeLoadHandler(i);
          Frame.src = url;
        };
      }

      for (var i=0;i<6;i++)    {
        _this.webprime.Loader.objectsToLoad += 1;
        loader.getFileURL("/"+(_skin.webprime.graphicalMode.toUpperCase())+"/"+i+PrimeConst.png.toUpperCase(),PrimeConst.mimepng).then(makeFrameCB(i)); 
      }

      function makeLoadHandler2(n) {
        return function () {
          _this.EffectFramesL++;
          if (!_this.webprime.config.runningWebGL)
            _this.EffectFrames[n] = ImageTools.resizeImage(this,_skin.webprime.gameVariables.arrowSize * 3,_skin.webprime.gameVariables.arrowSize * 3);
          else{
            var tmpimg = ImageTools.resizeImage(this,_skin.webprime.gameVariables.arrowSize * 3,_skin.webprime.gameVariables.arrowSize * 3);
            _this.EffectFrames[n] = _skin.gl.createTexture();
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, _this.EffectFrames[n]);
            _skin.gl.pixelStorei(_skin.gl.UNPACK_FLIP_Y_WEBGL, false);
            _skin.gl.texImage2D(_skin.gl.TEXTURE_2D, 0, _skin.gl.RGBA, _skin.gl.RGBA, _skin.gl.UNSIGNED_BYTE, tmpimg);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MAG_FILTER, _skin.gl.LINEAR);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_MIN_FILTER, _skin.gl.LINEAR); 
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_WRAP_S, _skin.gl.CLAMP_TO_EDGE);
            _skin.gl.texParameteri(_skin.gl.TEXTURE_2D, _skin.gl.TEXTURE_WRAP_T, _skin.gl.CLAMP_TO_EDGE);
            _skin.gl.bindTexture(_skin.gl.TEXTURE_2D, null);  
            _this.EffectFrames[n].width = tmpimg.width;  
            _this.EffectFrames[n].height = tmpimg.height;                
          }
          this.width = _skin.webprime.gameVariables.arrowSize * 3;
          this.height = _skin.webprime.gameVariables.arrowSize * 3;
          if (_this.EffectFramesL == 5)    {
            // Time to load effect object
            var i=0, len=(_this.webprime.gameVariables.songIsDouble)?10:5;
            while(i<len)    {
              var x = ((_this.webprime.gameVariables.songIsDouble) ? _this.webprime.gameVariables.doubleNotesX[i] :_this.webprime.gameVariables.singleNotesX[i]) - this.width / 2 + _this.webprime.gameVariables.showWidth / 2  +6;
              var y = ((_this.webprime.gameVariables.songIsDouble) ? _this.webprime.gameVariables.doubleReceptor.y:_this.webprime.gameVariables.singleReceptor.y) - this.height / 2 + _this.webprime.gameVariables.arrowSize / 2 ;
              
              var Frames    = [ _this.EffectFrames[0],_this.EffectFrames[1],_this.EffectFrames[2],_this.EffectFrames[3],_this.EffectFrames[4] ];
              var EffectPOS = new FrameObject({
                "frames"    :   Frames, 
                "frametime" :   20,
                "blendtype" :   "lighter",
                "runonce"   :   true,
                "visible"   :   false,
                "x"         :   x,
                "y"         :   y,
                "gl"        :   _skin.gl,
                "webprime"  :   _this.webprime
              });
              if (_this.webprime.gameVariables.defaultNoteSkin == _this.number)  {
                _this.webprime.gameVariables.drawer.AddObj(EffectPOS, 4);   
                _this.webprime.gameVariables.effectBlock.push(EffectPOS);
              }
              ++i;   
            }
          }
          _this.LoadedImages++; 
          _this.UpdateLoaded();
          //_this.webprime.Loader.objectsLoaded += 1;
          _this.webprime.checkLoaded();
        };
      }

      function makeFrame2CB(i) {
        return function(url) {
          var Frame2 = new Image();
          Frame2.n = i;
          Frame2.onload = makeLoadHandler2(i);
          Frame2.src = url;
        };
      }

      for (i=0;i<5;i++)    {
        //_this.webprime.Loader.objectsToLoad += 1;
        loader.getFileURL("/"+(_skin.webprime.graphicalMode.toUpperCase())+PrimeConst.StepFXBase+PrimeTools.Pad(_this.number,2)+"_"+i+PrimeConst.png.toUpperCase(),PrimeConst.mimepng).then(makeFrame2CB(i)); 
      }
    });
  };

  NoteSkin.prototype.UpdateLoaded = function() {      
    if (this.ImagesToLoad == this.LoadedImages)  {
      this.master.LoadedNoteSkins++;
      this.Loaded = true;
    }
  };

  window.NoteSkin = NoteSkin;

}());