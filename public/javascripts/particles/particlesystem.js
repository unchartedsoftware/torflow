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