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

    var lerp = require('../util/lerp');
    var Config = require('../config');

    // Reduce counts if on mobile device
    var IS_MOBILE = require('../util/mobile').IS_MOBILE;
    var NODE_COUNT = IS_MOBILE ? Config.node_count * Config.node_mobile_factor : Config.node_count;
    var NODE_COUNT_MIN = IS_MOBILE ? Config.node_count_min * Config.node_mobile_factor : Config.node_count_min;
    var NODE_COUNT_MAX = IS_MOBILE ? Config.node_count_max * Config.node_mobile_factor : Config.node_count_max;

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
            this._$pane = $('#map').find('.leaflet-marker-pane');
            this.setOpacity(this.getOpacity());
            return this;
        },

        getNodeCountMin: function() {
            return NODE_COUNT_MIN;
        },

        getNodeCountMax: function() {
            return NODE_COUNT_MAX;
        },

        getNodeCount: function() {
            return this._nodeCount || NODE_COUNT;
        },

        setNodeCount: function(count) {
            this._nodeCount = Math.round(count);
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
                        Config.node_radius.min,
                        Config.node_radius.max,
                        nodeBW / (self._minMax.max-self._minMax.min));
                } else {
                    pointRadius = Config.node_radius.min;
                }
                var marker = L.marker({
                        lat: node.lat,
                        lng: node.lng
                    }, {
                    icon: L.divIcon({
                        className: 'leaflet-marker-cluster',
                        iconSize: L.point(pointRadius,pointRadius)
                    })
                });
                // if not mobile, allow hover over markers
                if (!IS_MOBILE) {
                    self._addMarkerHandlers( marker, title );
                }
                return marker;
            });
            // store timestamp, if this changes during a batch it will cancel the
            // entire series operation, preventing stale additions
            var currentTimestamp = Date.now();
            this._requestTimestamp = currentTimestamp;
            // Leaflet only let you add markers in batch when creating a layer
            // group, so remove the original from map, re-create it, then
            // add it.
            this._map.removeLayer(this._markerLayer);
            this._markerLayer = L.layerGroup(markers);
            this._markerLayer.addTo(this._map);
        },

        clear : function() {
            this._markerLayer.clearLayers();
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

        setOpacity: function( opacity ) {
            if (this._opacity !== opacity ||
                this._$pane.css('opacity') !== opacity) {
                this._opacity = opacity;
                if ( this._$pane ) {
                    this._$pane.css('opacity', this._opacity);
                }
            }
        },

        show: function() {
            this._hidden = false;
            if ( this._$pane ) {
                this._$pane.css('display', '');
            }
        },

        hide: function() {
            this._hidden = true;
            if ( this._$pane ) {
                this._$pane.css('display', 'none');
            }
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
                var event = leafletEvent.originalEvent;
                var $marker = $(event.target);
                var offset = $marker.offset();
                var posY = offset.top - $(window).scrollTop();
                var posX = offset.left - $(window).scrollLeft() + $marker.outerWidth()/2;
                if ( self._$label ) {
                    self._$label.remove();
                }
                self._$label = $(
                    '<div class="hover-label">'+
                        label +
                    '</div>' );
                $( document.body ).append( self._$label );
                self._$label.css({
                    'left': -self._$label.outerWidth()/2 + posX + 'px',
                    'top': -self._$label.outerHeight()*1.25 + posY + 'px'
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

}());
