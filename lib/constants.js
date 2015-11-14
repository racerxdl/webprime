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

  PrimeConst.SongType = {
    "UCS"     : PrimeConst.TypeUCS,
    "NX"      : PrimeConst.TypeNX,
    "SM"      : PrimeConst.TypeSM,
    "SMA"     : PrimeConst.TypeSMA,
    "JPAKNX"  : PrimeConst.TypeJPAKNX,
    "TEXTUCS" : PrimeConst.TypeTextUCS
  };

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
  PrimeConst.png                      = ".png";
  PrimeConst.mimejpg                  = "image/jpg";
  PrimeConst.jpg                      = ".jpg";

  //File names to load
  PrimeConst.ItemDataPack             = "datapack/ITEM.jpak";
  PrimeConst.NoteSkinPack             = "datapack/NS/";
  PrimeConst.BaseImage                = "/BASE.PNG";
  PrimeConst.StepFXBase               = "/STEPFX";
  PrimeConst.BombAudio                = "audio/bomb2";

  // NX20

  PrimeConst.NX20 = {};

  /*  This is specific from NX20  */
  PrimeConst.NX20.NoteTypeNull        =   0x00;

  PrimeConst.NX20.NoteTypeEffect      =   0x41;   //  0b01000001
  PrimeConst.NX20.NoteTypeDivBrain    =   0x42;   //  0b01000010
  PrimeConst.NX20.NoteTypeFake        =   0x23;   //  0b00100011
  PrimeConst.NX20.NoteTypeTap         =   0x43;   //  0b01000011
  PrimeConst.NX20.NoteTypeHoldHeadFake=   0x37;   //  0b00110111
  PrimeConst.NX20.NoteTypeHoldHead    =   0x57;   //  0b01010111
  PrimeConst.NX20.NoteTypeHoldBodyFake=   0x3b;   //  0b00111011
  PrimeConst.NX20.NoteTypeHoldBody    =   0x5B;   //  0b01011011
  PrimeConst.NX20.NoteTypeHoldTailFake=   0x3f;   //  0b00111111
  PrimeConst.NX20.NoteTypeHoldTail    =   0x5F;   //  0b01011111
  PrimeConst.NX20.NoteTypeFakeItem    =   0x21;   //  0b00100001
  PrimeConst.NX20.NoteTypeItem        =   0x61;   //  0b01100001
  PrimeConst.NX20.NoteTypeRow         =   0x80;   //  0b10000000

    
  /*  Effect Stuff    */
  /*
                              [Type, Attr, Seed, Attr2]
      Explosion at screen:    [65,      0,   22,   192]
      Random Items at screen: [65,      3,   11,   192]
  */ 

  /*  Metadata Stuff  */
  PrimeConst.NX20.MetaUnknownM                =   0;

  PrimeConst.NX20.MetaNonStep                 =   16;
  PrimeConst.NX20.MetaFreedom                 =   17;
  PrimeConst.NX20.MetaVanish                  =   22;
  PrimeConst.NX20.MetaAppear                  =   32;
  PrimeConst.NX20.MetaHighJudge               =   64;
  PrimeConst.NX20.UnknownMeta0                =   80;
  PrimeConst.NX20.UnknownMeta1                =   81;
  PrimeConst.NX20.UnknownMeta2                =   82;
  PrimeConst.NX20.MetaStandBreak              =   83;

  PrimeConst.NX20.MetaNoteSkinBank0           =   900;
  PrimeConst.NX20.MetaNoteSkinBank1           =   901;
  PrimeConst.NX20.MetaNoteSkinBank2           =   902;
  PrimeConst.NX20.MetaNoteSkinBank3           =   903;
  PrimeConst.NX20.MetaNoteSkinBank4           =   904;
  PrimeConst.NX20.MetaNoteSkinBank5           =   905;
  PrimeConst.NX20.MetaMissionLevel            =   1000;
  PrimeConst.NX20.MetaChartLevel              =   1001;
  PrimeConst.NX20.MetaNumberPlayers           =   1002; 

  PrimeConst.NX20.MetaFloor1Level             =   1101;
  PrimeConst.NX20.MetaFloor2Level             =   1201;
  PrimeConst.NX20.MetaFloor3Level             =   1301;
  PrimeConst.NX20.MetaFloor4Level             =   1401;

  PrimeConst.NX20.MetaFloor1UnkSpec0          =   1103;
  PrimeConst.NX20.MetaFloor2UnkSpec0          =   1203;
  PrimeConst.NX20.MetaFloor3UnkSpec0          =   1303;
  PrimeConst.NX20.MetaFloor4UnkSpec0          =   1403;

  PrimeConst.NX20.MetaFloor1UnkSpec1          =   1110;
  PrimeConst.NX20.MetaFloor2UnkSpec1          =   1210;
  PrimeConst.NX20.MetaFloor3UnkSpec1          =   1310;
  PrimeConst.NX20.MetaFloor4UnkSpec1          =   1410;

  PrimeConst.NX20.MetaFloor1UnkSpec2          =   1111;
  PrimeConst.NX20.MetaFloor2UnkSpec2          =   1211;
  PrimeConst.NX20.MetaFloor3UnkSpec2          =   1311;
  PrimeConst.NX20.MetaFloor4UnkSpec2          =   1411;

  PrimeConst.NX20.MetaFloor1Spec              =   1150;
  PrimeConst.NX20.MetaFloor2Spec              =   1250;
  PrimeConst.NX20.MetaFloor3Spec              =   1350;
  PrimeConst.NX20.MetaFloor4Spec              =   1450;

  PrimeConst.NX20.MetaFloor1MissionSpec0      =   66639;
  PrimeConst.NX20.MetaFloor2MissionSpec0      =   66739;
  PrimeConst.NX20.MetaFloor3MissionSpec0      =   66839;
  PrimeConst.NX20.MetaFloor4MissionSpec0      =   66939;

  PrimeConst.NX20.MetaFloor1MissionSpec1      =   132175;
  PrimeConst.NX20.MetaFloor2MissionSpec1      =   132275;
  PrimeConst.NX20.MetaFloor3MissionSpec1      =   132375;
  PrimeConst.NX20.MetaFloor4MissionSpec1      =   132475;

  PrimeConst.NX20.MetaFloor1MissionSpec2      =   197711;
  PrimeConst.NX20.MetaFloor2MissionSpec2      =   197811;
  PrimeConst.NX20.MetaFloor3MissionSpec2      =   197911;
  PrimeConst.NX20.MetaFloor4MissionSpec2      =   198011;

  PrimeConst.NX20.MetaFloor1MissionSpec3      =   263247;
  PrimeConst.NX20.MetaFloor2MissionSpec3      =   263347;
  PrimeConst.NX20.MetaFloor3MissionSpec3      =   263447;
  PrimeConst.NX20.MetaFloor4MissionSpec3      =   263547;

  /*  Map NX20->Pumper    */
  PrimeConst.NX20.ToWebPrime = {};

  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeNull]          =   PrimeConst.NoteNull;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeTap]           =   PrimeConst.NoteTap;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeHoldHead]      =   PrimeConst.NoteHoldHead;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeHoldBody]      =   PrimeConst.NoteHoldBody;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeHoldTail]      =   PrimeConst.NoteHoldTail;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeFake]          =   PrimeConst.NoteFake;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeItem]          =   PrimeConst.NoteItem;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeEffect]        =   PrimeConst.NoteEffect;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeFakeItem]      =   PrimeConst.NoteItemFake;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeHoldHeadFake]  =   PrimeConst.NoteHoldHeadFake;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeHoldBodyFake]  =   PrimeConst.NoteHoldBodyFake;
  PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeHoldTailFake]  =   PrimeConst.NoteHoldTailFake;


  /*  Deduced ATTRs */
  PrimeConst.NX20.NoteAttrRandomSkin      =   0x3;
  PrimeConst.NX20.NoteAttrSnake           =   0x10;

  /*  This is from NX20, but also used on PrimeConst, so we only map it   */
  PrimeConst.NX20.NoteSeedAction          =   PrimeConst.NoteSeedAction;
  PrimeConst.NX20.NoteSeedShield          =   PrimeConst.NoteSeedShield;
  PrimeConst.NX20.NoteSeedChange          =   PrimeConst.NoteSeedChange; 
  PrimeConst.NX20.NoteSeedAcceleration    =   PrimeConst.NoteSeedAcceleration;
  PrimeConst.NX20.NoteSeedFlash           =   PrimeConst.NoteSeedFlash;
  PrimeConst.NX20.NoteSeedMineTap         =   PrimeConst.NoteSeedMineTap;
  PrimeConst.NX20.NoteSeedMineHold        =   PrimeConst.NoteSeedMineHold; 
  PrimeConst.NX20.NoteSeedAttack          =   PrimeConst.NoteSeedAttack;
  PrimeConst.NX20.NoteSeedDrain           =   PrimeConst.NoteSeedDrain;
  PrimeConst.NX20.NoteSeedHeart           =   PrimeConst.NoteSeedHeart;
  PrimeConst.NX20.NoteSeedSpeed2          =   PrimeConst.NoteSeedSpeed2;
  PrimeConst.NX20.NoteSeedRandom          =   PrimeConst.NoteSeedRandom;
  PrimeConst.NX20.NoteSeedSpeed3          =   PrimeConst.NoteSeedSpeed3;
  PrimeConst.NX20.NoteSeedSpeed4          =   PrimeConst.NoteSeedSpeed4;
  PrimeConst.NX20.NoteSeedSpeed8          =   PrimeConst.NoteSeedSpeed8;
  PrimeConst.NX20.NoteSeedSpeed1          =   PrimeConst.NoteSeedSpeed1;
  PrimeConst.NX20.NoteSeedPotion          =   PrimeConst.NoteSeedPotion; 
  PrimeConst.NX20.NoteSeedRotate0         =   PrimeConst.NoteSeedRotate0;
  PrimeConst.NX20.NoteSeedRotate90        =   PrimeConst.NoteSeedRotate90; 
  PrimeConst.NX20.NoteSeedRotate180       =   PrimeConst.NoteSeedRotate180;
  PrimeConst.NX20.NoteSeedRotate270       =   PrimeConst.NoteSeedRotate270; 
  PrimeConst.NX20.NoteSeedSpeed_          =   PrimeConst.NoteSeedSpeed_;
  PrimeConst.NX20.NoteSeedBomb            =   PrimeConst.NoteSeedBomb; 
  PrimeConst.NX20.NoteSeedHyperPotion     =   PrimeConst.NoteSeedHyperPotion;

  /*  Mod2String  */
  PrimeConst.NX20.ModToString         =   function(mod)   {
    switch(mod) {
      case PrimeConst.NX20.MetaNonStep        :   return  "NonStep";
      case PrimeConst.NX20.MetaFreedom        :   return  "Freedom";
      case PrimeConst.NX20.MetaVanish         :   return  "Vanish";
      case PrimeConst.NX20.MetaAppear         :   return  "Appear";
      case PrimeConst.NX20.MetaHighJudge      :   return  "High Judge";
      case PrimeConst.NX20.MetaStandBreak     :   return  "Stand Break On";
      default                                 :   return  "Unknown";
    }
  };

  window.PrimeConst                   = PrimeConst;

}());