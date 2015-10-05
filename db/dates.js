var connectionPool = require('./connection');
var config = require('../config');
var relays = require('./relay');

var getDates = function(onSuccess,onError) {
    connectionPool.query(
        'SELECT date FROM ' + config.db.database + '.dates order by date asc',
        function(dates) {
            onSuccess(dates);
        },
        onError );
};

var updateDates = function(onSuccess,onError) {
    relays._getDates(function(dates) {
        connectionPool.query(
            'TRUNCATE ' + config.db.database + '.dates',
            function() {
                var dateSpecs = dates.map(function(date) {
                    return [date];
                });
                connectionPool.query('INSERT INTO ' + config.db.database + '.dates (date) VALUES ?',[dateSpecs],onSuccess,onError);
            },
        onError);
    },onError);
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
