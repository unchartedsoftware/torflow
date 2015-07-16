var MapParticle = require('./mapparticle');
var ParticleSystem = require('./particlesystem');
var Config = require('../config');

var MapParticleSimulation = function(nodes,maxCount,map) {
    this._nodes = nodes.sort(function(n1,n2) { return n2.bandwidth - n1.bandwidth; });
    this._count = 0;
    this._maxCount = maxCount;
    this._requestAnimationFrame = window.requestAnimationFrame;     // TODO:  make this work for other browsers
    this._cancelAnimationFrame = window.cancelAnimationFrame;
    this._particleSystem = new ParticleSystem(this._count,function() {
        return new MapParticle(map);
    })
        .onParticlesAvailable(this._onParticlesAvailable.bind(this));

    this._redrawRAFId = null;
};

MapParticleSimulation.prototype = _.extend(MapParticleSimulation.prototype,{
    start : function() {
        for (var i = 0; i < this._count; i++) {
            this._addParticle();
        }
        this._redrawRAFId = this._requestAnimationFrame.call(window,this._notifyPositions.bind(this));
        return this;
    },
    stop : function() {
        this._cancelAnimationFrame.call(window,this._redrawRAFId);
        return this;
    },
    destroy : function() {
        this._particleSystem.destroy();
    },
    _getTailColor : function() {
        if (this._showTraffic === 'all') {
            return Math.random() > Config.hiddenServiceProbability ? Config.dot.tailFill : Config.dot.tailFillHidden;
        } else if (this._showTraffic === 'hidden') {
            return Config.dot.tailFillHidden;
        } else {
            return Config.dot.tailFill;
        }
    },
    _addParticle : function() {
        var pair = this._getProbabilisticSourceDestPair();
        //console.log('Adding particle from ' + pair.source.circle.id + ' to ' + pair.destination.circle.id);
        var tailColor = this._getTailColor();

        this._particleSystem.addParticle(pair.source,pair.destination,tailColor);
    },
    _getProbabilisticNodeIndex : function() {
        var rnd = Math.random();
        var i = 0;
        while (rnd > this._nodes[i].bandwidth && i < this._nodes.length) {
            rnd -= this._nodes[i].bandwidth;
            i++;
        }
        return i;
    },
    _getProbabilisticSourceDestPair : function() {
        // todo: return a source/dest pair from nodes based on bandwidth probability
        var source = this._getProbabilisticNodeIndex();
        var dest = this._getProbabilisticNodeIndex();
        while (source === dest) {
            dest = this._getProbabilisticNodeIndex();
        }
//        console.log('Spawning particle from ' + source + ' to ' + dest);
        return {
            source : this._nodes[source],
            destination : this._nodes[dest]
        };
    },
    _onParticlesAvailable : function(numDied) {
        for (var i = 0; i < numDied; i++) {
            this._addParticle();
        }
    },
    _notifyPositions : function() {
        var positions = this._particleSystem.positions();
        this._onPositionsAvailable(positions);
        this._redrawRAFId = this._requestAnimationFrame.call(window,this._notifyPositions.bind(this));
        return this;
    },
    onPositionsAvailable : function(callback) {
        this._onPositionsAvailable = callback;
        return this;
    },
    _updateParticleCounts : function() {
        var hiddenServicesCount = Math.floor(Config.hiddenServiceProbability * this._maxCount);
        var generalCount = this._maxCount - hiddenServicesCount;
        var newCount;
        if (this._showTraffic === 'all') {
            newCount = this._maxCount;
        } else if (this._showTraffic === 'general') {
            newCount = generalCount;
        } else {
            newCount = hiddenServicesCount;
        }
        if (this._particleSystem.count() !== newCount) {
            this._particleSystem.count(newCount);
        }
    },
    showTraffic : function(state) {
        if(state!==undefined) {
            this._showTraffic = state;
            this._updateParticleCounts();
            return this;
        } else {
            return this._showTraffic;
        }
    }
});

module.exports = MapParticleSimulation;