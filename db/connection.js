var mysql = require('mysql');
var config = require('../config');

var pool = mysql.createPool(config.db);

var _closeConnection = function(connection) {
	connection.release();
};

var _openConnection = function(callback) {
	pool.getConnection(function(err,connection) {
		if (err) {
			console.trace(err.message);
			if ( callback ) {
				callback(err);
			}
		} else {
			connection.query('SET NAMES \'utf8mb4\';', function() {
				callback(null,connection);
			});
		}
	});
};

var query = function(sql,values,callback) {
	if ( arguments.length === 2 ) {
		callback = values;
		values = undefined;
	}
	_openConnection(
		function(err,connection) {
			if (err) {
				if (callback) {
					callback(err);
				}
			} else {
				var args = [
					sql
				];
				if (values) {
					args.push(values);
				}
				args.push(function(err,res) {
					_closeConnection(connection);
					if (err) {
						console.trace(err.message);
						if (callback) {
							callback(err);
						}
					} else {
						if (callback) {
							callback(null,res);
						}
					}
				});
				connection.query.apply(connection,args);
			}
		});
};

var escape = function() {
	return pool.escape.apply(pool,arguments);
};

module.exports.query = query;
module.exports.escape = escape;
