var express = require('express');
var router = express.Router();
var RelayData = require('../util/relayData');

var relayData = null;
RelayData.processRelayData('Relays.csv', function(data) {
    console.log('Relay data ready!');
    relayData = data;
});

/* GET home page. */
router.get('/', function(req, res, next) {
    var points = RelayData.points(relayData);
    var payload = {
        objects : points.map(function(point) {
            return {
                circle : {
                    coordinates : [point.lat,point.lon]
                }
            };
        })
    };
    res.send(payload);
});

module.exports = router;
