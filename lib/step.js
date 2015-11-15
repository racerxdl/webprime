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

  var StepData = function(parameters) {   
    this.currentbpm   = parameters.bpm   || 0;
    
    this.CurrentTime = 0;            //  In milesseconds
    this.CurrentBeat = 0;
    this.LastMusic = 0;
    this.CurrentSplit = 0;
    this.CurrentMysteryBlock = 0;
    this.Splits = [];                //  StepSplit
    
    this.CachedDisplayedBeat = [];   //  Display Beat Cache  
    
    this.BPMChanges = [];            //  {  "BPM"       : BPM,          "Start" : StartInMS }    
    this.ScrollFactorChanges = [];   //  {  "SF"        : ScrolLFactor, "Start" : StartInMS }
    this.Stops = [];                 //  {  "StopTime"  : Freeze,       "Start" : StartInMS }
    this.Warps = [];                 //  {  "WarpBeat"  : WarpBeat,     "Start" : StartInMS }
    this.MysteryBlocks = [];         //  {  "Beat"    :beat,            "Ratio":mysteryblock, "BeatSplit" : beatsplit   }
    this.CurrentStop = 0;
    this.CurrentBPMChange = 0; 
    this.CurrentScrollFactorChange = 0;  
    this.CurrentWarp = 0;
      
    this.NoteSkinBank = { "0" : 0 };
    this.Modifiers  =   [];
    this.Stopped = false;
    this.StopUntil = 0;

    this.webprime = parameters.webprime;
  };

  StepData.prototype.AddSplit      = function(timesplit)   {   this.Splits.push(timesplit);        };

  StepData.prototype.AddBPMChange  = function(bpmchange)   {   
    if (this.BPMChanges.length === 0 || (this.BPMChanges.length > 0 && this.BPMChanges[this.BPMChanges.length-1].BPM !== bpmchange.BPM) )    
      this.BPMChanges.push(bpmchange);    
    else
      PrimeLog.d("Not adding BPM "+bpmchange.BPM+" because "+ ( (this.BPMChanges.length > 0)?(" the older is "+this.BPMChanges[this.BPMChanges.length-1].BPM):"Oh wait, we have a problem!"));
  };

  StepData.prototype.AddScrollFactorChanges  = function(sf)   {   
    if (this.ScrollFactorChanges.length === 0 || (this.ScrollFactorChanges.length > 0 && this.ScrollFactorChanges[this.ScrollFactorChanges.length-1].SF !== sf.SF) )    
      this.ScrollFactorChanges.push(sf);    
    else
      PrimeLog.d("Not adding ScrollFactor "+sf.SF+" because "+ ( (this.ScrollFactorChanges.length > 0)?(" the older is "+this.ScrollFactorChanges[this.ScrollFactorChanges.length-1].SF):"Oh wait, we have a problem!"));  
  };

  StepData.prototype.RemoveLastBPMChange = function()  {
    this.BPMChanges.splice(this.BPMChanges.length-1,1);
  };

  StepData.prototype.AddStop = function(stop)  {
    this.Stops.push(stop);
  };

  StepData.prototype.AddMysteryBlock = function(mb)  {
    this.MysteryBlocks.push(mb);
  };

  StepData.prototype.AddWarp = function(Warp)  {
    this.Warps.push(Warp);
  };

  StepData.prototype.AddModifier = function(mod) {
    this.Modifiers.push(mod);
  };

  StepData.prototype.GenerateCacheData = function()  {
    PrimeLog.l("StepData::Generating CacheData");

    var displayedBeat = 0;
    var lastRealBeat = 0;
    var lastRatio = 1;
    var lastBeatSplit = 1;
    this.CachedDisplayedBeat = [];

    for ( var i = 0; i < this.MysteryBlocks.length; i++ ) {
      var seg = this.MysteryBlocks[i];
      displayedBeat += ( seg.Beat - lastRealBeat ) * lastRatio * lastBeatSplit;
      lastRealBeat = seg.Beat;
      lastRatio = seg.Ratio;
      lastBeatSplit = seg.BeatSplit;
      var c = {"Beat":seg.Beat, "DisplayedBeat": displayedBeat, "Ratio" : seg.Ratio, "BeatSplit" : seg.BeatSplit};
      this.CachedDisplayedBeat.push(c);
    }

    PrimeLog.l("StepData::Finding Hold Ranges");

    var Holds = [{},{},{},{},{},{},{},{},{},{}];

    for (var s=0;s<this.Splits.length;s++)  {
      var rows = this.Splits[s].blocks[this.Splits[s].activeblock].rows;
      for ( var r=0;r<rows.length;r++) {
        for ( var n=0;n<rows[r].notes.length;n++)   {
          var note = rows[r].notes[n];
          if (note.type == PrimeConst.NoteHoldHead || note.type == PrimeConst.NoteHoldHeadFake)     {   //  Get the hold start
            if (Holds[n].beatend === undefined)  {
              PrimeLog.d("StepData::Finding Hold Ranges () : Ops! Cannot find Hold end! :(");
              Holds[n].beatend = rows[r].rowbeat;
            }
            Holds[n] = note;
          } else if (note.type == PrimeConst.NoteHoldTail || note.type == PrimeConst.NoteHoldTailFake || note.type == PrimeConst.NoteHoldBody || note.type == PrimeConst.NoteHoldBodyFake)   //  Set the hold end
            Holds[n].beatend = rows[r].rowbeat;
        }
      }
    }
  };

  StepData.prototype.GetDisplayBeat = function(beat)   {
    var data = this.CachedDisplayedBeat;
    var max = data.length -1;
    var l = 0, r = max, m;
    while( l <= r ) {
      m = (( l + r ) / 2) >> 0;
      if ( ( m === 0 || data[m].Beat <= beat ) && ( m === max || beat < data[m + 1].Beat ) ) 
        return data[m].DisplayedBeat + data[m].Ratio * (beat - data[m].Beat) * data[m].BeatSplit;
      else if ( data[m].Beat <= beat )
        l = m + 1;
      else
        r = m - 1;
    }
    return beat;
  };

  StepData.prototype.GetCutDelta = function()    {
      return (PrimeConst.StepCutTime/1000) * this.currentbpm;    
  };

  StepData.prototype.GetCutDelta2 = function()    {
      return (PrimeConst.StepCutTime/2000) * this.currentbpm;    
  };

  StepData.prototype.BeatInCutZone = function(beat, row)    {
      var InCutZone = (this.CurrentBeat - this.GetCutDelta()) <= beat && (this.CurrentBeat) >= beat;     
      if (beat < (this.CurrentBeat - this.GetCutDelta()) && row !== undefined)
          row.passed = true;
      return InCutZone;
  };

  StepData.prototype.GetBeatY = function(beat)        {
    var YOffset = 0;
    YOffset = this.webprime.gameVariables.noteData.GetDisplayBeat(beat) - this.webprime.gameVariables.noteData.GetDisplayBeat(this.CurrentBeat);
    //YOffset = (YOffset < 0)?0:YOffset;
    YOffset *= this.webprime.gameVariables.scrollSpeed;
    YOffset *= this.webprime.gameVariables.currentScrollFactor;
    YOffset *= this.webprime.gameVariables.arrowSize;
    YOffset += this.webprime.gameVariables.offsetY + PrimeConst.StepOffsetY+1;
    return YOffset;
  };

  StepData.prototype.Update = function(MusicTime)   {
    var i=this.CurrentBPMChange, len=this.BPMChanges.length,
        delta = (MusicTime - this.LastMusic);
        
    this.CurrentTime  += delta;
    this.LastMusic  = MusicTime;
    
    if (!this.Stopped || ( this.Stopped && this.StopUntil < this.CurrentTime) )    {
      this.CurrentBeat += (delta * this.currentbpm) / 60;
      this.Stopped = false;
    }

    //  Changing BPM
    while(i<len)    {
      if (this.BPMChanges[i].Start > this.CurrentTime)
        break;  //  We dont have
      if (this.BPMChanges[i].Start <= this.CurrentTime)    {
        this.currentbpm = this.BPMChanges[i].BPM;
        this.CurrentBPMChange = i+1;
        this.webprime.gameVariables.currentBPM = this.BPMChanges[i].BPM;
        PrimeLog.l("Changing BPM to "+this.currentbpm);
        break;
      }
      ++i;
    }
    
    //  Changing ScrollFactor
    i=this.CurrentScrollFactorChange; 
    len=this.ScrollFactorChanges.length;
    while(i<len)    {
      //if (this.ScrollFactorChanges[i].StartBeat > this.CurrentBeat)
      if (this.ScrollFactorChanges[i].Start > this.CurrentTime)
        break;  //  We dont have
      //if (this.ScrollFactorChanges[i].StartBeat <= this.CurrentBeat)    {
      if (this.ScrollFactorChanges[i].Start <= this.CurrentTime)    {
        this.currentscrollfactor = this.ScrollFactorChanges[i].SF;
        this.CurrentScrollFactorChange = i+1;
        if (!this.ScrollFactorChanges[i].Smooth) {
          this.webprime.gameVariables.currentScrollFactor = this.ScrollFactorChanges[i].SF;
          PrimeLog.l("Changing CurrentScrollFactor to "+this.currentscrollfactor);
          this.webprime.gameVariables.smoothScrollFactor = false;
        }else{
          if (this.ScrollFactorChanges[i].DeltaT > 0)  {
            PrimeLog.l("Smooth ScrollFactor Change from "+this.webprime.gameVariables.currentScrollFactor+" to "+this.currentscrollfactor+" in "+this.ScrollFactorChanges[i].DeltaT);
            this.webprime.gameVariables.smoothScrollFactor = true;
            this.webprime.gameVariables.scrollFactorFactor = (this.currentscrollfactor - this.webprime.gameVariables.currentScrollFactor) / this.ScrollFactorChanges[i].DeltaT; // Delta Factor / Delta Time
            this.webprime.gameVariables.scrollFactorMinus = this.currentscrollfactor < this.webprime.gameVariables.currentScrollFactor;
            this.webprime.gameVariables.nextScrollFactor = this.currentscrollfactor;
            this.webprime.gameVariables.baseScrollFactor = this.webprime.gameVariables.currentScrollFactor;
          }else{
            this.webprime.gameVariables.currentScrollFactor = this.currentscrollfactor;
          }
        }
        break;
      }
      ++i;
    }

    //  Smoothing Scrollfactor
    if (this.webprime.gameVariables.smoothScrollFactor)   {
      this.webprime.gameVariables.currentScrollFactor += this.webprime.gameVariables.scrollFactorFactor * delta;
      if ( (!this.webprime.gameVariables.scrollFactorMinus && (this.webprime.gameVariables.currentScrollFactor > this.webprime.gameVariables.nextScrollFactor) ) || (this.webprime.gameVariables.scrollFactorMinus && ( this.webprime.gameVariables.currentScrollFactor < this.webprime.gameVariables.nextScrollFactor ) ) )    {
        this.webprime.gameVariables.currentScrollFactor = this.webprime.gameVariables.nextScrollFactor;    
        this.webprime.gameVariables.smoothScrollFactor = false;
      }
    }
    
    //  Doing stops
    i=this.CurrentStop; 
    len=this.Stops.length;
    while(i<len)    {
      if (this.Stops[i].Start > this.CurrentTime)
        break;    
      if (this.Stops[i].Start <= this.CurrentTime)    {
        this.Stopped = true;
        this.CurrentStop = i+1;
        this.StopUntil = this.Stops[i].StopUntil;  
        PrimeLog.l("Stopping "+this.Stops[i].StopTime+" seconds. ("+this.CurrentTime+") ("+this.StopUntil+")");
      }     
      ++i;
    }
    
    //  Doing Warps
    i=this.CurrentWarp; 
    len=this.Warps.length;
    while(i<len)    {
      if (this.Warps[i].Start > this.CurrentTime +0.01)
        break;    
      if (this.Warps[i].Start <= this.CurrentTime +0.01)    {
        PrimeLog.l("Warping from beat "+this.CurrentBeat+" to "+this.Warps[i].WarpBeat+" - Time: "+this.CurrentTime+" WarpTime: "+this.Warps[i].WarpTime);
        this.CurrentBeat = this.Warps[i].WarpBeat;
        this.CurrentWarp = i+1;
      }     
      ++i;
    }
  };

  StepData.prototype.GetBeatBlock = function(screenheight)    {
    var i=this.CurrentSplit,len=this.Splits.length,
    block = [],
    starty = this.webprime.gameVariables.offsetY - this.webprime.gameVariables.arrowSize,
    endy = screenheight;
    var breakmaster = false; 
    while(i<len)    {                                               //  Iterate over splits
      var currblock = this.Splits[i].activeblock, 
          nlen=this.Splits[i].blocks[currblock].rows.length,
          n =0;
      while(n<nlen)   {                                             //  Iterate over rows
        var row = this.Splits[i].blocks[currblock].rows[n];
        row.UpdateY(this.CurrentBeat);
        this.BeatInCutZone(row.rowbeat, row);
        if (row.y >= starty && row.y < screenheight && !row.passed && row.rowbeat > (this.CurrentBeat - this.GetCutDelta())) 
          block.push(row);
        else if (row.y > screenheight)   {
          breakmaster = true;
          break;
        }
        ++n;
      }
      if (breakmaster)
        break;
      ++i;
    }
    return block;
  };

  window.StepData = StepData;

  /************************* StepSplit **************************/
  var StepSplit  = function (parameters)   {
    this.blocks         =   parameters.blocks       ||  [new StepBlock({})];
    this.activeblock    =   parameters.activeblock  ||  0;
    this.beatsplit      =   parameters.beatsplit    ||  0;
    this.mysteryblock   =   (parameters.mysteryblock!==undefined)? parameters.mysteryblock : 1;
    
    this.StartTime      =   parameters.starttime    ||  0;
    this.StartBeat      =   parameters.startbeat    ||  0;
    this.BPM            =   parameters.bpm          ||  0;
    this.BPS            =   parameters.bpm / 60;
    this.Delay          =   parameters.delay        ||  0;
    this.EndTime        =   9999999999;
    this.LastBeat       =   9999999999;
    this.MBStart        =   0;
  };

  StepSplit.prototype.ComputeSplitSize = function()    {
    this.TimeDuration = this.EndTime - this.StartTime;
    this.BeatDuration = this.LastBeat - this.StartBeat;
  };

  StepSplit.prototype.AddBlock = function(block)       {   this.blocks.push(block);          };

  StepSplit.prototype.AddRow  = function(block,row)    {   
    row.mysteryblock    =   this.mysteryblock;
    row.beatsplit       =   this.beatsplit;
    row.mbstart         =   this.mbstart;
    row.splitstart      =   this.StartBeat;
    row.currsplit       =   this;
    row.lastsplit       =   this.LastSplit;
    this.blocks[block].AddRow(row);   
  }; 

  window.StepSplit = StepSplit;

  /************************* StepBlock **************************/
  var StepBlock = function (parameters)    {
    this.rows = parameters.rows || [];      //  StepRow
  };

  StepBlock.prototype.AddRow = function (row)  {   this.rows.push(row); };

  window.StepBlock = StepBlock;

  /************************* StepRow **************************/
  var StepRow  = function (parameters) {
    this.rowbeat        =   parameters.rowbeat || 0;
    this.rowtime        =   parameters.rowtime || 0;
    this.notes          =   parameters.notes   || [];    //  PUMPER.StepNote
    this.mbbeat         =   parameters.mbbeat  || 0;
    this.mysteryblock   =   (parameters.mysteryblock!==undefined)? parameters.mysteryblock : 1; 
    this.lastmboffset   =   0;
    this.beatsplit      =   4; 
    this.passwd         =   false;
    this.webprime       =   parameters.webprime;
  };

  StepRow.prototype.RowOnBeatOrLess = function(beat)   {
      return this.rowbeat <= beat- (1/this.beatsplit) ;
  };

  StepRow.prototype.AddNote = function(note)     { this.notes.push(note); };

  StepRow.prototype.UpdateY = function(gamebeat) {
      //this.relativebeat = PUMPER.Globals.NoteData.GetDisplayBeat(this.rowbeat);
      this.y = this.webprime.gameVariables.noteData.GetBeatY(this.rowbeat);
  };

  window.StepRow = StepRow;

  /************************* StepNote **************************/
  var StepNote = function (parameters) {
      this.type       = parameters.type     || 0;
      this.attr       = parameters.attr     || 0;
      this.seed       = parameters.seed     || 0;
      this.attr2      = parameters.attr2    || 0;
      this.opacity    = (parameters.opacity!==undefined)?parameters.opacity: 1;
      this.rotation   = parameters.rotation || 0;
  };

  window.StepNote = StepNote;

}());