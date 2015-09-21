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

var fs = require('fs');
var readline = require('readline');
var Geo = require('./geo');

var processedCache = null;
var processedAggregateCache = null;

function processRelayData(filename,callback) {
    var relayData = {};     // Fingerprint -> JSON data

    var columns;            // column names

    var firstLine = true;
    var rd = readline.createInterface({
        input: fs.createReadStream(__dirname + '/../data/' + filename),
        output: process.stdout,
        terminal: false
    });

    rd.on('line', function(line) {
        if (firstLine) {
            firstLine = false;
            columns = line.split(',').map(function(column,i) {
                if (i === 5) {
                    return 'gps';
                } else {
                    return column.toLowerCase();
                }
            });
            return;
        }
        var element = {};
        line.split(',').forEach(function(value,i) {
            if (i === 5) {      // gps
                var latlon = value.split('/');
                var lat = parseFloat(latlon[0]);
                var lon = parseFloat(latlon[1]);

                if (isNaN(lat) || isNaN(lon)) {
                    element[columns[i]] = {
                        lat : 0,
                        lon : 0
                    };
                } else {
                    element[columns[i]] = {
                        lat : parseFloat(latlon[0]),
                        lon : parseFloat(latlon[1])
                    };
                }
            } else if ( i === 4) {
                element[columns[i]] = parseFloat(value);    // bandwidth
            } else {
                element[columns[i]] = value;                // string field
            }

        });
        relayData[element.fingerprint] = element;
    });

    rd.on('close',function() {
        callback(relayData);
    });
}

function createPointsFromData(relayData) {
    var points = [];
    Object.keys(relayData).forEach(function(fingerprint) {
        var data = relayData[fingerprint];
        points.push(data.gps);
    });
    return points;
}

function centerPoint(relayData) {
    return Geo.average(createPointsFromData(relayData));
}

function createBandwidthFromData(relayData) {
    var bandwidth = [];
    Object.keys(relayData).forEach(function(fingerprint) {
        bandwidth.push(relayData[fingerprint].observedbw);
    });
    return bandwidth;
}

function cache(data) {
    if (data) {
        processedCache = data;
    } else {
        return processedCache;
    }
}

function aggregateCache(data) {
    if (data) {
        processedAggregateCache = data;
    } else {
        return processedAggregateCache;
    }
}

module.exports.processRelayData = processRelayData;
module.exports.centerPoint = centerPoint;
module.exports.points = createPointsFromData;
module.exports.bandwidth = createBandwidthFromData;
module.exports.cache = cache;
module.exports.aggregateCache = aggregateCache;
