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
    var _ = require('lodash');
    var moment = require('moment');

    var getCountryOutliers = function(cc,count,callback) {
        var MAX_COUNT = 50;
        connectionPool.query(
            'SELECT * FROM ' + config.db.database + '.country_counts WHERE cc=? ORDER BY count DESC',
            [cc],
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    var i;
                    var outliers = {};
                    if (rows.length === 0) {
                        outliers[cc] = [];
                        return callback(null,outliers);
                    }
                    // Bound the outlier count
                    count = Math.min(count, MAX_COUNT);
                    // ensure equal numbers on either side
                    if (Math.floor(rows.length/2) < count) {
                        count = Math.floor(rows.length/2);
                    }
                    // Calculate average
                    var sum = 0;
                    rows.forEach(function(row) {
                        sum += row.count;
                    });
                    var avg = [{
                        position : 0,
                        date : 'Average',
                        client_count : sum/rows.length
                    }];
                    // Calculate top
                    var topN = [];
                    for (i=0; i<count; i++) {
                        topN.push({
                            position : count-i,
                            client_count : rows[i].count,
                            date : moment.utc(rows[i].date).format('MMM Do, YYYY')
                        });
                    }
                    // Calculate bottom
                    var bottomN = [];
                    for (i=rows.length-1; i>=rows.length-count; i--) {
                        bottomN.push({
                            position : i-rows.length,
                            client_count : rows[i].count,
                            date : moment.utc(rows[i].date).format('MMM Do, YYYY')
                        });
                    }
                    outliers[cc] = topN.concat(avg.concat(bottomN));
                    callback(null,outliers);
                }
            });
    };

    var getCountryHistogram = function(date,count,callback) {
        var limitStr = count ? 'LIMIT ' + count : '';
        connectionPool.query(
            'SELECT * FROM ' + config.db.database + '.country_counts WHERE date=? ORDER BY count DESC ' + limitStr,
            [date],
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    var histogram = {};
                    rows.forEach(function(row) {
                        histogram[row.cc] = row.count;
                    });
                    callback(null,histogram);
                }
            });
    };

    var getDateHistogram = function(countrycode,callback) {
        connectionPool.query(
            'SELECT date,count FROM ' + config.db.database + '.country_counts WHERE cc=? ORDER BY date',
            [countrycode],
            function(err,rows) {
                if (err) {
                    callback(err);
                } else {
                    callback(null,rows);
                }
            });
    };

    var updateCountries = function(date,histogram,callback) {
        var countrySpecs = [];
        _.forIn(histogram, function(count, country) {
            countrySpecs.push([date, country, count]);
        });
        if (countrySpecs.length > 0) {
            // only insert if we actually have data
            connectionPool.query(
                'INSERT INTO ' + config.db.database + '.country_counts (date,cc,count) VALUES ?',
                [countrySpecs],
                callback);
        } else {
            callback();
        }
    };

    module.exports.getCountryOutliers = getCountryOutliers;
    module.exports.getCountryHistogram = getCountryHistogram;
    module.exports.getDateHistogram = getDateHistogram;
    module.exports.updateCountries = updateCountries;

}());
