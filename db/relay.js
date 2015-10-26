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

(function() {
    'use strict';

    var connectionPool = require('./connection');
    var config = require('../config');
    var relayAggregator = require('../ingest/relayAggregator');
    var relayParser = require('../ingest/relayParser');

    var _getAggregateSummaryStats = function(nodes) {
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

    var updateRelays = function(relaySpecs,callback) {
    	connectionPool.query(
    		'INSERT INTO relays (' + relayParser.DB_ORDER + ') VALUES ?',
    		[relaySpecs],
    		callback);
    };

    var getRelays = function(date,callback) {
        connectionPool.query(
            'SELECT * FROM ' + config.db.database + '.relays WHERE date=?',
            [date],
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    var relays = {};
                    rows.forEach(function(row) {
                        relays[row.id] = row;
                    });
                    callback(null,relays);
                }
            });
    };

    var updateAggregates = function(date,callback) {
        relayAggregator.aggregateRelays(
            date,
            function(err, nodeSpecs) {
                if (err) {
                    callback(err);
                } else {
                    // add nodes to table
                    connectionPool.query(
                        'INSERT INTO relay_aggregates (date,lat,lng,x,y,bandwidth,normalized_bandwidth,label) VALUES ?',
                        [nodeSpecs],
                        callback);
                }
            });
    };

    var getAggregates = function(date,count,callback) {
        var limitStr = count ? 'LIMIT ' + count : '';
        connectionPool.query(
            'SELECT x,y,lat,lng,bandwidth,normalized_bandwidth,label FROM ' + config.db.database +
                '.relay_aggregates WHERE date=? ORDER BY bandwidth DESC ' + limitStr,
            [date],
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    var res = _getAggregateSummaryStats(rows);
                    res.nodes = rows;
                    callback(null,res);
                }
            });
    };

    module.exports.updateRelays = updateRelays;
    module.exports.getRelays = getRelays;
    module.exports.updateAggregates = updateAggregates;
    module.exports.getAggregates = getAggregates;

}());
