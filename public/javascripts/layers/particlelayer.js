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
var WebGLOverlay = require('./webgloverlay');
var LoadingBar = require('../util/loadingbar');

var ParticleLayer = WebGLOverlay.extend({

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
        // create filler array
        var filler = _.fill( new Array( Config.particle_count ), [ 0,0,0,0 ] );
        // create vertex buffer, this will be updated periodically
        this._vertexBuffer = new esper.VertexBuffer(
            new esper.VertexPackage([
                /**
                 * x: offsetX
                 * y: offsetY
                 * y: speed
                 * w: noise
                 */
                filler,
                /**
                 * x: offsetX
                 * y: offsetY
                 * y: speed
                 * w: noise
                 */
                filler ])
        );
        // execute callback
        done();
    },

    updateNodes: function(nodes) {
        // prepare loading bar
        if ( this._loadingBar ) {
            this._loadingBar.cancel();
        }
        this._loadingBar = new LoadingBar();
        var self = this;
        // flag as not ready to draw
        this._isReady = false;
        // create web worker to generate particles
        var worker = new Worker('javascripts/particles/particlesystem.js');
        worker.addEventListener('message', function( e ) {
            switch ( e.data.type ) {
                case 'progress':
                    self._loadingBar.update( e.data.progress );
                    break;
                case 'complete':
                    self._vertexBuffer.bufferData( new Float32Array( e.data.buffer ) );
                    self._timestamp = Date.now();
                    self._isReady = true; // flag as ready to draw
                    worker.terminate();
                    break;
            }
        });
        var offsetFactor = this._pathOffset !== undefined ? this._pathOffset : 1;
        // start the webworker
        worker.postMessage({
            type: 'start',
            particleConfig: {
                speed: Config.particle_base_speed_ms,
                variance: Config.particle_speed_variance_ms,
                offset: Config.particle_offset * offsetFactor,
                count: Config.particle_count
            },
            nodes: nodes,
            count: this._particleCount || Config.particle_count
        });
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

    setSpeed: function( speed ) {
        this._speed = speed;
    },

    getSpeed: function() {
        return this._speed !== undefined ? this._speed : 1.0;
    },

    setPathOffset: function( offset ) {
        this._pathOffset = offset;
    },

    getPathOffset: function() {
        return this._pathOffset !== undefined ? this._pathOffset : 1.0;
    },

    getParticleSize: function() {
        if ( Config.particle_zoom_scale ) {
            return Config.particle_zoom_scale( this._map.getZoom(), Config.particle_size );
        }
        return Config.particle_size;
    },

    clear: function() {
        var gl = this._gl;
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    },

    draw: function() {
        var gl = this._gl;
        this.clear();
        if ( this._isReady ) {
            this._viewport.push();
            this._shader.push();
            this._shader.setUniform( 'uProjectionMatrix', this._camera.projectionMatrix() );
            this._shader.setUniform( 'uTime', Date.now() - this._timestamp );
            this._shader.setUniform( 'uSpeedFactor', this.getSpeed() );
            this._shader.setUniform( 'uOffsetFactor', this.getPathOffset() );
            this._shader.setUniform( 'uPointSize', this.getParticleSize() );
            this._vertexBuffer.bind();
            gl.drawArrays( gl.POINTS, 0, this._particleCount || Config.particle_count );
            this._vertexBuffer.unbind();
            this._shader.pop();
            this._viewport.pop();
        }
    }

});

module.exports = ParticleLayer;
