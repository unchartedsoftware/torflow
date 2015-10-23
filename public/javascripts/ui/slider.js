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

var SliderTemplate = require('../templates/slider');

var Slider = function(spec) {
    var self = this;
    // parse inputs
    spec = spec || {};
    spec.label = spec.label || 'missing-label';
    spec.min = spec.min !== undefined ? spec.min : 0.0;
    spec.max = spec.max !== undefined ? spec.max : 1.0;
    spec.step = spec.step !== undefined ? spec.step : 0.1;
    spec.initialValue = spec.initialValue !== undefined ? spec.initialValue : 0.1;
    this._formatter = spec.formatter || function(value) {
        return value.toFixed(2);
    };
    spec.initialFormattedValue = this._formatter(spec.initialValue);
    // create container element
    this._$container = $( SliderTemplate(spec) );
    this._$label = this._$container.find('.control-value-label');
    // create slider and attach callbacks
    this._$slider = this._$container.find('.slider');
    this._$slider.slider({ tooltip: 'hide' });
    if ($.isFunction(spec.slideStart)) {
        this._$slider.on('slideStart', spec.slideStart);
    }
    if ($.isFunction(spec.slideStop)) {
        this._$slider.on('slideStop', spec.slideStop);
    }
    if ($.isFunction(spec.change)) {
        this._$slider.on('change', spec.change);
    }
    if ($.isFunction(spec.slide)) {
        this._$slider.on('slide', spec.slide);
    }
    this._$slider.on('change', function( event ) {
        self._$label.text( self._formatter(event.value.newValue) );
    });
};

Slider.prototype.getElement = function() {
    return this._$container;
};

module.exports = Slider;
