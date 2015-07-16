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
var router = express.Router();

var RelayData = require('../util/relayData');

var EDGE_PROBABILITY = 0.03;

/* GET home page. */
router.get('/', function(req, res, next) {
    var aggregateRelayData = RelayData.aggregateCache();


    var edges = [];
    for (var i = 0; i < aggregateRelayData.length; i++) {
        for (var j = 0; j < aggregateRelayData.length; j++) {
            if (i === j) {
                continue;
            }
            if (Math.random() >= 1.0 - EDGE_PROBABILITY) {
                edges.push({
                    source : aggregateRelayData[i].id,
                    target : aggregateRelayData[j].id
                });
            }
        }
    }

    res.send(edges);
});

module.exports = router;
