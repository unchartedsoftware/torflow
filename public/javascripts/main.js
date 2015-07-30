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
var Lerp = require('./util/lerp');
var Config = require('./config');

var Template = require('./templates/main');
var AboutTemplate = require('./templates/about');

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
    _showingLabels : null,


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

    _scaleBandwidth : function() {
        return this._element.find('#scale-bandwidth-input').prop('checked');
    },

    _getMoment : function(index) {
        return moment(this._dates[index].key).add(1,'days');        // ...I have no idea...dates are the worst...
    },

    _getFriendlyDate : function(index) {
        return this._getMoment(index).format('dddd, MMMM Do YYYY');
    },

    _getISODate : function(index) {
        return this._getMoment(index)
            .hours(0)
            .minutes(0)
            .seconds(0)
            .format();
    },

    _update : function() {
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

    _onBrightnessSlide : function() {
        var newBrightness = this._brightnessSlider.slider('getValue');
        var containerEl = this._baseTileLayer.getContainer();
        $(containerEl).css('-webkit-filter','brightness(' + newBrightness + ')');
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
        if (this._useClusters()) {
            this._element.find('#scale-bandwidth-input')
                .prop('disabled',true)
                .prop('checked',true);

            this._element.find('#step-input')
                .prop('disabled',true)
                .prop('checked',false);
        } else {
            this._element.find('#scale-bandwidth-input').prop('disabled',false);
            this._element.find('#step-input').prop('disabled',false);
        }
        this._update();
    },

    _onToggleStep : function() {

    },

    _onToggleScale : function() {
        this._update();
    },

    _onToggleLabels : function(e) {
        if (this._showingLabels) {
            this._map.removeLayer(this._labelLayer);
            this._showingLabels = false;
        } else {
            this._map.addLayer(this._labelLayer);
            this._showingLabels = true;
        }
    },

    _createMarkers : function() {
        var self = this;

        this._markersLayer = L.markerClusterGroup({
            removeOutsideVisibleBounds : false,
            disableClusteringAtZoom: this._useClusters() ? undefined : 1,
            zoomToBoundsOnClick : false,
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

                var bandwidthPercentString = bandwidthPercent === 0 ? '<1%' : bandwidthPercent + '%';
                var relayCountPercentString = relayCountPercent === 0 ? '<1%' : relayCountPercent + '%';

                return '<p>Relays in Group: ' + clusterRelayCount + '(' + relayCountPercentString + ')</p>' + '<p>Bandwidth: ' + bandwidthPercentString + '</p>';
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

                // If the aggregate bandwidth is not zero, fudge the position of the marker to be center of bandwidth instead of
                // weighted geographic center
                if (clusterBandwidth !== 0) {
                    var weightAvgLat = 0;
                    var weightedAvgLng = 0;
                    markers.forEach(function (marker, i) {
                        weightAvgLat += marker.getLatLng().lat * dataElements[i].bandwidth;
                        weightedAvgLng += marker.getLatLng().lng * dataElements[i].bandwidth;
                    });
                    weightAvgLat /= clusterBandwidth;
                    weightedAvgLng /= clusterBandwidth;

                    cluster.setLatLng(new L.LatLng(weightAvgLat, weightedAvgLng));
                }

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

        var maxBW = -Number.MAX_VALUE;
        var minBW = Number.MAX_VALUE;
        this._currentNodes.objects.forEach(function(node) {
            var nodeBW = _.reduce(node.circle.relays, function(memo, relay){ return memo + relay.bandwidth; },0);
            maxBW = Math.max(maxBW,nodeBW);
            minBW = Math.min(minBW,nodeBW);
        });

        this._currentNodes.objects.forEach(function(node) {
            var title = node.circle.relays.length === 1 ? node.circle.relays[0].name : node.circle.relays.length + ' relays at location';
            var marker;
            var usedRadius;
            if (self._scaleBandwidth()) {
                var nodeBW = _.reduce(node.circle.relays, function(memo, relay){ return memo + relay.bandwidth; },0);
                var pointRadius = Lerp(Config.node_radius.min,Config.node_radius.max,nodeBW / (maxBW-minBW));
                usedRadius = pointRadius;
                marker = L.marker(node.latLng, {
                    icon : L.divIcon({
                        className: 'relay-cluster',
                        iconSize:L.point(pointRadius, pointRadius)
                    })
                });
            } else {
                marker = L.marker(node.latLng, {icon: DEFAULT_ICON});
                usedRadius = Config.node_radius.min;
            }
            marker.data = node;
            marker.bindPopup(title, {
                offset : new L.Point(0,-usedRadius/2)
            });
            marker.on('mouseover',function() {
                marker.openPopup();
            });
            marker.on('mouseout',function() {
                marker.closePopup();
            });
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

    _fetch : function(isoDateStr, onNodesReady) {
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

            self._createMarkers();


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
    
    _init : function(dates) {
        this._dates = dates;
        var totalDays = dates.length;
        this._element = $(document.body).append($(Template(_.extend(Config,{
            maxIndex : totalDays-1,
            defaultDate : this._getFriendlyDate(totalDays-1)
        }))));
        this._element.find('.hidden-filter-btn').change(this._onHiddenFilterChange.bind(this));
        this._element.find('#show-flow-input').change(this._onToggleFlow.bind(this));
        this._element.find('#cluster-input').change(this._onToggleClusters.bind(this));
        this._element.find('#label-input').change(this._onToggleLabels.bind(this));
        this._element.find('#step-input').change(this._onToggleStep.bind(this));
        this._element.find('#scale-bandwidth-input').change(this._onToggleScale.bind(this));


        this._showingLabels = this._element.find('#label-input').prop('checked');


        this._dateLabel = this._element.find('#date-label');
        this._dateSlider = this._element.find('#date-slider').slider({
            tooltip:'hide'
        });

        this._dateSlider.on('slideStop', this._update.bind(this));
        this._dateSlider.on('slide',this._onDateSlide.bind(this));


        this._brightnessSlider = this._element.find('#brightness-slider').slider({
            tooltip:'hide'
        });
        this._brightnessSlider.on('slide',this._onBrightnessSlide.bind(this));

        this._update();


        this._map = L.map('map').setView([0, 0], 2);
        this._map.options.maxZoom = Config.maxZoom || 18;

        var mapUrlBase = 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png';
        if (Config.localMapServer) {
            mapUrlBase = 'http://' + window.location.host + '/map/';
        }

        this._baseTileLayer = L.tileLayer(
            mapUrlBase + 'dark_nolabels/{z}/{x}/{y}.png', {
                attribution: '<span class="attribution">Map tiles by <a href="http://cartodb.com/attributions#basemaps">CartoDB</a>, under <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a></span>' + '|' +
                            '<a href="http://uncharted.software" target="_blank"><img src="/img/uncharted-logo-light-gray-small.png"</a>',
                maxZoom: Config.maxZoom || 18,
            }).addTo(this._map);
        this._onBrightnessSlide();

        this._labelLayer = L.tileLayer(
            mapUrlBase + 'dark_only_labels/{z}/{x}/{y}.png', {
                maxZoom: Config.maxZoom || 18,
            });

        if (this._showingLabels) {
            this._labelLayer.addTo(this._map);
        }

        /* Initialize the SVG layer */
        this._map._initPathRoot();
    },

    /**
     * Application startup.
     */
    start: function () {
        // Fetch the dates available + relay count for each date
        $.get('/dates',this._init.bind(this));
        // TODO: display wait dialog
    },

    about : function() {
        $.get('data/changelog.json',function(changelog) {
            $(document.body).append($(AboutTemplate(changelog)));
        });
    }
});

exports.App = App;