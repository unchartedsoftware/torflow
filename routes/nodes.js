var express = require('express');
var router = express.Router();
var RelayData = require('../util/relayData');
var MathUtil = require('../util/mathutil');

var relayData = null;
RelayData.processRelayData('Relays.csv', function(data) {
    console.log('Relay data ready!');
    relayData = data;
});

/* GET home page. */
router.get('/', function(req, res, next) {

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
            totalBW += relayData[id].observedbw;
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
        objects : aggregatedRelayData.map(function(aggregate) {
            return {
                circle : {
                    coordinates : [aggregate.gps.lat,aggregate.gps.lon],
                    bandwidth : (aggregate.bandwidth - aggregatedBandwidthExtends.min) / aggregatedBandwidthExtends.max
                }
            };
        })
    };

    var scaledBandwidths = payload.objects.map(function(o) {
        return o.circle.bandwidth;
    });
    var scaledBandwidthExtents = MathUtil.minmax(scaledBandwidths);


    // Ensure larger nodes sit on top
    payload.objects = payload.objects.sort(function(o1,o2) {
        return o1.circle.bandwidth - o2.circle.bandwidth;
    });
    
    res.send(payload);
});

module.exports = router;
