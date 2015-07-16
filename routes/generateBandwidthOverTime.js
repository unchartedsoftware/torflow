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
