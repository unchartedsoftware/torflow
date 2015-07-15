var express = require('express');
var _ = require('underscore');
var request = require('request');
var router = express.Router();

var EDGE_PROBABILITY = 0.03;

var getRandomSample = function(arr,percent) {
    var n = Math.round(arr.length * percent);
    return _.sample(arr,n);
};

/* GET home page. */
router.get('/', function(req, res, next) {
    var flow = [];
    request('http://localhost:3000/nodes', function (error, response, body) {
        if (!error && response.statusCode === 200) {

            var data = JSON.parse(body).objects.map(function(d) {
                return d.circle;
            });

            data.forEach(function(source) {
                var nodeBW = source.bandwidth;
                if (nodeBW === 0) { return; }

                var nodesMinusThis = _.partition(data, function(d) {
                    return d.id !== source.id;
                })[0];

                var nodesToLink = _.sample(nodesMinusThis, Math.round(nodesMinusThis.length * EDGE_PROBABILITY));

                nodesToLink.forEach(function(target) {
                    flow.push({
                        source : source.id,
                        target : target.id,
                        bandwidth : source.bandwidth * target.bandwidth
                    });
                });
            });
            res.send(body);
        }
    });
});

module.exports = router;
