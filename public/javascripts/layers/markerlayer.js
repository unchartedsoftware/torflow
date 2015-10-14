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

var lerp = require('../util/lerp');
var config = require('../config');

var MarkerLayer = function() {
    this._markerLayer = L.layerGroup();
    this._nodes = null;
    this._opacity = 1;
    this._scaleByBandwidth = true;
};

MarkerLayer.prototype = _.extend(MarkerLayer.prototype, {

    addTo: function(map) {
        this._map = map;
        this._markerLayer.addTo(map);
        return this;
    },

    set : function(nodeData) {
        var self = this;
        this._nodes = nodeData.nodes;
        this._minMax = nodeData.minMax;
        var markers = this._nodes.map(function(node) {
            var title = node.label;
            var pointRadius;
            if (self._scaleByBandwidth) {
                var nodeBW = node.bandwidth;
                pointRadius = lerp(
                    config.node_radius.min,
                    config.node_radius.max,
                    nodeBW / (self._minMax.max-self._minMax.min));
            } else {
                pointRadius = config.node_radius.min;
            }
            var marker = L.marker({
                    lat: node.lat,
                    lng: node.lng
                }, {
                icon: L.divIcon({
                    className: 'relay-cluster',
                    iconSize: L.point(pointRadius,pointRadius)
                })
            });
            self._addMarkerHandlers( marker, title );
            return marker;
        });
        // store timestamp, if this changes during a batch it will cancel the
        // entire series operation, preventing stale additions
        var currentTimestamp = Date.now();
        this._requestTimestamp = currentTimestamp;
        var CHUNK_SIZE = 20;
        var chunks = _.chunk(markers,CHUNK_SIZE);
        var additions = _.map( chunks, function(chunk) {
            return function(done) {
                chunk.forEach(function(marker) {
                    self._markerLayer.addLayer(marker);
                });
                done(self._requestTimestamp !== currentTimestamp);
            };
        });
        // execute the additions in chunks to prevent browser from locking
        async.series(additions);
    },

    clear : function() {
        this._markerLayer.clearLayers();
    },

    setOpacity: function( opacity ) {
        if (this._opacity !== opacity) {
            this._opacity = opacity;
            console.log('Implement this');
        }
    },

    scaleByBandwidth: function( scaleByBandwidth ) {
        if (scaleByBandwidth !== undefined &&
            scaleByBandwidth !== this._scaleByBandwidth) {
            this._scaleByBandwidth = scaleByBandwidth;
            this.clear();
            this.set({
                minMax: this._minMax,
                nodes: this._nodes
            });
        }
        return this._scaleByBandwidth;
    },

    getOpacity: function() {
        return this._opacity;
    },

    show: function() {
        this._hidden = false;
        console.log('Implement this');
    },

    hide: function() {
        this._hidden = true;
        console.log('Implement this');
    },

    isHidden: function() {
        return this._hidden;
    },

    _addMarkerHandlers : function( marker, label ) {
        var self = this;
        if ( typeof label === 'function' ) {
            label = label();
        }
        // on mouse over create label
        marker.on( 'mouseover', function( leafletEvent ) {
            var event = leafletEvent.originalEvent,
                offset = $(document.body).offset(),
                relativeX = event.pageX - offset.left,
                relativeY = event.pageY - offset.top;
            if ( self._$label ) {
                self._$label.remove();
            }
            self._$label = $(
                '<div class="relay-cluster-label">'+
                    '<a>' + label + '</a>' +
                '</div>' );
            $( document.body ).append( self._$label );
            self._$label.css({
                'left': -self._$label.outerWidth()/2 + relativeX + 'px',
                'top': -self._$label.outerHeight()*1.5 + relativeY + 'px'
            });
        });
        // on mouse out destroy label
        marker.on( 'mouseout', function() {
            if ( self._$label ) {
                self._$label.remove();
                self._$label = null;
            }
        });
    }

});

module.exports = MarkerLayer;
