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

var nodeUtil = require('../util/nodeUtil');
var lerp = require('../util/lerp');
var config = require('../config');
var markertooltip = require('../util/markertooltip');

var MarkerLayer = function() {
    this._markerLayer = L.layerGroup();
    this._nodes = null;
};

MarkerLayer.prototype = _.extend(MarkerLayer.prototype, {

    addTo: function(map) {
        this._map = map;
        this._markerLayer.addTo(map);
        return this;
    },

    set : function(nodes,scaleByBandwidth) {
        var self = this;
        this._nodes = nodes;
        this._minMaxBandwidth = null;
        this._normalizedBandwidth = null;
        this._bandwidthSum = null;
        this._totalBandwidth = null;

        var minMax = nodeUtil.getMinMaxBandwidth(this._nodes);
        var markers = this._nodes.objects.map(function(node) {
            var relays = node.circle.relays;
            var title = relays.length === 1 ? relays[0].name : relays.length + ' relays at location';
            var marker;
            if (scaleByBandwidth) {
                var nodeBW = nodeUtil.sumRelaysBandwidth(relays);
                var pointRadius = lerp(config.node_radius.min,config.node_radius.max,nodeBW / (minMax.max-minMax.min));
                marker = L.marker(node.latLng, {
                    icon : L.divIcon({
                        className: 'relay-cluster',
                        iconSize:L.point(pointRadius, pointRadius)
                    })
                });
            } else {
                marker = L.marker(node.latLng, {
                    icon: L.divIcon({
                        className: 'relay-cluster',
                        iconSize: L.point(config.node_radius.min, config.node_radius.min)
                    })
                });
            }
            marker.data = node;
            markertooltip.addHandlers( marker, title );
            return marker;
        });

        markers.forEach(function(marker) {
            self._markerLayer.addLayer(marker);
        });
    },

    clear : function() {
        this._markerLayer.clearLayers();
    },

    setOpacity : function() {
        // TODO:  how to handle this?
    }

});

module.exports = MarkerLayer;
