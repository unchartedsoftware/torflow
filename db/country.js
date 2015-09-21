var connectionPool = require('./connection');
var config = require('../config');

var getCountryHistogram = function(date,onComplete,onError) {
    var connection = null;

    var complete = function(histogram) {
        connectionPool.close(connection);
        onComplete(histogram);
    };

    var error = function(err) {
        connectionPool.close(connection);
        if (onError) {
            onError(err);
        } else {
            console.error(err);
        }
    };

    connectionPool.open(function(conn) {
        connection = conn;

        connection.query('SELECT * FROM ' + config.db.database + '.guard_clients WHERE date=?',[date], function(err,rows) {
            if (err) {
                error(err);
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
                complete(histogram);
            }
        });
    });
};

module.exports.getCountryHistogram = getCountryHistogram;
