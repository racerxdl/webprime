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
      beatDiv: this.getAttribute("beat-div") !== null ? $("#"+this.getAttribute("beat-div")) : null
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
      sentinel: {}
    };

    this.sounds = {

    };

    //  Create drawing Canvas
    this.canvas = $("<canvas></canvas>")[0];
    this.appendChild(this.canvas);

    // Initialize everything
    this.updateGraphicalMode();
    if (!this.config.disableWebGL) {
      PrimeGL.Tools.webGLEnabled(this);
      PrimeLog.i("WebGL Mode: " + (this.config.webGLExperimental ? "experimental" : "native")) ;
    }

    PrimeLog.d("Initializing Skin");
    this.gameVariables.skin = new F2Skin({"canvas":this.canvas, "gl":this.gl, "webprime": this});

    PrimeLog.d("Initializing Constants");
    this.gameVariables.singleReceptor   =   { "x": (this.canvas.width - (this.gameVariables.showWidth*5)) / 2 ,  "y": this.gameVariables.offsetY, "width": this.gameVariables.showWidth * 5,  "height" : this.gameVariables.arrowSize };
    this.gameVariables.doublereceptor   =   { "x": (this.canvas.width - (this.gameVariables.showWidth*10)) / 2 , "y": this.gameVariables.offsetY, "width": this.gameVariables.showWidth * 10, "height" : this.gameVariables.arrowSize };

    for(var i=0;i<5;i++)    
        this.gameVariables.singleNotesX.push(this.gameVariables.singleReceptor.x + this.gameVariables.showWidth * i -4);
    
    for(i=0;i<10;i++)    
        this.gameVariables.doubleNotesX.push(this.gameVariables.doublereceptor.x + this.gameVariables.showWidth * i -4 + (i>4?6:0));

    if(!this.config.disableWebGL)  
        this.gameVariables.drawer = new Drawer({ "canvas": this.canvas,    "skin" : this.gameVariables.skin });
    else
        this.gameVariables.drawer = new PrimeGL.Drawer({ "canvas": this.canvas,    "skin" : this.gameVariables.skin, "gl" : this.gl });

    this.Looper = new Looper({ "drawer" : this.gameVariables.drawer,   "notedata" : this.gameVariables.noteData, "skin" : this.gameVariables.skin});

  };

  webPrime.checkLoaded = function() {
    this.Loader.allObjectsLoaded = this.Loader.objectsLoaded === this.Loader.objectsToLoad;
    return this.Loader.allObjectsLoaded;
  };

  webPrime.updateDivs = function(currentTime, currentBeat) {
    if(this.webprime.config.timeDiv !== undefined)
      this.webprime.config.timeDiv.html(this.gameVariables.music.GetTime());
    if(this.webprime.config.beatDiv !== undefined)
      this.webprime.config.beatDiv.html(this.gameVariables.noteData.CurrentBeat);
  };

  webPrime.updateCanvas = function() {
    this.canvas.setAttribute("width", this.getAttribute("width"));
    this.canvas.setAttribute("height", this.getAttribute("height"));
    this.config.width = this.getAttribute("width");
    this.config.height = this.getAttribute("height");
  };

  webPrime.updateInfoHead = function() {

  };

  webPrime.updateFPSCounter = function() {
    if(this.config.FPSStats !== undefined)
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

  var webPrimeComponent = document.registerElement('web-prime', {
    prototype: webPrime
  });

}());