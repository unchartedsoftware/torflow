var dir = require('node-dir');
var ingestFile = require('./ingestFile');
var async = require('async');

var _csvFilesOnly = function(csvPath) {
	return (csvPath.indexOf('.csv') === csvPath.length - 4);
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
			var csvFiles = files.filter(_csvFilesOnly);
			async.series(
				csvFiles.map(function(csvPath) {
					return function(done) {
						ingestFile(csvPath,done);
					};
				}),
				function(err) {
					done(err);
				});
		}],
		callback);
};

module.exports = ingestFiles;
