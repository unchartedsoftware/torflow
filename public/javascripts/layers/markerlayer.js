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

    set : function(nodeData,scaleByBandwidth) {
        var self = this;
        this._nodes = nodeData.nodes;
        var minMax = nodeData.minMax;
        var markers = this._nodes.map(function(node) {
            var title = node.label;
            var pointRadius;
            if (scaleByBandwidth) {
                var nodeBW = node.bandwidth;
                pointRadius = lerp(
                    config.node_radius.min,
                    config.node_radius.max,
                    nodeBW / (minMax.max-minMax.min));
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
            markertooltip.addHandlers( marker, title );
            return marker;
        });

        var CHUNK_SIZE = 10;
        var chunks = _.chunk(markers,CHUNK_SIZE);
        var additions = _.map( chunks, function(chunk) {
            return function(done) {
                chunk.forEach(function(marker) {
                    self._markerLayer.addLayer(marker);
                });
                done();
            };
        });
        async.series(additions);
    },

    clear : function() {
        this._markerLayer.clearLayers();
    },

    setOpacity : function() {
        // TODO:  how to handle this?
    }

});

module.exports = MarkerLayer;
