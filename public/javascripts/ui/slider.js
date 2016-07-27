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

}());
