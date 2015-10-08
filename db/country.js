var connectionPool = require('./connection');
var config = require('../config');

var getCountryHistogram = function(date,callback) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.guard_clients WHERE date=?',
        [date],
        function(err,rows) {
            if (err) {
                callback(err);
            } else {
                var histogram = {};
                rows.forEach(function(row) {
                    var cc = row.cc;
                    if (cc !== '??') {
                        histogram[cc] = ( histogram[cc] !== undefined ) ? histogram[cc] : 0;
                        histogram[cc] += row.guardclientcount;
                    }
                });
                callback(null,histogram);
            }
        });
};

module.exports.getCountryHistogram = getCountryHistogram;
