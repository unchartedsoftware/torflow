var connectionPool = require('./connection');
var config = require('../config');
var relayDB = require('./relay');
var DBUtil = require('./db_utils');
var async = require('async');

var getDates = function(callback) {
    connectionPool.query(
        'SELECT date FROM ' + config.db.database + '.dates order by date asc',
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

var updateDates = function(callback) {
    async.waterfall([
        // truncate table if it exists
        function(done) {
            console.log('truncate');
            connectionPool.query(
                'TRUNCATE ' + config.db.database + '.dates',
                done);
        },
        // get all dates from relay table
        function(rows,done) {
            console.log('get dates');
            relayDB.getDates(done);
        },
        // for each date, get the min, max, and total bandwidth, and insert into table
        function(dates,done) {
            async.series(
                dates.map(function(date) {
                    return function(done) {
                        var sqlDate = DBUtil.getMySQLDate(date);
                        relayDB.getAggregates(date,null,function(err,row) {
                            if (err) {
                                done(err);
                            } else {
                                var dateSpec = [[sqlDate, row.bandwidth]];
                                connectionPool.query(
                                    'INSERT INTO ' + config.db.database + '.dates (date,bandwidth) VALUES ?',
                                    [ dateSpec ], //row.minMax.min, row.minMax.max],
                                    done);
                            }
                        });
                    };
                }),
                done );
        }],
        function(err) {
            callback(err); // only pass on error, if it exists
        });
};

var getMinBandwidth = function(callback) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.dates ORDER BY bandwidth LIMIT 1',
        function(err,rows) {
            if (err) {
                callback(err);
            } else {
                callback(null,rows[0]);
            }
        });
};

var getMaxBandwidth = function(callback) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.dates ORDER BY bandwidth DESC LIMIT 1',
        function(err,rows) {
            if (err) {
                callback(err);
            } else {
                callback(null,rows[0]);
            }
        });
};

module.exports.updateDates = updateDates;
module.exports.getDates = getDates;
module.exports.getMinBandwidth = getMinBandwidth;
module.exports.getMaxBandwidth = getMaxBandwidth;
