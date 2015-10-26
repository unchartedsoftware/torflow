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

    var connectionPool = require('./connection');
    var config = require('../config');
    var relayDB = require('./relay');

    var getDates = function(callback) {
        connectionPool.query(
            'SELECT * FROM ' + config.db.database + '.dates order by date asc',
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    var dates = rows.map(function(row) {
                        return row.date;
                    });
                    var bandwidths = rows.map(function(row) {
                        return row.bandwidth;
                    });
                    callback(null,{
                        dates: dates,
                        bandwidths: bandwidths
                    });
                }
            });
    };

    var updateDates = function(date,callback) {
        relayDB.getAggregates(date,null,function(err,row) {
            if (err) {
                callback(err);
            } else {
                var dateSpec = [[date, row.bandwidth]];
                connectionPool.query(
                    'INSERT INTO ' + config.db.database + '.dates (date,bandwidth) VALUES ?',
                    [ dateSpec ], //row.minMax.min, row.minMax.max],
                    callback);
            }
        });
    };

    var getMinBandwidth = function(callback) {
        connectionPool.query(
            'SELECT * FROM ' + config.db.database + '.dates ORDER BY bandwidth LIMIT 1',
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    callback(null,rows[0]);
                }
            });
    };

    var getMaxBandwidth = function(callback) {
        connectionPool.query(
            'SELECT * FROM ' + config.db.database + '.dates ORDER BY bandwidth DESC LIMIT 1',
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    callback(null,rows[0]);
                }
            });
    };

    module.exports.updateDates = updateDates;
    module.exports.getDates = getDates;
    module.exports.getMinBandwidth = getMinBandwidth;
    module.exports.getMaxBandwidth = getMaxBandwidth;

}());
