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
var CountryLayer = require('./layers/countrylayer');
var Lerp = require('./util/lerp');
var Config = require('./config');
var MarkerTooltip = require('./util/markertooltip');
var Template = require('./templates/main');

/**
 * Creates the TorFlow front-end app
 * @constructor
 */
var App = function() {};

App.prototype = _.extend(App.prototype, {

    _clusters : {},     // zoom level -> list of clusters
    _particleLayer : null,
    _markersLayer : null,
    _countryLayer : null,
    _map : null,
    _element : null,
    _dateLabel : null,
    _currentNodes : null,
    _currentDate : null,
    _currentHistogram : null,
    _showFlow : true,
    _showingLabels : null,

    _clear : function() {
        if (this._markersLayer) {
            this._markersLayer.clearLayers();
        }
        if (this._countryLayer) {
            this._countryLayer.clear();
        }
    },

    _getVisibleRelays : function() {
        var bounds = this._map.getBounds();
        return this._currentNodes.objects.filter(function(aggregate) {
            return bounds.contains(aggregate.latLng);
        });
    },

    _latLngToNormalizedCoord : function(latLng) {
        var px = this._map.project( latLng ),
            dim = Math.pow( 2, this._map.getZoom() ) * 256;
        return {
            x: px.x / dim,
            y: ( dim - px.y ) / dim
        };
    },

    _sumRelaysBandwidth : function( relays ) {
        return _.reduce(relays, function(memo, relay) {
            return memo + relay.bandwidth;
        }, 0);
    },

    _getNormalizedBandwidth : function( relays ) {
        return this._sumRelaysBandwidth(relays) / this._getCurrentTotalBandwidth();
    },

    _getMinMaxBandwidth : function() {
        var max = -Number.MAX_VALUE;
        var min = Number.MAX_VALUE;
        var self = this;
        this._currentNodes.objects.forEach(function(node) {
            var nodeBW = self._sumRelaysBandwidth(node.circle.relays);
            max = Math.max(max,nodeBW);
            min = Math.min(min,nodeBW);
        });
        return {
            min: min,
            max: max
        };
    },

    _createParticles : function() {
        var self = this;
        var nodes = this._currentNodes.objects.map(function (node) {
            return {
                bandwidth: self._getNormalizedBandwidth(node.circle.relays),
                latLng: node.latLng,
                pos: self._latLngToNormalizedCoord(node.latLng)
            };
        });
        this._particleLayer.updateNodes(nodes);
    },

    _scaleByBandwidth : function() {
        return this._element.find('#scale-bandwidth-input').prop('checked');
    },

    _getMoment : function(index) {
        return moment(this._dates[index]);
    },

    _getFriendlyDate : function(index) {
        return this._getMoment(index).format('dddd, MMMM Do YYYY');
    },

    _getISODate : function(index) {
        var m = this._getMoment(index)
            .hours(0)
            .minutes(0)
            .seconds(0);
        return m.format();
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

    _onSpeedSlide : function() {
        var newSpeed = this._speedSlider.slider('getValue');
        this._particleLayer.setSpeed( newSpeed );
    },

    _onPathSlide : function() {
        var offset = this._pathSlider.slider('getValue');
        this._particleLayer.setPathOffset( offset );
    },

    _onOpacitySlide : function() {
        var newOpacity = this._opacitySlider.slider('getValue');
        this._countryLayer.setOpacity(newOpacity);
    },

    _onHiddenFilterChange : function() {
        var checkedRadioBtn = this._element.find('#hidden-filter-btn-group').find('.active > input');
        var checkedState = checkedRadioBtn.attr('hidden-id');
        if (checkedState === 'all') {
            this._particleLayer.showTraffic('all');
        } else if (checkedState === 'hidden') {
            this._particleLayer.showTraffic('hidden');
        } else if (checkedState === 'general') {
            this._particleLayer.showTraffic('general');
        }
    },

    _onToggleFlow : function() {
        if (this._particleLayer.isHidden()) {
            this._showFlow = true;
            this._particleLayer.show();
        } else {
            this._showFlow = false;
            this._particleLayer.hide();
        }
    },

    _onToggleScale : function() {
        this._update();
    },

    _onToggleLabels : function() {
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
        var minMax = this._getMinMaxBandwidth();
        var markers = this._currentNodes.objects.map(function(node) {
            var relays = node.circle.relays;
            var title = relays.length === 1 ? relays[0].name : relays.length + ' relays at location';
            var marker;
            if (self._scaleByBandwidth()) {
                var nodeBW = self._sumRelaysBandwidth(relays);
                var pointRadius = Lerp(Config.node_radius.min,Config.node_radius.max,nodeBW / (minMax.max-minMax.min));
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
                        iconSize: L.point(Config.node_radius.min, Config.node_radius.min)
                    })
                });
            }
            marker.data = node;
            MarkerTooltip( marker, title );
            return marker;
        });

        markers.forEach(function(marker) {
            self._markersLayer.addLayer(marker);
        });

        //this._markersLayer = L.layerGroup(markers);
        //this._map.addLayer(this._markersLayer);
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
        this._currentNodes.objects.forEach(function(node) {
            totalRelays+= node.circle.relays.length;
        });
        return totalRelays;
    },

    _fetch : function(isoDateStr) {

        function handleNodes(nodes) {
            // Add a LatLng object to each item in the dataset
            nodes.objects.forEach(function(node) {
                node.latLng = new L.LatLng(
                    node.circle.coordinates[0],
                    node.circle.coordinates[1]);
            });
            // Initialize zoom -> clusters map
            var minZoom = self._map.getMinZoom();
            var maxZoom = self._map.getMaxZoom();
            for (var i = minZoom; i <= maxZoom; i++) {
                self._clusters[i] = [];
            }
            // Create markers
            self._createMarkers();
            // Update particles
            if ( oldNodes !== self._currentNodes ) {
                self._createParticles();
            }
        }

        function handleHistogram(histogram) {
            self._countryLayer.set(histogram);
        }

        var oldNodes = this._currentNodes,
            self = this;

        if (this._currentDate === isoDateStr) {
            handleNodes(this._currentNodes);
            handleHistogram(this._currentHistogram);
        } else {
            d3.json('/nodes/' + encodeURI(isoDateStr), function (nodes) {
                self._currentNodes = nodes;
                handleNodes(nodes);
            });
            d3.json('/country/' + encodeURI(isoDateStr),function(histogram) {
                self._currentHistogram = histogram;
                handleHistogram(histogram);
            });
            self._currentDate = isoDateStr;
        }
    },

    _initUI : function() {
        var totalDays = this._dates.length;
        var extendedConfig = _.extend(Config,{
            maxIndex : totalDays-1,
            defaultDate : this._getFriendlyDate(totalDays-1)
        });

        this._element = $(document.body).append(Template(extendedConfig));

        this._element.find('.hidden-filter-btn').change(this._onHiddenFilterChange.bind(this));
        this._element.find('#show-flow-input').change(this._onToggleFlow.bind(this));
        this._element.find('#label-input').change(this._onToggleLabels.bind(this));
        this._element.find('#scale-bandwidth-input').change(this._onToggleScale.bind(this));

        this._element.find('#summary-button').click( function() {
            swal({
                title: null,
                text: Config.summary,
                html: true,
                confirmButtonColor: '#149BDF'
            });
        });

        this._showingLabels = this._element.find('#label-input').prop('checked');

        this._dateLabel = this._element.find('#date-label');
        this._dateSlider = this._element.find('#date-slider').slider({ tooltip: 'hide' });

        this._dateSlider.on('slideStop', this._update.bind(this));
        this._dateSlider.on('slide',this._onDateSlide.bind(this));

        this._brightnessSlider = this._element.find('#brightness-slider').slider({ tooltip: 'hide' });
        this._brightnessSlider.on('slide',this._onBrightnessSlide.bind(this));

        this._speedSlider = this._element.find('#speed-slider').slider({ tooltip: 'hide' });
        this._speedSlider.on('slideStop',this._onSpeedSlide.bind(this));

        this._pathSlider = this._element.find('#path-slider').slider({ tooltip: 'hide' });
        this._pathSlider.on('slide',this._onPathSlide.bind(this));

        this._opacitySlider = this._element.find('#opacity-slider').slider({ tooltip: 'hide' });
        this._opacitySlider.on('slide',this._onOpacitySlide.bind(this));
    },

    _initMap : function() {
        // Initialize the map object
        this._map = L.map('map', {
            inertia: false,
            zoomControl: false,
            minZoom: 3,
            maxZoom: Config.maxZoom || 18
        });
        this._map.setView([40, -42], 4);
        // Initialize zoom controls
        this._zoomControls = new L.Control.Zoom({ position: 'topright' });
        this._zoomControls.addTo(this._map);
    },

    _initLayers : function() {
        // Initialize the baselayer
        var mapUrlBase = 'http://{s}.basemaps.cartocdn.com/';
        if (Config.localMapServer) {
            mapUrlBase = 'http://' + window.location.host + '/map/';
        }
        this._baseTileLayer = L.tileLayer(
            mapUrlBase + 'dark_nolabels/{z}/{x}/{y}.png',
            {
                attribution: Config.mapAttribution,
                maxZoom: Config.maxZoom || 18,
                noWrap: true
            });
        this._baseTileLayer.addTo(this._map);
        // Initialize the country layer
        this._countryLayer = new CountryLayer(this._map);
        // Initialize markers layer
        this._markersLayer = L.layerGroup();
        this._markersLayer.addTo(this._map);
        // Initialize particle layer
        this._particleLayer = new DotLayer();
        this._particleLayer.addTo(this._map);
        // Initialize the label layer
        this._labelLayer = L.tileLayer(
            mapUrlBase + 'dark_only_labels/{z}/{x}/{y}.png',
            {
                maxZoom: Config.maxZoom || 18,
                noWrap: true,
                zIndex: 10
            });
        if (this._showingLabels) {
            this._labelLayer.addTo(this._map);
        }
    },

    _init : function(dates) {
        this._dates = dates;
        // init app
        this._initUI();
        this._initMap();
        this._initLayers();
        // set initial state
        this._onBrightnessSlide();
        this._onSpeedSlide();
        this._onPathSlide();
        // begin
        this._update();
    },

    /**
     * Application startup.
     */
    start: function () {
        // Fetch the dates available + relay count for each date
        $.get('/dates',this._init.bind(this));
    }

});

exports.App = App;
