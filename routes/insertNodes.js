var express = require('express');
var _ = require('underscore');
var request = require('request');
var moment = require('moment');
var ESClient = require('../util/elasticsearch');
var Process = require('../util/process_each');
var UUID = require('../util/uuid');
var RelayData = require('../util/relayData');
var router = express.Router();




/* GET home page. */
router.get('/:index/', function(req, res, next) {
    var index = req.params.index;

    RelayData.processRelayData('Relays.csv',function(data) {

        var objects = Object.keys(data).map(function(id) {
            var element = data[id];
            return {
                Fingerprint : element.fingerprint,
                Name : element.name,
                Gps : element.gps.lat + '/' + element.gps.lon,
                Ip : element.ip,
                Port : element.orport,
                Bandwidth : element.observedbw
            };
        });

        var insertStats = {
            success : 0,
            fail : 0,
            errors : []
        };
        var onComplete = function() {
            res.send(insertStats);
        };

        Process.each(objects,function(body,processNext) {
            ESClient.create({
                index: index,
                type: 'relay',
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

    });
});

module.exports = router;
