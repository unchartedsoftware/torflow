var connectionPool = require('./connection');
var config = require('../config');

var getRelays = function(date,onComplete,onError) {
    var connection = null;

    var complete = function(relays) {
        connectionPool.close(connection);
        onComplete(relays);
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

        connection.query('SELECT * FROM ' + config.db.database + '.relays WHERE date=?',[date], function(err,rows) {
            if (err) {
                error(err);
            } else {
                var relays = {};
                rows.forEach(function(row) {
                    relays[row.id] = row;
                });
                complete(relays);
            }
        });
    });
};

var getFingerprints = function(date,onComplete,onError) {
    var connection = null;

    var complete = function(fingerprintToId) {
        connectionPool.close(connection);
        onComplete(fingerprintToId);
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

        connection.query('SELECT id,fingerprint FROM ' + config.db.database + '.relays WHERE date=?',[date], function(err,rows) {
            if (err) {
                error(err);
            } else {
                var fingerprintToId = {};
                rows.forEach(function(row) {
                    fingerprintToId[row.fingerprint] = row.id;
                });
                complete(fingerprintToId);
            }
        });
    });
};

var dates = function(onSuccess,onError) {
    var connection = null;

    var complete = function(datebounds) {
        connectionPool.close(connection);
        onSuccess(datebounds);
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

        connection.query('SELECT distinct date FROM ' + config.db.database + '.relays order by date asc', function(err,rows) {
            if (err) {
                error(err);
            } else {
                complete(rows.map(function(row) {
                    return row.date;
                }));
            }
        });
    });
};
module.exports.get = getRelays;
module.exports.fingerprints = getFingerprints;
module.exports.getDates = dates;