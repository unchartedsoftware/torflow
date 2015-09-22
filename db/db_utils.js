var Process = require('./../util/process_each');
var Config = require('../config');
var mysql = require('mysql');

function getMySQLDate(year, month, day) {
	return year + '/' + month + '/' + day + ' 00:00:00';
}

function getTableNames(conn,schema,success,error) {
	var query = 'SELECT table_name as name FROM information_schema.tables WHERE table_schema = ' + conn.escape(schema);
	conn.query(query, function(err,rows) {
		if (err) {
			if (error) {
				error(err);
			}
		} else {
			var names = [];
			for (var i = 0; i < rows.length; i++) {
				names.push(rows[i].name);
			}
			success(names);
		}
	});
}

function tableExists(conn,schema,tablename,success,error) {
	var query = 'SELECT COUNT(*) as count ' +
		'FROM information_schema.tables ' +
		'WHERE table_schema = ' + conn.escape(schema) + ' ' +
		'AND table_name = ' + conn.escape(tablename) + ';';
	conn.query(query, function(err,rows) {
		if (err) {
			if (error) {
				error(err);
			}
		} else {
			var exists = rows[0].count === 1;
			success(exists);
		}
	});
}

function createTable(conn,name,columns,pk,success,error) {
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
	conn.query(query, function(err) {
		if (err) {
			if (error) {
				error(err);
			}
		} else {
			success();
		}
	});
}

function conditionalCreateTable(conn,schemaname,tableSpec,success,error) {
	console.log('\tChecking if table ' + tableSpec.name + ' exists');
	tableExists(conn,schemaname,tableSpec.name,function(bExists) {
		if (!bExists) {
			console.log('Creating table ' + tableSpec.name);
			createTable(conn, tableSpec.name, tableSpec.columns, tableSpec.primaryKey, function() {
				success();
			}, function(err) {
				if (error) {
					error(err);
				}
			});
		} else {
			success();
		}
	}, function(err) {
		if (error) {
			error(err);
		}
	});
}

function createTables(conn,tableSpecs,success,error) {
	var PID = Process.each(tableSpecs,function(spec,processNext) {
		function eachSuccess() {
			processNext();
		}
		function eachError(err) {
			Process.cancel(PID);
			if (error) {
				error(err);
			}
		}
		conditionalCreateTable(conn,Config.db.database,spec,eachSuccess,eachError);
	}, success);
}

function createColumnString(name, type, nn, autoinc) {
	return '`' + name + '` ' + type + ' ' + (nn ? 'NOT NULL' : '') + (autoinc ? ' AUTO_INCREMENT ' : '');
}

function conditionalCreateDatabase(name,success,error) {
	var connection = mysql.createConnection({
		host: Config.db.host,
		user: Config.db.user,
		password: Config.db.password
	});
	connection.connect();
	connection.query('CREATE DATABASE IF NOT EXISTS ' + name, function(err,rows) {
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
exports.getTableNames = getTableNames;
exports.conditionalCreateTable = conditionalCreateTable;
exports.createColumnString = createColumnString;
exports.createTable = createTable;
exports.createTables = createTables;
exports.conditionalCreateDatabase = conditionalCreateDatabase;
exports.getMySQLDate = getMySQLDate;
