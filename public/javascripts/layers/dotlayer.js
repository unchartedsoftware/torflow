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

var Config = require('../config.js');
var CanvasOverlay = require('./canvasoverlay');

var DotLayer = CanvasOverlay.extend({

    initShaders: function( done ) {
        this._shader = new esper.Shader({
            vert: '../../shaders/particle.vert',
            frag: '../../shaders/particle.frag'
        }, function() {
            done();
        });
    },

    initBuffers: function( done ) {

        function createIndices( n ) {
            var indices = new Array( n ),
                i;
            for ( i=0; i<n; i++ ) {
                indices[i] = i;
            }
            return indices;
        }

        /**
         * x: startX
         * y: startY
         * z: endX
         * w: endY
         */
        this._positions = _.fill( new Array( Config.particle_count ), [ 0,0,0,0 ] );

        /**
         * x: offsetX
         * y: offsetY
         * y: speed
         */
        this._offsets = _.fill( new Array( Config.particle_count ), [ 0,0,0 ] );

        // create vertex buffer, this will be updated periodically
        this._vertexBuffer = new esper.VertexBuffer(
            new esper.VertexPackage([
                this._positions,
                this._offsets ])
            );

        // create index buffer, this will never be changed
        this._indexBuffer = new esper.IndexBuffer( createIndices( Config.particle_count ), {
                mode: 'POINTS'
            });

        // execute callback
        done();
    },

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
        // todo: return a source/dest pair from nodes based on bandwidth probability
        var source = this._getProbabilisticNodeIndex();
        var dest = this._getProbabilisticNodeIndex();
        while (source === dest) {
            dest = this._getProbabilisticNodeIndex();
            tries++;
            if (tries === MAX_TRIES) {
                throw 'Cannot find destination.  Something is wrong with the probaility bandwidths on your nodes!';
            }
        }
        return {
            source : this._nodes[source],
            dest : this._nodes[dest]
        };
    },

    _getProbabilisticPairs: function(nodes) {
        var pairs = [],
            count = this._particleCount || Config.particle_count,
            i;
        for ( i=0; i<count; i++ ) {
            pairs.push( this._getProbabilisticPair() );
        }
        return pairs;
    },

    updateNodes: function(nodes) {
        if (this._nodes !== nodes) {
            this._nodes = nodes;
            this._updateBuffers();
        }
    },

    _updateBuffers : function() {
        var self = this,
            pairs = this._getProbabilisticPairs();
        pairs.forEach( function( pair, index ) {

            // var src = self._map.project( pair.source.latLng ),
            //     dst = self._map.project( pair.dest.latLng ),
            //     dim = Math.pow( 2, self._map.getZoom() ) * 256;
            //
            // self._positions[ index ] = [
            //     src.x,
            //     dim - src.y,
            //     dst.x,
            //     dim - dst.y ];

            self._positions[ index ] = [
                pair.source.latLng.lng,
                pair.source.latLng.lat,
                pair.dest.latLng.lng,
                pair.dest.latLng.lat ];

            self._offsets[ index ] = [
                -3 + Math.random()*6,
                -3 + Math.random()*6,
                1000 + Math.random()*4000 ];
        });
        var pack = new esper.VertexPackage([ this._positions, this._offsets ]);
        this._vertexBuffer.bufferData( pack.buffer() );
        this._timestamp = Date.now();
    },

    _updateParticleCounts: function() {
        var hiddenServicesCount = Math.floor(Config.hiddenServiceProbability * Config.particle_count);
        var generalCount = Config.particle_count - hiddenServicesCount;
        if (this._showTraffic === 'all') {
            this._particleCount = Config.particle_count;
        } else if (this._showTraffic === 'general') {
            this._particleCount = generalCount;
        } else {
            this._particleCount = hiddenServicesCount;
        }
        this._indexBuffer.count = this._particleCount;
    },

    showTraffic: function(state) {
        if (state!==undefined) {
            this._showTraffic = state;
            this._updateParticleCounts();
            return this;
        } else {
            return this._showTraffic;
        }
    },

    draw: function() {
        var gl = this._gl;
        gl.clearColor( 0, 0, 0, 0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        this._viewport.push();
        this._shader.push();
        this._shader.setUniform( 'uProjectionMatrix', this._camera.projectionMatrix() );
        this._shader.setUniform( 'uTime', Date.now() - this._timestamp );
        this._vertexBuffer.bind();
        this._indexBuffer.bind();
        this._indexBuffer.draw();
        this._indexBuffer.unbind();
        this._vertexBuffer.unbind();
        this._shader.pop();
        this._viewport.pop();
    }

});

module.exports = DotLayer;
