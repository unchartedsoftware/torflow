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
        if (Object.keys(this._active).length + this._available.length < this._count) {
            this._available.push(particle);
            this._onParticlesAvailable(this._available.length);
        }
    },
    count : function(count) {
        if (count!==undefined) {
            if (count > this._count) {
                for (var i = this._count; i < count; i++) {
                    this._available.push(this._getParticleFn());
                }
                this._onParticlesAvailable(this._available.length);

            }
            this._count = count;
        } else {
            return this._count;
        }
    },
    addParticle : function(source,destination,color) {
        var particle = this._available.pop();

        particle
            .source(source)
            .destination(destination)
            .tailColor(color||null)
            .onDeath(this._onParticleDied.bind(this))
            .start();
        this._active[particle.id()] = particle;
        return this;
    },
    destroy : function() {
        this._available.forEach(function(inactiveParticle) {
            inactiveParticle.destroy();
        });
        var self = this;
        Object.keys(this._active).forEach(function(particleId) {
            var activeParticle = self._active[particleId];
            activeParticle.destroy();
        });
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