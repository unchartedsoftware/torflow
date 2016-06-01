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
                    [ dateSpec ],
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

    var dateExists = function(dateString,callback) {
        connectionPool.query(
            'SELECT * FROM ' + config.db.database + '.dates WHERE date=?',[dateString],
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    callback(null,rows.length > 0);
                }
            }
        )
    };

    module.exports.updateDates = updateDates;
    module.exports.getDates = getDates;
    module.exports.getMinBandwidth = getMinBandwidth;
    module.exports.getMaxBandwidth = getMaxBandwidth;
    module.exports.dateExists = dateExists;

}());
