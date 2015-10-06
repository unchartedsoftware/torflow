var config = require('../config');
var connectionPool = require('./connection');
var mysql = require('mysql');
var async = require('async');

function getMySQLDate(year, month, day) {
	return year + '/' + month + '/' + day + ' 00:00:00';
}

function tableExists(schema,tablename,success,error) {
	var query = 'SELECT COUNT(*) as count ' +
		'FROM information_schema.tables ' +
		'WHERE table_schema = ' + connectionPool.escape(schema) + ' ' +
		'AND table_name = ' + connectionPool.escape(tablename) + ';';
	connectionPool.query(
		query,
		function(rows) {
			var exists = rows[0].count === 1;
			success(exists);
		},
		error );
}

function createTable(name,columns,pk,success,error) {
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
		query += ')';
		query += ' ENGINE=InnoDB DEFAULT CHARSET=utf8;';
	}
	connectionPool.query(
		query,
		success,
		error );
}

function conditionalCreateTable(schemaname,tableSpec,success,error) {
	console.log('\tChecking if table ' + tableSpec.name + ' exists');
	tableExists(
		schemaname,
		tableSpec.name,
		function(exists) {
			if (!exists) {
				console.log('Creating table ' + tableSpec.name);
				createTable(tableSpec.name, tableSpec.columns, tableSpec.primaryKey, success, error);
			} else {
				success();
			}
		},
		error);
}

function createTables(tableSpecs,success,error) {
	var jobs = tableSpecs.map( function( spec ) {
		return function( done ) {
			conditionalCreateTable(
				config.db.database,
				spec,
				function() {
					done(null,null);
				},
				function(err) {
					done(err);
				});
		};
	});
	async.series(
		jobs,
		function( err, rows ) {
			if (err) {
				error(err);
			} else {
				success(rows);
			}
		});
}

function createColumnString(name, type, notnull, autoinc) {
	return '`' + name + '` ' + type + ' ' + (notnull ? 'NOT NULL' : '') + (autoinc ? ' AUTO_INCREMENT ' : '');
}

function conditionalCreateDatabase(name,success,error) {
	var connection = mysql.createConnection({
		host: config.db.host,
		user: config.db.user,
		password: config.db.password
	});
	connection.connect();
	connection.query('CREATE DATABASE IF NOT EXISTS ' + name, function(err) {
		if (err) {
			connection.end();
			error(err);
		} else {
			connection.end();
			success();
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
