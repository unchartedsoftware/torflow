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
    var bandwidth = RelayData.bandwidth(relayData);
    var bandwidthExtents = MathUtil.minmax(bandwidth);

    var payload = {
        objects : Object.keys(relayData).map(function(fingerprint) {
            return {
                circle : {
                    coordinates : [relayData[fingerprint].gps.lat,relayData[fingerprint].gps.lon],
                    bandwidth : (relayData[fingerprint].observedbw - bandwidthExtents.min) / bandwidthExtents.max
                }
            };
        })
    };
    res.send(payload);
});

module.exports = router;
