var MapParticle = require('./mapparticle');
var ParticleSystem = require('./particlesystem');
var Lerp = require('../util/lerp');

var MapParticleSimulation = function(nodes,count,map) {
    this._nodes = nodes;
    this._count = count;
    this._requestAnimationFrame = window.requestAnimationFrame;     // TODO:  make this work for other browsers
    this._cancelAnimationFrame = window.cancelAnimationFrame;
    this._particleSystem = new ParticleSystem(count,function() {
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
        this._cancelAnimationFrame(this._redrawRAFId);
        return this;
    },
    _addParticle : function() {
        var pair = this._getProbabilisticSourceDestPair();
        //console.log('Adding particle from ' + pair.source.circle.id + ' to ' + pair.destination.circle.id);
        this._particleSystem.addParticle(pair.source,pair.destination,'rbga(0,0,255,0.8',Lerp(750,1500,Math.random()));
    },
    _getProbabilisticSourceDestPair : function() {
        // todo: return a source/dest pair from nodes based on bandwidth probability
        this._nodes = _.shuffle(this._nodes);
        return {
            source : this._nodes[0],
            destination : this._nodes[1]
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
    }
});

module.exports = MapParticleSimulation;