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
