var express = require('express');
var request = require('request');
var Config = require('../config');
var router = express.Router();

/* GET home page. */
router.get('/:day/:month/:year', function(req, res, next) {
    var day = req.params.day;
    var month = req.params.month;
    var year = req.params.year;

    var q ={
        "size":999999999,
        "query" : {
            "range" : {
                "date" : {
                    "from" : year + '-' + month + '-'+ day,
                    "to" : year + '-' + month + '-'+ day
                }
            }
        }
    };


    request({
        url: 'http://' + Config.elasticsearch.host + ':' + Config.elasticsearch.port + '/' + Config.bandwidth_index_name + '/_search',
        method: 'POST',
        json: q
    }, function(error, response, body){
        if(error || body.error) {
            console.log(error || body.error);
            res.status(500).send(error || body.error);
        } else {
            var map = {};
            body.hits.hits.forEach(function(hit) {
                map[hit._source.id] = hit._source.bandwidth;
            });
            res.send(map);
        }
    });
});

module.exports = router;
