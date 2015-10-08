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
var relayDB = require('../db/relay');
var DBUtil = require('../db/db_utils');

var _getSummaryStats = function(nodes) {
    var max = -Number.MAX_VALUE;
    var min = Number.MAX_VALUE;
    var sum = 0;
    nodes.forEach(function(node) {
        max = Math.max(max,node.bandwidth);
        min = Math.min(min,node.bandwidth);
        sum += node.bandwidth;
    });
    return {
        minMax : {
            min: min,
            max: max
        },
        bandwidth: sum
    };
};

/**
 * GET /nodes/:dateid
 */
router.get('/:dateid', function(req, res) {
    // get sql date from id
    var sqlDate = DBUtil.getMySQLDate(req.params.dateid);
    // pull relays for date
    relayDB.getAggregates(
        sqlDate,
        function(nodes) {
            var payload = _getSummaryStats(nodes);
            payload.nodes = nodes;
            res.send(payload);
        },
        function() {
            res.status(500).send('Node data could not be retrieved.');
        });
});

module.exports = router;
