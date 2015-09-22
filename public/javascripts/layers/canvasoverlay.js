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

L.CanvasOverlay = L.Class.extend({

    initialize: function (options) {
        L.setOptions(this, options);
    },

    draw: function() {
        console.error('\'draw\' function for CanvasOverlay class must be implemented');
    },

    initShaders: function( done ) {
        console.error('\'initShaders\' function for CanvasOverlay class must be implemented');
    },

    initBuffers: function( done ) {
        console.error('\'initBuffers\' function for CanvasOverlay class must be implemented');
    },

    _initGL : function() {
        var self = this,
            shadersDone = $.Deferred(),
            buffersDone = $.Deferred();
        this._gl = esper.WebGLContext.get( this._canvas );
        this.initShaders( function() {
            shadersDone.resolve();
        });
        this.initBuffers( function() {
            buffersDone.resolve();
        });
        $.when( shadersDone, buffersDone ).then( function() {
            var width = self._canvas.width,
                height = self._canvas.height;
            self._viewport = new esper.Viewport({
                width: width,
                height: height
            });
            self._camera = new esper.Camera();
            self._updateProjection();
            self._initialized = true;
            self._draw();
        });
    },

    _initCanvas: function () {
        this._canvas = L.DomUtil.create('canvas', 'leaflet-webgl-layer leaflet-layer');
        var size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
    },

    onAdd: function (map) {
        this._map = map;
        if (!this._canvas) {
            this._initCanvas();
        }
        map._panes.overlayPane.appendChild(this._canvas);
        this._initGL();
        map.on('move', this._reset, this);
        map.on('resize',  this._resize, this);
        map.on('zoomstart', this.hide, this);
        map.on('zoomend', this._reset, this);
        map.on('zoomend', this.show, this);
        this._reset();
    },

    onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._canvas);
        map.off('move', this._reset, this);
        map.off('resize', this._resize, this);
        map.off('zoomstart', this.hide, this);
        map.off('zoomend', this._reset, this);
        map.off('zoomend', this.show, this);
        this._gl = null;
        this._canvas = null;
        this._viewport = null;
        this._camera = null;
        this._initialized = false;
    },

    show: function() {
        this._canvas.style.display = 'block';
        this._hidden = false;
    },

    hide: function() {
        this._canvas.style.display = 'none';
        this._hidden = true;
    },

    isHidden: function() {
        return this._hidden;
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    _updateProjection: function() {
        var bounds = this._map.getPixelBounds(),
            dim = Math.pow( 2, this._map.getZoom() ) * 256,
            ortho = esper.Mat44.ortho(
                bounds.min.x,
                bounds.max.x,
                dim - bounds.max.y,
                dim - bounds.min.y,
                -1, 1 );
        // var bounds = this._map.getBounds(),
        //     ortho = esper.Mat44.ortho(
        //         bounds.getWest(),
        //         bounds.getEast(),
        //         bounds.getSouth(),
        //         bounds.getNorth(),
        //         -1, 1 );
        if ( this._camera ) {
            this._camera.projectionMatrix( ortho );
        }
    },

    _resize: function (resizeEvent) {
        var width = resizeEvent.newSize.x,
            height = resizeEvent.newSize.y;
        if ( this._initialized ) {
            this._viewport.resize( width, height );
            this._updateProjection();
        }
    },

    _reset: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        this._updateProjection();
    },

    _draw: function () {
        if ( this._initialized ) {
            if ( !this._hidden ) {
                this.draw();
            }
            requestAnimationFrame( this._draw.bind( this ) );
        }
    }

});

module.exports = L.CanvasOverlay;
