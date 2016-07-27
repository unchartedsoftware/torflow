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

    var LegendTemplate = require('../templates/legend');

    function _createRamp(increments,ramp) {
        var i;
        var $ramp = $('<div class="legend-ramp-container""></div>');
        var colorRamp = d3.scale.linear()
            .range(ramp)
            .domain([0,1]);
        for ( i=0; i<increments; i++ ) {
            $ramp.append('<div class="legend-increment" style="' +
                'background-color:' + colorRamp(i/increments) + ';' +
                'width:' + ((1/increments)*100) + '%;' +
                '"></div>');
        }
        return $ramp;
    }

    var Legend = function(spec) {
        // parse inputs
        spec = spec || {};
        spec.label = spec.label !== undefined ? spec.label : 'Legend';
        spec.increments = spec.increments || 20;
        spec.ramp = spec.ramp || ['rgb(255,0,0)', 'rgb(0,0,255)'];
        // create elements
        this._$container = $( LegendTemplate(spec) );
        this._$container.find('.layer-legend').append( _createRamp(spec.increments,spec.ramp) );
    };


    Legend.prototype.getElement = function() {
        return this._$container;
    };

    module.exports = Legend;

}());
