var connectionPool = require('./connection');
var config = require('../config');
var relayDB = require('./relay');

var getDates = function(callback) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.dates order by date asc',
        function(err,rows) {
            if (err) {
                callback(err);
            } else {
                var dates = rows.map(function(row) {
                    return row.date;
                });
                var bandwidths = rows.map(function(row) {
                    return row.bandwidth;
                });
                callback(null,{
                    dates: dates,
                    bandwidths: bandwidths
                });
            }
        });
};

var updateDates = function(date,callback) {
    relayDB.getAggregates(date,null,function(err,row) {
        if (err) {
            callback(err);
        } else {
            var dateSpec = [[date, row.bandwidth]];
            connectionPool.query(
                'INSERT INTO ' + config.db.database + '.dates (date,bandwidth) VALUES ?',
                [ dateSpec ], //row.minMax.min, row.minMax.max],
                callback);
        }
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
