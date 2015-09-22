var mysql = require('mysql');
var config = require('../config');

var pool = mysql.createPool(config.db);

var closeConnection = function(connection) {
	connection.release();
};

var openConnection = function(onSuccess,onError) {
	pool.getConnection(function(err,connection) {
		if (err) {
			console.trace(err.message);
			closeConnection(connection);
			if ( onError ) {
				onError(err);
			} else {
				onSuccess(err);
			}
		} else {
			connection.query('SET NAMES \'utf8mb4\';', function() {
				onSuccess(connection);
			});
		}
	});
};

var complete = function(result,connection,onComplete) {
    closeConnection(connection);
    onComplete(result);
};

var error = function(err,connection,onError) {
    closeConnection(connection);
    if (onError) {
        onError(err);
    }
};

module.exports.open = openConnection;
module.exports.close = closeConnection;
module.exports.complete = complete;
module.exports.error = error;
