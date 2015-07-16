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
var router = express.Router();

var EDGE_PROBABILITY = 0.03;

var getRandomSample = function(arr,percent) {
    var n = Math.round(arr.length * percent);
    return _.sample(arr,n);
};

/* GET home page. */
router.get('/', function(req, res, next) {
    var flow = [];
    request('http://localhost:3000/nodes', function (error, response, body) {
        if (!error && response.statusCode === 200) {

            var data = JSON.parse(body).objects.map(function(d) {
                return d.circle;
            });

            data.forEach(function(source) {
                var nodeBW = source.bandwidth;
                if (nodeBW === 0) { return; }

                var nodesMinusThis = _.partition(data, function(d) {
                    return d.id !== source.id;
                })[0];

                var nodesToLink = _.sample(nodesMinusThis, Math.round(nodesMinusThis.length * EDGE_PROBABILITY));

                nodesToLink.forEach(function(target) {
                    flow.push({
                        source : source.id,
                        target : target.id,
                        bandwidth : source.bandwidth * target.bandwidth
                    });
                });
            });
            res.send(body);
        }
    });
});

module.exports = router;
