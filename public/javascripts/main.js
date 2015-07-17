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

var DotLayer = require('./layers/dotlayer');
var MapParticleSimulation = require('./particles/mapparticlesimulation');
var Config = require('./config');

var Template = require('./templates/main');

/**
 * Creates the TorFlow front-end app
 * @constructor
 */
var App = function() {

};

App.prototype = _.extend(App.prototype, {

    _clusters : {},     // zoom level -> list of clusters
    _particleSimulation : null,
    _particleLayer : null,
    _map : null,
    _element : null,
    _dateLabel : null,

    _onMapClustered : function() {
        var self = this;

        var clusterset = this._clusters[this._map.getZoom()];
        //console.log('Zoom Level : ' + this._map.getZoom() + ', Edge Count: ' + clusterset.length * clusterset.length);

        var totalBandwidth = 0;
        var nodes = clusterset.map(function(cluster) {
            var bandwidth = 0;
            cluster.getAllChildMarkers().forEach(function(child) {
                bandwidth+=child.data.circle.bandwidth;
            });
            totalBandwidth+=bandwidth;

            return {
                bandwidth : bandwidth,
                latLng: cluster._latlng
            };
        });

        nodes.forEach(function(node) {
            node.bandwidth /= totalBandwidth;
        });



        if (this._particleLayer) {
            this._map.removeLayer(this._particleLayer);
            delete this._particleLayer;
        }
        if (this._particleSimulation) {
            this._particleSimulation.stop();
            this._particleSimulation.destroy();
        }

        this._particleLayer = new DotLayer()
            .fillStyle('rgba(255,255,255,0.8');
        this._particleLayer.addTo(this._map);

        this._particleSimulation = new MapParticleSimulation(nodes,Config.particle_count,this._map)
            .onPositionsAvailable(function(positions) {
                self._particleLayer.clear();
                positions.forEach(function(pos) {
                    self._particleLayer.add(pos);
                });
            });
        this._onHiddenFilterChange();
        this._particleSimulation.start();
    },

    _getFriendlyDate : function(daysFromMinDate) {
        return moment(this._dateBounds.min.value).add(daysFromMinDate,'day').format('dddd, MMMM Do YYYY');
    },

    _onDateChange : function() {
        var newDateIdx = this._dateSlider.slider('getValue');
        var friendlyDate = this._getFriendlyDate(newDateIdx);
        this._dateLabel.text(friendlyDate);
    },

    _onHiddenFilterChange : function() {
        var checkedRadioBtn = this._element.find('#hidden-filter-btn-group').find('.active > input');
        var checkedState = checkedRadioBtn.attr('hidden-id');
        if (checkedState === 'all') {
            this._particleSimulation.showTraffic('all');
        } else if (checkedState === 'hidden') {
            this._particleSimulation.showTraffic('hidden');
        } else if (checkedState === 'general') {
            this._particleSimulation.showTraffic('general');
        }
    },

    /**
     * Application startup.
     */
    start: function () {
        var self = this;
        var idToLatLng = {};
        
        $.get('/datebounds',function(dateBounds) {
            self._dateBounds = dateBounds;
            var totalDays = moment(dateBounds.max.value).diff(moment(dateBounds.min.value),'days') + 1;
            self._element = $(document.body).append($(Template(_.extend(Config,{
                totalDates : totalDays,
                defaultIndex : totalDays,
                defaultDate : self._getFriendlyDate(totalDays)
            }))));
            self._element.find('.hidden-filter-btn').change(self._onHiddenFilterChange.bind(self));

            self._dateLabel = self._element.find('#date-label');
            self._dateSlider = self._element.find('input.slider').slider({
                tooltip:'hide'
            });
            if (self._dateSlider) {
                self._dateSlider.on('slideStop', self._onDateChange.bind(self));
            }


            self._map = L.map('map').setView([0, 0], 2);
            var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
            L.tileLayer(
                'http://{s}.tiles.mapbox.com/v3/examples.map-0l53fhk2/{z}/{x}/{y}.png', {
                    attribution: '&copy; ' + mapLink + ' Contributors',
                    maxZoom: 18,
                }).addTo(self._map);

            /* Initialize the SVG layer */
            self._map._initPathRoot();


            d3.json('/nodes', function (nodes) {

                /* Add a LatLng object to each item in the dataset */
                var totalBandwidth = 0;
                var totalRelays = 0;
                nodes.objects.forEach(function(d,i) {
                    d.latLng = new L.LatLng(d.circle.coordinates[0],
                        d.circle.coordinates[1]);
                    idToLatLng[d.circle.id] = d.latLng;
                    var groupBandwidth = 0;
                    d.circle.relays.forEach(function(relay) {
                        groupBandwidth += relay.bandwidth;
                    });
                    totalBandwidth += groupBandwidth;
                    totalRelays += d.circle.relays.length;
                });


                // Initialize zoom -> clusters map
                var minZoom = self._map.getMinZoom();
                var maxZoom = self._map.getMaxZoom();
                for (var i = minZoom; i <= maxZoom; i++) {
                    self._clusters[i] = [];
                }

                var markers = L.markerClusterGroup({
                    removeOutsideVisibleBounds : false,
//                    showCoverageOnHover : false,
                    tooltip : function(cluster) {
                        var markers = cluster.getAllChildMarkers();
                        var clusterRelayCount = 0;
                        var clusterBandwidth = 0;
                        markers.forEach(function(markerCluster) {
                            clusterRelayCount += markerCluster.data.circle.relays.length;
                            var groupBandwidth = 0;
                            markerCluster.data.circle.relays.forEach(function(relay) {
                                groupBandwidth += relay.bandwidth;
                            });
                            clusterBandwidth += groupBandwidth;
                        });
                        var bandwidthPercent = Math.round((clusterBandwidth/totalBandwidth) * 100);
                        var relayCountPercent = Math.round((clusterRelayCount/totalRelays) * 100);
                        return '<p>Relays in Group: ' + clusterRelayCount + '(' + relayCountPercent + '%)</p>' + '<p>Bandwidth: ' + bandwidthPercent + '%</p>';
                    },
                    tooltipOffset : function(cluster,icon) {
                        return new L.Point(0,-icon.options.iconSize.x/2);
                    },
                    iconCreateFunction: function (cluster) {
                        var markers = cluster.getAllChildMarkers();

                        var dataElements = markers.map(function(marker) {
                            return marker.data.circle;
                        });

                        // Adjust position of marker latLng to be at the center of bandwidth as opposed to geometric center
                        var clusterBandwidth = 0;
                        dataElements.forEach(function(data) {
                            clusterBandwidth += data.bandwidth;
                        });

                        var weightAvgLat = 0;
                        var weightedAvgLng = 0;
                        markers.forEach(function(marker,i) {
                            weightAvgLat += marker.getLatLng().lat * dataElements[i].bandwidth;
                            weightedAvgLng += marker.getLatLng().lng * dataElements[i].bandwidth;
                        });
                        weightAvgLat /= clusterBandwidth;
                        weightedAvgLng /= clusterBandwidth;

                        cluster.setLatLng(new L.LatLng(weightAvgLat,weightedAvgLng));

                        self._clusters[self._map.getZoom()].push(cluster);


                        var radius = Config.node_radius.min + (Config.node_radius.max-Config.node_radius.min)*clusterBandwidth;

                        var icon = L.divIcon({
                            className: 'relay-cluster',
                            iconSize: L.point(radius, radius)
                        });
                        cluster.icon = icon;
                        return icon;
                    }
                });

                markers.on('animationend', self._onMapClustered.bind(self));
                markers.on('initialized',self._onMapClustered.bind(self));

                var defaultIcon = L.divIcon({
                    className: 'relay-cluster',
                    iconSize:L.point(Config.node_radius.min, Config.node_radius.min)
                });


                nodes.objects.forEach(function(node) {
                    var title = node.circle.id;
                    var marker = L.marker(node.latLng, {icon: defaultIcon});
                    marker.data = node;
                    marker.bindPopup(title);
                    markers.addLayer(marker);
                });

                self._map.addLayer(markers);

                self._particleLayer = new DotLayer()
                    .fillStyle(Config.dot.headFill);
                self._particleLayer.addTo(self._map);

            }); 
        });
    }
});

exports.App = App;