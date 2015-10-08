var connectionPool = require('./connection');
var config = require('../config');
var relayDB = require('./relay');
var async = require('async');

var getDates = function(onSuccess,onError) {
    connectionPool.query(
        'SELECT date FROM ' + config.db.database + '.dates order by date asc',
        function(rows) {
            var dates = rows.map(function(row) {
                return row.date;
            });
            onSuccess(dates);
        },
        onError );
};

var updateDates = function(onSuccess,onError) {
    async.waterfall([
        // truncate table if it exists
        function(done) {
            connectionPool.query(
                'TRUNCATE ' + config.db.database + '.dates',
                function() {
                    done();
                },
                function(err) {
                    done(err);
                });
        },
        // get all dates from relayDB table
        function(done) {
            relayDB.getDates(
                function(dates) {
                    done(null,dates);
                },
                function(err) {
                    done(err);
                });
        },
        // insert dates into table
        function(dates,done) {
            var dateSpecs = dates.map(function(date) {
                return [date];
            });
            connectionPool.query(
                'INSERT INTO ' + config.db.database + '.dates (date) VALUES ?',
                [dateSpecs],
                function() {
                    done();
                },
                function(err) {
                    done(err);
                });
        }],
        function(err) {
            if (err) {
                onError(err);
            } else {
                onSuccess();
            }
        });
};

module.exports.updateDates = updateDates;
module.exports.getDates = getDates;
