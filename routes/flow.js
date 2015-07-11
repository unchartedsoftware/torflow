var express = require('express');
var router = express.Router();

var RelayData = require('../util/relayData');

var EDGE_PROBABILITY = 0.03;

/* GET home page. */
router.get('/', function(req, res, next) {
    var aggregateRelayData = RelayData.aggregateCache();


    var edges = [];
    for (var i = 0; i < aggregateRelayData.length; i++) {
        for (var j = 0; j < aggregateRelayData.length; j++) {
            if (i === j) {
                continue;
            }
            if (Math.random() >= 1.0 - EDGE_PROBABILITY) {
                edges.push({
                    source : aggregateRelayData[i].id,
                    target : aggregateRelayData[j].id
                });
            }
        }
    }

    res.send(edges);
});

module.exports = router;
