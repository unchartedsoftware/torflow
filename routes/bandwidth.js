/**
* Copyright © 2015 Uncharted Software Inc.
*
* Property of Uncharted™, formerly Oculus Info Inc.
* http://uncharted.software/
*
* Released under the MIT License.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is furnished to do
* so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

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
