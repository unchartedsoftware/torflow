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

var ButtonGroup = function(spec) {
    var self = this;
    // parse inputs
    spec = spec || {};
    spec.buttons = spec.buttons || [];
    spec.initialValue = spec.initialValue !== undefined ? spec.initialValue : 0;
    // create container element
    this._$container = $('<div style="text-align:center;">');
    this._$group = $('<div class="btn-group services-btn-group" data-toggle="buttons"></div>');
    // create buttons
    spec.buttons.forEach( function( button, index ) {
        var label = button.label || 'missing-label-' + index;
        var click = button.click || null;
        var className = ( index === spec.initialValue ) ? 'active' : '';
        var $button = $(
            '<label class="btn btn-xs btn-primary hidden-filter-btn '+className+'">' +
                '<input class="hidden-filter-input" type="radio" name="hidden-options">'+ label +
            '</label>');
        $button.click( function() {
            if ($.isFunction(click)) {
                click();
            }
        });
        self._$group.append($button);
    });
    this._$container.append(this._$group);
};

ButtonGroup.prototype.getElement = function() {
    return this._$container;
};

module.exports = ButtonGroup;
