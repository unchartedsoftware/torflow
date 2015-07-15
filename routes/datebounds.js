var express = require('express');
var request = require('request');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var q ={
        size:0,
        "aggs" : {
            "max_date" : {
                "max" : {
                    "field" : "date"
                }
            },
            "min_date" : {
                "min" : {
                    "field" : "date"
                }
            }
        }
    };


    request({
        url: 'http://localhost:9200/bandwidths_1/_search', 
        method: 'POST',
        json: q
    }, function(error, response, body){
        if(error) {
            console.log(error);
            res.send(error);
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
