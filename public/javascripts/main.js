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

// Reduce counts if on mobile device
var IS_MOBILE = require('./util/mobile').IS_MOBILE;
var NODE_COUNT = IS_MOBILE ? Config.node_count_mobile : Config.node_count;
var COUNTRY_COUNT = IS_MOBILE ? Config.country_count_mobile : Config.country_count;

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
    _currentDate : null,
    _currentHistogram : null,

    _clear : function() {
        this._markerLayer.clear();
        this._countryLayer.clear();
        this._particleLayer.clear();
    },

    _update : function( isoDate ) {
        this._clear();
        this._fetch(isoDate);
    },

    _fetch : function(isoDateStr) {

        function handleNodes(data) {
            // Create markers
            self._markerLayer.set(data);
            // Update particles, if they are different
            if ( oldNodes !== self._currentNodeData ) {
                self._particleLayer.updateNodes(data.nodes);
            }
        }

        function handleHistogram(histogram) {
            self._countryLayer.set(histogram);
        }

        var oldNodes = this._currentNodeData,
            self = this;

        if (this._currentDate === isoDateStr) {
            // selected current date, simply refresh layers
            handleNodes(this._currentNodeData);
            handleHistogram(this._currentHistogram);
        } else {
            // new date, request new information
            d3.json('/nodes/' + encodeURI(isoDateStr) + '?count=' + NODE_COUNT, function (data) {
                self._currentNodeData = data;
                handleNodes(data);
            });
            d3.json('/country/' + encodeURI(isoDateStr) + '?count=' + COUNTRY_COUNT,function(histogram) {
                self._currentHistogram = histogram;
                handleHistogram(histogram);
            });
            self._currentDate = isoDateStr;
        }
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
                step: (layer.getParticleCountMax() - layer.getParticleCountMin())/10,
                initialValue: layer.getParticleCount(),
                formatter: function( value ) {
                    return (value/1000) + 'K';
                },
                slideStop: function( event ) {
                    if ( event.value !== layer.getParticleCount() ) {
                        layer.setParticleCount( event.value );
                    }
                }
            }),
            scaleByZoomToggle = new ToggleBox({
                label: 'Scale by Zoom',
                initialValue: layer.scaleByZoom(),
                enabled: function() {
                    layer.scaleByZoom(true);
                },
                disabled: function() {
                    layer.scaleByZoom(false);
                }
            }),
            servicesButtonGroup = new ButtonGroup({
                intialValue: 0,
                buttons: [
                    {
                        label: 'All',
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
                        label: 'General Purpose',
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
            .append( servicesButtonGroup.getElement() ).append('<div style="clear:both;"></div>');
        return $controlElement;
    },

    _addMarkerControls : function($controlElement,layer) {
        var scaleByBandwidthToggle = new ToggleBox({
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
            .append( scaleByBandwidthToggle.getElement() ).append('<div style="clear:both;"></div>');
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
        $mapControls.append( this._addFlowControls( this._createLayerUI('Flow', this._particleLayer ), this._particleLayer ) );
        $mapControls.append( this._addMarkerControls( this._createLayerUI('Nodes', this._markerLayer ), this._markerLayer ) );
        $mapControls.append( this._createLayerUI('Labels', this._labelLayer ) );
        $mapControls.append( this._createLayerUI('Countries', this._countryLayer ) );
        // create date slider
        this._dateSlider = new DateSlider({
            dates: this._dates,
            slideStop: function() {
                var isoDate = self._dateSlider.getISODate();
                self._update(isoDate);
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
        $drilldownContainer.find('.drilldown-close').click(function() {
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
                var dateStr = moment(data.date).format('YYYY-MM-DD');
                if (dateStr !== 'Average') {
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

    _init : function(dates) {
        this._dates = dates;
        // init app
        this._initIndex();
        this._initMap();
        this._initLayers();
        this._initUI();
        // begin
        this._update(this._dateSlider.getISODate());
    },

    start: function () {
        // Fetch the dates available + relay count for each date
        $.get('/dates',this._init.bind(this));
    }

});

exports.App = App;
