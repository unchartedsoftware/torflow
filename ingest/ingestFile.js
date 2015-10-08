var fs = require('fs');
var readline = require('readline');
var _ = require('lodash');
var async = require('async');
var relayParser = require('./relayParser');
var relayDB = require('../db/relay');
var connectionPool = require('../db/connection');

var getGuardClientSpecs = function(guardClients,fingerprintToId,date) {
	var guardClientSpecs = [];
	// append id to guardclient
	_.forIn(fingerprintToId,function(id,fingerprint) {
		if (guardClients[fingerprint]) {
			guardClients[fingerprint].id = id;
		}
	});
	// extract guard client row
	_.forIn(guardClients, function(guardClient) {
		_.forIn(guardClient.guardClients,function(count,countrycode) {
			guardClientSpecs.push([
				guardClient.id,
				countrycode,
				count,
				date
			]);
		});
	});
	return guardClientSpecs;
};

/**
 * Ingest a csv relay file into the database
 * @param resolvedFilePath - the resolved path of the file
 * @param callback - callback
 */
var ingestFile = function(resolvedFilePath,callback) {
	async.waterfall([
		// extract relay data from csv
		function(done) {
			_extractFromCSV(resolvedFilePath,done);
		},
		// insert relay data into table
		function(relaySpecs,numSkipped,guardClients,date,done) {
			_insertRelayData(
				relaySpecs,
				function(err) {
					if (err) {
						done(err);
					} else {
						done(null,relaySpecs,numSkipped,guardClients,date);
					}
				});
		},
		// get mapping from fingerprint -> relay id to each element with guard client
		function(relaySpecs,numSkipped,guardClients,date,done) {
			relayDB.fingerprints(
				date,
				function(err,fingerprintToId) {
					if (err) {
						done(err);
					} else {
						done(null,relaySpecs,numSkipped,guardClients,date,fingerprintToId);
					}
				});
		},
		// push to the list of guard client rows in the database
		function(relaySpecs,numSkipped,guardClients,date,fingerprintToId,done) {
			var guardClientSpecs = getGuardClientSpecs(guardClients,fingerprintToId,date);
			_insertGuardClientData(
				guardClientSpecs,
				function(err) {
					if (err) {
						done(err);
					} else {
						done(null,relaySpecs.length,numSkipped);
					}
				});
		}],
        callback);
};

/**
 * Extracts an sql date string from the filename of the csv file we're processing
 * @param filename
 * @returns {*}
 */
var _getSQLDateFromFilename = function(filename) {
	var paths = filename.split('/');
	var name = paths[paths.length-1].replace('.csv','');
	var datePieces = name.split('-');
	var year = datePieces[1];
	var month = datePieces[2];
	var day = datePieces[3];
	return year + '/' + month + '/' + day + ' 00:00:00';
};

/**
 * Extracts an array of specs from a csv file
 * @private
 * @param filename - name of the file to parse
 * @param callback - callback
 */
var _extractFromCSV = function(filename,callback) {
	console.log('Parsing csv file: ' + filename);
	var dateString = _getSQLDateFromFilename(filename);
	var rd = readline.createInterface({
		input: fs.createReadStream(filename),
		output: process.stdout,
		terminal: false
	});
	var numSkipped = 0;
	var firstLine = true;
	var relays = [];
	var guardClients = {};
	var err = false;
	rd.on('line', function(line) {
		if (err) {
			return;
		}
		if (firstLine) {
			// Verify file integrity
			firstLine = false;
			err = relayParser.verify(line);
			if (err) {
				callback(err);
			}
			// always ignore first line
			return;
		}
		var relaySpec = relayParser.parseRelayLine(line,dateString);
		var guardClientMap = relayParser.parseCountryCodeLine(line,dateString);
		if (relaySpec === null) {
			numSkipped++;
		} else {
			relays.push(relaySpec);
			guardClients[guardClientMap.fingerprint] = guardClientMap;
		}
	});
	rd.on('close',function() {
		callback(null,relays,numSkipped,guardClients,dateString);
	});
};

/**
 * Inserts a list of relays into the db
 * @param relaySpecs - array of spec arrays describing a list of relays
 * @param callback - callback
 * @private
 */
var _insertRelayData = function(relaySpecs,callback) {
	connectionPool.query(
		'INSERT INTO relays (' + relayParser.DB_ORDER + ') VALUES ?',
		[relaySpecs],
		callback);
};

/**
 * Inserts a list of guard clients into the db
 * @param guardSpecs - array of spec arrays describing a list of guard clients
 * @param callback - callback
 * @private
 */
var _insertGuardClientData = function(guardSpecs,callback) {
	if ( guardSpecs.length === 0 ) {
		return callback();
	}
	var BATCH_INSERT_SIZE = 2000;
	var chunks = _.chunk(guardSpecs, BATCH_INSERT_SIZE);
	async.series(
		chunks.map(function(chunk) {
			return function(done) {
				connectionPool.query(
					'INSERT INTO guard_clients (relay_id,cc,guardclientcount,date) VALUES ?',
					[chunk],
					done);
			};
		}),
		callback);
};

module.exports = ingestFile;
