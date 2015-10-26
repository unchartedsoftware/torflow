var db_utils = require('./db_utils');
var config = require('../config');
var async = require('async');

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
		primaryKey : 'id',
		indices: ['date']
	};
	var relayaggregates = {
		name : 'relay_aggregates',
		columns : [
			db_utils.createColumnString('date','datetime',nonNull),
			db_utils.createColumnString('lat','float',nonNull),
			db_utils.createColumnString('lng','float',nonNull),
			db_utils.createColumnString('x','float',nonNull),
			db_utils.createColumnString('y','float',nonNull),
			db_utils.createColumnString('bandwidth','float',nonNull),
			db_utils.createColumnString('normalized_bandwidth','float',nonNull),
			db_utils.createColumnString('label','varchar(255)',nonNull)
		],
		indices: ['date']
	};
	var countrycounts = {
		name : 'country_counts',
		columns : [
			db_utils.createColumnString('date','datetime',nonNull),
			db_utils.createColumnString('cc','varchar(2)',nonNull),
			db_utils.createColumnString('count','int(11)',nonNull)
		],
		indices: ['date','cc']
	};
	var dates = {
		name : 'dates',
		columns : [
			db_utils.createColumnString('date','datetime',nonNull),
			db_utils.createColumnString('bandwidth','float',nonNull)
		],
		indices: ['bandwidth']
	};
	tables.push(relays);
	tables.push(relayaggregates);
	tables.push(dates);
	tables.push(countrycounts);
	return tables;
};

var initialize = function(callback) {
	async.waterfall([
		// create database, if it doesn;t exist already
		function(done) {
			db_utils.conditionalCreateDatabase(config.db.database,done);
		},
		// create tables
		function(done) {
			var specs = _getTableSpecs();
			db_utils.createTables(specs,done);
		}],
		callback);
};

module.exports.initialize = initialize;
