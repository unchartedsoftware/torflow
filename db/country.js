var connectionPool = require('./connection');
var config = require('../config');

var getCountryHistogram = function(date,onSuccess,onError) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.guard_clients WHERE date=?',
        [date],
        function(rows) {
            var histogram = {};
            rows.forEach(function(row) {
                var cc = row.cc;
                var existing = histogram[cc];
                if (!existing) {
                    existing = 0;
                }
                existing += row.guardclientcount;
                histogram[cc] = existing;
            });
            onSuccess(histogram);
        },
        onError );
};

module.exports.getCountryHistogram = getCountryHistogram;
