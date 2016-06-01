/**
 Copyright 2016 Uncharted Software Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

(function() {
    'use strict';

	var fs = require('fs');
	var readline = require('readline');
	var _ = require('lodash');
	var async = require('async');
	var relayParser = require('./relayParser');
	var relayDB = require('../db/relay');
	var datesDB = require('../db/dates');
	var countryDB = require('../db/country');

	/**
	 * Creates a hashmap from countrycode -> guardclient count
	 * @param guardClients - object containing guard client info
	 * @returns {*}
	 *
	 */
	var _getGuardClientsHistogram = function(guardClients) {
		var histogram = {};
		// extract guard client row
		_.forIn(guardClients, function(guardClient) {
			_.forIn(guardClient.guardClients,function(count,countrycode) {
				if ( countrycode !== '??' ) {
					// ignore clients with missing country codes
					histogram[countrycode] = count;
				}
			});
		});
		return histogram;
	};

	/**
	 * Extracts an sql date string from the filename of the csv file we're processing
	 * @param filename - name of the file to parse
	 * @returns {*}
	 */
	var _getSQLDateFromFilename = function(filename) {
		var paths = filename.split('/');
		var name = paths[paths.length-1].replace('.csv','');
		var datePieces = name.split('-');
		var year = datePieces[1];
		var month = datePieces[2];
		var day = datePieces[3];
		return year + '-' + month + '-' + day + ' 00:00:00';
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
	 * Ingest a csv relay file into the database
	 * @param resolvedFilePath - the resolved path of the file
	 * @param callback - callback
	 */
	var ingestFile = function(resolvedFilePath,callback) {

		var dateString = _getSQLDateFromFilename(resolvedFilePath);
		datesDB.dateExists(dateString, function(err,exists) {

			// If we've already ingested the date, skip this file
			if (err || exists) {
				console.log('Ignoring.  Date already exists.');
				callback(err);
				return;
			}

			async.waterfall([
					// extract relay data from csv
					function(done) {
						_extractFromCSV(resolvedFilePath,done);
					},
					// insert relay data into table
					function(relaySpecs,numSkipped,guardClients,date,done) {
						relayDB.updateRelays(
							relaySpecs,
							function(err) {
								if (err) {
									done(err);
								} else {
									done(null,relaySpecs,numSkipped,guardClients,date);
								}
							});
					},
					// get guard client histogram and write to countries table
					function(relaySpecs,numSkipped,guardClients,date,done) {
						var histogram = _getGuardClientsHistogram(guardClients,date);
						countryDB.updateCountries(date, histogram, function(err) {
							if (err) {
								done(err);
							} else {
								done(null,date,relaySpecs.length,numSkipped);
							}
						});
					},
					// update relay_aggregates table
					function(date,numImported,numSkipped,done) {
						relayDB.updateAggregates(date,function(err) {
							if (err) {
								done(err);
							} else {
								done(null,date,numImported,numSkipped);
							}
						});
					},
					// update dates table
					function(date,numImported,numSkipped,done) {
						datesDB.updateDates(date, function(err) {
							if (err) {
								done(err);
							} else {
								done(null,numImported,numSkipped);
							}
						});
					}],
				function(err, numImported, numSkipped ) {
					if (err) {
						callback(err);
					} else {
						var logStr = 'Imported ' + numImported + ' relays from ' + resolvedFilePath;
						if (numSkipped > 0) {
							logStr += ' (' + numSkipped + ' of ' + numImported+numSkipped + ' skipped due to malformed data)';
						}
						console.log(logStr);
						callback();
					}
				});
		});
	};

	module.exports = ingestFile;

}());
