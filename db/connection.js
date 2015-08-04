var mysql = require('mysql');
var poolModule = require('generic-pool');
var config = require('../config');

var pool = poolModule.Pool({
	name 	: 'mysql-connection-pool',
	create 	: function(callback) {
		var connection = mysql.createConnection({
			host     : config.db.host,
			user     : config.db.user,
			password : config.db.password,
			database : config.db.database
		});
		connection.connect(function(err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                callback(err,null);
                return;
            }
            callback(null,connection);
            console.log('connected as id ' + connection.threadId);
        });
	},
	destroy	: function(connection) {
		connection.end();
	},
	max : 10,
	idleTimeoutMillis : 30000,
	log : false
});

var open = function(callback) {
	pool.acquire(function(err,connection) {
		if (err) throw err;
		else {
			connection.query("SET NAMES 'utf8mb4';",function() {
				callback(connection);
			});

		}
	});
};

var close = function(connection) {
	pool.release(connection);
};

module.exports.open = open;
module.exports.close = close;