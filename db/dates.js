var connectionPool = require('./connection');
var config = require('../config');
var relayDB = require('./relay');
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
            connectionPool.query(
                'TRUNCATE ' + config.db.database + '.dates',
                done);
        },
        // get all dates from relay table
        function(rows,done) {
            relayDB.getDates(done);
        },
        // insert dates into date table
        function(dates,done) {
            var dateSpecs = dates.map(function(date) {
                return [date];
            });
            connectionPool.query(
                'INSERT INTO ' + config.db.database + '.dates (date) VALUES ?',
                [dateSpecs],
                done);
        }],
        function(err) {
            callback(err); // only pass on error, if it exists
        });
};

module.exports.updateDates = updateDates;
module.exports.getDates = getDates;
