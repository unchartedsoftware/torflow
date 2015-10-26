/**
* Copyright © 2015 Uncharted Software Inc.
*
* Property of Uncharted™, formerly Oculus Info Inc.
* http://uncharted.software/
*
* Released under the MIT License.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is furnished to do
* so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
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
