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
