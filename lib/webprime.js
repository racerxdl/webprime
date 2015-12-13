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
      loaded: false,
      controlsCreated: false
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
      songLevel: this.getAttribute("song-level"),
      songMode: this.getAttribute("song-mode"),
      songLocation: this.getAttribute("song-location") !== null ? this.getAttribute("song-location") : "ARCADE",
      overrideNoteskin: this.getAttribute("override-noteskin") !== null ? parseInt(this.getAttribute("override-noteskin")) : null,
      highSpeedAnimation: this.getAttribute("high-speed-animation") !== null,
      webglBackground: this.getAttribute("webgl-background") !== null ? ( (this.getAttribute("webgl-background") in GLBackground.BGD) ? this.getAttribute("webgl-background") : null ) : null,
      fileData: null,
      debugMode: this.getAttribute("debug-mode") !== null,
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
      arrowSize: this.graphicalMode === "SD" ? 64 : 96,
      showWidth: this.graphicalMode === "SD" ? 50 : 74,
      doubleOffsetX: this.graphicalMode === "SD" ? 6 : 14,
      offsetY: 32,
      doubleNotesX: [],
      singleNotesX: [],
      singleReceptor: {x:0,y:0},
      doubleReceptor: {x:0,y:0},
      defaultNoteSkin: 0,
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
    this.gameVariables.doubleReceptor   =   { "x": (this.canvas.width - (this.gameVariables.showWidth*10)) / 2 , "y": this.gameVariables.offsetY, "width": this.gameVariables.showWidth * 10, "height" : this.gameVariables.arrowSize };

    for (var i=0;i<5;i++)    
        this.gameVariables.singleNotesX.push(this.gameVariables.singleReceptor.x + this.gameVariables.showWidth * i -4);
    
    for (i=0;i<10;i++)    
        this.gameVariables.doubleNotesX.push(this.gameVariables.doubleReceptor.x + this.gameVariables.showWidth * i -4 + (i>4?this.gameVariables.doubleOffsetX:0));

    if (this.config.disableWebGL || !this.config.runningWebGL)  
        this.gameVariables.drawer = new CanvasDrawer({ "canvas": this.canvas,    "skin" : this.gameVariables.skin, "webprime": this });
    else
        this.gameVariables.drawer = new WebGLDrawer({ "canvas": this.canvas,    "skin" : this.gameVariables.skin, "gl" : this.gl, "webprime": this });

    this.loadData();
  };

  webPrime.setDebugMode = function(enabled) {
    this.config.debugMode = enabled;
    this.refreshDebug();
  };

  webPrime.refreshDebug = function() {
    if (this.config.debugMode) {
      if (this.Loader.controlsCreated) {
        var debugText = "";

        debugText += "Time: " + PrimeTools.FixTo3(this.gameVariables.music.GetTime()) + "<BR/>";
        debugText += "Beat: " + PrimeTools.FixTo3(this.gameVariables.noteData.CurrentBeat) + "<BR/>";
        debugText += "BPM: " + this.gameVariables.currentBPM + "<BR/>";
        debugText += "Scroll Speed: " + PrimeTools.FixTo3(this.gameVariables.scrollSpeed) + "<BR/>";
        debugText += "Combo: " + this.gameVariables.currentCombo + "<BR/>";

        debugText += "<BR/><BR/>Configuration: <BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- WebGL Mode: " + this.config.runningWebGL + "<BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Draw Anchors: " + this.config.drawAnchors + "<BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Song ID: "+ this.config.songId + "<BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Song Type: "+ this.config.songType + "<BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Song Level: "+ this.config.songLevel + "<BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Song Mode: "+ this.config.songMode + "<BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Song Location: "+ this.config.songLocation + "<BR/>";

        debugText += "<BR/><BR/>Scroll Factor: <BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Factor: " + PrimeTools.FixTo3(this.gameVariables.currentScrollFactor) + "<BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Base: " + PrimeTools.FixTo3(this.gameVariables.baseScrollFactor) + "<BR/>";
        debugText += "&nbsp;&nbsp;&nbsp;- Factor: "+ PrimeTools.FixTo3(this.gameVariables.scrollFactorFactor) + "<BR/>";

        this.gParamDiv.html(debugText);
      }
    }
  };

  webPrime.createControls = function() {
    if (!this.Loader.controlsCreated) {
      var webprime = this;

      // Control Buttons
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

      // Debug Holder
      this.debugholder = $("<div></div>");

      this.gParamDiv = $("<div></div>");
      this.gParamDiv.css('position', 'absolute');
      this.gParamDiv.css('top', '10px');
      this.gParamDiv.css('left', '10px');
      this.gParamDiv.css('width', '250px');
      this.gParamDiv.css('color', 'white');
      this.gParamDiv.css('text-align', 'left');
      this.gParamDiv.css('textShadow', '2px 0 0 #000000, -2px 0 0 #000000, 0 2px 0 #000000, 0 -2px 0 #000000, 1px 1px #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000');

      this.debugholder.append(this.gParamDiv);
      this.container.append(this.debugholder);
      this.Loader.controlsCreated = true;
    }
  };

  webPrime.checkLoaded = function() {
    this.Loader.allObjectsLoaded = this.Loader.objectsLoaded >= this.Loader.objectsToLoad;
    if (this.Loader.loaded && !this.Loader.controlsCreated)
      this.createControls();
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
        /**
         *  This will load a NX file inside an JPAK.
         *  It will load a JPAK file with url specified on "jpak" loadarg, it will use also the level and mode parameter to pick the chart.
         *  The structure of the JPAK file needs to follow this:
         *  - MUSIC.MP3         //  The MP3 song file
         *  - MUSIC.OGG         //  The OGG song file
         *  - PREVIEW.MP3         //  The preview song MP3, not needed for this loader.
         *  - PREVIEW.OGG         //  The preview song OGG, not needed for this loader.
         *  - PREVIEW.MP4         //  The preview video mp4, not needed for this loader.
         *  - TITLE.JPG         //  The background image
         *  - CHARTS            //  The charts folder
         *  //  This is the charts folder content. You don't need to have all these folders created.
         *  //  This is just for reference how you should place your NX charts inside the folders
         *  - CHARTS/SINGLE       //  The single charts folder
         *  - CHARTS/SINGLE/{LEVEL}.NX  //  The single chart with level {LEVEL}
         *  - CHARTS/DOUBLE       //  The double charts folder
         *  - CHARTS/SINGLEPERFORMANCE  //  The single performance charts folder
         *  - CHARTS/DOUBLEPERFORMANCE  //  The double performance charts folder
         *  - CHARTS/MISSION        //  The mission folders
         */
        case PrimeConst.TypeJPAKNX:
          if (this.config.fileName !== undefined && this.config.songLevel !== undefined && this.config.songMode !== undefined)   {
            this.jpakloader = new JPAK.Loader({"file" : this.config.fileName});
            this.jpakloader.load().then(function() {
              var nXFileName  = (_this.config.songLocation=="ARCADE") ? 
                                "/CHARTS/" + _this.config.songMode + "/" + _this.config.songLevel + ".NX" : 
                                "/CHARTS/" + _this.config.songLocation + "/" + _this.config.songMode + "/" + _this.config.songLevel + ".NX";
              var nXFile;
              var soundFile;
              var imageFile;

              _this.jpakloader.getFileArrayBuffer(nXFileName).then(function(data) {
                nXFile = data;
                return (_this.config.supportedCodecs.audio.indexOf("mp3") > -1) ? 
                              _this.jpakloader.getFileURL("/MUSIC.MP3", "audio/mpeg") : 
                              _this.jpakloader.getFileURL("/MUSIC.OGG", "audio/ogg");
              }).then(function(url) {
                soundFile = url;
                return _this.jpakloader.getFileURL("/TITLE.JPG", "image/jpeg");
              }).then(function(url) {
                imageFile = url;
                if (nXFile !== undefined && soundFile !== undefined && imageFile !== undefined) {
                  _this.gameVariables.noteData = _NXParser(_this, nXFile);
                  _this.gameVariables.music = new SoundPlayer({"filename":soundFile,"webprime":_this});

                  _this.addBackground(imageFile);
                  _this.noteLoadedCallback();
                } else {
                  PrimeLog.e("Fail to load step - Not valid step file!");
                  throw "NotValidStepFileException";
                }
              });
            });          
          }
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

    if (this.config.overrideNoteskin !== null && this.gameVariables.skin.NoteSkins.hasOwnProperty(this.config.overrideNoteskin))
      this.gameVariables.defaultNoteSkin = this.config.overrideNoteskin;
    else
      this.gameVariables.defaultNoteSkin = this.gameVariables.noteData.NoteSkinBank[0];

    this.gameVariables.EffectBank = new EffectBank({"drawer":this.gameVariables.drawer, "gl" : this.gl, "webprime": this});
    
      

    for (var bank in this.gameVariables.noteData.NoteSkinBank) {
      if (this.gameVariables.noteData.NoteSkinBank.hasOwnProperty(bank)) {
        if (this.config.overrideNoteskin !== null && this.gameVariables.skin.NoteSkins.hasOwnProperty(this.config.overrideNoteskin))
          this.gameVariables.noteData.NoteSkinBank[bank] = this.config.overrideNoteskin;
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
        var img_o = ImageTools.resizeImage(this,_this.config.width,_this.config.height);
        img = _this.gl.createTexture();
        _this.gl.bindTexture(_this.gl.TEXTURE_2D, img);
        _this.gl.pixelStorei(_this.gl.UNPACK_FLIP_Y_WEBGL, true);
        _this.gl.texImage2D(_this.gl.TEXTURE_2D, 0, _this.gl.RGBA, _this.gl.RGBA, _this.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(img_o));
        _this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MAG_FILTER, _this.gl.LINEAR);
        _this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MIN_FILTER, _this.gl.LINEAR);
        _this.gl.bindTexture(_this.gl.TEXTURE_2D, null); 
        img.width = PrimeGL.Tools.nextHighestPowerOfTwo(img_o.width); 
        img.height = PrimeGL.Tools.nextHighestPowerOfTwo(img_o.height);         
       
        BGObject = new AnimatedObject({"image" : img, "gl" : _this.gl, "webprime" : _this});
        _this.gameVariables.drawer.AddObj(BGObject, 0);

        if (_this.config.webglBackground !== null) {
          var SHD = new GLBackground.BGD[_this.config.webglBackground](_this.gl, _this.config.width, _this.config.height);
          //var SHD = new GLBackground.PIUBGAOFF(_this.gl, _this.config.width, _this.config.height);
          SHD.Render();
          BGObject = new AnimatedObject({"image" : SHD.texture, "gl" : _this.gl, "webprime" : _this});
          BGObject.shd = SHD; 
          BGObject.opacity = 0.5;
        }
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