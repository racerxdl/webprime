/**
 *  @preserve
 *  __        __   _     ____       _     
 *  \ \      / /__| |__ |  _ \ _ __(_)_ __ ___   ___ 
 *   \ \ /\ / / _ \ '_ \| |_) | '__| | '_ ` _ \ / _ \
 *    \ V  V /  __/ |_) |  __/| |  | | | | | | |  __/
 *     \_/\_/ \___|_.__/|_|   |_|  |_|_| |_| |_|\___| 
 *                                                                                      
 *  Pump It Up: Prime Web Version
 *  Copyright (C) 2014  HUEBR's Team
 *  
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *  
 */

 /** @define {boolean} */ var DebugMode = true;

/**
 *  This is the Main Loader. It will loader any needed scripts and trigger a Run(params) that should be declared on main.js
 *  @constructor
 */
 var Loader = function(params) {
    var loader = this;
    this.debug = DebugMode || false;

    //  Script Holder
    //  This only does the script load count, so we can keep track of scripts that is already loaded.
    this.scriptholder = {
        "size"      :   0,
        "loaded"    :   0,
        "ok"        :   false,
        "callback"  :   function() {
            this["ok"] = this["size"] == this["loaded"];
            if(loader.cssholder["ok"] && loader.scriptholder["ok"]) {
                if(window["Run"] !== undefined)
                    window["Run"](params);
                else if(params["debug"])   
                    this.error("PANIC! No RUN function!!!");
            }
        }
    };

    //  CSS Holder
    //  Same as Script Holder, but for CSS
    this.cssholder = {
        "size"      :   0,
        "loaded"    :   0,
        "ok"        :   false,
        "callback"  :   this.scriptholder["callback"]
    };

    //  Load Scripts
    if(params.hasOwnProperty("scripts"))    {
        this.scriptholder.size = params["scripts"].length;
        for(var i in params["scripts"]) {
            this.log("Loading "+params["scripts"][i]);
            this.LoadJS(params["scripts"][i]);
        }
    }

    //  Load CSS
    if(params.hasOwnProperty("css"))    {
        this.cssholder.size = params["css"].length;
        for(var i in params["css"]) {
            this.log("Loading "+params["css"][i]);
            this.LoadCSS(params["css"][i]);
        }
    }
}

/**
 *  Loads an Javascript File
 *  @param {string}
 */
 Loader.prototype.LoadJS =   function(filename)   {

    var loader = this;
    var fileref=document.createElement('script')
    fileref.setAttribute("type","text/javascript")
    fileref.onload = function() {
        loader.scriptholder["loaded"] += 1;
        loader.scriptholder["callback"]();
    }
    fileref.setAttribute("src", filename)
    document.getElementsByTagName("head")[0].appendChild(fileref);
}

/**
 *  Loads an CSS File
 *  @param {string}
 */
 Loader.prototype.LoadCSS    =   function(filename)   {

    var loader = this;
    var fileref=document.createElement("link")
    fileref.setAttribute("rel", "stylesheet")
    fileref.setAttribute("type", "text/css")

    fileref.setAttribute("src", filename);

    //  This is a nasty hack, we dont have onload method for link tag, so we load as an image.
    //  It will obviously crash, but when it gets onerror, it means the file is loaded.
    var img = document.createElement('img');
    img.onerror = function(){
        loader.cssholder["loaded"] += 1;
        loader.cssholder["callback"]();
    }
    img.src = filename;
    document.getElementsByTagName("head")[0].appendChild(fileref);
}

/**
 *  Displays an error message at console, if debug is enabled.
 *  @param {string}
 */
 Loader.prototype.error  =   function(message)   {

    if(this.debug)  {
        if(console.error !== undefined)
            console.error("WebPrime Loader: "+message);
        else
            console.log("WebPrime Loader: "+message);
    }
}

/**
 *  Displays an log message at console, if debug is enabled. 
 *  @param {string}
 */
 Loader.prototype.log  =   function(message)   {

    if(this.debug)
        console.log("WebPrime Loader: "+message);
}

new Loader(params);