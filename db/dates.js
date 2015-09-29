var connectionPool = require('./connection');
var config = require('../config');
var relays = require('./relay');
var Process = require('../util/process_each');
var lodash = require('lodash');

var getDates = function(onSuccess,onError) {
    connectionPool.query(
        'SELECT date FROM ' + config.db.database + '.dates order by date asc',
        function(dates) {
            onSuccess(dates);
        },
        onError );
};

var _insertDateChunk = function(dates,onSuccess,onError) {
    connectionPool.query(
        'INSERT INTO ' + config.db.database + '.dates (date) VALUES ?',
        [dates],
        function (err, rows) {
            if (err) {
                onError(err);
            } else {
                onSuccess();
            }
        });
}

var updateDates = function(onSuccess,onError) {
    relays._getDates(function(dates) {
        connectionPool.query(
            'TRUNCATE ' + config.db.database + '.dates',
            function() {
                var chunks = lodash.chunk(dates, 2000);
                Process.each(chunks, function (chunk, processNext) {
                    _insertDateChunk(chunk, function () {
                        processNext();
                    }, onError);
                },onSuccess);
            },
        onError );
    },onError)
};

var getDates = function(onSuccess,onError) {
    connectionPool.query(
        'SELECT distinct date FROM ' + config.db.database + '.relays order by date asc',
        function(rows) {
            var dates = rows.map(function(row) {
                return row.date;
            });
            onSuccess(dates);
        },
        onError );
};


module.exports.updateDates = updateDates;
module.exports.getDates = getDates;
