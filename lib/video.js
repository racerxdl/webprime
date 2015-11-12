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
  var VideoPlayer = function ( parameters ) {
    this.filename = parameters.filename;
    this.autoplay = parameters.autoplay || false;
    this.Enable   = parameters.enable || true;
    this.idname = "vplay-"+new Date().getUTCMilliseconds();

    this.Create();
  };

  VideoPlayer.prototype.GetVideo = function()  {   return this.videounit; };

  VideoPlayer.prototype.Destroy  = function()  {
    $("#"+this.idname).remove();
    $(this.videoHolder).remove();
    this.videounit = new Image();
    this.Created = false;
  };

  VideoPlayer.prototype.Create = function()    {
    if (!this.Created && this.Enable) {
      if (this.filename === undefined || !this.Enable)    {
        PrimeLog.d("Creating VideoPlayer with Dummy as "+this.idname);
        this.videounit = new Image();
      }else{
        PrimeLog.d("Creating VideoPlayer with "+this.filename+" as "+this.idname);
        this.videoHolder = document.createElement('div');
        this.videoHolder.setAttribute("style", "display:none;");
        $(this.videoHolder).html(
          '<video controls loop id="'+this.idname+'"  width="320" height="240" hidden>' + 
          '<source src="'+this.filename+'.webm" type=video/webm>' + 
          '<source src="'+this.filename+'.ogg" type=video/ogg>'  + 
          '<source src="'+this.filename+'.mp4" type=video/mp4>'  + 
          '</video>'
        );
        $('body').append(this.videoHolder);   
        _vthis.videounit = document.getElementById(this.idname);   
        if (this.autoplay) 
          setTimeout(this.Play, 1000);
      }
      this.Created = true;
    }else{
      if (!this.Enable)
        this.videounit = new Image();
    }
  };

  VideoPlayer.prototype.Play = function()  {
    PrimeLog.d("VideoPlayer("+this.idname+").Play()");
    if (this.Enable)
      this.videounit.play();
  };
  VideoPlayer.prototype.Pause = function() {
    PrimeLog.d("VideoPlayer("+this.idname+").Pause()");
    this.videounit.pause();
  };
  VideoPlayer.prototype.ChangeVideo = function(filename,autoplay) {
    this.filename = filename;
    this.autoplay = autoplay || false;
    this.Destroy();
    this.Create();
  };

}());