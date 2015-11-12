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

  /*********************** SceneLayer ************************/
  var SceneLayer = function ( parameters )    {
    this.Objects = [];
    this.width = parameters.width || 640;
    this.height = parameters.height || 480;
    this.blendtype = parameters.blendtype || "source-over";
    this.webglmode = parameters.webglmode || false;
  };

  SceneLayer.prototype.InitLayer       =   function ( )        {
    if (!this.webglmode) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext('2d');
      this.ForceRedraw = false;
    } else {
      this.canvas = null;
      this.ctx = null;
    }
  };

  SceneLayer.prototype.AddObject       =   function ( obj )    {
    this.Objects.push(obj);
  };

  SceneLayer.prototype.push = SceneLayer.prototype.AddObject;

  SceneLayer.prototype.indexOf = function(obj) {
    return this.Objects.indexOf(obj);
  };

  SceneLayer.prototype.splice = function(index, quantity) {
    this.Objects.splice(index, quantity);
  };

  SceneLayer.prototype.RemoveObject    =   function ( objname ) {
    var i           =   0, 
        len         =   this.Objects.length;
    while(i<len)    {
      if (this.Objects[i].id == objname)   {
        this.Objects.splice(i,1);
        break;
      }
      ++i;
    }
  };

  SceneLayer.prototype.NeedsUpdate     =   function ( )    {
    if (this.ForceRedraw || this.webglmode)    
      return true;
    else{
      var i           =   0, 
          len         =   this.Objects.length,
          need        =   false;
      while(i<len)    {
          need |= this.Objects[i].NeedsRedraw;
          if (need) break;
          ++i;
      }
      return need;
    }
  }; 

  SceneLayer.prototype.GetCanvas       =   function ( )    { return this.canvas; };

  SceneLayer.prototype.GetContext      =   function ( )    { return this.ctx; };
  
  SceneLayer.prototype.Update          =   function ( timeDelta )    {
    var i           =   0, 
        len         =   this.Objects.length;
    while(i<len)    {
      this.Objects[i].Update(timeDelta);
      if (this.Objects[i].GLUpdate !== undefined && this.webglmode)
        this.Objects[i].GLUpdate();
      ++i;       
    }
  };
  
  SceneLayer.prototype.UpdateCanvas    =   function ( )    {
    if (!this.webglmode) {
      var i           =   0, 
          len         =   this.Objects.length;
      if (this.NeedsUpdate())  {
        this.ctx.clearRect(0,0,this.width,this.height);
        while(i<len)    {
          this.Objects[i].Draw(this.ctx);
          ++i;       
        }
      }
    }
  };

  SceneLayer.prototype.ClearCanvas     =   function ( )    {
    if (!this.webglmode)
      this.ctx.clearRect(0,0,this.width,this.height);
  };

  window.SceneLayer = SceneLayer;

}());