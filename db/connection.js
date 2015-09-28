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
			if ( onError ) {
				onError(err);
			}
		} else {
			connection.query('SET NAMES \'utf8mb4\';', function() {
				onSuccess(connection);
			});
		}
	});
};

var query = function(sql,values,onSuccess,onError) {
	if ( arguments.length === 3 ) {
		onError = onSuccess;
		onSuccess = values;
		values = undefined;
	}
	var args = [
		sql
	];
	if ( values ) {
		args.push( values );
	}
	args.push( function(err,res) {
		if (err) {
			onError(err);
		} else {
			onSuccess(res);
		}
	});
	openConnection(
		function(conn) {
			conn.query.apply( conn, args );
		},
		onError );
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
module.exports.query = query;
module.exports.complete = complete;
module.exports.error = error;
