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

var _addCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

var _isInteger = function(n) {
   return n % 1 === 0;
};

var addLabels = function(spec) {
    spec = spec || {};
    if ( !spec.svg ) {
        console.error('Must pass svg element to add labels to. Ignoring command.');
        return;
    }
    var svg = spec.svg;
    var label = spec.label || 'missing label';
    var selector = spec.selector || '';
    var $label = null;
    svg.selectAll(selector)
        .on('mousemove', function(d) {
            if ($label) {
                $label.remove();
            }
            var formattedY = _isInteger(d.y) ? _addCommas(d.y) : _addCommas(d.y.toFixed(2));
            if ( $.isFunction(label) ) {
                $label = $( label(d.x, formattedY) );
            } else {
                $label = $(label);
            }
            $( document.body ).append( $label );
            $label.css({
                'left': d3.event.pageX - $label.outerWidth()/2,
                'top': d3.event.pageY - $label.outerHeight()*1.25
            });
        })
        .on('mouseout', function() {
            if ( $label ) {
                $label.remove();
                $label = null;
            }
        });
};

module.exports = {
    addLabels: addLabels
};
