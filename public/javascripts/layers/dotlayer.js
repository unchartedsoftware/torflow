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
var ParticleSystem = require('../particles/particlesystem');

var DotLayer = CanvasOverlay.extend({

    initShaders: function( done ) {
        this._shader = new esper.Shader({
            vert: '../../shaders/particle.vert',
            frag: '../../shaders/particle.frag'
        }, function() {
            // execute callback
            done();
        });
    },

    initBuffers: function( done ) {
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
         * w: noise
         */
        this._offsets = _.fill( new Array( Config.particle_count ), [ 0,0,0,0 ] );
        // create vertex buffer, this will be updated periodically
        this._vertexBuffer = new esper.VertexBuffer(
            new esper.VertexPackage([ this._positions, this._offsets ])
        );
        // execute callback
        done();
    },

    updateNodes: function(nodes) {
        if ( !this._system ) {
            this._system = new ParticleSystem();
        }
        this._system.updateNodes(nodes);
        this._updateBuffers();
    },

    _updateBuffers : function() {
        var self = this,
            pairs = this._system.getProbabilisticPairs(this._particleCount);
        pairs.forEach( function( pair, index ) {

            var src = self._map.project( pair.source.latLng ),
                dst = self._map.project( pair.dest.latLng ),
                dim = Math.pow( 2, self._map.getZoom() ) * 256,
                start = {
                    x: src.x / dim,
                    y: ( dim - src.y ) / dim
                },
                end = {
                    x: dst.x / dim,
                    y: ( dim - dst.y ) / dim
                };

            self._positions[ index ] = [
                start.x,
                start.y,
                end.x,
                end.y ];

            var difference = new esper.Vec2( end ).sub( start ),
                dist = difference.length(),
                speed = Config.particle_base_speed_ms + Config.particle_speed_variance_ms * Math.random(),
                offset = Math.min( Config.particle_max_channel_width, dist * Config.particle_offset ),
                perp = new esper.Vec3( difference.x, difference.y, 0.0 ).cross([ 0, 0, 1.0 ]).normalize(),
                perpOffset = perp.mult( -offset/2 + Math.random() * offset );

            self._offsets[ index ] = [
                perpOffset.x,
                perpOffset.y,
                speed,
                Math.random() ];
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
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE );
        this._viewport.push();
        this._shader.push();
        this._shader.setUniform( 'uProjectionMatrix', this._camera.projectionMatrix() );
        this._shader.setUniform( 'uTime', Date.now() - this._timestamp );
        this._vertexBuffer.bind();
        gl.drawArrays( gl.POINTS, 0, this._particleCount || Config.particle_count );
        this._vertexBuffer.unbind();
        this._shader.pop();
        this._viewport.pop();
    }

});

module.exports = DotLayer;
