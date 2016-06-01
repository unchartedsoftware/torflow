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

}());
