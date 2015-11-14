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

  /**********************************************************/
  /* This Sentinel is just used to keep away most people    */
  /* from downloading data from server and running offline. */
  /* But a skilled user can reverse this.                   */
  /**********************************************************/


  function serialize(obj) {
    var str = [];
    for (var p in obj)
       str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    return str.join("&");
  }

  var DummySentinel = function() {};
  DummySentinel.prototype.Update = function() {};
  DummySentinel.prototype.OK = function() {return true;};
  DummySentinel.prototype.InitSession = function() {};
  DummySentinel.prototype.GetHash = function() {};

  window.DummySentinel = DummySentinel;

  var Sentinel = function(disabled)    {
    this.isOk1 = false;         //  True is good
    this.isOk2 = true;          //  False is good
    this.isOk3 = -9123;         //  StoredSession.k is good. Magic! :P
    this.StoredSession = {"SID":(Math.random()*0xFFFFFF)>>0};
    this.SessionLoaded = false;
    this.tryes = 0;
    this.falsetryes = 0;
    this.HashTime = 0;
    this.HashLastTime = 0;
    this.disabled = disabled;
  };

  Sentinel.prototype.OK           =    function()  {
    return (this.isOk1 && !this.isOk2 && this.isOk3 == this.StoredSession.k) || !this.disabled;
  };

  Sentinel.prototype.Update        =   function() {
    if (!this.disabled) {
      var timeDelta = Date.now() - this.HashLastTime;
      this.HashLastTime = Date.now();
      this.HashTime += timeDelta;
      if (this.HashTime >= 1000)   {
        this.HashTime = 0;
        this.GetHash();
      }
    }
  };

  Sentinel.prototype.InitSession   =   function()  {
    if (!this.disabled) {
      var SessionRequest = new XMLHttpRequest();
      var req = serialize({"a":"gs"});
      SessionRequest.open('GET', 'api.php?'+req, true);
      //SessionRequest.responseType = 'json';
      SessionRequest.responseType = 'text';
      SessionRequest.Sentinel = this;
      SessionRequest.onload = function(e)    {
        //this.Sentinel.StoredSession = JSON.parse(this.response);
        this.Sentinel.StoredSession = JSON.parse(this.response);
        this.Sentinel.SessionLoaded = true;
        this.Sentinel.isOk3 = this.Sentinel.StoredSession.k;
        this.Sentinel.GetHash();
      };
      SessionRequest.send();
    }
  };

  Sentinel.prototype.GetHash       =   function()  {
    if (!this.disabled) {
      if (this.StoredSession !== undefined)    {
        //  For now, just a random number from client to server compute.
        var dataToSend = {"h":(Math.random()*10000000)>>0, "a":"gh"};
        
        var HashRequest = new XMLHttpRequest();
        HashRequest.open('POST', 'api.php', true);
        HashRequest.responseType = 'arraybuffer';
        HashRequest.Sentinel = this;
        HashRequest.dataToSend = dataToSend;
        HashRequest.onload = function(e) {
          var data = new Uint8Array(this.response); 
          var str  = "";
          for (var i=0;i<data.length;i++)    {
            data[i] = data[i] ^ (this.dataToSend.h & (i*13));
            str += String.fromCharCode(data[i]);
          }
          if (this.Sentinel.StoredSession.SID != str)    {
            //BREAK
            this.Sentinel.isOk1 = false;
            this.Sentinel.isOk3 = this.Sentinel.StoredSession.k -1234;
            this.Sentinel.StoredSession = undefined;
            return;
          }else{
            this.Sentinel.isOk1 = true;
            this.Sentinel.isOk2 = false;
            this.Sentinel.isOk3 = this.Sentinel.StoredSession.k;
          }
          this.tryes = 0;
          
        };

        HashRequest.onerror = function()    {
          if (this.Sentinel.tryes == 5)    {   //  Maximum tryes
            this.Sentinel.isOk2 = true;
            this.Sentinel.isOk3 = 9999 + this.Sentinel.StoredSession.k;
          }else{
            this.Sentinel.GetHash();
            this.Sentinel.tryes += 1;
          }
        };

        dataToSend = serialize(dataToSend);
        HashRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        HashRequest.send(dataToSend);
      }
    }
  };

  window.Sentinel = Sentinel;

}());