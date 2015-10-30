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

  var PrimeConst = {};

  //  Game Constants
  PrimeConst.StepSoundOffset          = -100; //  Draw offset within sound, in milesseconds.
  PrimeConst.StepOffsetY              = 0;    //  Y Offset in px
  PrimeConst.StepCutTime              = 83.3; //  Time to remove the Step in milesseconds.

  //  Loader Types
  PrimeConst.TypeInvalid              = 0;    //  The default one, for undefined type
  PrimeConst.TypeUCS                  = 1;    //  UCS File Loader
  PrimeConst.TypeNX                   = 2;    //  NX20/10 File Loader
  PrimeConst.TypeSM                   = 3;    //  SM File Loader
  PrimeConst.TypeSMA                  = 4;    //  SMA File Loader
  PrimeConst.TypeSSC                  = 5;    //  SSC File Loader
  PrimeConst.TypeJPAKNX               = 6;    //  JPAK'd NX20 file (piuvisual struct) file loader
  PrimeConst.TypeTextUCS              = 7;    //  Text Type UCS (not a file loader, just receive the Text as parameter)


  //  Note Types
  PrimeConst.NoteNull                 = 0;
  PrimeConst.NoteTap                  = 1;
  PrimeConst.NoteHoldHead             = 2;
  PrimeConst.NoteHoldBody             = 3;
  PrimeConst.NoteHoldTail             = 4;
  PrimeConst.NoteFake                 = 5;
  PrimeConst.NoteItem                 = 6;
  PrimeConst.NoteEffect               = 7;
  PrimeConst.NoteItemFake             = 8;
  PrimeConst.NoteHoldHeadFake         = 9;
  PrimeConst.NoteHoldBodyFake         = 10;
  PrimeConst.NoteHoldTailFake         = 11;

  //Note Seed
  PrimeConst.NoteSeedAction           = 0;
  PrimeConst.NoteSeedShield           = 1;
  PrimeConst.NoteSeedChange           = 2; 
  PrimeConst.NoteSeedAcceleration     = 3; 
  PrimeConst.NoteSeedFlash            = 4; 
  PrimeConst.NoteSeedMineTap          = 5; 
  PrimeConst.NoteSeedMineHold         = 6; 
  PrimeConst.NoteSeedAttack           = 7;
  PrimeConst.NoteSeedDrain            = 8;
  PrimeConst.NoteSeedHeart            = 9; 
  PrimeConst.NoteSeedSpeed2           = 10;
  PrimeConst.NoteSeedRandom           = 11; 
  PrimeConst.NoteSeedSpeed3           = 12;
  PrimeConst.NoteSeedSpeed4           = 13; 
  PrimeConst.NoteSeedSpeed8           = 14; 
  PrimeConst.NoteSeedSpeed1           = 15; 
  PrimeConst.NoteSeedPotion           = 16; 
  PrimeConst.NoteSeedRotate0          = 17; 
  PrimeConst.NoteSeedRotate90         = 18; 
  PrimeConst.NoteSeedRotate180        = 19; 
  PrimeConst.NoteSeedRotate270        = 20; 
  PrimeConst.NoteSeedSpeed_           = 21; 
  PrimeConst.NoteSeedBomb             = 22; 
  PrimeConst.NoteSeedHyperPotion      = 23; 

  //Modifier Type
  PrimeConst.ModNonStep               = 0;
  PrimeConst.ModFreedom               = 1;
  PrimeConst.ModVanish                = 2;
  PrimeConst.ModAppear                = 3;
  PrimeConst.ModHighJudge             = 4;
  PrimeConst.ModStandBreak            = 5;

  //Skin Constants
  PrimeConst.StepSDSize               = 64;

  //Mime Types
  PrimeConst.mimepng                  = "image/png";
  PrimeConst.png                      = ".PNG";
  PrimeConst.mimejpg                  = "image/jpg";
  PrimeConst.jpg                      = ".JPG";

  //File names to load
  PrimeConst.ItemDataPack             = "datapack/ITEM.jpak";
  PrimeConst.NoteSkinPack             = "datapack/NS/";
  PrimeConst.BaseImage                = "/BASE.PNG";
  PrimeConst.StepFXBase               = "/STEPFX";

  window.PrimeConst                   = PrimeConst;

}());