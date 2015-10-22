var connectionPool = require('./connection');
var config = require('../config');

var getCountryHistogram = function(date,callback) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.guard_clients WHERE date=? GROUP BY cc ORDER BY guardclientcount DESC',
        [date],
        function(err,rows) {
            if (err) {
                callback(err);
            } else {
                var histogram = {};
                rows.forEach(function(row) {
                    histogram[row.cc] = row.guardclientcount;
                });
                callback(null,histogram);
            }
        });
};

module.exports.getCountryHistogram = getCountryHistogram;
