var connectionPool = require('./connection');
var config = require('../config');

var getRelays = function(date,onSuccess,onError) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.relays WHERE date=?',
        [date],
        function(rows) {
            var relays = {};
            rows.forEach(function(row) {
                relays[row.id] = row;
            });
            onSuccess(relays);
        },
        onError );
};

var getFingerprints = function(date,onSuccess,onError) {
    connectionPool.query(
        'SELECT id,fingerprint FROM ' + config.db.database + '.relays WHERE date=?',
        [date],
        function(rows) {
            var fingerprintToId = {};
            rows.forEach(function(row) {
                fingerprintToId[row.fingerprint] = row.id;
            });
            onSuccess(fingerprintToId);
        },
        onError );
};

var getDates = function(onSuccess,onError) {
    connectionPool.query(
        'SELECT distinct date FROM ' + config.db.database + '.relays order by date asc',
        function(rows) {
            var dates = rows.map(function(row) {
                return row.date;
            });
            onSuccess(dates);
        },
        onError );
};

module.exports.get = getRelays;
module.exports.fingerprints = getFingerprints;
module.exports.getDates = getDates;
