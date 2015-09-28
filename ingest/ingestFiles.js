var dir = require('node-dir');
var moment = require('moment');
var connectionPool = require('../db/connection');
var ingestFile = require('./ingestFile');
var process = require('../util/process_each');
var config = require('../config');

var _getDates = function(onSuccess,onError) {
    connectionPool.open(
        function(conn) {
            conn.query('SELECT distinct date FROM ' + config.db.database + '.relays order by date asc',
			function(err,rows) {
                if (err) {
                    connectionPool.error(err,conn,onError);
                } else {
                    var dates = rows.map(function(row) {
                        return [ moment(row.date).format('YYYY/MM/DD HH:mm:ss') ];
                    });
					console.log('Extracted ' + dates.length + ' unique dates');
                    connectionPool.complete(dates,conn,onSuccess);
                }
            });
        },
        onError );
};

var _insertDates = function(dates,onSuccess,onError) {
	connectionPool.open(
        function(conn) {
			conn.query(
				'INSERT INTO dates (date) VALUES ?',
				[dates],
				function(err, rows) {
					if (err) {
	                    connectionPool.error(err,conn,onError);
	                } else {
						connectionPool.complete(rows,conn,onSuccess);
					}
				});
	        },
	        onError );
};

/**
 * Ingest a list of csv files from the path specified
 * @param resolvedPath - the resolved file path of the directory containing the csv files to ingest
 * @param onSuccess - success callback
 * @param onError - error callback
 */
var ingestFiles = function(resolvedPath,onSuccess,onError) {
	// Open a single connection for all files to ingest
	connectionPool.open(
		function(conn) {
			// Get a list of files in the containing directory.   Does not include sub dirs.
			dir.files(resolvedPath, function (err, files) {
				if (err) {
					onError(err);
				} else {
					// Ingest each file
					process.each(files,function(csvPath, processNext) {
						// Skip files not ending with .csv
						if (csvPath.indexOf('.csv') !== csvPath.length - 4) {
							processNext();
							return;
						}

						var onFileSuccess = function(numImported,numSkipped) {
							var logStr = 'Imported ' + csvPath;
							if (numSkipped > 0) {
								logStr += ' (' + numSkipped + ' of ' + numImported+numSkipped + ' skipped due to malformed data)';
							}
							console.log(logStr);
							processNext();
						};

						var onFileError = function(msg) {
							console.trace(msg);
							connectionPool.close(conn);
							processNext();
						};

						ingestFile(conn, csvPath,onFileSuccess,onFileError);

					}, function() {
						// when finished
						connectionPool.close(conn);
						// extract dates to their own table
						_getDates(
							function( dates ) {
								_insertDates( dates, function() {
									console.log('Dates ingestion complete');
									onSuccess();
								}, onError );
							}, onError );
					});
				}
			});
		},
		onError );
};

module.exports = ingestFiles;
