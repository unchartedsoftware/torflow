var Particle = require('./particle');

var ParticleSystem = function(count,GetParticle) {
    this._count = count;
    this._available = [];
    this._active = {};
    this._getParticleFn = GetParticle || function() { return new Particle(); };

    this._init();
};

ParticleSystem.prototype = _.extend(ParticleSystem.prototype, {
    _init : function() {
        for (var i = 0; i < this._count; i++) {
            this._available.push(this._getParticleFn());
        }
    },
    _onParticleDied : function(particle) {
        // Release it into the wild and notify listeners
        particle.reset();
        delete this._active[particle.id()];
        this._available.push(particle);
        this._onParticlesAvailable(this._available.length);
    },
    addParticle : function(source,destination,color,duration) {
        var particle = this._available.pop();

        particle
            .source(source)
            .destination(destination)
            .color(color)
            .duration(duration)
            .onDeath(this._onParticleDied.bind(this))
            .start();
        this._active[particle.id()] = particle;
        return this;
    },
    onParticlesAvailable : function(callback) {
        this._onParticlesAvailable = callback;
        return this;
    },
    positions : function() {
        var self = this;
        return Object.keys(this._active).map(function(particleId) {
            return self._active[particleId].position();
        });
    }
});

module.exports = ParticleSystem;