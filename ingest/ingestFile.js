var fs = require('fs');
var readline = require('readline');
var relayParser = require('./relayParser');
var _ = require('underscore');

/**
 * Ingest a csv relay file into the database
 * @param conn - open database connection
 * @param resolvedFilePath - the resolved path of the file
 * @param onSuccess - success callback
 * @param onError - error callback
 */
var ingestFile = function(conn, resolvedFilePath, onSuccess, onError) {

	var success = function(relaySpecs,numSkipped) {
		_insertRelays(conn,relaySpecs,function() {
			onSuccess(relaySpecs.length,numSkipped);
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

		var relaySpec = relayParser.parseLine(line,dateString);
		if (relaySpec === null) {
			numSkipped++;
		} else {
			relays.push(relaySpec);
		}



	});

	rd.on('close',function() {
		onSuccess(relays,numSkipped);
	});
}

/**
 * Inserts a list of relays into the db
 * @param conn - open db connection
 * @param specs - array of spec arrays describing a list of relays
 * @param onSuccess - success callback
 * @param onError - error callback
 * @private
 */
var _insertRelays = function(conn,specs,onSuccess,onError) {
	conn.query(
		'INSERT INTO relays (' + relayParser.DB_ORDER + ') VALUES ?',
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