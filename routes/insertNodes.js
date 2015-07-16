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
