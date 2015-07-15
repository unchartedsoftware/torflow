var express = require('express');
var _ = require('underscore');
var request = require('request');
var moment = require('moment');
var ESClient = require('../util/elasticsearch');
var Process = require('../util/process_each');
var UUID = require('../util/uuid');
var router = express.Router();

var MIN_SCALE = 0.25;
var MAX_SCALE = 2.50;


/* GET home page. */
router.get('/:index/:numdays', function(req, res, next) {
    var index = req.params.index;
    var numDays = parseInt(req.params.numdays);


    var historicalData = [];

    request('http://localhost:3000/nodes', function (error, response, body) {
        if (!error && response.statusCode === 200) {

            var data = JSON.parse(body).objects.map(function(d) {
                return d.circle;
            });

            data.forEach(function(source) {
                var startDay = moment()
                    .hour(0)
                    .minute(0)
                    .second(0)
                    .millisecond(0)
                    .subtract(numDays, 'days');


                for (var i = 0; i < numDays; i++) {
                    var dayStr = startDay.format();

                    var bwScale = MIN_SCALE + (MAX_SCALE-MIN_SCALE)*Math.random();

                    historicalData.push({
                        id : source.id,
                        date : dayStr,
                        bandwidth : source.bandwidth * bwScale
                    });
                    startDay.add(1,'day');
                }
            });

            var insertStats = {
                success : 0,
                fail : 0,
                errors : []
            };
            var onComplete = function() {
                res.send(insertStats);
            };

            Process.each(historicalData,function(body,processNext) {
                ESClient.create({
                    index: index,
                    type: 'bandwidths',
                    id: UUID.generate(),
                    body: body
                }, function (error, response) {
                    if (error) {
                        insertStats.fail = insertStats.fail+1;
                        errors.push(response);
                    } else {
                        insertStats.success = insertStats.success+1;
                    }
                    processNext();
                });
            }, onComplete);


        }
    });
});

module.exports = router;
