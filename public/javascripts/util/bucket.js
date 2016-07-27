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

    var bucket = function(spec) {
        spec = spec || {};
        var data = spec.data;
        var threshold = spec.threshold || 1;
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
        var currentMin = null;
        var buckets = [];
        data.forEach(function(value, index) {
            var x = xExtractor(value, index);
            var y = yExtractor(value, index);
            if ( currentY === null ) {
                currentX = x;
                currentMin = x;
                currentY = y;
                currentCount++;
            } else {
                // compare normalized values
                var currentAvg = currentY / currentCount;
                var current = (currentAvg - min) / range;
                var val = (y - min) / range;
                if ( currentCount === maxBucketSize || Math.abs(val - current) > threshold ) {
                    // push bucket
                    buckets.push({
                        x: currentX / currentCount,
                        y: currentY / currentCount,
                        from: currentMin,
                        to: x
                    });
                    // create fresh bucket
                    currentX = x;
                    currentY = y;
                    currentMin = x;
                    currentCount = 1;
                } else {
                    currentX += x;
                    currentY += y;
                    currentCount++;
                }
            }
        });
        // add last bucket if it was unfinished
        if ( currentY ) {
            buckets.push({
                x: currentX / currentCount,
                y: currentY / currentCount,
                from: currentMin,
                to: xExtractor(data[data.length-1], data.length-1)
            });
        }
        return {
            buckets: buckets,
            min: min,
            max: max
        };
    };

    module.exports = bucket;

}());
