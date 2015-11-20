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

  var _UCSData = {
     "." : PrimeConst.NoteNull,
     "X" : PrimeConst.NoteTap,
     "M" : PrimeConst.NoteHoldHead,
     "H" : PrimeConst.NoteHoldBody,
     "W" : PrimeConst.NoteHoldTail 
  };

  var _UCSParser = function ( webprime, UCSText ) {
    var lines = UCSText.split('\n');
    var inBlock = false;
    var beat = 0;
    var time = 0;
    var UCSData = new StepData({webprime: webprime});
    var i = 0;
    var CurSplit;
    var CurBlock;
    var HeaderData = 0;
    var CurSF = 1, SmoothSF = 0;
    var LastScrollFactor;
    var blockmb = false;

    while(i<lines.length)    {
      if (lines[i][0] === ":")  {
        if (!inBlock)    {
          if (CurSplit !== undefined)   
            blockmb = false;
          
          CurSplit = new StepSplit( {} );
          CurSplit.StartTime = time;
          CurSplit.StartBeat = beat;
          CurSplit.mysteryblock = null;
          HeaderData = 0;
          inBlock = true;
        }
        var command = lines[i].replace(":","").split('=');  

        switch(command[0])  {
          case "Format"       :   UCSData.Format = parseInt(command[1]);break;
          case "Mode"         :   UCSData.Mode   = command[1];break;
          case "BPM"          :   HeaderData++; CurSplit.BPM   = parseFloat(command[1].replace(",",".")); CurSplit.BPS = CurSplit.BPM/60.0; break;
          case "Delay"        :   HeaderData++; CurSplit.Delay = parseFloat(command[1].replace(",",".")) / 1000; break;
          case "Beat"         :   HeaderData++; break;  //  Ignore Beat
          case "Split"        :   HeaderData++; CurSplit.beatsplit = parseInt(command[1]); break;
          case "Level"        :   var ld = command[1].split(":"); UCSData.Level = parseInt(ld[0]); UCSData.Players = parseInt(ld[1]); break;
          case "MysteryBlock" :    
            CurSplit.mysteryblock = parseFloat(command[1]);  
            UCSData.AddMysteryBlock({"Beat":beat , "Ratio":CurSplit.mysteryblock, "BeatSplit" : CurSplit.beatsplit});
            break;
          case "Speed"        :   var ls = command[1].split(":"); CurSF = parseFloat(ls[0]); SmoothSF = parseInt(ls[1]) === 1; break;
          case "Noteskin"     :   CurSplit.Noteskin = parseInt(command[1]); UCSData.NoteSkinBank[CurSplit.Noteskin] = CurSplit.Noteskin; break;
          default             :   PrimeLog.l("UCS: Command not know: "+command[0]+" with value "+command[1]); break;
        }

        if (lines[i+1][0] !== ":") {
          var bpmchange = { "BPM" : CurSplit.BPM, "Start" : time };
          UCSData.AddBPMChange(bpmchange);
          UCSData.AddSplit(CurSplit);
          PrimeLog.d("UCS: Split header done! Adding Split.\n- BPM: "+CurSplit.BPM+"\n- Split: "+CurSplit.beatsplit);

          if (UCSData.currentbpm === 0) {
            UCSData.currentbpm = CurSplit.BPM;
            webprime.gameVariables.currentBPM = CurSplit.BPM;
          }

          var sf = { "SF": CurSF, "Start": time, "Smooth" : SmoothSF, "StartBeat": beat};
          if (LastScrollFactor !== undefined)  
              LastScrollFactor.DeltaT = time - LastScrollFactor.Start;
          
          LastScrollFactor = sf;

          UCSData.AddScrollFactorChanges(sf);
          time += CurSplit.Delay;
          beat += CurSplit.Delay * CurSplit.BPS;
        }
      }else{

        if (CurSplit.mysteryblock === null) {
          CurSplit.mysteryblock  = 1 / CurSplit.beatsplit;
          UCSData.AddMysteryBlock({"Beat":beat , "Ratio":CurSplit.mysteryblock, "BeatSplit" : CurSplit.beatsplit});
        }

        inBlock = false;
        var note = lines[i].split(""),
            lennote = note.length,
            n = 0,
            row = new StepRow({"rowbeat" : beat, "Noteskin": CurSplit.Noteskin, "mysteryblock": CurSplit.mysteryblock, "rowtime" : time, "webprime": webprime}),
            addrow = false;
        while(n<lennote)    {
          if (note[n] != "\r") {
            addrow |= (note[n]!=".");
            if (note[n] in _UCSData)
              row.AddNote(new StepNote({"type" : _UCSData[note[n]]}));
            else{
              PrimeLog.l("Note type not know: "+note[n]+" code  "+note[n].charCodeAt(0));
              row.AddNote(new StepNote({"type" : _UCSData["."]}));
            }
          }
          ++n;
        }

        beat +=  1.0 / CurSplit.beatsplit;
        time +=  1.0 / (CurSplit.beatsplit * CurSplit.BPS);
        if (addrow)
          CurSplit.AddRow(0, row);
      } 
      ++i;       
    }
    UCSData.GenerateCacheData();
    return UCSData;
  };

  window._UCSParser = _UCSParser;

}());