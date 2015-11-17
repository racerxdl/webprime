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

  var _NXParser = function (webprime, nxdata) {
    var head = struct.unpack("cccc", nxdata.slice(0,4)).join("");
    switch(head){
        case "NX10":    return _NX10Parser(webprime, nxdata);
        case "NX20":    return _NX20Parser(webprime, nxdata);
        default:        PrimeLog.d("Invalid Data Magic: "+head);
    }
  };

  window._NXParser = _NXParser;

  var _NX10Parser =  function (webprime, data) {
    PrimeLog.d("NX10 Parser Not implemented!");
    throw "NotImplementedException";
  };

  window._NX10Parser = _NX10Parser;

  var nX20StepParse = function ( stepdata ) {
      if (!(stepdata[0] in PrimeConst.NX20.ToWebPrime))
          PrimeLog.d("NX20StepParse: Unknown type: "+stepdata[0]+" from ("+stepdata+")");
      if (stepdata[0] == PrimeConst.NX20.NoteTypeEffect || stepdata[0] == PrimeConst.NX20.NoteTypeFakeItem)   {
          if (stepdata[1] == 3 && stepdata[2] == 11) //  Random Item Effect
              return new StepNote({"type" : PrimeConst.NoteItemFake, "attr" : 0, "seed" : (Math.random()*24) >>> 0, "attr2" : 0});
          else
              return new StepNote({"type" : PrimeConst.NX20.ToWebPrime[PrimeConst.NX20.NoteTypeEffect], "attr" : stepdata[1], "seed" : stepdata[2], "attr2" : stepdata[3]});
      }else
          return new StepNote({"type" : PrimeConst.NX20.ToWebPrime[stepdata[0]], "attr" : stepdata[1], "seed" : stepdata[2], "attr2" : stepdata[3]});
          
  };

  var _NX20Parser = function ( webprime, data ) {
    PrimeLog.d("Yuuupi! NX20! Size: "+data.byteLength);
    
    var steptime;
    var bpm;
    var mysteryblock;
    var delay;
    var speed;
    var beatsplit;
    var beatmeasure;
    var smoothspeed;
    var unknownflag;
    var divisionconds;
    var systemselected;
    var numblocks;
    var freeze;
    var LastScrollFactor;
    var DivConditions;
    var numrows;

    /*  Step data */
    var time = 0;
    var beat = 0;                   //  Offset added later
    var beatOffsetAdded = false;    //  Prevent double adding to offset    
    var mbbeat = 0;
    var lastoffset = 0;
    var NX20Data = new StepData({"webprime":webprime});
    var CurSplit;
    var row;
    
    function setOffset(BPS) {
      if (!beatOffsetAdded) {
        PrimeLog.i("Adding offset: "+PrimeConst.StepSoundOffset+" beat: "+(PrimeConst.StepSoundOffset * BPS / 1000));
        beat += PrimeConst.StepSoundOffset * BPS / 1000;
        time += PrimeConst.StepSoundOffset / 1000;
        beatOffsetAdded = true;
      }
    }
    
    /*  Parser Data */
    var offset = 0;
    var starting_column     =   struct.unpack("I", data.slice(4,8))[0];
    var numcolumns          =   struct.unpack("I", data.slice(8,12))[0];
    var lightmap            =   struct.unpack("I", data.slice(12,16))[0];
    var metadatablocks      =   struct.unpack("I", data.slice(16,20))[0];
    
    NX20Data.StartColumn    =   starting_column;
    NX20Data.NumColumns     =   numcolumns;
    NX20Data.Mode           =   (numcolumns==10)?"Double":"Single";
    NX20Data.Lightmap       =   lightmap;

    webprime.gameVariables.songIsDouble = numcolumns==10; 
    
    PrimeLog.d("NX20(Head) \n-   Starting Column: "+starting_column+"\n-   Number of Columns: "+numcolumns+"\n-   Mode: "+NX20Data.Mode+"\n-   Lightmap: "+lightmap+"\n-   Metadata Blocks: "+metadatablocks);
    offset = 20;
    
    /*  Parse metadata blocks   */
    var metadata = [];
    var floors   = [];
    var currentfloor;
    
    var idx, value;
    for (var i=0;i<metadatablocks;i++) {
      idx = struct.unpack("I", data.slice(offset,offset+4))[0];
      value = struct.unpack("I", data.slice(offset+4,offset+8))[0];
      //   ID - 1001 for level
      metadata.push({"id":idx,"value":value});
      offset += 8;
      
      switch(idx)  {
        case PrimeConst.NX20.MetaUnknownM           :   NX20Data.MetaUnknownM   =   value;  PrimeLog.d("NX20(Metadata) Setting MetaUnknownM to "+value); break;
        /*  Noteskin Banks  */
        case PrimeConst.NX20.MetaNoteSkinBank0      :   
        case PrimeConst.NX20.MetaNoteSkinBank1      :   
        case PrimeConst.NX20.MetaNoteSkinBank2      :   
        case PrimeConst.NX20.MetaNoteSkinBank3      :   
        case PrimeConst.NX20.MetaNoteSkinBank4      :   
        case PrimeConst.NX20.MetaNoteSkinBank5      :   
            NX20Data.NoteSkinBank   [idx-900]   =   (value==254)?0:value;  PrimeLog.d("NX20(Metadata) Setting Noteskin Bank "+(idx-900)+" to "+value); break;
        /*  Modifiers   */
        case PrimeConst.NX20.MetaNonStep            :
        case PrimeConst.NX20.MetaFreedom            :
        case PrimeConst.NX20.MetaVanish             :
        case PrimeConst.NX20.MetaAppear             :
        case PrimeConst.NX20.MetaHighJudge          :
        case PrimeConst.NX20.MetaStandBreak         :   
          if (value==1)    { 
              NX20Data.AddModifier(idx);
              PrimeLog.d("NX20(Metadata) Adding modifier "+PrimeConst.NX20.ModToString(idx));
          }
        break;
        case PrimeConst.NX20.UnknownMeta0           :   NX20Data.UnkMeta0   =   value;  PrimeLog.d("NX20(Metadata) Setting unknown meta 0 to " + value); break; 
        case PrimeConst.NX20.UnknownMeta1           :   NX20Data.UnkMeta1   =   value;  PrimeLog.d("NX20(Metadata) Setting unknown meta 1 to " + value); break; 
        case PrimeConst.NX20.UnknownMeta2           :   NX20Data.UnkMeta2   =   value;  PrimeLog.d("NX20(Metadata) Setting unknown meta 2 to " + value); break;   
        /*  Floor Data  */
        case PrimeConst.NX20.MetaFloor1Level        :   currentfloor    =   { "id" : 1, "level" : value };   floors.push(currentfloor); PrimeLog.d("NX20(Metadata) Adding floor "+currentfloor.id+" level "+value); break;   
        case PrimeConst.NX20.MetaFloor2Level        :   currentfloor    =   { "id" : 2, "level" : value };   floors.push(currentfloor); PrimeLog.d("NX20(Metadata) Adding floor "+currentfloor.id+" level "+value); break;  
        case PrimeConst.NX20.MetaFloor3Level        :   currentfloor    =   { "id" : 3, "level" : value };   floors.push(currentfloor); PrimeLog.d("NX20(Metadata) Adding floor "+currentfloor.id+" level "+value); break;  
        case PrimeConst.NX20.MetaFloor4Level        :   currentfloor    =   { "id" : 4, "level" : value };   floors.push(currentfloor); PrimeLog.d("NX20(Metadata) Adding floor "+currentfloor.id+" level "+value); break;  
        case PrimeConst.NX20.MetaFloor1Spec         :   
        case PrimeConst.NX20.MetaFloor2Spec         :
        case PrimeConst.NX20.MetaFloor3Spec         :
        case PrimeConst.NX20.MetaFloor4Spec         :   currentfloor.spec   =   value;  PrimeLog.d("NX20(Metadata) Setting Floor "+currentfloor.id+" spec to "+value);break;

        case PrimeConst.NX20.MetaFloor1MissionSpec0 :
        case PrimeConst.NX20.MetaFloor2MissionSpec0 :
        case PrimeConst.NX20.MetaFloor3MissionSpec0 :
        case PrimeConst.NX20.MetaFloor4MissionSpec0 :   currentfloor.mspec0 =   value;  PrimeLog.d("NX20(Metadata) Setting Floor "+currentfloor.id+" mission spec 0 to "+value); break;

        case PrimeConst.NX20.MetaFloor1MissionSpec1 :
        case PrimeConst.NX20.MetaFloor2MissionSpec1 :
        case PrimeConst.NX20.MetaFloor3MissionSpec1 :
        case PrimeConst.NX20.MetaFloor4MissionSpec1 :   currentfloor.mspec1 =   value;  PrimeLog.d("NX20(Metadata) Setting Floor "+currentfloor.id+" mission spec 1 to "+value); break;

        case PrimeConst.NX20.MetaFloor1MissionSpec2 :
        case PrimeConst.NX20.MetaFloor2MissionSpec2 :
        case PrimeConst.NX20.MetaFloor3MissionSpec2 :
        case PrimeConst.NX20.MetaFloor4MissionSpec2 :   currentfloor.mspec2 =   value;  PrimeLog.d("NX20(Metadata) Setting Floor "+currentfloor.id+" mission spec 2 to "+value); break;

        case PrimeConst.NX20.MetaFloor1MissionSpec3 :
        case PrimeConst.NX20.MetaFloor2MissionSpec3 :
        case PrimeConst.NX20.MetaFloor3MissionSpec3 :
        case PrimeConst.NX20.MetaFloor4MissionSpec3 :   currentfloor.mspec3 =   value;  PrimeLog.d("NX20(Metadata) Setting Floor "+currentfloor.id+" mission spec 3 to "+value); break;
        
        case PrimeConst.NX20.MetaFloor1UnkSpec0     :   
        case PrimeConst.NX20.MetaFloor2UnkSpec0     :
        case PrimeConst.NX20.MetaFloor3UnkSpec0     :
        case PrimeConst.NX20.MetaFloor4UnkSpec0     :   currentfloor.unkspec0   =   value;  PrimeLog.d("NX20(Metadata) Setting Floor "+currentfloor.id+" unknown spec 0 to "+value); break;

        case PrimeConst.NX20.MetaFloor1UnkSpec1     :
        case PrimeConst.NX20.MetaFloor2UnkSpec1     :
        case PrimeConst.NX20.MetaFloor3UnkSpec1     :
        case PrimeConst.NX20.MetaFloor4UnkSpec1     :   currentfloor.unkspec1   =   value;  PrimeLog.d("NX20(Metadata) Setting Floor "+currentfloor.id+" unknown spec 1 to "+value); break;

        case PrimeConst.NX20.MetaFloor1UnkSpec2     :
        case PrimeConst.NX20.MetaFloor2UnkSpec2     :
        case PrimeConst.NX20.MetaFloor3UnkSpec2     :
        case PrimeConst.NX20.MetaFloor4UnkSpec2     :   currentfloor.unkspec2   =   value;  PrimeLog.d("NX20(Metadata) Setting Floor "+currentfloor.id+" unknown spec 2 to "+value); break;

        /*  Chart Data  */
        case PrimeConst.NX20.MetaChartLevel     :   NX20Data.Level          =   value;  PrimeLog.d("NX20(Metadata) Setting chart level to "+value);break;
        case PrimeConst.NX20.MetaMissionLevel   :   NX20Data.MissionLevel   =   value;  PrimeLog.d("NX20(Metadata) Setting chart mission level to "+value);break;
        case PrimeConst.NX20.MetaNumberPlayers  :   NX20Data.NumberPlayers  =   value;  PrimeLog.d("NX20(Metadata) Setting number of players to "+value); break;
        default:
            PrimeLog.d("NX20(Metadata) Metadata Block("+idx+") = "+value);
      }
    }

    NX20Data.MetaData = metadata;
    var numsplits = struct.unpack("I", data.slice(offset,offset+4))[0];
    offset += 4;
    PrimeLog.d("NX20() Number of splits: "+numsplits);
    /*  Parse Splits    */
    var Warp = false;
    for (i=0;i<numsplits;i++) {
      /*  Split Head */
      systemselected  =   struct.unpack("I", data.slice(offset,offset+4))[0];
      metadatablocks  =   struct.unpack("I", data.slice(offset+4,offset+8))[0];
      var splitmetadata   =   [];
      offset += 8;
      for (var m=0;m<metadatablocks;m++)   {
        idx = struct.unpack("I", data.slice(offset,offset+4))[0];
        value = struct.unpack("I", data.slice(offset+4,offset+8))[0];
        //   ID - 1001 for level
        splitmetadata.push({"id":idx,"value":value});
        offset += 8;          
      }
      
      numblocks       =   struct.unpack("I", data.slice(offset,offset+4))[0];
      offset          +=  4;
      PrimeLog.d( "NX20(Split) Split("+i+")"+
                  "\n-    System Selected: "+systemselected+
                  "\n-    Metadata Blocks: "+metadatablocks+
                  "\n-    Number of Blocks: "+numblocks);
      // Current, I dont know how the System Selected works, so I will just throw as it was random.
      //  When System Selected = 0, The real machine always return the first block.
      
      var SelectedBlock = (systemselected===0)?0:(Math.random()*numblocks) >> 0;
                
      /*  Block Process   */
      for (var blk=0;blk<numblocks;blk++)  {
        steptime        =   struct.unpack("f", data.slice(offset+0,offset+4))[0];
        bpm             =   struct.unpack("f", data.slice(offset+4,offset+8))[0];
        mysteryblock    =   struct.unpack("f", data.slice(offset+8,offset+12))[0];
        delay           =   struct.unpack("f", data.slice(offset+12,offset+16))[0];
        speed           =   struct.unpack("f", data.slice(offset+16,offset+20))[0];
        beatsplit       =   struct.unpack("B", data.slice(offset+20,offset+21))[0];
        beatmeasure     =   struct.unpack("B", data.slice(offset+21,offset+22))[0];
        smoothspeed     =   struct.unpack("B", data.slice(offset+22,offset+23))[0];
        unknownflag     =   struct.unpack("B", data.slice(offset+23,offset+24))[0];
        divisionconds   =   struct.unpack("I", data.slice(offset+24,offset+28))[0];
        freeze          =   (speed<0);
        offset          +=  28;
        DivConditions   =   [];
        for (var div=0;div<divisionconds;div++)  {
          idx = struct.unpack("I", data.slice(offset,offset+4))[0];
          p1 = struct.unpack("h", data.slice(offset+4,offset+6))[0];
          p2 = struct.unpack("h", data.slice(offset+6,offset+8))[0];
          //   ID - 1001 for level
          DivConditions.push({"id":idx,"p1":p1,"p2":p2}); 
          PrimeLog.d("NX20(Contition) ID: "+idx+" ("+p1+","+p2+")");               
          offset += 8;
        }
        setOffset(bpm/60); // Add offset if needed 
        numrows         =   struct.unpack("I", data.slice(offset,offset+4))[0];
        offset += 4;
        if (SelectedBlock != blk)   {
          PrimeLog.d("NX20(Block) Block("+blk+") Block skipped by random.");
          for (var n=0; n<numrows;n++) {
            var rowt =  struct.unpack("BBBB", data.slice(offset,offset+4));
            offset  +=  4;
            if (rowt[0] == PrimeConst.NX20.NoteTypeRow) {
                /*  Empty Line  */
            } else {
              for (var k=0;k<(numcolumns-1);k++)   {
                rowt =  struct.unpack("BBBB", data.slice(offset,offset+4));
                offset += 4;
              }
            }
          }             
        } else {
          speed = Math.abs(speed);
          PrimeLog.d( "NX20(Block) Block("+blk+")"+
                      "\n-    StepTime: "+steptime+
                      "\n-    BPM: "+bpm+
                      "\n-    Mystery Block: "+mysteryblock+
                      "\n-    Delay: "+delay+
                      "\n-    Freeze: "+freeze+
                      "\n-    Speed: "+speed+
                      "\n-    Beat Split: "+beatsplit+
                      "\n-    Beat Measure: "+beatmeasure+
                      "\n-    Smooth Speed:   "+smoothspeed+
                      "\n-    Unknown Flag:   "+unknownflag+
                      "\n-    Division Conditions:    "+divisionconds+
                      "\n-    Number of Rows: "+numrows);  
        
          var lastsplit = CurSplit;
          if (CurSplit !== undefined)   {
            CurSplit.LastBeat = beat ;
            CurSplit.LastBeatMB = ( beat - CurSplit.StartBeat) * CurSplit.mysteryblock + CurSplit.StartBeat;
            CurSplit.EndTime = time;
            CurSplit.ComputeSplitSize();
          }
          CurSplit = new StepSplit( {"webprime":webprime} );
          CurSplit.StartTime      =   time;
          CurSplit.StartBeat      =   beat;
          CurSplit.BPM            =   bpm;
          CurSplit.BPS            =   bpm / 60;
          CurSplit.Delay          =   delay/1000;
          CurSplit.beatsplit      =   beatsplit;
          CurSplit.mysteryblock   =   mysteryblock;
          CurSplit.LastSplit      =   lastsplit;
          CurSplit.DivConditions  =   divisionconds;
          //NX20Data.AddBPMChange({ "BPM" : bpm, "Start" : time });
          NX20Data.AddBPMChange({ "BPM" : bpm, "Start": steptime/1000});
          
          
          //var sf = { "SF": speed, "Start": time, "Smooth" : (smoothspeed>0), "StartBeat": beat};
          var sf = { "SF": speed, "Start": (steptime/1000) + PrimeConst.StepSoundOffset / 1000, "Smooth" : (smoothspeed>0), "StartBeat": beat};
          if (LastScrollFactor !== undefined)  
              LastScrollFactor.DeltaT = (steptime/1000) - LastScrollFactor.Start + PrimeConst.StepSoundOffset / 1000;
          
          LastScrollFactor = sf;
          //PrimeLog.i("NX20(Block) Block("+blk+"): Adding Scroll Factor Change"
          NX20Data.AddScrollFactorChanges(sf);
          NX20Data.AddSplit(CurSplit);
          

          if (NX20Data.currentbpm === 0) {
            NX20Data.currentbpm = CurSplit.BPM;
            webprime.gameVariables.currentBPM = CurSplit.BPM;
          }
          //console.log("NX20(Block) Block("+blk+"): MysteryBlock of "+mysteryblock+" at "+beat);
          NX20Data.AddMysteryBlock({"Beat":beat , "Ratio":mysteryblock, "BeatSplit" : beatsplit});
          if (steptime >= 0)   {                    
            if (freeze)
              NX20Data.AddStop({"StopUntil" : time + CurSplit.Delay , "StopTime": CurSplit.Delay, "Start" : time });
            else{
              beat += CurSplit.Delay * CurSplit.BPS; 
            }   
          } else
            beat += CurSplit.Delay * CurSplit.BPS;
          time += CurSplit.Delay;
          // Detect Warp
          if (Math.round(steptime*1000 + PrimeConst.StepSoundOffset*1000) != Math.round(time*1000*1000))    {
            // Lets do an warp!
            var WarpBeat = ((steptime/1000) - time ) * CurSplit.BPS + beat;
            PrimeLog.i("NX20(Block) Block("+blk+"): Time Warp from "+(steptime)+" ms to "+time*1000+" ms from beat "+WarpBeat+" to beat "+beat);
            NX20Data.AddWarp({ "WarpBeat" : beat /*+ 1.0 / CurSplit.beatsplit*/,  "Start" : (steptime/1000), "WarpTime" : time, "WarpDelta" : time - (steptime/1000) });
          }                    
          /*  Parse Notes */
          for (var nr=0; nr<numrows;nr++) {
            var rowd =  struct.unpack("BBBB", data.slice(offset,offset+4));
            offset  +=  4;
            if (rowd[0] == PrimeConst.NX20.NoteTypeRow) {
              /*  Empty Line  */
            } else {
              row = new StepRow({"rowbeat" : beat, "rowtime" : time, "mbbeat" : mbbeat, "mysteryblock" : CurSplit.mysteryblock, "webprime": webprime});
              row.AddNote(nX20StepParse(rowd));
              
              for (var kt=0;kt<(numcolumns-1);kt++)   {
                rowd =  struct.unpack("BBBB", data.slice(offset,offset+4));
                offset += 4;
                row.AddNote(nX20StepParse(rowd)); 
              }
              CurSplit.AddRow(0, row);
            }
            mbbeat += mysteryblock * beatsplit;
            beat +=  1.0 / CurSplit.beatsplit;
            time +=  1.0 / (CurSplit.beatsplit * CurSplit.BPS);
          }
        }
      }
    }
    PrimeLog.d("NX20() Noteskins used by this chart: "+NX20Data.NoteSkins);
    NX20Data.GenerateCacheData();
    return NX20Data;
  };

  window._NX20Parser = _NX20Parser;

}());