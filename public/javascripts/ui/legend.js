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

    var LegendTemplate = require('../templates/legend');

    function _createRamp(increments,ramp) {
        var i;
        var $ramp = $('<div class="legend-ramp-container""></div>');
        var colorRamp = d3.scale.sqrt()
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
