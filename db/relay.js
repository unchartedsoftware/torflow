/**
 Copyright 2016 Uncharted Software Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
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
                '.relay_aggregates WHERE date=? AND lat<>0 AND lng<>0 ORDER BY bandwidth DESC ' + limitStr,
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
