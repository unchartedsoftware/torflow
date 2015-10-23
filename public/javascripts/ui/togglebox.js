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
