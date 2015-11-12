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
    var lastblock = -1;
    var inBlock = false;
    var beat = 0;
    var time = 0;
    var linen = 0;
    var lastbeat = 0;
    var UCSData = new StepData({webprime: webprime});
    var lineslength = lines.length;
    var i = 0;
    var CurSplit;
    var CurBlock;
    var HeaderData = 0;
    var inblock = false;
    var LongTmp = [ {}, {}, {}, {}, {} ];
    while(i<lineslength)    {
      if (lines[i][0] === ":")  {
        if (!inblock)    {
          if (CurSplit !== undefined)   {
            CurSplit.LastBeat = beat;
            CurSplit.EndTime = time;
          }
          CurSplit = new StepSplit( {} );
          CurSplit.StartTime = time;
          CurSplit.StartBeat = beat;
          HeaderData = 0;
          inblock = true;
        }
        var command = lines[i].replace(":","").split('=');  
        switch(command[0])  {
          case "Format"   :   UCSData.Format = parseInt(command[1]);break;
          case "Mode"     :   UCSData.Mode   = command[1];break;
          case "BPM"      :   HeaderData++; CurSplit.BPM   = parseFloat(command[1].replace(",",".")); CurSplit.BPS = CurSplit.BPM/60.0; break;
          case "Delay"    :   HeaderData++; CurSplit.Delay = parseFloat(command[1].replace(",",".")) / 1000; break;
          case "Beat"     :   HeaderData++; break;  //  Ignore Beat
          case "Split"    :   HeaderData++; CurSplit.beatsplit = parseInt(command[1]); CurSplit.mysteryblock  = 1 / CurSplit.beatsplit; break;
          default         :   PrimeLog.l("UCS: Command not know: "+command[0]+" with value "+command[1]); break;
        }     
        if (HeaderData === 4) {
          var bpmchange = { "BPM" : CurSplit.BPM, "Start" : time };
          UCSData.AddBPMChange(bpmchange);
          UCSData.AddSplit(CurSplit);
          PrimeLog.d("UCS: Split header done! Adding Split.\n- BPM: "+CurSplit.BPM+"\n- Split: "+CurSplit.beatsplit);
          if (UCSData.currentbpm === 0) {
            UCSData.currentbpm = CurSplit.BPM;
            webprime.gameVariables.currentBPM = CurSplit.BPM;
          }
          time += CurSplit.Delay;
          beat += CurSplit.Delay * CurSplit.BPS;
        }
      }else{
        inblock = false;
        var note = lines[i].split(""),
            lennote = note.length,
            n = 0,
            row = new StepRow({"rowbeat" : beat, "rowtime" : time, "webprime": webprime}),
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