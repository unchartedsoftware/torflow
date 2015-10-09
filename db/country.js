var connectionPool = require('./connection');
var config = require('../config');

var NUM_COUNTRIES = 50;

var getCountryHistogram = function(date,callback) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.guard_clients WHERE date=? GROUP BY cc ORDER BY guardclientcount DESC LIMIT ' + NUM_COUNTRIES,
        [date],
        function(err,rows) {
            if (err) {
                callback(err);
            } else {
                var histogram = {};
                console.log(rows.length);
                rows.forEach(function(row) {
                    var cc = row.cc;
                    histogram[cc] = ( histogram[cc] !== undefined ) ? histogram[cc] : 0;
                    histogram[cc] += row.guardclientcount;
                });
                callback(null,histogram);
            }
        });
};

module.exports.getCountryHistogram = getCountryHistogram;
