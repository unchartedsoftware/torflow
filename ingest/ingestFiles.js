var dir = require('node-dir');
var ingestFile = require('./ingestFile');
var relayDB = require('../db/relay');
var datesDB = require('../db/dates');
var async = require('async');

var _csvFilesOnly = function(csvPath) {
	return (csvPath.indexOf('.csv') === csvPath.length - 4);
};

var _getIngestFileFunc = function(csvPath) {
	return function(done) {
		ingestFile(
			csvPath,
			function(err,numImported,numSkipped) {
				if (err) {
					done(err);
				} else {
					var logStr = 'Imported ' + csvPath;
					if (numSkipped > 0) {
						logStr += ' (' + numSkipped + ' of ' + numImported+numSkipped + ' skipped due to malformed data)';
					}
					console.log(logStr);
					done();
				}
			});
	};
};

/**
 * Ingest a list of csv files from the path specified
 * @param resolvedPath - the resolved file path of the directory containing the csv files to ingest
 * @param callback - callback
 */
var ingestFiles = function(resolvedPath,callback) {
	async.waterfall([
		// get all .csv filenames
		function(done) {
			dir.files(resolvedPath,done);
		},
		// ingest files, in series
		function(files,done) {
			async.series(
				files.filter(_csvFilesOnly).map(function(csvPath) {
					return _getIngestFileFunc(csvPath);
				}),
				done );
		},
		// update dates table
		function(res,done) {
			datesDB.updateDates(done);
		},
		// update relay_aggregates table
		function(done) {
			relayDB.updateAggregates(done);
		}],
		callback);
};

module.exports = ingestFiles;
