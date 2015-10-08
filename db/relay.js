var connectionPool = require('./connection');
var config = require('../config');
var datesDB = require('./dates');
var async = require('async');
var relayAggregator = require('../ingest/relayAggregator');

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

var updateAggregates = function( onSuccess, onError ) {
    async.waterfall([
        // truncate table if it exists
        function(done) {
            connectionPool.query(
                'TRUNCATE ' + config.db.database + '.relay_aggregates',
                function() {
                    done();
                },
                function(err) {
                    done(err);
                });
        },
        // get all dates from dates table
        function(done) {
            datesDB.getDates(
                function(dates) {
                    done(null,dates);
                },
                function(err) {
                    done(err);
                });
        },
        // ingest each aggregate in series
        function( dates, done ) {
            async.series(
                dates.map( function(date) {
    				return function(done) {
    					// aggregate relays
    					relayAggregator.aggregateRelays(date, function(nodes) {
    						// organize them into mysql rows
    						var specs = nodes.map(function(node) {
    							return [
    								date,
    								node.lat,
    								node.lng,
    								node.x,
    								node.y,
    								node.bandwidth,
    								node.normalizedBandwidth,
    								node.label
    							];
    						});
    						// add nodes to table
    						connectionPool.query(
    							'INSERT INTO relay_aggregates (date,lat,lng,x,y,bandwidth,normalized_bandwidth,label) VALUES ?',
    							[specs],
    							function() {
    								done();
    							},
    							function(err) {
    								done(err);
    							});
    					});
    				};
    			}),
                done);
        }],
        function(err) {
            if (err) {
                onError(err);
            } else {
                onSuccess();
            }
        });
};

var getAggregatedRelays = function(date,onSuccess,onError) {
    connectionPool.query(
        'SELECT * FROM ' + config.db.database + '.relay_aggregates WHERE date=? ORDER BY bandwidth',
        [date],
        function(rows) {
            console.log(rows);
            onSuccess(rows);
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
module.exports.updateAggregates = updateAggregates;
module.exports.getAggregates = getAggregatedRelays;
