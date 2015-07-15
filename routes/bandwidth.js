var express = require('express');
var request = require('request');
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
        url: 'http://localhost:9200/bandwidths_1/_search',
        method: 'POST',
        json: q
    }, function(error, response, body){
        if(error) {
            console.log(error);
            res.send(error);
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
