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
    _dateLabel : null,
    _currentNodeData : null,
    _currentDate : null,
    _currentHistogram : null,

    _clear : function() {
        this._markerLayer.clear();
        this._countryLayer.clear();
        this._particleLayer.clear();
    },

    _latLngToNormalizedCoord : function(latLng) {
        var px = this._map.project( latLng ),
            dim = Math.pow( 2, this._map.getZoom() ) * 256;
        return {
            x: px.x / dim,
            y: ( dim - px.y ) / dim
        };
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
            d3.json('/nodes/' + encodeURI(isoDateStr), function (data) {
                self._currentNodeData = data;
                handleNodes(data);
            });
            d3.json('/country/' + encodeURI(isoDateStr),function(histogram) {
                self._currentHistogram = histogram;
                handleHistogram(histogram);
            });
            self._currentDate = isoDateStr;
        }
    },

    _createLayerUI : function(layerName,layer) {
        var $controls = $(
                '<div class="map-control-element"></div>'),
            $head = $('<div class="layer-control-head"></div>'),
            $body = $('<div class="layer-control-body"></div>'),
            $title = $('<div class="layer-title">'+layerName+'</div>'),
            $toggleIcon = $( !layer.isHidden() ? '<i class="fa fa-check-square-o">' : '<i class="fa fa-square-o">'),
            $toggle = $('<div class="layer-toggle"></div>'),
            $opacitySlider = $(
                '<div class="layer-control">' +
                    '<Label class="layer-control-label">Opacity</Label>' +
                    '<input class="opacity-slider slider" ' +
                        'type="text" data-slider-min="'+0+'" ' +
                        'data-slider-max="'+1+'" ' +
                        'data-slider-step="0.01" ' +
                        'data-slider-value="'+layer.getOpacity()+'"/>'+
                '</div>');
        $toggle.append( $toggleIcon );
        $head.click( function() {
            if ( layer.isHidden() ) {
                layer.show();
                $toggleIcon.removeClass('fa-square-o');
                $toggleIcon.addClass('fa-check-square-o');
            } else {
                layer.hide();
                $toggleIcon.removeClass('fa-check-square-o');
                $toggleIcon.addClass('fa-square-o');
            }
        });

        $opacitySlider.find('.slider').slider({ tooltip: 'hide' });
        $opacitySlider.find('.slider').on('slide', function( event ) {
            layer.setOpacity( event.value );
        });
        $head.append( $toggle ).append( $title );
        $body.append( $opacitySlider ).append('<div style="clear:both;"></div>');
        $controls.append( $head ).append( $body );
        return $controls;
    },

    _addFlowControls : function($controlElement, layer) {
        var $speedSlider = $(
                '<div class="layer-control">' +
                    '<Label class="layer-control-label">Particle Speed</Label>' +
                    '<input class="speed-slider slider" ' +
                        'type="text" data-slider-min="'+Config.particle_speed_min_factor+'" ' +
                        'data-slider-max="'+Config.particle_speed_max_factor+'" ' +
                        'data-slider-step="0.01" ' +
                        'data-slider-value="'+layer.getSpeed()+'"/>'+
                '</div>'),
            $pathSlider = $(
                '<div class="layer-control">' +
                    '<Label class="layer-control-label">Path Width</Label>' +
                    '<input class="path-slider slider" ' +
                        'type="text" data-slider-min="'+Config.particle_min_offset+'" ' +
                        'data-slider-max="'+Config.particle_max_offset+'" ' +
                        'data-slider-step="0.01" ' +
                        'data-slider-value="'+layer.getPathOffset()+'"/>'+
                '</div>'),
            $particleSizeSlider = $(
                '<div class="layer-control">' +
                    '<Label class="layer-control-label">Particle Size</Label>' +
                    '<input class="path-slider slider" ' +
                        'type="text" data-slider-min="'+0+'" ' +
                        'data-slider-max="'+4+'" ' +
                        'data-slider-step="1" ' +
                        'data-slider-value="'+1+'"/>'+
                '</div>'),
            $servicesButtons = $(
                // '<div>'+
                //     '<Label class="layer-control-label">Services</Label>' +
                //     '<div style="clear:both;"></div>' +
                    '<div class="btn-group services-btn-group" data-toggle="buttons">' +
                        '<label class="btn btn-xs btn-primary active hidden-filter-btn active">' +
                            '<input class="hidden-filter-input" type="radio" name="hidden-options" autocomplete="off" hidden-id="all">All' +
                        '</label>' +
                        '<label class="btn btn-xs btn-primary hidden-filter-btn">' +
                            '<input class="hidden-filter-input" type="radio" name="hidden-options" autocomplete="off" hidden-id="hidden">Hidden Services' +
                        '</label>' +
                        '<label class="btn btn-xs btn-primary hidden-filter-btn">' +
                            '<input class="hidden-filter-input" type="radio" name="hidden-options" autocomplete="off" hidden-id="general">General Purpose' +
                        '</label>' +
                    '</div>');// +
                // '</div>');

        $speedSlider.find('.slider').slider({ tooltip: 'hide' });
        $speedSlider.find('.slider').on('slideStop', function( event ) {
            layer.setSpeed( event.value );
        });

        $pathSlider.find('.slider').slider({ tooltip: 'hide' });
        $pathSlider.find('.slider').on('slide', function( event ) {
            layer.setPathOffset( event.value );
        });

        $particleSizeSlider.find('.slider').slider({ tooltip: 'hide' });


        $servicesButtons.find('.hidden-filter-btn').change(function() {
            var checkedRadioBtn = $servicesButtons.find('.services-btn-group').find('.active > input');
            var checkedState = checkedRadioBtn.attr('hidden-id');
            if (checkedState === 'all') {
                layer.showTraffic('all');
            } else if (checkedState === 'hidden') {
                layer.showTraffic('hidden');
            } else if (checkedState === 'general') {
                layer.showTraffic('general');
            }
        });

        $controlElement.find('.layer-control-body')
            .append( $speedSlider ).append('<div style="clear:both;"></div>')
            .append( $pathSlider ).append('<div style="clear:both;"></div>')
            .append( $particleSizeSlider ).append('<div style="clear:both;"></div>')
            .append( $servicesButtons ).append('<div style="clear:both;"></div>');
        return $controlElement;
    },

    _addMarkerControls : function($controlElement,layer) {
        var $toggleIcon = $( layer.scaleByBandwidth() ? '<i class="fa fa-check-square-o">' : '<i class="fa fa-square-o">'),
            $toggle = $('<div class="layer-toggle"></div>'),
            $control = $(
                '<div class="layer-control">' +
                    '<Label style="float:left" class="layer-control-label">Scale by bandwidth</Label>' +
                '</div>');

        $toggle.append($toggleIcon);
        $control.append($toggle);
        $toggle.click( function() {
            if ( layer.scaleByBandwidth() ) {
                layer.scaleByBandwidth(false);
                $toggleIcon.removeClass('fa-check-square-o');
                $toggleIcon.addClass('fa-square-o');
            } else {
                layer.scaleByBandwidth(true);
                $toggleIcon.removeClass('fa-square-o');
                $toggleIcon.addClass('fa-check-square-o');
            }
        });

        $controlElement.find('.layer-control-body')
            .append( $control ).append('<div style="clear:both;"></div>');
        return $controlElement;
    },

    _initIndex : function() {
        var totalDays = this._dates.length;
        var extendedConfig = _.extend(Config,{
            maxIndex : totalDays-1,
            defaultDate : this._getFriendlyDate(totalDays-1)
        });

        this._element = $(document.body).append(Template(extendedConfig));
    },

    _initUI : function() {

        var $map = $('.map-controls');
        $map.append( this._addFlowControls( this._createLayerUI('Flow', this._particleLayer ), this._particleLayer ) );
        $map.append( this._addMarkerControls( this._createLayerUI('Nodes', this._markerLayer ), this._markerLayer ) );
        $map.append( this._createLayerUI('Labels', this._labelLayer ) );
        $map.append( this._createLayerUI('Countries', this._countryLayer ) );

        this._dateLabel = this._element.find('#date-label');
        this._dateSlider = this._element.find('#date-slider').slider({ tooltip: 'hide' });

        this._dateSlider.on('slideStop', this._update.bind(this));
        this._dateSlider.on('slide',this._onDateSlide.bind(this));

        this._element.find('#summary-button').click( function() {
            swal({
                title: null,
                text: Config.summary,
                html: true,
                confirmButtonColor: '#149BDF'
            });
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
        this._countryLayer = new CountryLayer();
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
                zIndex: 10
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
        // set initial state
        // this._onBrightnessSlide();
        // this._onSpeedSlide();
        // this._onPathSlide();
        // begin
        this._update();
    },

    start: function () {
        // Fetch the dates available + relay count for each date
        $.get('/dates',this._init.bind(this));
    }

});

exports.App = App;
