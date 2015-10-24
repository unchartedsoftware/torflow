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

var ParticleLayer = require('./layers/particlelayer');
var CountryLayer = require('./layers/countrylayer');
var MarkerLayer = require('./layers/markerlayer');
var DateSlider = require('./ui/dateslider');
var Slider = require('./ui/slider');
var ToggleBox = require('./ui/togglebox');
var ButtonGroup = require('./ui/buttongroup');
var LayerMenu = require('./ui/layermenu');
var Config = require('./config');
var Template = require('./templates/main');

/**
 * Creates the TorFlow front-end app
 * @constructor
 */
var App = function() {};

App.prototype = _.extend(App.prototype, {

    _particleLayer : null,
    _markerLayer : null,
    _countryLayer : null,
    _map : null,
    _element : null,
    _currentNodeData : null,
    _currentHistogram : null,

    _update : function() {
        this._updateNodes();
        this._updateCountries();
    },

    _updateNodes : function() {
        var self = this;
        var isoDate = this._dateSlider.getISODate();
        var nodeCount = self._markerLayer.getNodeCount();
        // clear existing data
        this._markerLayer.clear();
        this._particleLayer.clear();
        // request node data
        d3.json('/nodes/' + encodeURI(isoDate) + '?count=' + nodeCount, function(data) {
            self._currentNodeData = data;
            // Create markers
            self._markerLayer.set(data);
            // Update particles, if they are different
            self._particleLayer.updateNodes(data.nodes, data.bandwidth);
        });
    },

    _updateCountries : function() {
        var self = this;
        var isoDate = this._dateSlider.getISODate();
        var countryCount = self._countryLayer.getCountryCount();
        // clear existing data
        this._countryLayer.clear();
        // request client country count data
        d3.json('/country/' + encodeURI(isoDate) + '?count=' + countryCount, function(histogram) {
            self._currentHistogram = histogram;
            self._countryLayer.set(histogram);
        });
    },

    _createLayerUI : function(layerName,layer) {
        var layerMenu = new LayerMenu({
                layer: layer,
                label: layerName
            }),
            opacitySlider = new Slider({
                label: 'Opacity',
                min: 0,
                max: 1,
                step: 0.01,
                initialValue: layer.getOpacity(),
                change: function( event ) {
                    layer.setOpacity( event.value.newValue );
                }
            });
        layerMenu.getBody().append( opacitySlider.getElement() ).append('<div style="clear:both;"></div>');
        return layerMenu.getElement();
    },

    _addFlowControls : function($controlElement, layer) {
        var speedSlider = new Slider({
                label: 'Particle Speed',
                min: Config.particle_speed_min_factor,
                max: Config.particle_speed_max_factor,
                step: 0.01,
                initialValue: layer.getSpeed(),
                slideStop: function( event ) {
                    layer.setSpeed( event.value );
                }
            }),
            pathSlider = new Slider({
                label: 'Path Width',
                min: Config.particle_min_offset,
                max: Config.particle_max_offset,
                step: 0.01,
                initialValue: layer.getPathOffset(),
                change: function( event ) {
                    layer.setPathOffset( event.value.newValue );
                }
            }),
            particleSizeSlider = new Slider({
                label: 'Particle Size',
                min: Config.particle_min_size,
                max: Config.particle_max_size,
                step: 1,
                initialValue: layer.getParticleSize(),
                change: function( event ) {
                    layer.setParticleSize( event.value.newValue );
                }
            }),
            particleCountSlider = new Slider({
                label: 'Particle Count',
                min: layer.getParticleCountMin(),
                max: layer.getParticleCountMax(),
                step: (layer.getParticleCountMax() - layer.getParticleCountMin()) / 100,
                initialValue: layer.getUnscaledParticleCount(),
                formatter: function( value ) {
                    return (value/1000) + 'K';
                },
                slideStop: function( event ) {
                    if ( event.value !== layer.getUnscaledParticleCount() ) {
                        layer.setParticleCount( event.value );
                    }
                }
            }),
            scaleByZoomToggle = new ToggleBox({
                label: 'Scale Size by Zoom',
                initialValue: layer.scaleSizeByZoom(),
                enabled: function() {
                    layer.scaleSizeByZoom(true);
                },
                disabled: function() {
                    layer.scaleSizeByZoom(false);
                }
            }),
            scaleByBandwidthToggle = new ToggleBox({
                label: 'Scale Count by Bandwidth',
                initialValue: layer.scaleCountByBandwidth(),
                enabled: function() {
                    layer.scaleCountByBandwidth(true);
                },
                disabled: function() {
                    layer.scaleCountByBandwidth(false);
                }
            }),
            servicesButtonGroup = new ButtonGroup({
                intialValue: 0,
                buttons: [
                    {
                        label: 'All Services',
                        click: function() {
                            layer.showTraffic('all');
                        }
                    },
                    {
                        label: 'Hidden Services',
                        click: function() {
                            layer.showTraffic('hidden');
                        }
                    },
                    {
                        label: 'General Services',
                        click: function() {
                            layer.showTraffic('general');
                        }
                    }
                ]
            });
        $controlElement.find('.layer-control-body')
            .append( speedSlider.getElement() ).append('<div style="clear:both;"></div>')
            .append( pathSlider.getElement() ).append('<div style="clear:both;"></div>')
            .append( particleSizeSlider.getElement() ).append('<div style="clear:both;"></div>')
            .append( particleCountSlider.getElement() ).append('<div style="clear:both;"></div>')
            .append( scaleByZoomToggle.getElement() ).append('<div style="clear:both;"></div>')
            .append( scaleByBandwidthToggle.getElement() ).append('<div style="clear:both;"></div>')
            .append( servicesButtonGroup.getElement() ).append('<div style="clear:both;"></div>');
        return $controlElement;
    },

    _addMarkerControls : function($controlElement, layer) {
        var self = this;
        var nodeCountSlider = new Slider({
                label: 'Node Count (top n)',
                min: layer.getNodeCountMin(),
                max: layer.getNodeCountMax(),
                step: (layer.getNodeCountMax() - layer.getNodeCountMin()) / 100,
                initialValue: layer.getNodeCount(),
                formatter: function( value ) {
                    return Math.round(value);
                },
                slideStop: function( event ) {
                    if ( event.value !== layer.getNodeCount() ) {
                        layer.setNodeCount( event.value );
                        self._updateNodes();
                    }
                }
            }),
            scaleByBandwidthToggle = new ToggleBox({
                label: 'Scale by Bandwidth',
                initialValue: layer.scaleByBandwidth(),
                enabled: function() {
                    layer.scaleByBandwidth(true);
                },
                disabled: function() {
                    layer.scaleByBandwidth(false);
                }
            });
        $controlElement.find('.layer-control-body')
            .append( nodeCountSlider.getElement() ).append('<div style="clear:both;"></div>')
            .append( scaleByBandwidthToggle.getElement() ).append('<div style="clear:both;"></div>');
        return $controlElement;
    },

    _addCountryControls : function($controlElement, layer) {
        var self = this;
        var countryCountSlider = new Slider({
                label: 'Country Count (top n)',
                min: layer.getCountryCountMin(),
                max: layer.getCountryCountMax(),
                step: (layer.getCountryCountMax() - layer.getCountryCountMin()) / 100,
                initialValue: layer.getCountryCount(),
                formatter: function( value ) {
                    return Math.round(value);
                },
                slideStop: function( event ) {
                    if ( event.value !== layer.getCountryCount() ) {
                        layer.setCountryCount( event.value );
                        self._updateCountries();
                    }
                }
            });
        $controlElement.find('.layer-control-body')
            .append( countryCountSlider.getElement() ).append('<div style="clear:both;"></div>');
        return $controlElement;
    },

    _initIndex : function() {
        this._element = $(document.body).append(Template(Config));
    },

    _initUI : function() {
        var self = this,
            $mapControls = $('.map-controls'),
            $dateControls = $('.date-controls'),
            $drilldownContainer = $('.drilldown-container');
        // create map controls
        $mapControls.append( this._addFlowControls( this._createLayerUI('Particles', this._particleLayer ), this._particleLayer ) );
        $mapControls.append( this._addMarkerControls( this._createLayerUI('Nodes', this._markerLayer ), this._markerLayer ) );
        $mapControls.append( this._createLayerUI('Labels', this._labelLayer ) );
        $mapControls.append( this._addCountryControls( this._createLayerUI('Top Client Connections', this._countryLayer ), this._countryLayer ) );
        // create date slider
        this._dateSlider = new DateSlider({
            dates: this._dates,
            slideStop: function() {
                self._update();
            }
        });
        $dateControls.append(this._dateSlider.getElement());
        // add handlers to summary button
        this._summaryButton = this._element.find('.summary-button');
        this._summaryButton.click( function() {
            swal({
                title: null,
                text: Config.summary,
                html: true
            });
        });
        // add handler to drilldown close buttons
        $drilldownContainer.draggabilly();
        $drilldownContainer.find('.drilldown-close-button').click(function() {
            $drilldownContainer.hide();
        });
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
        var self = this;
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
        this._countryLayer = new CountryLayer({
            redirect: function( data ) {
                var dateStr = moment.utc(data.date, 'MMM Do, YYYY').format('YYYY-MM-DD');
                if (dateStr !== 'Invalid date') {
                    self._dateSlider.setDate(dateStr);
                }
            }
        });
        this._countryLayer.addTo(this._map);
        // Initialize markers layer
        this._markerLayer = new MarkerLayer();
        this._markerLayer.addTo(this._map);
        // Initialize particle layer
        this._particleLayer = new ParticleLayer();
        this._particleLayer.setBandwidthMinMax(
            this._min.bandwidth,
            this._max.bandwidth );
        this._particleLayer.scaleCountByBandwidth(true);
        this._particleLayer.addTo(this._map);
        // Initialize the label layer
        this._labelLayer = L.tileLayer(
            mapUrlBase + 'dark_only_labels/{z}/{x}/{y}.png',
            {
                maxZoom: Config.maxZoom || 18,
                noWrap: true,
                zIndex: 10,
                opacity: 0.65
            });
        this._labelLayer.addTo(this._map);
        this._labelLayer.getOpacity = function() {
            return this.options.opacity;
        };
        this._labelLayer.show = function() {
            this._hidden = false;
            self._map.addLayer(this);
        };
        this._labelLayer.hide = function() {
            this._hidden = true;
            self._map.removeLayer(this);
        };
        this._labelLayer.isHidden = function() {
            return this._hidden;
        };
    },

    _init : function(dates, min, max) {
        this._dates = dates;
        this._min = min;
        this._max = max;
        // init app
        this._initIndex();
        this._initMap();
        this._initLayers();
        this._initUI();
        // begin
        this._update();
    },

    start: function () {
        var self = this;
        $.get('/dates', function(res) {
            self._init(res.dates, res.min, res.max);
        });
    }

});

exports.App = App;
