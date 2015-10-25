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

*/

(function () {
  'use strict';

  var webPrime = Object.create(HTMLElement.prototype);

  webPrime.createdCallback = function() {
    // Load attributes
    this.graphicalMode = this.getAttribute("graphical-mode") !== null ? this.getAttribute("graphical-mode") : "SD"; 

    //  Create drawing Canvas
    this.canvas = $("<canvas></canvas>")[0];
    this.appendChild(this.canvas);

    // Initialize everything
    this.updateGraphicalMode();
  };

  webPrime.updateCanvas = function() {
    this.canvas.setAttribute("width", this.getAttribute("width"));
    this.canvas.setAttribute("height", this.getAttribute("height"));
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