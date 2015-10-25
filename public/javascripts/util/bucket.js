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

var bucket = function(spec) {
    spec = spec || {};
    var data = spec.data;
    var threshld = spec.threshold || 1;
    var maxBucketSize = spec.maxBucketSize || Math.round(data.length / 100);
    var xExtractor = spec.xExtractor || function(x) { return x; };
    var yExtractor = spec.yExtractor || function(y) { return y; };
    var min = yExtractor( _.min(data, function(value) {
            return yExtractor(value);
        }));
    var max = yExtractor( _.max(data, function(value) {
            return yExtractor(value);
        }));
    var range = max - min;
    var currentX = null;
    var currentY = null;
    var currentCount = 0;
    var buckets = [];
    data.forEach(function(value,index) {
        var x = xExtractor(value,index);
        var y = yExtractor(value,index);
        if ( currentY === null ) {
            currentX = x;
            currentY = y;
            currentCount++;
        } else {
            var current = (( currentY / currentCount ) - min) / range;
            var val = (y - min) / range;
            if ( currentCount === maxBucketSize || Math.abs(val - current) > threshld ) {
                buckets.push({
                    x: currentX / currentCount,
                    y: currentY / currentCount
                });
                currentX = null;
                currentY = null;
                currentCount = 0;
            } else {
                currentX += x;
                currentY += y;
                currentCount++;
            }
        }
    });
    if ( currentY ) {
        buckets.push({
            x: currentX / currentCount,
            y: currentY / currentCount
        });
    }
    this._data = buckets.map(function(bandwidth,index) {
        return {
            bandwidth: bandwidth,
            index: index
        };
    });
    return {
        buckets: buckets,
        min: min,
        max: max
    };
};

module.exports = bucket;
