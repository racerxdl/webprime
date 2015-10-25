/**
__        __   _     ____       _     
\ \      / /__| |__ |  _ \ _ __(_)_ __ ___   ___ 
 \ \ /\ / / _ \ '_ \| |_) | '__| | '_ ` _ \ / _ \
  \ V  V /  __/ |_) |  __/| |  | | | | | | |  __/
   \_/\_/ \___|_.__/|_|   |_|  |_|_| |_| |_|\___| 
                                                                                    
Pump It Up: Prime Web Version
Copyright (C) 2014  HUEBR's Team

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

  var PrimeLog = {};
  PrimeLog.verbosity = 3; //  0 - Error, 1 - Warning, 2 - Info, 3 - Debug

  PrimeLog.debug = function() {
    if (PrimeLog.verbosity >= 3) {
      [].splice.call(arguments, 0, 0, "(WebPrime Debug)");
      if (console.debug)
        console.debug.apply(console, arguments);
      else
        console.log.apply(console, arguments);
    }
  };

  PrimeLog.error = function() {
    if (PrimeLog.verbosity >= 0) {
      [].splice.call(arguments, 0, 0, "(WebPrime Error)");
      if (console.error)
        console.error.apply(console, arguments);
      else
        console.log.apply(console, arguments);
    }
  };

  PrimeLog.warning = function() {
    if (PrimeLog.verbosity >= 1) {
      [].splice.call(arguments, 0, 0, "(WebPrime Warning)");
      console.log.apply(console, arguments);
    }
  };

  PrimeLog.info = function() {
    if (PrimeLog.verbosity >= 2) {
      [].splice.call(arguments, 0, 0, "(WebPrime Info)");
      if (console.info)
        console.info.apply(console, arguments);
      else
        console.log.apply(console, arguments);
    }
  };

  PrimeLog.d = PrimeLog.debug;
  PrimeLog.e = PrimeLog.error;
  PrimeLog.w = PrimeLog.warning;
  PrimeLog.i = PrimeLog.info;
  PrimeLog.l = PrimeLog.info;
  PrimeLog.log = PrimeLog.info;

  window.PrimeLog = PrimeLog;

}());