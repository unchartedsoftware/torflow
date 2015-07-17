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

var express = require('express');
var ElasticSearch = require('../util/elasticsearch');
var router = express.Router();
var MathUtil = require('../util/mathutil');
var Config = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {

    ElasticSearch.search({
        index: Config.relays_index_name,
        q: '*',
        size:99999999
    }).then(function (body) {
        var hits = body.hits.hits;
        var relayData = {};
        var skipped = [];
        hits.map(function(hit) {
            var data = hit._source;
            var latlngStr = data.Gps;
            var pieces = latlngStr.split('/');
            var lat = parseFloat(pieces[0]);
            var lon = parseFloat(pieces[1]);
            var bw = parseFloat(data.Bandwidth);
            if (isNaN(lat) || isNaN(lon) || isNaN(bw) || (lat === 0 && lon===0)) {
                skipped.push(data);
                return undefined;
            }

            return {
                fingerprint : data.Fingerprint,
                bandwidth : bw,
                name : data.Name,
                gps : {
                    lat: lat,
                    lon: lon
                }
            }
        })
            .filter(function(res) { return res !== undefined; })
            .forEach(function(res) { relayData[res.fingerprint] = res; });

        if (skipped.length > 0) {
            console.error('Skipped ' + skipped.length + ' due to malformatted data');
        }

        // Aggregate on equal lat/lon
        var buckets = {};
        Object.keys(relayData).forEach(function(id) {
            var key = relayData[id].gps.lat.toString() + relayData[id].gps.lon.toString();
            var bucket = buckets[key] || [];
            bucket.push(id);
            buckets[key] = bucket;
        });

        var i = 0;
        var aggregatedRelayData = Object.keys(buckets).map(function(latlon) {
            var ids = buckets[latlon];
            var totalBW = 0;
            ids.forEach(function(id){
                totalBW += relayData[id].bandwidth;
            });
            return {
                id : 'aggregate_' + i++,
                gps : relayData[ids[0]].gps,
                bandwidth : totalBW,
                relays : ids.map(function(id) { return relayData[id]; })
            };
        });

        var aggregatedBandwidth = aggregatedRelayData.map(function(a) { return a.bandwidth; });
        var aggregatedBandwidthExtends = MathUtil.minmax(aggregatedBandwidth);

        var payload = {
            objects : aggregatedRelayData.map(function(aggregate,i) {
                return {
                    circle : {
                        coordinates : [aggregate.gps.lat,aggregate.gps.lon],
                        bandwidth : (aggregate.bandwidth - aggregatedBandwidthExtends.min) / aggregatedBandwidthExtends.max,
                        id : aggregate.id,
                        relays : aggregate.relays
                    }
                };
            })
        };

        // Ensure larger nodes sit on top
        payload.objects = payload.objects.sort(function(o1,o2) {
            return o1.circle.bandwidth - o2.circle.bandwidth;
        });

        res.send(payload);
    }, function (error) {
        console.trace(error.message);
    });
});

module.exports = router;
