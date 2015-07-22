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

var DEFAULT_ICON = L.divIcon({
    className: 'relay-cluster',
    iconSize:L.point(Config.node_radius.min, Config.node_radius.min)
});

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
    _markersLayer : null,
    _map : null,
    _element : null,
    _dateLabel : null,
    _currentNodes : null,
    _currentDate : null,
    _showFlow : true,


    _clear : function() {
        if (this._particleSimulation) {
            this._particleSimulation.stop();
            this._particleSimulation.destroy();
        }
        if (this._particleLayer) {
            this._map.removeLayer(this._particleLayer);
            delete this._particleLayer;
        }
        if (this._markersLayer) {
            this._map.removeLayer(this._markersLayer);
        }
    },

    _getVisibleRelays : function() {
        var bounds = this._map.getBounds();
        return this._currentNodes.objects.filter(function(aggregate) {
            return bounds.contains(aggregate.latLng);
        });
    },

    _startSimulation : function(nodes) {
        var self = this;
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

        if (this._showFlow) {
            this._particleSimulation.start();
        }
    },

    _onMapClustered : function() {
        var totalBandwidth = this._getCurrentTotalBandwidth();
        var nodes;

        if (this._useClusters() === false) {
            nodes = this._currentNodes.objects.map(function (node) {
                return {
                    bandwidth: _.reduce(node.circle.relays, function(memo, relay){ return memo + relay.bandwidth; },0) / totalBandwidth,
                    latLng: node.latLng
                };
            });
            this._startSimulation(nodes);
        } else {

            var clusterset = this._clusters[this._map.getZoom()];

            var aggregatesIncluded = {};
            nodes = clusterset.map(function (cluster) {
                var bandwidth = 0;
                cluster.getAllChildMarkers().forEach(function (child) {
                    child.data.circle.relays.forEach(function (relay) {
                        bandwidth += relay.bandwidth;
                    });
                    aggregatesIncluded[child.data.circle.id] = true;
                });

                return {
                    bandwidth: bandwidth,
                    latLng: cluster._latlng
                };
            });

            // Add any singleton relays that aren't in a marker cluster
            var allVisisbleRelays = this._getVisibleRelays();
            allVisisbleRelays.forEach(function (relay) {
                if (!aggregatesIncluded[relay.circle.id]) {
                    nodes.push({
                        bandwidth: relay.circle.bandwidth,
                        latLng: relay.latLng
                    });
                }
            });

            nodes.forEach(function (node) {
                node.bandwidth /= totalBandwidth;
            });

            var checkedSum = 0;
            nodes.forEach(function(n) {
                checkedSum += n.bandwidth;
            });

            nodes = nodes.sort(function(n1,n2) { return n2.bandwidth - n1.bandwidth; });

            this._startSimulation(nodes);
        }
    },

    _useClusters : function() {
        return this._element.find('#cluster-input').prop('checked');
    },

    _getFriendlyDate : function(daysFromMinDate) {
        return moment(this._dateBounds.min.value).add(daysFromMinDate,'day').format('dddd, MMMM Do YYYY');
    },

    _getISODate : function(daysFromMinDate) {
        return moment(this._dateBounds.min.value)
            .add(daysFromMinDate,'day')
            .hours(0)
            .minutes(0)
            .seconds(0)
            .milliseconds(0).format();
    },

    _onDateChange : function() {
        var newDateIdx = this._dateSlider.slider('getValue');
        var isoDate = this._getISODate(newDateIdx);
        this._clear();
        this._fetch(isoDate);
    },

    _onDateSlide : function() {
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

    _onToggleFlow : function() {
        if (this._particleSimulation.isStarted()) {
            this._showFlow = false;
            this._particleSimulation.stop();
            this._particleLayer.hide();
        } else {
            this._showFlow = true;
            this._particleSimulation.start();
            this._particleLayer.show();
        }
    },

    _onToggleClusters : function() {
        this._onDateChange();
    },

    _createClusterMarkers : function() {
        var self = this;

        this._markersLayer = L.markerClusterGroup({
            removeOutsideVisibleBounds : false,
            disableClusteringAtZoom: this._useClusters() ? undefined : 1,
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
                var bandwidthPercent = Math.round((clusterBandwidth / self._getCurrentTotalBandwidth()) * 100);
                var relayCountPercent = Math.round((clusterRelayCount / self._getCurrentTotalRelays()) * 100);
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

        this._markersLayer.on('animationend', this._onMapClustered.bind(this));
        this._markersLayer.on('initialized',this._onMapClustered.bind(this));


        this._currentNodes.objects.forEach(function(node) {
            var title = node.circle.id;
            var marker = L.marker(node.latLng, {icon: DEFAULT_ICON});
            marker.data = node;
            marker.bindPopup(title);
            self._markersLayer.addLayer(marker);
        });

        this._map.addLayer(this._markersLayer);
    },



    _getCurrentTotalBandwidth : function() {
        var total = 0;
        this._currentNodes.objects.forEach(function(aggregate) {
            aggregate.circle.relays.forEach(function(relay) {
                total+=relay.bandwidth;
            });
        });
        return total;
    },

    _getCurrentTotalRelays : function() {
        var totalRelays = 0;
        this._currentNodes.objects.forEach(function(d,i) {
            totalRelays+= d.circle.relays.length;
        });
        return totalRelays;
    },

    _fetch : function(isoDateStr) {
        var self = this;
        var idToLatLng = {};

        function handleNodes(nodes) {
            /* Add a LatLng object to each item in the dataset */
            nodes.objects.forEach(function(d,i) {
                d.latLng = new L.LatLng(d.circle.coordinates[0],
                    d.circle.coordinates[1]);
                idToLatLng[d.circle.id] = d.latLng;
            });


            // Initialize zoom -> clusters map
            var minZoom = self._map.getMinZoom();
            var maxZoom = self._map.getMaxZoom();
            for (var i = minZoom; i <= maxZoom; i++) {
                self._clusters[i] = [];
            }

            self._createClusterMarkers();


            self._particleLayer = new DotLayer()
                .fillStyle(Config.dot.headFill);
            self._particleLayer.addTo(self._map);

        }

        if (this._currentDate === isoDateStr) {
            handleNodes(this._currentNodes);
        } else {
            d3.json('/nodes/' + encodeURI(isoDateStr), function (nodes) {
                self._currentNodes = nodes;
                self._currentDate = isoDateStr;
                handleNodes(nodes);
            });
        }
    },
    
    _init : function(dateBounds) {
        this._dateBounds = dateBounds;
        var totalDays = moment(dateBounds.max.value).diff(moment(dateBounds.min.value),'days') + 1;
        this._element = $(document.body).append($(Template(_.extend(Config,{
            totalDates : totalDays,
            defaultIndex : totalDays,
            defaultDate : this._getFriendlyDate(totalDays)
        }))));
        this._element.find('.hidden-filter-btn').change(this._onHiddenFilterChange.bind(this));
        this._element.find('#show-flow-input').change(this._onToggleFlow.bind(this));
        this._element.find('#cluster-input').change(this._onToggleClusters.bind(this));


        this._dateLabel = this._element.find('#date-label');
        this._dateSlider = this._element.find('input.slider').slider({
            tooltip:'hide'
        });

        this._dateSlider.on('slideStop', this._onDateChange.bind(this));
        this._dateSlider.on('slide',this._onDateSlide.bind(this));

        this._onDateChange();


        this._map = L.map('map').setView([0, 0], 2);
        var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tiles.mapbox.com/v3/examples.map-0l53fhk2/{z}/{x}/{y}.png', {
                attribution: '<span style="color:lightgrey">&copy;</span> ' + mapLink + ' | <a href="http://uncharted.software" target="_blank"><img src="/img/uncharted-logo-light-gray-small.png"</a>',
                //prefix : '<a href="http://uncharted.software" target="_blank"><img src="/img/uncharted-logo-light-gray-small.png"</a>',
                maxZoom: 18,
            }).addTo(this._map);

        /* Initialize the SVG layer */
        this._map._initPathRoot();
    },

    /**
     * Application startup.
     */
    start: function () {
        // Fetch the date bounds and initialize everything
        $.get('/datebounds',this._init.bind(this));
        // TODO: display wait dialog
    }
});

exports.App = App;