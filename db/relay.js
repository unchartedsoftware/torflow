var connectionPool = require('./connection');
var config = require('../config');
var async = require('async');
var relayAggregator = require('../ingest/relayAggregator');

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

var getDates = function(callback) {
    connectionPool.query(
        'SELECT distinct date FROM ' + config.db.database + '.relays order by date asc',
        function(err,rows) {
            if (err) {
                callback(err);
            } else {
                var dates = rows.map(function(row) {
                    return row.date;
                });
                callback(null,dates);
            }
        });
};

var updateAggregates = function(callback) {
    async.waterfall([
        // truncate table if it exists
        function(done) {
            connectionPool.query(
                'TRUNCATE ' + config.db.database + '.relay_aggregates',
                done);
        },
        // get all dates from dates table
        function(rows,done) {
            getDates(done);
        },
        // aggregate and insert relays
        function(dates,done) {
            async.series(
                dates.map( function(date) {
    				return function(done) {
    					relayAggregator.aggregateRelays(
                            date,
                            function(err,nodeSpecs) {
                                if (err) {
                                    done(err);
                                } else {
                                    // add nodes to table
            						connectionPool.query(
            							'INSERT INTO relay_aggregates (date,lat,lng,x,y,bandwidth,normalized_bandwidth,label) VALUES ?',
            							[nodeSpecs],
            							done);
                                }
    					    });
    				};
    			}),
                done);
        }],
        function(err) {
            callback(err); // only pass on error, if it exists
        });
};

var getAggregatedRelays = function(date,count,callback) {
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

var getFingerprints = function(date,callback) {
    connectionPool.query(
        'SELECT id,fingerprint FROM ' + config.db.database + '.relays WHERE date=?',
        [date],
        function(err,rows) {
            if (err) {
                callback(err);
            } else {
                var fingerprintToId = {};
                rows.forEach(function(row) {
                    fingerprintToId[row.fingerprint] = row.id;
                });
                callback(null,fingerprintToId);
            }
        });
};

module.exports.get = getRelays;
module.exports.fingerprints = getFingerprints;
module.exports.getDates = getDates;
module.exports.updateAggregates = updateAggregates;
module.exports.getAggregates = getAggregatedRelays;
