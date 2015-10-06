var db_utils = require('./db_utils');
var config = require('../config');

var _getTableSpecs = function() {
	var tables = [];
	var nonNull = true;
	var autoIncrement = true;

	var relays = {
		name : 'relays',
		columns : [
			db_utils.createColumnString('id','int(11)',nonNull,autoIncrement),
			db_utils.createColumnString('fingerprint','varchar(40)',nonNull),
            db_utils.createColumnString('name','varchar(255)',nonNull),
            db_utils.createColumnString('flags','varchar(4)',nonNull),
            db_utils.createColumnString('ip','varchar(30)',nonNull),
			db_utils.createColumnString('port','varchar(6)',nonNull),
            db_utils.createColumnString('bandwidth','float',nonNull),
			db_utils.createColumnString('dirclients','int(11)',nonNull),
			db_utils.createColumnString('lat','decimal(10,8)',nonNull),
			db_utils.createColumnString('lng','decimal(11,8)',nonNull),
			db_utils.createColumnString('date','datetime',nonNull)
		],
		primaryKey : 'id'
	};

	var guardclients = {
		name : 'guard_clients',
		columns : [
			db_utils.createColumnString('id','int(11)',nonNull, autoIncrement),
			db_utils.createColumnString('relay_id','int(11)',nonNull),
			db_utils.createColumnString('cc','varchar(2)',nonNull),
			db_utils.createColumnString('guardclientcount','int(11)',nonNull),
			db_utils.createColumnString('date','datetime',nonNull)
		],
		primaryKey : 'id'
	};

	var dates = {
		name : 'dates',
		columns : [
			db_utils.createColumnString('date','datetime',nonNull)
		]
	};

	tables.push(relays);
	tables.push(guardclients);
	tables.push(dates);

	return tables;
};

var initialize = function(onSuccess,onError) {
	db_utils.conditionalCreateDatabase(
		config.db.database,
		function() {
			var specs = _getTableSpecs();
			db_utils.createTables(specs,onSuccess,onError);
		},
		onError);
};

module.exports.initialize = initialize;
