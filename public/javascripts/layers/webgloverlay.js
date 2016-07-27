/**
 Copyright 2016 Uncharted Software Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

(function() {
    'use strict';

    L.WebGLOverlay = L.Class.extend({

        initialize: function (options) {
            L.setOptions(this, options);
        },

        draw: function() {
            console.error('\'draw\' function for CanvasOverlay class must be implemented');
        },

        initShaders: function( done ) {
            console.error('\'initShaders\' function for CanvasOverlay class must be implemented');
            done();
        },

        initBuffers: function( done ) {
            console.error('\'initBuffers\' function for CanvasOverlay class must be implemented');
            done();
        },

        getContext: function() {
            return this._gl;
        },

        _initGL : function() {
            var self = this,
                shadersDone = $.Deferred(),
                buffersDone = $.Deferred(),
                gl = this._gl = esper.WebGLContext.get( this._canvas );
            // handle missing context
            if ( !gl ) {
                return;
            }
            // init the webgl state
            gl.clearColor( 0, 0, 0, 0 );
            gl.enable( gl.BLEND );
            gl.disable( gl.DEPTH_TEST );
            gl.blendFunc( gl.SRC_ALPHA, gl.ONE );
            // load shaders
            this.initShaders( function() {
                shadersDone.resolve();
            });
            // init buffers
            this.initBuffers( function() {
                buffersDone.resolve();
            });
            // once finished
            $.when( shadersDone, buffersDone ).then( function() {
                var width = self._canvas.width,
                    height = self._canvas.height;
                self._viewport = new esper.Viewport();
                self._viewport.resize(width, height);
                self._initialized = true;
                self._draw();
            });
        },

        _initCanvas: function () {
            this._canvas = L.DomUtil.create('canvas', 'leaflet-webgl-layer leaflet-layer');
            var size = this._map.getSize();
            var pixelRatio = window.devicePixelRatio;
            this._canvas.width = size.x * pixelRatio;
            this._canvas.height = size.y * pixelRatio;
            this._canvas.style.width = size.x + 'px';
            this._canvas.style.height = size.y + 'px';
            var animated = this._map.options.zoomAnimation && L.Browser.any3d;
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
        },

        onAdd: function (map) {
            this._map = map;
            if (!this._canvas) {
                this._initCanvas();
            }
            map._panes.tilePane.appendChild(this._canvas);
            this._initGL();
            var self = this;
            map.on('zoomstart', function() {
                self._isZooming = true;
            });
            map.on('zoomend', function() {
                self._isZooming = false;
            });
            // Animate layer on zoom
            if (map.options.zoomAnimation && L.Browser.any3d) {
                map.on('zoomanim', this._animateZoom, this);
            }
            map.on('resize', this._resize, this);
        },

        onRemove: function (map) {
            map.getPanes().tilePane.removeChild(this._canvas);
            map.off('resize', this._resize, this);
            if (map.options.zoomAnimation) {
                map.off('zoomanim', this._animateZoom, this);
            }
            this._gl = null;
            this._canvas = null;
            this._viewport = null;
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

        _getProjection: function() {
            var bounds = this._map.getPixelBounds(),
                dim = Math.pow( 2, this._map.getZoom() ) * 256;
            return alfador.Mat44.ortho(
                (bounds.min.x / dim),
                (bounds.max.x / dim),
                ( dim - bounds.max.y ) / dim,
                ( dim - bounds.min.y ) / dim,
                -1, 1 );
        },

        _clearBackBuffer: function() {
            if (!this._gl) {
                return;
            }
            var gl = this._gl;
            gl.clear( gl.COLOR_BUFFER_BIT );
        },

        clear: function() {
            this._clearBackBuffer();
            this._isReady = false;
        },

        _animateZoom: function (e) {
            var scale = this._map.getZoomScale(e.zoom),
                offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
            this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
        },

        _resize: function (resizeEvent) {
            var pixelRatio = window.devicePixelRatio,
                width = resizeEvent.newSize.x,
                height = resizeEvent.newSize.y;
            if ( this._initialized ) {
                this._viewport.resize( width * pixelRatio, height * pixelRatio );
                this._canvas.width = width * pixelRatio;
                this._canvas.height = height * pixelRatio;
                this._canvas.style.width = width + 'px';
                this._canvas.style.height = height + 'px';
            }
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

    module.exports = L.WebGLOverlay;

}());
