var connectionPool = require('./connection');
var config = require('../config');

var getCountryHistogram = function(date,onComplete,onError) {
    connectionPool.open(
        function(conn) {
            conn.query('SELECT * FROM ' + config.db.database + '.guard_clients WHERE date=?',[date], function(err,rows) {
                if (err) {
                    connectionPool.error(err,conn,onError);
                } else {
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
                    connectionPool.complete(histogram,conn,onComplete);
                }
            });
        },
        function(err) {
            onError(err);
        });
};

module.exports.getCountryHistogram = getCountryHistogram;
