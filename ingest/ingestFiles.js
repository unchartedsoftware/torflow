var dir = require('node-dir');
var connectionPool = require('../db/connection');
var ingestFile = require('./ingestFile');
var datesDB = require('../db/dates');
var async = require('async');

var _addDateIndex = function(tableName,onSuccess,onError) {
	connectionPool.query(
		'ALTER TABLE `' + tableName + '` ADD INDEX `date` (`date`)',
		onSuccess,
		onError );
};

var csvFilesOnly = function(csvPath) {
	return (csvPath.indexOf('.csv') === csvPath.length - 4);
};

var getIngestFileFunc = function(csvPath) {
	return function(done) {
		ingestFile(
			csvPath,
			function(numImported,numSkipped) {
				var logStr = 'Imported ' + csvPath;
				if (numSkipped > 0) {
					logStr += ' (' + numSkipped + ' of ' + numImported+numSkipped + ' skipped due to malformed data)';
				}
				console.log(logStr);
				done(null,null);
			},
			function(msg) {
				console.trace(msg);
				done(msg);
			});
	};
};

/**
 * Ingest a list of csv files from the path specified
 * @param resolvedPath - the resolved file path of the directory containing the csv files to ingest
 * @param onSuccess - success callback
 * @param onError - error callback
 */
var ingestFiles = function(resolvedPath,onSuccess,onError) {
	// Get a list of files in the containing directory.   Does not include sub dirs.
	dir.files(resolvedPath, function(err, files) {
		if (err) {
			onError(err);
		} else {
			// Get array of ingest jobs
			var jobs = files.filter(csvFilesOnly).map(function(csvPath) {
				return getIngestFileFunc(csvPath);
			});
			// Truncate dates
			jobs.push( function( done ) {
				datesDB.updateDates(
					function() {
						done(null,null);
					},
					function(err) {
						done(err);
					});
			});
			// Add date index to relay table
			jobs.push( function( done ) {
				_addDateIndex(
					'relays',
					function() {
						done(null,null);
					},
					function(err) {
						done(err);
					});
			});
			// Add date index to guard clients table
			jobs.push( function( done ) {
				_addDateIndex(
					'guard_clients',
					function() {
						done(null,null);
					},
					function(err) {
						done(err);
					});
			});
			// Execute jobs in series
			async.series(jobs, function(err) {
				if (err) {
					onError(err);
				} else {
					onSuccess();
				}
			});
		}
	});
};

module.exports = ingestFiles;
