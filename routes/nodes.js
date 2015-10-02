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
var router = express.Router();
var MathUtil = require('../util/mathutil');
var moment = require('moment');
var RelayDB = require('../db/relay');
var DBUtil = require('../db/db_utils');

/**
 * GET /nodes/:nodeid
 */
router.get('/:nodeid', function(req, res) {
    var momentDate = moment(req.params.nodeid);
    var day = momentDate.date();    // date == day of month, day == day of week.
    var month = momentDate.month() + 1; // indexed from 0?
    var year = momentDate.year();
    var sqlDate = DBUtil.getMySQLDate(year,month,day);
    RelayDB.get(sqlDate,function(relays) {
        // Aggregate on equal lat/lon
        var buckets = {};
        Object.keys(relays).forEach(function(id) {
            var key = relays[id].lat.toString() + relays[id].lng.toString();
            var bucket = buckets[key] || [];
            bucket.push(id);
            buckets[key] = bucket;
        });
        var i = 0;
        var aggregatedRelayData = Object.keys(buckets).map(function(latlon) {
            var ids = buckets[latlon];
            var totalBW = 0;
            ids.forEach(function(id){
                totalBW += relays[id].bandwidth;
            });
            return {
                id : 'aggregate_' + i++,
                lat : relays[ids[0]].lat,
                lng : relays[ids[0]].lng,
                bandwidth : totalBW,
                relays : ids.map(function(id) { return relays[id]; })
            };
        });
        var aggregatedBandwidth = aggregatedRelayData.map(function(a) { return a.bandwidth; });
        var aggregatedBandwidthExtends = MathUtil.minmax(aggregatedBandwidth);
        var payload = {
            objects : aggregatedRelayData.map(function(aggregate) {
                return {
                    circle : {
                        coordinates : [aggregate.lat,aggregate.lng],
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
    }, function() {
        res.status(500).send('Node data could not be retrieved.');
    });
});

module.exports = router;
