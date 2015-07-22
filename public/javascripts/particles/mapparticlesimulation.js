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
        this._redrawRAFId = null;
        return this;
    },
    isStarted : function() {
        return this._redrawRAFId !== null;
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
        while (i < this._nodes.length && rnd > this._nodes[i].bandwidth) {
            rnd -= this._nodes[i].bandwidth;
            i++;
        }
        return Math.min(i,this._nodes.length-1);
    },
    _getProbabilisticSourceDestPair : function() {
        var maxTries = 500;
        var tries = 0;
        // todo: return a source/dest pair from nodes based on bandwidth probability
        var source = this._getProbabilisticNodeIndex();
        var dest = this._getProbabilisticNodeIndex();
        while (source === dest) {
            dest = this._getProbabilisticNodeIndex();
            tries++;
            if (tries === maxTries) {
                throw 'Cannot find destination.  Something is wrong with the probaility bandwidths on your nodes!';
            }
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