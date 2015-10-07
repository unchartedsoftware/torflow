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
                histogram[cc] = ( histogram[cc] !== undefined ) ? histogram[cc] : 0;
                histogram[cc] += row.guardclientcount;
            });
            onSuccess(histogram);
        },
        onError );
};

module.exports.getCountryHistogram = getCountryHistogram;
