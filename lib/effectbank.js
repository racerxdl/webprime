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
   *  This is the effect bank class.
   *  This class will hold the global effects to be called by the system.
   */
  var EffectBank = function(parameters)  {
    this.drawer       = parameters.drawer;
    this.gl           = parameters.gl;
    this.webprime     = parameters.webprime;
    this.FlashEffect  = new Effects.FlashEffect(this.webprime, this.drawer, this.gl);
  };

  window.EffectBank = EffectBank;

  /*
   *  Just an holder for the Effect types.
   */
  var Effects = {};

  /*
   *  Flash effect. This effect will flash the screen (white)
   *  It is like here: https://www.youtube.com/watch?v=OPdWZdWySZo
   */
  Effects.FlashEffect = function(webprime, drawer, gl)    {
    this.drawer = drawer;
    this.gl = gl;
    this.webprime = webprime;
    this.webprime.Loader.objectsToLoad += 1;
    this.CurrentBeat100 = -1;
    this.EffectImage = document.createElement("canvas");
    this.EffectImage.width = this.drawer.canvas.width;
    this.EffectImage.height = this.drawer.canvas.height;
    //  This effect is just a blank screen
    var ctx = this.EffectImage.getContext("2d");

    ctx.beginPath();
    ctx.rect(0, 0, this.EffectImage.width, this.EffectImage.height);
    ctx.fillStyle = 'white';
    ctx.fill();

    if(!this.webprime.config.runningWebGL)
      this.EffectTexture = this.EffectImage;
    else{
      this.EffectTexture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.EffectTexture);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, PrimeGL.Tools.toPowerOfTwo(this.EffectImage));
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST); 
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);  
      this.EffectTexture.width = PrimeGL.Tools.nextHighestPowerOfTwo(this.width); 
      this.EffectTexture.height = PrimeGL.Tools.nextHighestPowerOfTwo(this.height); 
      this.EffectTexture.rwidth = this.width;
      this.EffectTexture.rheight = this.height;     
    }    

    this.EffectObject = new AnimatedObject({
      "image"     :   this.EffectTexture, 
      "opacity"   :   0,
      "x"         :   0,
      "y"         :   0,
      "gl"        :   this.gl,
      "webprime"  :   this.webprime,
      "Update"    :   function(timeDelta) {
        if(this.opacity !== 0)   {
          var delta = 0;
          if(this.MusicTime !== undefined) 
            delta = this.webprime.gameVariables.music.GetTime() - this.MusicTime;
          this.MusicTime = this.webprime.gameVariables.music.GetTime();
          this.opacity -= (delta * this.AnimTime);
          if(this.opacity < 0)
            this.opacity = 0;
          this.NeedsRedraw = true;
        }
      }
    });    

    this.EffectObject.Start = function()    {
        this.opacity = 0.95;
    };

    this.EffectObject.AnimTime = 1;
    this.drawer.AddObj(this.EffectObject,4);
    this.webprime.Loader.objectsLoaded += 1;
    this.webprime.checkLoaded();
  };

  /*
   *  This function starts the effect
   */
  Effects.FlashEffect.prototype.Start = function (CurrentBeat)   {
    if((CurrentBeat*100)>>0 > this.CurrentBeat100)  {
      this.CurrentBeat100 = (CurrentBeat*100)>>0;
      this.EffectObject.Start();
      //Do Effect
    }
  };

}());