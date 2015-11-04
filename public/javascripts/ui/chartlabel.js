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

    var Formatter = require('../util/format');

    var BUFFER = 1;
    var _$label = null;

    var addLabels = function(spec) {
        spec = spec || {};
        if ( !spec.svg ) {
            console.error('Must pass svg element to add labels to. Ignoring command.');
            return;
        }
        var svg = spec.svg;
        var label = spec.label || 'missing label';
        var selector = spec.selector || '';
        svg.selectAll(selector)
            .on('mousemove', function(d) {
                if (!_$label) {
                    // if label doesn't already exist, create it
                    var formattedY = Formatter.format(d.y);
                    if ( $.isFunction(label) ) {
                        _$label = $( label(d.x, formattedY, d) );
                    } else {
                        _$label = $(label);
                    }
                    $( document.body ).append( _$label );
                }
                var left = d3.event.pageX - _$label.outerWidth()/2;
                var top = d3.event.pageY - _$label.outerHeight()*1.25;
                if (left + _$label.outerWidth() + BUFFER > window.innerWidth) {
                    left = window.innerWidth - _$label.outerWidth() - BUFFER;
                }
                if (left < BUFFER) {
                    left = BUFFER;
                }
                if (top + _$label.outerHeight() + BUFFER> window.innerWidth) {
                    left = window.innerWidth - _$label.outerHeight() - BUFFER;
                }
                if (top < BUFFER) {
                    top = BUFFER;
                }
                // position label
                _$label.css({
                    'left': left,
                    'top': top
                });
            })
            .on('mouseout', function() {
                if ( _$label ) {
                    _$label.remove();
                    _$label = null;
                }
            })
            .on('mouseleave', function() {
                if ( _$label ) {
                    _$label.remove();
                    _$label = null;
                }
            });
    };

    module.exports = {
        addLabels: addLabels
    };

}());
