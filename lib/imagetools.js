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

  var ImageTools = {};

  /*
   *  Clones a canvas context
   */
  ImageTools.cloneCanvas = function ( canvas ) {
    var newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    context.drawImage(canvas, 0, 0);
    return newCanvas;
  };

  /*
   *  Creates a canvas buffer
   */
  ImageTools.createBuffCanvas = function ( width, height)   {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;   
  };

  /*
   *  Crops a image
   */
  ImageTools.CropImage = function(image,x,y,width,height)   {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    context.drawImage(image,x,y,width,height,0,0,width,height);
    return canvas;
  };

  /*
   *  Cut and crop an image
   */

  ImageTools.CropImageTarget = function(image,x,y,width,height,targetx,targety,targetw,targeth)   {
    var canvas = document.createElement('canvas');
    canvas.width = targetw;
    canvas.height = targeth;
    var context = canvas.getContext('2d');
    context.drawImage(image,x,y,width,height,targetx,targety,width,height);
    return canvas;
  };

  /*
   *  Resizes an Image
   */
  ImageTools.ResizeImage = function(image,width,height)   {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    context.drawImage(image,0,0,image.width,image.height,0,0,width,height);
    return canvas;
  };

  ImageTools.GetCompatibleCodecs = function()  {
    var testEl = document.createElement( "video" ), testEl2 = document.createElement( "audio" ),
    video=[],audio=[];
    if ( testEl.canPlayType ) {
      // Check for MPEG-4 support
      if("" !== testEl.canPlayType( 'video/mp4; codecs="mp4v.20.8"' ))
          video.push("mpeg4");

      // Check for h264 support
      if("" !== ( testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E"' ) || testEl.canPlayType( 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' ) ))
          video.push("h264");

      // Check for Ogg support
      if("" !== testEl.canPlayType( 'video/ogg; codecs="theora"' ))
          video.push("ogg");

      // Check for Webm support
      if("" !== testEl.canPlayType( 'video/webm; codecs="vp8, vorbis"' ))
          video.push("webm");   
    }

    if (testEl2.canPlayType)    {
      if("" !== testEl2.canPlayType('audio/mpeg'))
          audio.push("mp3");
      if("" !== testEl2.canPlayType('audio/ogg'))
          audio.push("ogg");
    }
    return { "video": video, "audio": audio };
  };

  ImageTools.HighSpeedRequest = (function(){
    return  function( callback ){
      window.setTimeout(callback, 1000 / 240);
    };
  })();

  window.ImageTools = ImageTools;

}());