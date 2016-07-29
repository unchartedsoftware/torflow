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

    var IS_MOBILE = require('./util/mobile').IS_MOBILE;

    var ParticleLayer = require('./layers/particlelayer');
    var CountryLayer = require('./layers/countrylayer');
    var MarkerLayer = require('./layers/markerlayer');
    var LabelLayer = require('./layers/labellayer');
    var BaseLayer = require('./layers/baselayer');

    var DateSlider = require('./ui/dateslider');
    var DateChart = require('./ui/datechart');
    var Slider = require('./ui/slider');
    var ToggleBox = require('./ui/togglebox');
    var ButtonGroup = require('./ui/buttongroup');
    var LayerMenu = require('./ui/layermenu');
    var Config = require('./config');

    var ChartTemplate = require('./templates/chart');
    var MainTemplate = require('./templates/main');
    var AboutTemplate = require('./templates/about');

    var Formatter = require('./util/format');

    // Map elements
    var _map = null;
    var _particleLayer = null;
    var _markerLayer = null;
    var _countryLayer = null;
    var _labelLayer = null;
    var _baseLayer = null;
    var _layerMenus = {};
    var _containers = {};

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

    var _createBaseLayerUI = function(layerName,layer) {
        var layerMenu = new LayerMenu({
                layer: layer,
                label: layerName
            }),
            brightnessSlider = new Slider({
                label: 'Brightness',
                min: 0.01,
                max: 3,
                step: 0.01,
                initialValue: layer.getBrightness(),
                change: function( event ) {
                    layer.setBrightness( event.value.newValue );
                }
            });
        layerMenu.getBody().append( brightnessSlider.getElement() ).append('<div style="clear:both;"></div>');
        _layerMenus[layerName] = layerMenu;
        return layerMenu.getElement();
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
        _layerMenus[layerName] = layerMenu;
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
                    if ( value >= 1000000 ) {
                        return Formatter.format(value/1000000) + 'M';
                    }
                    return Formatter.format(value/1000) + 'K';
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
            hiddenRGB = 'rgb(' +
                Math.floor(Config.particle_hidden_color[0]*255+50) + ',' +
                Math.floor(Config.particle_hidden_color[1]*255+50) + ',' +
                Math.floor(Config.particle_hidden_color[2]*255+50) + ')',
            generalRGB = 'rgb(' +
                Math.floor(Config.particle_general_color[0]*255+50) + ',' +
                Math.floor(Config.particle_general_color[1]*255+50) + ',' +
                Math.floor(Config.particle_general_color[2]*255+50) + ')',
            servicesButtonGroup = new ButtonGroup({
                intialValue: 0,
                buttons: [
                    {
                        label: 'All Services',
                        click: function() {
                            layer.showTraffic('all');
                        },
                        leftColor: hiddenRGB,
                        rightColor: generalRGB
                    },
                    {
                        label: 'Hidden Services',
                        click: function() {
                            layer.showTraffic('hidden');
                        },
                        color: hiddenRGB
                    },
                    {
                        label: 'General Services',
                        click: function() {
                            layer.showTraffic('general');
                        },
                        color: generalRGB
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
                    return Formatter.format(Math.round(value));
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
        // Prevent mobile scrolling
        $(document.body).on('touchmove', function(event) {
            event.preventDefault();
        });
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
        var $githubButton = $('.github-button');
        var $shareButton = $('.share-button');
        // Create map controls
        if (_particleLayer.getContext()) {
            $mapControls.append(_addFlowControls( _createLayerUI('Particles', _particleLayer ), _particleLayer ));
        }
        $mapControls.append(_addMarkerControls( _createLayerUI('Nodes', _markerLayer ), _markerLayer ));
        $mapControls.append(_createLayerUI('Labels', _labelLayer ));
        $mapControls.append(_addCountryControls( _createLayerUI('Top Client Connections', _countryLayer ), _countryLayer ));
        $mapControls.append(_createBaseLayerUI('Base Map', _baseLayer ));
        // Minimize menus by default
        _.forIn( _layerMenus, function(menu) {
            menu.minimize();
        });
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
            .colorStops(Config.bandwidth_color_ramp)
            .click(_redirectDate)
            .updateDate(_dateSlider.getISODate())
            .title('Bandwidth Over Time')
            .data(_dateInfo);
        // Create outliers dialog
        var $outlierContainer = $( ChartTemplate() )
            .addClass('outlier-chart-container');
        $outlierContainer.appendTo('.main');
        $outlierContainer.find('.chart-close-button').click(function() {
            $outlierContainer.hide();
        });
        // Create country histogram dialog
        var $histogramContainer = $( ChartTemplate() )
            .addClass('date-histogram-container');
        $histogramContainer.appendTo('.main');
        $histogramContainer.find('.chart-close-button').click(function() {
            $histogramContainer.hide();
        });
        // Create country histogram dialog
        var $summaryContainer = $( ChartTemplate() )
            .addClass('summary-container');
        $summaryContainer.appendTo('.main');
        $summaryContainer.find('.chart-close-button').click(function() {
            $summaryContainer.hide();
        });
        // Add summary content
        $summaryContainer.find('.chart-content')
            .append(IS_MOBILE ? Config.summary_mobile : Config.summary);

        // Create about button
        var $aboutButton = $(
            '<div class="about-button large-button">' +
                    '<i class="fa fa-info"></i>' +
            '</div>');
        $aboutButton.click(function() {
            window.open('/about', '_blank');
        });
        $summaryContainer.append($aboutButton);
        // Add handler to summary button
        $summaryButton.click( function() {
            $outlierContainer.hide();
            $histogramContainer.hide();
            $summaryContainer.show();
        });
        // add handler to github button
        $githubButton.click( function() {
            window.open('https://github.com/unchartedsoftware/torflow', '_blank');
        });
        //add handler to share button
        var $shareContainer = $( ChartTemplate() )
            .addClass('share-container');
        $shareContainer.appendTo('.main');
        $shareContainer.find('.chart-close-button').click(function() {
            $shareContainer.hide();
        });
        // Add share content
        $shareContainer.find('.chart-content').jsSocials({
            shareIn: "popup",
            shares: ["twitter", "facebook", "googleplus", "linkedin", "pinterest"],
            on: {
                click: function() {
                    $shareContainer.hide();
                }
            }
        });



        $shareButton.click(function() {
           $shareContainer.show();
        });

        // Store containers
        _containers['outliers'] = $outlierContainer;
        _containers['histogram'] = $histogramContainer;
        _containers['summary'] = $summaryContainer;
        // Enable draggable containers on desktop
        if (!IS_MOBILE) {
            $outlierContainer.draggabilly();
            $histogramContainer.draggabilly();
            $summaryContainer.draggabilly();
        }
    };

    var _buildMapLocQueryParam = function() {
        var center = _map.getCenter();
        return center.lng + ',' + center.lat + ',' + _map.getZoom();
    };

    var _updateMapLocUrl = function() {
        var hash = window.location.hash;
        var mapLocIndex = hash.indexOf('ML=');
        var endIndex;

        if(hash.indexOf('?') < 0) {
            hash = hash + '?ML=' + _buildMapLocQueryParam();
        } else if(mapLocIndex < 0) {
            hash = hash + '&ML=' + _buildMapLocQueryParam();
        } else {
            endIndex = hash.indexOf('&', mapLocIndex);
            if(endIndex < 0) {
                endIndex = hash.length;
            }

            hash = hash.replace(hash.substring(mapLocIndex, endIndex), 'ML=' + _buildMapLocQueryParam())
        }


        window.location.hash = hash;
    };

    var getMapLocFromUrl = function () {
        var zoom;
        var center = [0,0];
        var hash = window.location.hash;
        var mapLocIndex = hash.indexOf('ML=');
        var endIndex, mapLocStr;
        if (mapLocIndex > 0) {
            endIndex = hash.indexOf('&', mapLocIndex);
            if (endIndex < 0) {
                endIndex = hash.length;
            }
            mapLocStr = hash.substring(mapLocIndex + 3, endIndex);
            var items = mapLocStr.split(',');
            if (items.length === 3) {
                zoom = parseInt(items[2], 10);
                center[0] = parseFloat(items[1]);
                center[1] = parseFloat(items[0]);
            }

            if(isNaN(zoom) || isNaN(center[0]) || isNaN(center[1])) {
                return;
            }

            return {zoom:zoom, center:center};
        }
    };
    var _initMap = function() {
        // Initialize the map object
        _map = L.map('map', {
            inertia: false,
            zoomControl: false,
            minZoom: IS_MOBILE ? Config.mobile_zoom.min : Config.desktop_zoom.min,
            maxZoom: Config.maxZoom || 18
        });

        var center = [40, -42];
        var zoom = IS_MOBILE ? Config.mobile_zoom.start : Config.desktop_zoom.start;

        var mapLoc = getMapLocFromUrl();

        if(mapLoc) {
            center = mapLoc.center;
            zoom = mapLoc.zoom;
        }

        _map.setView(center, zoom);
        // Initialize zoom controls
        var zoomControls = new L.Control.Zoom({ position: 'topright' });
        zoomControls.addTo(_map);

        _map.on('moveend', _updateMapLocUrl);
        _map.on('zoomend', _updateMapLocUrl);
    };

    var _initLayers = function() {
        // Determine map server
        var mapUrlBase;
        if (Config.localMapServer) {
            mapUrlBase = '//' + window.location.host + '/map/';
        } else {
            mapUrlBase ='https://cartodb-basemaps-{s}.global.ssl.fastly.net/';
        }
        // Initialize the baselayer
        _baseLayer = new BaseLayer(
            mapUrlBase + 'dark_nolabels/{z}/{x}/{y}.png',
            {
                attribution: Config.mapAttribution,
                maxZoom: Config.maxZoom || 18,
                noWrap: true
            });
        _baseLayer.addTo(_map);
        // Initialize the country layer
        _countryLayer = new CountryLayer({
            redirect: _redirectDate,
            click: function() {
                _containers['summary'].hide();
            }
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

    var _about = function(changeLog) {
        if (IS_MOBILE) {
            $(document.body).addClass('mobile');
        }
        $(document.body).append( AboutTemplate(changeLog) );
    };

    window.torflow = {
        start: function() {
            // Request dates and initialize the app
            $.get('/dates', _init );
        },
        about : function() {
            // request change log and initialize page
            $.get('data/changelog.json', _about );
        }
    };

}());
