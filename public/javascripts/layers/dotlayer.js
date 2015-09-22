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

    bufferPositions : function(positions) {
        var self = this,
            points = new Float32Array( positions.length * 2 );
        positions.forEach( function( pos, index ) {
            var px = self._map.latLngToContainerPoint(pos.latLng);
            points[ index*2 ] = px.x;
            points[ index*2 + 1 ] = self._canvas.height - px.y;
        });
        if ( !this._renderable ) {
            this._createBuffers();
        }
        this._renderable.vertexBuffers[0].bufferData( points );
    },

    _createBuffers: function() {

        function createIndices( n ) {
            var indices = new Array( n ),
                i;
            for ( i=0; i<n; i++ ) {
                indices[i] = i;
            }
            return indices;
        }

        function createPositions( n ) {
            var positions = new Array( n ),
                i;
            for ( i=0; i<n; i++ ) {
                positions[i] = [ 0, 0 ];
            }
            return positions;
        }

        this._renderable = new esper.Renderable({
            positions: createPositions( Config.particle_count ),
            indices: createIndices( Config.particle_count ),
            options: {
                mode: 'POINTS'
            }
        });
    },

    draw: function() {
        if ( this._initialized && this._renderable && !this._hidden ) {
            var gl = this._gl;
            gl.clearColor( 0, 0, 0, 0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            this._viewport.push();
            this._shader.push();
            this._shader.setUniform( 'uProjectionMatrix', this._camera.projectionMatrix() );
            this._renderable.draw();
            this._shader.pop();
            this._viewport.pop();
        }
    }

});

module.exports = DotLayer;
