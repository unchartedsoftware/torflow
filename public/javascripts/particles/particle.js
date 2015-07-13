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
        this._color = null;
        this._duration = null;
        this._milliseconds = null;
        this._lastUpdate = null;
        this._scale = 1.0;
        this._position = null;
        this._onDeath = null;
        this._rafId = null;
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
    color : function(color) {
        if (color!==undefined) {
            this._color = color;
            return this;
        } else {
            return this._color;
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
    getColor : function() {
        return this._color;
    },
    start : function() {
        this._rafID = this._requestAnimationFrame.call(window,this._tick.bind(this));
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
            this._rafId = this._requestAnimationFrame.call(window, this._tick.bind(this));
        } else {
            this._cancelAnimationFrame.call(window,this._rafId);
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