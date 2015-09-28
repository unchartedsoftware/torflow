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
        onError );
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
        onError );
};

var getDates = function(onSuccess,onError) {
    connectionPool.open(
        function(conn) {
            conn.query('SELECT * FROM ' + config.db.database + '.dates order by date asc', function(err,rows) {
            //conn.query('SELECT distinct date FROM ' + config.db.database + '.relays order by date asc', function(err,rows) {
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
        onError );
};

module.exports.get = getRelays;
module.exports.fingerprints = getFingerprints;
module.exports.getDates = getDates;
