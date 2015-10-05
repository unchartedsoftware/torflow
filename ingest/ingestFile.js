var fs = require('fs');
var readline = require('readline');
var relayParser = require('./relayParser');
var RelayDB = require('../db/relay');
var connectionPool = require('./connection');
var lodash = require('lodash');
var async = require('async');
var BATCH_INSERT_SIZE = 2000;

var getGuardClientSpecs = function(guardClients,fingerprintToId,date) {
	var guardClientSpecs = [];
	Object.keys(fingerprintToId).forEach(function(fingerprint) {
		if (guardClients[fingerprint]) {
			guardClients[fingerprint].id = fingerprintToId[fingerprint];
		}
	});
	// For each relay data, push to the list of guard client rows in the database
	Object.keys(guardClients).forEach(function(fingerprint) {
		var dataForRelay = guardClients[fingerprint];
		//Iterate over each country this guard was accessed from and add it to the array
		Object.keys(dataForRelay.guardClients).forEach(function(cc) {
			var count = dataForRelay.guardClients[cc];
			guardClientSpecs.push([
				guardClients[fingerprint].id,
				cc,
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
 * @param onSuccess - success callback
 * @param onError - error callback
 */
var ingestFile = function(resolvedFilePath, onSuccess, onError) {

	var success = function(relaySpecs,numSkipped,guardClients,date) {

		// Insert the relay data into the relays table
		_insertRelayData(relaySpecs,function() {

			// Get a mapping from fingerprint -> relay id (in table) and append it to each element we have guard client data for
			RelayDB.fingerprints(date,function(fingerprintToId) {

				var guardClientSpecs = getGuardClientSpecs(guardClients,fingerprintToId,date);

				if (guardClientSpecs.length > 0) {
					var chunks = lodash.chunk(guardClientSpecs, BATCH_INSERT_SIZE);
					var jobs = chunks.map(function(chunk) {
						return function(done) {
							_insertGuardClientData(
								chunk,
								function() {
									done(null,null);
								}, function(err) {
									done(err);
								});
						};
					});
					async.series(jobs,function(err) {
						if (err) {
							onError(err);
						} else {
							onSuccess(relaySpecs.length,numSkipped);
						}
					});
				} else {
					onSuccess(relaySpecs.length,numSkipped);
				}
			},
			onError);

		},
		onError);
	};

	var error = function(msg) {
		onError(msg);
	};

	_extractFromCSV(resolvedFilePath,success,error);
};

/**
 * Extracts an sql date string from the filename of the csv file we're processing
 * @param filename
 * @returns {*}
 */
var _getSQLDateFromFilename = function(filename) {
	var paths = filename.split('/');
	var name = paths[paths.length-1];
	name = name.replace('.csv','');
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
 * @param onSuccess - success callback
 * @param onError - error callback
 */
var _extractFromCSV = function(filename,onSuccess,onError) {
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
	var error = false;

	rd.on('line', function(line) {
		if (error) {
			return;
		}
		if (firstLine) {
			// Verify file integrity
			firstLine = false;
			error = relayParser.verify(line);
			if (error) {
				onError(error);
				return;
			}
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
		onSuccess(relays,numSkipped,guardClients,dateString);
	});
};

/**
 * Inserts a list of relays into the db
 * @param relaySpecs - array of spec arrays describing a list of relays
 * @param onSuccess - success callback
 * @param onError - error callback
 * @private
 */
var _insertRelayData = function(relaySpecs,onSuccess,onError) {
	connectionPool.query(
		'INSERT INTO relays (' + relayParser.DB_ORDER + ') VALUES ?',
		[relaySpecs],
		onSuccess,
		onError);
};

/**
 * Inserts a list of guard clients into the db
 * @param guardSpecs - array of spec arrays describing a list of guard clients
 * @param onSuccess - success callback
 * @param onError - error callback
 * @private
 */
var _insertGuardClientData = function(guardSpecs,onSuccess,onError) {
	connectionPool.query(
		'INSERT INTO guard_clients (relay_id,cc,guardclientcount,date) VALUES ?',
		[guardSpecs],
		onSuccess,
		onError);
};

module.exports = ingestFile;
