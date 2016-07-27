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

    var ToggleBoxTemplate = require('../templates/togglebox');

    var ToggleBox = function(spec) {
        var self = this;
        // parse inputs
        spec = spec || {};
        spec.label = spec.label !== undefined ? spec.label : 'missing-label';
        spec.initialValue = spec.initialValue !== undefined ? spec.initialValue : true;
        this.onEnabled = spec.enabled || null;
        this.onDisabled = spec.disabled || null;
        this.onToggle = spec.toggled || null;
        // set initial state
        this._enabled = spec.initialValue;
        // create elements
        this._$container = $( ToggleBoxTemplate(spec) );
        this._$toggleIcon = this._$container.find('i.fa');
        this._$toggleBox = this._$container.find('.layer-toggle');
        // create and attach callbacks
        this._enable = function() {
            self._$toggleIcon.removeClass('fa-square-o');
            self._$toggleIcon.addClass('fa-check-square-o');
        };
        this._disable = function() {
            self._$toggleIcon.removeClass('fa-check-square-o');
            self._$toggleIcon.addClass('fa-square-o');
        };
        this._$toggleBox.click( function() {
            self._enabled = !self._enabled;
            if (self._enabled) {
                self._enable();
                if ($.isFunction(self.onEnabled)) {
                    self.onEnabled();
                }
            } else {
                self._disable();
                if ($.isFunction(self.onDisabled)) {
                    self.onDisabled();
                }
            }
            if ($.isFunction(self.onToggle)) {
                self.onToggle(self._enabled);
            }
        });
    };

    ToggleBox.prototype.getElement = function() {
        return this._$container;
    };

    module.exports = ToggleBox;

}());
