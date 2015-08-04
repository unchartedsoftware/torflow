var connectionPool = require('./connection');
var db_utils = require('./db_utils');

var _getTableSpecs = function() {
	var tables = [];
	var nonNull = true;
	var replays = {
		name : 'replays',
		columns : [	db_utils.createColumnString('fingerprint','varchar(40)',nonNull),
            db_utils.createColumnString('name','varchar(255)',nonNull),
            db_utils.createColumnString('flags','varchar(4)',nonNull),
            db_utils.createColumnString('ip','varchar(30)',nonNull),
			db_utils.createColumnString('port','varchar(6)',nonNull),
            db_utils.createColumnString('bandwidth','float',nonNull),
			db_utils.createColumnString('uptime','int(11)',nonNull),
        ],
		primaryKey : 'id'
	};

	var events = {
		name : 'events',
		columns : [	db_utils.createColumnString('id','varchar(255)',nonNull),
			db_utils.createColumnString('replay_id','varchar(255)',nonNull),
			db_utils.createColumnString('json','text',nonNull),
			db_utils.createColumnString('gametime','int(11)')],
		primaryKey : 'id'
	};

	tables.push(replays);
	tables.push(events);

	return tables;
};

var initialize = function(success,error) {
	connectionPool.open(function(connection) {

		function onSuccess() {
			connectionPool.close(connection);
			success();
		}

		function onError(err) {
			connectionPool.close(connection);
			if (error) {
                error(err);
            } else {
                console.error(err);
            }
		}


		var specs = _getTableSpecs();
		db_utils.createTables(connection,specs,onSuccess,onError);
	});
};


module.exports.initialize = initialize;