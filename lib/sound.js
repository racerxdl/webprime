/**
__        __   _     ____       _     
\ \      / /__| |__ |  _ \ _ __(_)_ __ ___   ___ 
 \ \ /\ / / _ \ '_ \| |_) | '__| | '_ ` _ \ / _ \
  \ V  V /  __/ |_) |  __/| |  | | | | | | |  __/
   \_/\_/ \___|_.__/|_|   |_|  |_|_| |_| |_|\___| 
                                                                                    
Pump It Up: Prime Web Version
Copyright (C) 2014  HUEBR's Team

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

  var SoundManager = function (webprime) {
    this.webprime = webprime;
  };

  SoundManager.prototype.PlaySwitch = function()    {
    if(this.webprime.config.EnableSound)
      this.Switch.Play();
  };

  SoundManager.prototype.PlayCMDSet = function()    {     
    if(this.webprime.config.EnableSound)
      this.CMDSet.Play();
  };

  SoundManager.prototype.PlayBack = function()  {
    if(this.webprime.config.EnableSound)
      this.Back.Play();
  };

  SoundManager.prototype.PlayPress = function() {
    if(this.webprime.config.EnableSound)
      this.Press.Play();
  };

  SoundManager.prototype.PlayBomb  = function()    {
    if(this.webprime.config.EnableSound)
      this.Bomb.Play();
  };

  SoundManager.prototype.PlayMusic = function(music)    {
    if(this.Music !== undefined)    {
      if( this.Music.filename !== music )    {
        this.Music.Pause();
        this.Music = new SoundPlayer({filename:music,autoplay:true,loop:true,webprime:this.webprime});
      }else if(_this.Music.audiounit.paused){
        this.Music.Play();
      }
    }else
      this.Music = new SoundPlayer({filename:music,autoplay:true,loop:true,webprime:this.webprime});
  };

  SoundManager.prototype.PauseMusic = function()    {
    if(this.Music !== undefined)    
      this.Music.Pause();  
  };

  window.SoundManager = SoundManager;

  var SoundPlayer = function (parameters) {
    this.idname = "aplay-"+new Date().getUTCMilliseconds();
    this.filename = parameters.filename;
    this.autoplay = parameters.autoplay || false;
    this.audiounit = new Audio();
    this.audiounit.loop = parameters.loop || false;
    this.resettozero = parameters.reset || false;
    this.buildnew = parameters.buildnew || false;
    this.webprime = parameters.webprime;
    PrimeLog.d("Creating PUMPER::AudioPlayer with "+this.filename);
    
    if(!this.buildnew)  {
      this.audiounit.src = this.filename;

      clearTimeout(this.playtimeout);
      if(parameters.autoplay) 
        this.playtimeout = setTimeout(this.Play, 300);
    }else{
      this.audiounit = {};
    }  
  };
          
  SoundPlayer.prototype.Play = function()  {
    var _this = this;
    PrimeLog.d("PUMPER::AudioPlayer("+this.idname+").Play()");
    if(this.webprime.config.EnableSound)   {
      if(this.buildnew)   {
        var a,b;
        b=new Date();
        a=b.getTime();
        this.audiounit[a] = new Audio(this.filename);
        this.audiounit[a].onended=function(){delete _this.audiounit[a];};
        this.audiounit[a].play();
      }else{
        if(this.audiounit.readyState !== 0)    {
          if(this.resettozero)
            this.audiounit.currenttime = 0;
          this.audiounit.play();
        }else{
          clearTimeout(this.playtimeout);
          this.playtimeout = setTimeout(this.Play, 300);
        }
      }
    }
  };
  SoundPlayer.prototype.Pause = function() {
    PrimeLog.d("PUMPER::AudioPlayer("+this.idname+").Pause()");
    clearTimeout(this.playtimeout);
    this.audiounit.pause();
  };
  SoundPlayer.prototype.GetTime = function()   {
    return this.audiounit.currentTime;
  };

  window.SoundPlayer = SoundPlayer;
}());