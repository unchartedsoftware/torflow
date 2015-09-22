var connectionPool = require('./connection');
var config = require('../config');

var getRelays = function(date,onComplete,onError) {
    connectionPool.open(
        function(conn) {
            conn.query('SELECT * FROM ' + config.db.database + '.relays WHERE date=?',[date], function(err,rows) {
                if (err) {
                    connectionPool.error(err,conn,onError);
                } else {
                    var relays = {};
                    rows.forEach(function(row) {
                        relays[row.id] = row;
                    });
                    connectionPool.complete(relays,conn,onComplete);
                }
            });
        },
        function(err) {
            onError(err);
        });
};

var getFingerprints = function(date,onComplete,onError) {
    connectionPool.open(
        function(conn) {
            conn.query('SELECT id,fingerprint FROM ' + config.db.database + '.relays WHERE date=?',[date], function(err,rows) {
                if (err) {
                    connectionPool.error(err,conn,onError);
                } else {
                    var fingerprintToId = {};
                    rows.forEach(function(row) {
                        fingerprintToId[row.fingerprint] = row.id;
                    });
                    connectionPool.complete(fingerprintToId,conn,onComplete);
                }
            });
        },
        function(err) {
            onError(err);
        });
};

var getDates = function(onSuccess,onError) {
    connectionPool.open(
        function(conn) {
            conn.query('SELECT distinct date FROM ' + config.db.database + '.relays order by date asc', function(err,rows) {
                if (err) {
                    connectionPool.error(err,conn,onError);
                } else {
                    var dates = rows.map(function(row) {
                        return row.date;
                    });
                    connectionPool.complete(dates,conn,onSuccess);
                }
            });
        },
        function(err) {
            onError(err);
        });
};

module.exports.get = getRelays;
module.exports.fingerprints = getFingerprints;
module.exports.getDates = getDates;
