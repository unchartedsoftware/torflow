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

    canvas: function() {
        return this._canvas;
    },

    _initGL : function() {
        console.log('init gl');
        var self = this,
            canvas = this._canvas;
        this._gl = esper.WebGLContext.get( this._canvas );
        this._shader = new esper.Shader({
            vert: '../../shaders/point.vert',
            frag: '../../shaders/point.frag'
        }, function() {
            if ( !self._canvas || self._canvas !== canvas ) {
                // layer has been detached since last add.
                return;
            }
            var width = self._canvas.width,
                height = self._canvas.height;
            self._viewport = new esper.Viewport({
                width: width,
                height: height
            });
            self._camera = new esper.Camera({
                projection: esper.Mat44.ortho( 0, width, 0, height, -1, 1 )
            });
            self._initialized = true;
            self._redraw();
        });
    },

    _initCanvas: function () {
        console.log('init canvas');
        var canvas = this._canvas = L.DomUtil.create('canvas', 'leaflet-webgl-layer leaflet-layer');
        var size = this._map.getSize();
        canvas.width  = size.x;
        canvas.height = size.y;
        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
    },

    onAdd: function (map) {

        console.log('adding to map');
        this._map = map;

        if (!this._canvas) {
            this._initCanvas();
        }

        map._panes.overlayPane.appendChild(this._canvas);

        this._initGL();

        map.on('moveend', this._reset, this);
        map.on('resize',  this._resize, this);

        if (map.options.zoomAnimation && L.Browser.any3d) {
            map.on('zoomanim', this._animateZoom, this);
        }

        this._reset();
    },

    onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._canvas);
        map.off('moveend', this._reset, this);
        map.off('resize', this._resize, this);
        if (map.options.zoomAnimation) {
            map.off('zoomanim', this._animateZoom, this);
        }
        this._canvas = null;
        this._viewport = null;
        this._camera = null;
        this._initialized = false;
        this._gl = null;
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    _resize: function (resizeEvent) {
        var width = resizeEvent.newSize.x,
            height = resizeEvent.newSize.y;
        if ( this._initialized ) {
            this._viewport.resize( width, height );
            this._camera.projectionMatrix( esper.Mat44.ortho( 0, width, 0, height, -1, 1 ) );
        }
    },

    _reset: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
    },

    _redraw: function () {
        /*
        var size = this._map.getSize();
        var bounds = this._map.getBounds();
        var zoomScale = (size.x * 180) / (20037508.34  * (bounds.getEast() - bounds.getWest())); // resolution = 1/zoomScale
        var zoom = this._map.getZoom();
        */
        this.draw();
        if ( this._initialized ) {
            requestAnimationFrame( this._redraw.bind( this ) );
        }
    },

    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom),
            offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
        this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
    }
});

module.exports = L.CanvasOverlay;
