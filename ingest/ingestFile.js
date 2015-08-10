var fs = require('fs');
var readline = require('readline');
var relayParser = require('./relayParser');
var RelayDB = require('../db/relay');
var lodash = require('lodash');
var process = require('../util/process_each');

var BATCH_INSERT_SIZE = 2000;

/**
 * Ingest a csv relay file into the database
 * @param conn - open database connection
 * @param resolvedFilePath - the resolved path of the file
 * @param onSuccess - success callback
 * @param onError - error callback
 */
var ingestFile = function(conn, resolvedFilePath, onSuccess, onError) {

	var success = function(relaySpecs,numSkipped,guardClients,countryCount,date) {

		// Insert the relay data into the relays table
		_insertRelayData(conn,relaySpecs,guardClients,countryCount,function() {

			// Get a mapping from fingerprint -> relay id (in table) and append it to each element we have guard client data for
			RelayDB.fingerprints(date,function(fingerprintToId) {
				Object.keys(fingerprintToId).forEach(function(fingerprint) {
					if (guardClients[fingerprint]) {
						guardClients[fingerprint].id = fingerprintToId[fingerprint];
					}
				});

				var guardClientSpecs = [];

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

				if (guardClientSpecs.length > 0) {
					var chunks = lodash.chunk(guardClientSpecs, BATCH_INSERT_SIZE);
					process.each(chunks, function (chunk, processNext) {
						_insertGuardClientData(conn, chunk, function () {
							processNext();
						}, onError);

					},function() {
						onSuccess(relaySpecs.length,numSkipped);
					});
				} else {
					onSuccess(relaySpecs.length,numSkipped);
				}
			},onError);

		},onError);
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
	var hour = parseInt(datePieces[4].charAt(0) === '0' ? datePieces[4].charAt(1) : datePieces[4]);
	var minute = parseInt(datePieces[5].charAt(0) === '0' ? datePieces[5].charAt(1) : datePieces[5]);
	var second = parseInt(datePieces[6].charAt(0) === '0' ? datePieces[6].charAt(1) : datePieces[6]);
	return year + '/' + month + '/' + day + ' 00:00:00';
};

/**
 * Extracts an array of relay specs from a csv file
 * @param filename - name of the file to parse
 * @param onSuccess(relays) - success callback
 * @param onError - error callback
 * @private
 */
var _extractFromCSV = function(filename,onSuccess,onError) {
	var relays = [];
	var guardClients = {};

	var dateString =_getSQLDateFromFilename(filename);

	var numSkipped = 0;

	var firstLine = true;
	var rd = readline.createInterface({
		input: fs.createReadStream(filename),
		output: process.stdout,
		terminal: false
	});

	var error = false;

	rd.on('line', function(line) {
		if (error) {
			return;
		}

		// Verify file integrity
		if (firstLine) {
			firstLine = false;
			var columns = line.replace(')','').split(',');
			if (columns.length !== relayParser.COLUMNS.length) {
				error = true;
				var msg = 'Relay file format not supported!';
				onError(msg);
				return;
			}
			for (var i = 0; i < columns.length; i++) {
				if (columns[i] !== relayParser.COLUMNS[i]) {
					error = true;
					var msg = 'Relay file format not supported!\n' +
							'Expected: ' + relayParser.COLUMNS + '\n' +
							'Read:     ' + columns + '\n';
					onError(msg);
					return;
				}
			}
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

		// Get a count for every country for this date
		var countryCount = {};
		Object.keys(guardClients).forEach(function(fingerprint) {
			Object.keys(guardClients[fingerprint].guardClients).forEach(function(cc) {
				if (cc === '??') {
					return;
				} else {
					var existingCount = countryCount[cc];
					if (!existingCount) {
						existingCount = 0;
					}
					existingCount += guardClients[fingerprint].guardClients[cc];
					countryCount[cc] = existingCount;
				}
			});
		});


		onSuccess(relays,numSkipped,guardClients,countryCount,dateString);
	});
}

/**
 * Inserts a list of relays into the db
 * @param conn - open db connection
 * @param relaySpecs - array of spec arrays describing a list of relays
 * @param onSuccess - success callback
 * @param onError - error callback
 * @private
 */
var _insertRelayData = function(conn,relaySpecs,guardClients,countryCount,onSuccess,onError) {
	conn.query(
		'INSERT INTO relays (' + relayParser.DB_ORDER + ') VALUES ?',
		[relaySpecs],
		function (err, rows) {
			if (err) {
				onError(err);
			} else {
				onSuccess();
			}
	});
};

var _insertGuardClientData = function(conn,specs,onSuccess,onError) {

	conn.query(
		'INSERT INTO guard_clients (relay_id,cc,guardclientcount,date) VALUES ?',
		[specs],
		function (err, rows) {
			if (err) {
				onError(err);
			} else {
				onSuccess();
			}
		});
};

module.exports = ingestFile;