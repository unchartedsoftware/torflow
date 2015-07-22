/**
* Copyright © 2015 Uncharted Software Inc.
*
* Property of Uncharted™, formerly Oculus Info Inc.
* http://uncharted.software/
*
* Released under the MIT License.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is furnished to do
* so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

var UUID = require('../util/uuid');
var DeepClone = require('../util/deepclone');
var Particle = function() {
    this._requestAnimationFrame = window.requestAnimationFrame;     // TODO:  make this work for other browsers
    this._cancelAnimationFrame = window.cancelAnimationFrame;
    this._uuid = UUID.generate();
    this._init();
};

Particle.prototype = _.extend(Particle.prototype,{
    _init : function() {
        this._source = null;
        this._destination = null;
        this._tailColor = null;
        this._duration = null;
        this._milliseconds = null;
        this._lastUpdate = null;
        this._scale = 1.0;
        this._position = null;
        this._onDeath = null;
        this._rafID = null;
    },
    id : function() { return this._uuid; },
    source : function(source) {
        if (source!==undefined) {
            this._source = DeepClone(source);
            this._position = DeepClone(source);
            return this;
        } else {
            return this._source;
        }
    },
    destination : function(destination) {
        if (destination!==undefined) {
            this._destination = DeepClone(destination);
            return this;
        } else {
            return this._destination;
        }
    },
    duration : function(duration) {
        if (duration!==undefined) {
            this._duration = duration;
            this._milliseconds = duration;
            return this;
        } else {
            return this._duration;
        }
    },
    tailColor : function(tailColor) {
        if (tailColor!==undefined) {
            this._tailColor = tailColor;
            return this;
        } else {
            return this._tailColor;
        }
    },
    position : function(position) {
        if (position!==undefined) {
            this._position = position;
            return this;
        } else {
            return this._position;
        }
    },
    _killOnNextTick : function() {
        this._milliseconds = 0;
    },
    start : function() {
        this._rafID = this._requestAnimationFrame.call(window,this._tick.bind(this));
    },
    destroy : function() {
        if (this._rafID) {
            this._cancelAnimationFrame.call(window,this._rafID);
        }
    },
    reset : function() {
        this._init();
    },
    _updatePosition : function(alpha) {
        this._position.x = this._source.x + (this._destination.x - this._source.x) * alpha;
        this._position.y = this._source.y + (this._destination.y - this._source.y) * alpha;
    },
    _tick : function(timestamp) {
        var deltaMillis = this._lastUpdate ? timestamp - this._lastUpdate: 0;

        deltaMillis *= this._scale;

        this._milliseconds -= deltaMillis;
        this._milliseconds = Math.max(this._milliseconds,0);

        this._updatePosition((this._duration - this._milliseconds)/this._duration);



        this._lastUpdate = timestamp;
        if (this._milliseconds > 0) {
            if (this._postTick) {
                this._postTick();
            }
            this._rafID = this._requestAnimationFrame.call(window, this._tick.bind(this));
        } else {
            this._cancelAnimationFrame.call(window,this._rafID);
            if (this._onDeath) {
                //console.log('\tParticle ' + this._uuid + ' died');
                this._onDeath(this);
            }
        }
    },
    onDeath : function(callback) {
        this._onDeath = callback;
        return this;
    }
});

module.exports = Particle;