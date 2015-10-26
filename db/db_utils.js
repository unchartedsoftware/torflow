var config = require('../config');
var connectionPool = require('./connection');
var mysql = require('mysql');
var async = require('async');
var moment = require('moment');

function getMySQLDate(dateId) {
	console.log(dateId);
	var date = moment.utc(dateId);
    var day = date.date(); // date == day of month, day == day of week.
    var month = date.month() + 1; // indexed from 0?
    var year = date.year();
	return year + '-' + month + '-' + day + ' 00:00:00';
}

function tableExists(schema,tablename,callback) {
	var query = 'SELECT COUNT(*) as count ' +
		'FROM information_schema.tables ' +
		'WHERE table_schema = ' + connectionPool.escape(schema) + ' ' +
		'AND table_name = ' + connectionPool.escape(tablename) + ';';
	connectionPool.query(
		query,
		function(err,rows) {
			if (err) {
				callback(err);
			} else {
				var exists = rows[0].count === 1;
				callback(exists);
			}
		});
}

function createTable(name,columns,pk,indices,callback) {
	var query = 'CREATE TABLE ' + name + ' ';
	if (columns.length > 0) {
		query +=  ' ( ';
		for (var i = 0; i < columns.length - 1; i++) {
			query += columns[i] + ', ';
		}
		query += columns[columns.length - 1];
		if (pk) {
			query += ', PRIMARY KEY (`' + pk + '`)';
		}
		if (indices) {
			indices.forEach( function(key) {
				query += ', INDEX `' + key + '`(`' + key + '`)';
			});
		}
		query += ')';
		query += ' ENGINE=InnoDB DEFAULT CHARSET=utf8;';
	}
	connectionPool.query(
		query,
		callback );
}

function conditionalCreateTable(schemaname,tableSpec,callback) {
	console.log('\tChecking if table ' + tableSpec.name + ' exists');
	tableExists(
		schemaname,
		tableSpec.name,
		function(exists) {
			if (!exists) {
				console.log('Creating table ' + tableSpec.name);
				createTable(
					tableSpec.name,
					tableSpec.columns,
					tableSpec.primaryKey,
					tableSpec.indices,
					callback);
			} else {
				callback();
			}
		});
}

function createTables(tableSpecs,callback) {
	async.series(
		tableSpecs.map( function( spec ) {
			return function( done ) {
				conditionalCreateTable(config.db.database,spec,done);
			};
		}),
		function(err) {
			callback(err); // only pass on error, if it exists
		});
}

function createColumnString(name, type, notnull, autoinc) {
	return '`' + name + '` ' + type + ' ' + (notnull ? 'NOT NULL' : '') + (autoinc ? ' AUTO_INCREMENT ' : '');
}

function conditionalCreateDatabase(name,callback) {
	var connection = mysql.createConnection({
		host: config.db.host,
		user: config.db.user,
		password: config.db.password
	});
	connection.connect();
	connection.query(
		'CREATE DATABASE IF NOT EXISTS ' + name,
		function(err) {
		if (err) {
			connection.end();
			callback(err);
		} else {
			connection.end();
			callback();
		}
	});
}

exports.tableExists = tableExists;
exports.conditionalCreateTable = conditionalCreateTable;
exports.createColumnString = createColumnString;
exports.createTable = createTable;
exports.createTables = createTables;
exports.conditionalCreateDatabase = conditionalCreateDatabase;
exports.getMySQLDate = getMySQLDate;
