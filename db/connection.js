/**
 Copyright 2016 Uncharted Software Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

(function() {
    'use strict';

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

}());
