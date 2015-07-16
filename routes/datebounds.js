var express = require('express');
var request = require('request');
var Config = require('../config');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var q ={
        size:0,
        'aggs' : {
            'max_date' : {
                'max' : {
                    'field' : 'date'
                }
            },
            'min_date' : {
                'min' : {
                    'field' : 'date'
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
            var map = {
                min : body.aggregations.min_date,
                max : body.aggregations.max_date
            };
            res.send(map);
        }
    });
});

module.exports = router;
