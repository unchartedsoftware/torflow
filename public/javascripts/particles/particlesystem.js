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

var Config = require('../config');

var ParticleSystem = function() {
    this._nodes = [];
    this._pairs = [];
};

ParticleSystem.prototype = _.extend(ParticleSystem.prototype,{

    _getProbabilisticNodeIndex : function( nodes ) {
        var rnd = Math.random();
        var i = 0;
        while (i < this._nodes.length && rnd > this._nodes[i].bandwidth) {
            rnd -= this._nodes[i].bandwidth;
            i++;
        }
        return Math.min(i,this._nodes.length-1);
    },

    _getProbabilisticPair: function() {
        var MAX_TRIES = 500;
        var tries = 0;
        // TODO: return a source/dest pair from nodes based on bandwidth probability
        var source = this._getProbabilisticNodeIndex();
        var dest = this._getProbabilisticNodeIndex();
        while (source === dest) {
            dest = this._getProbabilisticNodeIndex();
            tries++;
            if (tries === MAX_TRIES) {
                throw 'Cannot find destination. Something is wrong with the probaility bandwidths on your nodes!';
            }
        }
        return {
            source : this._nodes[source],
            dest : this._nodes[dest]
        };
    },

    getProbabilisticPairs: function(count) {
        if ( !this._dirty ) {
            return this._pairs;
        }
        this._pairs = [];
        var i;
        count = count || Config.particle_count;
        for ( i=0; i<count; i++ ) {
            this._pairs.push( this._getProbabilisticPair() );
        }
        this._dirty = false;
        return this._pairs;
    },

    updateNodes: function(nodes) {
        if (this._nodes !== nodes) {
            this._nodes = nodes;
            this._dirty = true;
        }
    }

});

module.exports = ParticleSystem;
