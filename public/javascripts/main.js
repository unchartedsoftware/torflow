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

(function() {

    'use strict';

    var IS_MOBILE = require('./util/mobile').IS_MOBILE;

    var ParticleLayer = require('./layers/particlelayer');
    var CountryLayer = require('./layers/countrylayer');
    var MarkerLayer = require('./layers/markerlayer');
    var LabelLayer = require('./layers/labellayer');

    var DateSlider = require('./ui/dateslider');
    var DateChart = require('./ui/datechart');
    var Slider = require('./ui/slider');
    var ToggleBox = require('./ui/togglebox');
    var ButtonGroup = require('./ui/buttongroup');
    var LayerMenu = require('./ui/layermenu');
    var Config = require('./config');

    var ChartTemplate = require('./templates/chart');
    var MainTemplate = require('./templates/main');

    // Map elements
    var _map = null;
    var _particleLayer = null;
    var _markerLayer = null;
    var _countryLayer = null;
    var _labelLayer = null;
    var _baseLayer = null;

    // Date slider which controls which date is currently being visualized.
    var _dateSlider = null;
    var _dateChart = null;

    // Date information object containing all dates and the dates with the
    // min and max bandwidths.
    var _dateInfo = null;

    var _updateNodes = function() {
        var isoDate = _dateSlider.getISODate();
        var nodeCount = _markerLayer.getNodeCount();
        // clear existing data
        _markerLayer.clear();
        _particleLayer.clear();
        // request node data
        d3.json('/nodes/' + encodeURI(isoDate) + '?count=' + nodeCount, function(data) {
            // Create markers
            _markerLayer.set(data);
            // Update particles, if they are different
            _particleLayer.updateNodes(data.nodes, data.bandwidth);
        });
    };

    var _updateCountries = function() {
        var isoDate = _dateSlider.getISODate();
        var countryCount = _countryLayer.getCountryCount();
        // clear existing data
        _countryLayer.clear();
        // request client country count data
        d3.json('/country/' + encodeURI(isoDate) + '?count=' + countryCount, function(histogram) {
            _countryLayer.set(histogram);
        });
    };

    var _update = function() {
        _dateChart.updateDate(_dateSlider.getISODate());
        _countryLayer.updateDate(_dateSlider.getISODate());
        _updateNodes();
        _updateCountries();
    };

    var _redirectDate = function(data) {
        var date = (data.xRange) ? data.xRange.start : moment.utc(data.x, 'MMM Do, YYYY');
        var dateStr = date.format('YYYY-MM-DD');
        if (dateStr !== 'Invalid date') {
            _dateSlider.setDate(dateStr);
        }
    };

    var _createLayerUI = function(layerName,layer) {
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
    };

    var _addFlowControls = function($controlElement, layer) {
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
    };

    var _addMarkerControls = function($controlElement, layer) {
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
                        _updateNodes();
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
    };

    var _addCountryControls = function($controlElement, layer) {
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
                        _updateCountries();
                    }
                }
            });
        $controlElement.find('.layer-control-body')
            .append( countryCountSlider.getElement() ).append('<div style="clear:both;"></div>');
        return $controlElement;
    };

    var _initMain = function() {
        // Create and append the main tempalte
        $(document.body).append( MainTemplate(Config) );
        // If mobile append mobile class
        if (IS_MOBILE) {
            $(document.body).addClass('mobile');
        }
    };

    var _initUI = function() {
        // Grab all relevant elements
        var $mapControls = $('.map-controls');
        var $dateControls = $('.date-controls');
        var $summaryButton = $('.summary-button');
        // Create map controls
        $mapControls.append(_addFlowControls( _createLayerUI('Particles', _particleLayer ), _particleLayer ));
        $mapControls.append(_addMarkerControls( _createLayerUI('Nodes', _markerLayer ), _markerLayer ));
        $mapControls.append(_createLayerUI('Labels', _labelLayer ));
        $mapControls.append(_addCountryControls( _createLayerUI('Top Client Connections', _countryLayer ), _countryLayer ));
        // Create date slider
        _dateSlider = new DateSlider({
            dates: _dateInfo.dates,
            slideStop: function() {
                _update();
            },
            change: function() {
                _dateChart.updateDate(_dateSlider.getISODate());
                _countryLayer.updateDate(_dateSlider.getISODate());
            }
        });
        $dateControls.append(_dateSlider.getElement());
        // Create date / bandwidth histogram
        _dateChart = new DateChart( $dateControls )
            .colorStops(['rgb(153,25,75)','rgb(25,75,153)'])
            .click(_redirectDate)
            .updateDate(_dateSlider.getISODate())
            .data(_dateInfo);
        // Add handlers to summary button
        $summaryButton.click( function() {
            swal({
                title: null,
                text: Config.summary,
                html: true
            });
        });
        // Create outliers dialog
        var $outlierContainer = $( ChartTemplate() )
            .addClass('outlier-chart-container');
        $outlierContainer.appendTo('#main');
        $outlierContainer.draggabilly();
        $outlierContainer.find('.chart-close-button').click(function() {
            $outlierContainer.hide();
        });
        // create country histogram dialog
        var $histogramContainer = $( ChartTemplate() )
            .addClass('date-histogram-container');
        $histogramContainer.appendTo('#main');
        $histogramContainer.draggabilly();
        $histogramContainer.find('.chart-close-button').click(function() {
            $histogramContainer.hide();
        });
    };

    var _initMap = function() {
        // Initialize the map object
        _map = L.map('map', {
            inertia: false,
            zoomControl: false,
            minZoom: 3,
            maxZoom: Config.maxZoom || 18
        });
        _map.setView([40, -42], 4);
        // Initialize zoom controls
        var zoomControls = new L.Control.Zoom({ position: 'topright' });
        zoomControls.addTo(_map);
    };

    var _initLayers = function() {
        // Determine map server
        var mapUrlBase;
        if (Config.localMapServer) {
            mapUrlBase = 'http://' + window.location.host + '/map/';
        } else {
            mapUrlBase ='http://{s}.basemaps.cartocdn.com/';
        }
        // Initialize the baselayer
        _baseLayer = L.tileLayer(
            mapUrlBase + 'dark_nolabels/{z}/{x}/{y}.png',
            {
                attribution: Config.mapAttribution,
                maxZoom: Config.maxZoom || 18,
                noWrap: true
            });
        _baseLayer.addTo(_map);
        // Initialize the country layer
        _countryLayer = new CountryLayer({
            redirect: _redirectDate
        });
        _countryLayer.addTo(_map);
        // Initialize markers layer
        _markerLayer = new MarkerLayer();
        _markerLayer.addTo(_map);
        // Initialize particle layer
        _particleLayer = new ParticleLayer();
        _particleLayer.setBandwidthMinMax(
            _dateInfo.min.bandwidth,
            _dateInfo.max.bandwidth );
        _particleLayer.scaleCountByBandwidth(true);
        _particleLayer.addTo(_map);
        // Initialize the label layer
        _labelLayer = new LabelLayer(
            mapUrlBase + 'dark_only_labels/{z}/{x}/{y}.png',
            {
                maxZoom: Config.maxZoom || 18,
                noWrap: true,
                zIndex: 10,
                opacity: 0.65
            });
        _labelLayer.addTo(_map);
    };

    var _init = function(dateInfo) {
        // Store date info
        _dateInfo = dateInfo;
        // Init app
        _initMain();
        _initMap();
        _initLayers();
        _initUI();
        // Fetch the data for the current date
        _update();
    };

    window.torflow = {
        start: function() {
            // Request dates and intialize the app
            $.get('/dates', _init );
        }
    };

}());
