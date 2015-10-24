var dir = require('node-dir');
var ingestFile = require('./ingestFile');
var relayDB = require('../db/relay');
var datesDB = require('../db/dates');
var countryDB = require('../db/country');
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
		},
		// update relay_aggregates table
		function(done) {
			console.log('Updating relay_aggregates table');
			relayDB.updateAggregates(done);
		},
		// update dates table
		function(done) {
			console.log('Updating dates table');
			datesDB.updateDates(done);
		},
		// update country_counts table
		function(done) {
			console.log('Updating country_counts table');
			countryDB.updateCountries(done);
		}],
		callback);
};

module.exports = ingestFiles;
