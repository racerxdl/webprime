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
   * This is the Looper Class.
   * It does the main loop of the game
   */
  var Looper = function ( parameters )  {
    this.Drawer     = parameters.drawer;
    this.NoteData   = parameters.notedata;
    this.Skin       = parameters.skin; 
    this.webprime   = parameters.webprime;
  };

  /*
   *  Main Loop Function. Draws the loading if the game is loading,
   *  if not, runs the game Update, Updates the Sentinel, updates the current block
   *  and updates the views.
   */
  Looper.prototype.loop = function()  {
    this.webprime.gameVariables.sentinel.Update();
    if (this.Drawer !== undefined)   { 
      this.Drawer.Update();
      if (this.webprime.Loader.objectsToLoad > this.webprime.Loader.objectsLoaded || !this.webprime.Loader.loadStarted) {
        this.webprime.Loader.loaded = false;
        this.Drawer.DrawLoading();
      }else{
        if (this.webprime.gameVariables.sentinel.OK())   {
          this.webprime.Loader.loaded = true;
          this.NoteData.Update(this.webprime.gameVariables.music.GetTime());
          this.Skin.Update(this.webprime.gameVariables.music.GetTime());
          this.Drawer.NoteBlock = this.NoteData.GetBeatBlock(this.webprime.config.height);
          this.Drawer.DrawLayers();
          this.webprime.updateDivs();
        }
      }
    }

    this.webprime.updateInfoHead();
    this.webprime.updateFPSCounter();
  };

  window.Looper = Looper;
}());