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

  var webPrime = Object.create(HTMLElement.prototype);

  webPrime.createdCallback = function() {
    // Load attributes
    this.graphicalMode = this.getAttribute("graphical-mode") !== null ? this.getAttribute("graphical-mode") : "SD"; 

    this.Loader = {
      objectsLoaded: 0,
      objectsToLoad:  0,
      allObjectsLoaded: false,
      loadStarted: false,
      loaded: false
    };

    this.config = {
      enableSound: this.getAttribute("disable-sound") === null,
      enableVideo: this.getAttribute("enable-video") !== null,
      drawAnchors: this.getAttribute("draw-anchors") !== null,
      runningWebGL: false,
      webGLExperimental: false,
      disableWebGL: this.getAttribute("disable-webgl") !== null,
      subPixelRender: this.getAttribute("sub-pixel-render") !== null,
      timeDiv: this.getAttribute("time-div") !== null ? $("#"+this.getAttribute("time-div")) : null,
      beatDiv: this.getAttribute("beat-div") !== null ? $("#"+this.getAttribute("beat-div")) : null,
      fileName: this.getAttribute("file-name"),
      songType: this.getAttribute("song-type"),
      songId: this.getAttribute("song-id"),
      highSpeedAnimation: this.getAttribute("high-speed-animation") !== null,
      fileData: null,
      supportedCodecs: ImageTools.getCompatibleCodecs()
    };

    this.gameVariables = {
      drawer: null,
      looper: null,
      skin: null,
      currentBPM: 0,
      currentCombo: 0,
      songIsDouble: false,
      effectBlock: [],
      effectBank: {},
      noteData: null,
      scrollSpeed: 3,
      music: {},
      currentScrollFactor: 1,
      smoothScrollFactor: false,
      scrollFactorFactor: 1,
      scrollFactorMinus: 1,
      nextScrollFactor: 0,
      baseScrollFactor: 1,
      arrowSize: 64,
      showWidth: 50,
      offsetY: 32,
      doubleNotesX: [],
      singleNotesX: [],
      singleReceptor: {x:0,y:0},
      doubleReceptor: {x:0,y:0},
      defaultNoteSkin: {},
      sentinel: new DummySentinel()
    };

    //  Create drawing Canvas
    this.canvas = $("<canvas></canvas>")[0];
    this.container = $("<div></div>");
    this.container.css("position", "relative");

    this.appendChild(this.container[0]);
    this.container.append(this.canvas);

    // Initialize everything
    this.updateGraphicalMode();
    if (!this.config.disableWebGL) {
      PrimeGL.Tools.webGLEnabled(this);
      PrimeLog.i("WebGL Mode: " + (this.config.webGLExperimental ? "experimental" : "native")) ;
      if (this.config.runningWebGL)
        this.gl = this.config.webGLExperimental ? this.canvas.getContext("experimental-webgl") : this.canvas.getContext("webgl");
    }

    PrimeLog.d("Initializing Skin");
    this.gameVariables.skin = new F2Skin({"canvas":this.canvas, "gl":this.gl, "webprime": this});

    PrimeLog.d("Initializing Constants");
    this.gameVariables.singleReceptor   =   { "x": (this.canvas.width - (this.gameVariables.showWidth*5)) / 2 ,  "y": this.gameVariables.offsetY, "width": this.gameVariables.showWidth * 5,  "height" : this.gameVariables.arrowSize };
    this.gameVariables.doublereceptor   =   { "x": (this.canvas.width - (this.gameVariables.showWidth*10)) / 2 , "y": this.gameVariables.offsetY, "width": this.gameVariables.showWidth * 10, "height" : this.gameVariables.arrowSize };

    for (var i=0;i<5;i++)    
        this.gameVariables.singleNotesX.push(this.gameVariables.singleReceptor.x + this.gameVariables.showWidth * i -4);
    
    for (i=0;i<10;i++)    
        this.gameVariables.doubleNotesX.push(this.gameVariables.doublereceptor.x + this.gameVariables.showWidth * i -4 + (i>4?6:0));

    if (this.config.disableWebGL || !this.config.runningWebGL)  
        this.gameVariables.drawer = new CanvasDrawer({ "canvas": this.canvas,    "skin" : this.gameVariables.skin, "webprime": this });
    else
        this.gameVariables.drawer = new WebGLDrawer({ "canvas": this.canvas,    "skin" : this.gameVariables.skin, "gl" : this.gl, "webprime": this });

    this.loadData();
    this.createControls();
  };

  webPrime.createControls = function() {
/*
    <div id="ucsbuttons">
      <input type="button" value="Play" class="btn btn-default" onClick="PUMPER.Globals.PumpGame.Play();">
      <input type="button" value="Pause" class="btn btn-default" onClick="PUMPER.Globals.PumpGame.Pause();">
      <input type="button" value="+ Speed" class="btn btn-default" onClick="PUMPER.IncreaseSpeed();">
      <input type="button" value="- Speed" class="btn btn-default" onClick="PUMPER.DecreaseSpeed();">
    </div>
    <div id="infohead">
      BPM: 000 BEAT: 000.000 TIME: 000.000 BLOCK: 000 SPEED: 3x
    </div>
    */
    var webprime = this;
    this.ucsbuttons = $("<div></div>");

    var playButton = $('<button/>', {
      text: "Play",
      click: function () { webprime.play(); }
    });

    var pauseButton = $('<button/>', {
      text: "Pause",
      click: function () { webprime.pause(); }
    });

    var increaseSpeedButton = $('<button/>', {
      text: "Speed +",
      click: function () { webprime.increaseSpeed(); }
    });

    var decreaseSpeedButton = $('<button/>', {
      text: "Speed -",
      click: function () { webprime.decreaseSpeed(); }
    });

    this.ucsbuttons.css('position', 'absolute');
    this.ucsbuttons.css('margin', '0 auto');
    this.ucsbuttons.css('z-index', '2');
    this.ucsbuttons.css('bottom', '10px');
    this.ucsbuttons.css('right', '10px');


    this.ucsbuttons.append(playButton);
    this.ucsbuttons.append(pauseButton);

    this.ucsbuttons.append(increaseSpeedButton);
    this.ucsbuttons.append(decreaseSpeedButton);

    this.container.append(this.ucsbuttons);
  };

  webPrime.checkLoaded = function() {
    this.Loader.allObjectsLoaded = this.Loader.objectsLoaded >= this.Loader.objectsToLoad;
    return this.Loader.allObjectsLoaded;
  };

  webPrime.updateDivs = function(currentTime, currentBeat) {
    if (this.config.timeDiv !== null)
      this.config.timeDiv.html(this.gameVariables.music.GetTime());

    if (this.config.beatDiv !== null)
      this.config.beatDiv.html(this.gameVariables.noteData.CurrentBeat);
  };

  webPrime.updateCanvas = function() {
    this.canvas.setAttribute("width", this.getAttribute("width"));
    this.canvas.setAttribute("height", this.getAttribute("height"));
    this.config.width = parseInt(this.getAttribute("width"));
    this.config.height = parseInt(this.getAttribute("height"));
    this.container.width(this.config.width);
    this.container.height(this.config.height);
  };

  webPrime.updateInfoHead = function() {

  };

  webPrime.updateFPSCounter = function() {
    if (this.config.FPSStats !== undefined)
      this.config.FPSStats.update();
  };

  webPrime.updateGraphicalMode = function() {
    switch(this.graphicalMode) {
      case "HD":
        this.setAttribute("width", 1280);
        this.setAttribute("height", 720);
        break;
      default:  // Defaults to SD
        this.setAttribute("width", 640);
        this.setAttribute("height", 480);
        break;
    }
    this.updateCanvas();
  };

  webPrime.loadData = function() {
    var _this = this;
    if (this.config.songType === null) {
      PrimeLog.e("Song type not specified!");
      return false;
    }

    var soundFile;
    var imageFile;

    if (this.config.songType in PrimeConst.SongType) {
      var loaderType = PrimeConst.SongType[this.config.songType];
      switch (loaderType) {
        case PrimeConst.TypeUCS:
          if (this.config.fileName !== undefined && this.config.songId !== undefined) {
            PrimeLog.i("Loading UCS file \""+this.config.fileName+"\" with songId: "+this.config.songId);
            soundFile = (this.config.supportedCodecs.audio.indexOf("mp3") > -1) ? 
                        "ucs/mp3/" + this.config.songId + ".mp3"  :
                        "ucs/ogg/" + this.config.songId + ".ogg";
            imageFile = "ucs/img/" + this.config.songId + ".jpg";
            $.ajax({
              url : _this.config.fileName,
              dataType: "text",
              success : function (data) {
                PrimeLog.i("Notedata Loaded!");
                _this.gameVariables.noteData = _UCSParser(_this, data);
                _this.gameVariables.music = new SoundPlayer({"filename":soundFile,"webprime":_this});

                _this.addBackground(imageFile);
                _this.noteLoadedCallback();
              }
            });
          }else
            PrimeLog.e("No UCS file specifed!");
        break;
        case PrimeConst.TypeSM:
          PrimeLog.e("TODO: Implement TypeSM Loader");
        break;
        case PrimeConst.TypeSSC:
          PrimeLog.e("TODO: Implement TypeSSC Loader");
        break;
        case PrimeConst.TypeSMA:
          PrimeLog.e("TODO: Implement TypeSMA Loader");
        break;
        case PrimeConst.TypeJPAKNX:
          PrimeLog.e("TODO: Implement TypeJPAKNX Loader");
        break;
        case PrimeConst.TypeTextUCS:
          if (this.config.fileData !== null && this.config.songId !== null) {
            PrimeLog.i("Loading UCS From Memory with SongID "+this.config.songId);
            soundFile = (this.config.supportedCodecs.audio.indexOf("mp3") > -1) ? 
                        "ucs/mp3/" + this.config.songId + ".mp3"  :
                        "ucs/ogg/" + this.config.songId + ".ogg";
            imageFile = "ucs/img/" + this.config.songId + ".jpg";
            this.gameVariables.noteData = _UCSParser(this, this.config.fileData);
            this.gameVariables.music = new SoundPlayer({"filename":soundFile,"webprime":_this});
            this.addBackground(imageFile);
            this.noteLoadedCallback();
          }else
            PrimeLog.e("No UCS data specifed!");   
        break;
        case PrimeConst.TypeNX:
        break;
      }
    } else {
      PrimeLog.e("Invalid SongType "+this.config.songType);
    }
  };

  webPrime.noteLoadedCallback = function() {
    PrimeLog.i("Initializing Looper");
    this.gameVariables.looper = new Looper({ 
      "drawer"    : this.gameVariables.drawer,  
      "notedata"  : this.gameVariables.noteData, 
      "skin"      : this.gameVariables.skin,
      "webprime"  : this
    });
    this.gameVariables.defaultNoteSkin = this.gameVariables.noteData.NoteSkinBank[0];
    this.gameVariables.EffectBank = new EffectBank({"drawer":this.gameVariables.drawer, "gl" : this.gl, "webprime": this});
    for (var bank in this.gameVariables.noteData.NoteSkinBank) {
      if (this.gameVariables.noteData.NoteSkinBank.hasOwnProperty(bank)) {
        this.gameVariables.skin.LoadNoteSkin(this.gameVariables.noteData.NoteSkinBank[bank]);
      }
    }
    this.Loader.loadStarted = true;
    this.animate();
  };

  webPrime.play = function() {
    this.gameVariables.music.Play();
  };

  webPrime.pause = function() {
    this.gameVariables.music.Pause();
  };

  webPrime.increaseSpeed = function() {
    if(this.gameVariables.scrollSpeed < 10) {
      PrimeLog.i("Changed ScrollSpeed from "+this.gameVariables.scrollSpeed+"x to "+(this.gameVariables.scrollSpeed+0.5)+"x");
      this.gameVariables.scrollSpeed+=0.5;
    }
  };

  webPrime.decreaseSpeed = function() {
    if(this.gameVariables.scrollSpeed > 0.5) {
      PrimeLog.i("Changed ScrollSpeed from "+this.gameVariables.scrollSpeed+"x to "+(this.gameVariables.scrollSpeed-0.5)+"x");
      this.gameVariables.scrollSpeed-=0.5;
    }
  };

  webPrime._internalAnimate = function(a) {
    if ( a.config.highSpeedAnimation)
        ImageTools.highSpeedRequest(function() { a._internalAnimate(a); });
    else
      requestAnimationFrame(function() { a._internalAnimate(a); });
    a.gameVariables.looper.loop();
  };

  webPrime.animate = function() {
    this._internalAnimate(this);
  };

  /*
   *  This is for adding a background image to the system.
   *  For WebGL we need to create a texture and a Background object. But in default way, we initialize a PIUBGAOFF Shader Background.
   *  For 2D Canvas, we just resize it to fit on the screen.
   */
  webPrime.addBackground = function(image)   {
    var bg = new Image();
    var _this = this;
    bg.onload = function()  {
      var img;
      var BGObject;
      if (_this.config.runningWebGL)    {
        img = _this.gl.createTexture();
        _this.gl.bindTexture(_this.gl.TEXTURE_2D, img);
        _this.gl.pixelStorei(_this.gl.UNPACK_FLIP_Y_WEBGL, true);
        _this.gl.texImage2D(_this.gl.TEXTURE_2D, 0, _this.gl.RGBA, _this.gl.RGBA, _this.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(this));
        _this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MAG_FILTER, _this.gl.LINEAR);
        _this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MIN_FILTER, _this.gl.LINEAR_MIPMAP_NEAREST); 
        _this.gl.generateMipmap(_this.gl.TEXTURE_2D);
        _this.gl.bindTexture(_this.gl.TEXTURE_2D, null); 
        img.width = PrimeGL.Tools.nextHighestPowerOfTwo(this.width); 
        img.height = PrimeGL.Tools.nextHighestPowerOfTwo(this.height); 
        img.rwidth = this.width;
        img.rheight = this.height;    
        
       
        BGObject = new AnimatedObject({"image" : img, "gl" : _this.gl, "webprime" : _this});
        _this.gameVariables.drawer.AddObj(BGObject, 0);

        var SHD = new GLBackground.PIUBGAOFF(_this.gl, _this.config.width, _this.config.height);
        SHD.Render();
        BGObject = new AnimatedObject({"image" : SHD.texture, "gl" : _this.gl, "webprime" : _this});
        BGObject.shd = SHD; 
        BGObject.opacity = 0.5;
 
      }else{
        img = ImageTools.resizeImage(this,_this.config.width,_this.config.height);
        BGObject = new AnimatedObject({"image" : img, "gl" : _this.gl, "webprime" : _this});
      }
      _this.gameVariables.drawer.AddObj(BGObject, 0);
    };
    bg.src = image;
  };

  var webPrimeComponent = document.registerElement('web-prime', {
    prototype: webPrime
  });

}());