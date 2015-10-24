var connectionPool = require('./connection');
var config = require('../config');
var datesDB = require('./dates');
var clientsDB = require('./guardclients');
var async = require('async');
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
                        date : moment(rows[i].date).format('MMM Do, YYYY')
                    });
                }
                // Calculate bottom
                var bottomN = [];
                for (i=rows.length-1; i>=rows.length-count; i--) {
                    bottomN.push({
                        position : i-rows.length,
                        client_count : rows[i].count,
                        date : moment(rows[i].date).format('MMM Do, YYYY')
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

var updateCountries = function(callback) {
    async.waterfall([
        // truncate table if it exists
        function(done) {
            connectionPool.query(
                'TRUNCATE ' + config.db.database + '.country_counts',
                done);
        },
        // get all dates from dates table
        function(rows,done) {
            datesDB.getDates(done);
        },
        // get all country histograms, for each date
        function(dates,done) {
            async.series(
                dates.map(function(date) {
                    return function(done) {
                        clientsDB.getCountryHistogram(date,function(err,histogram) {
                            if (err) {
                                done(err);
                            } else {
                                done(null,{
                                    date: date,
                                    histogram: histogram
                                });
                            }
                        });
                    };
                }),
                done);
        },
        // add country data
        function(histogramPairs,done) {
            async.series(
                histogramPairs.map(function(pair) {
                    return function(done) {
                        var countrySpecs = [];
                        _.forIn(pair.histogram, function(count,country) {
                            countrySpecs.push([pair.date, country, count]);
                        });
                        if (countrySpecs.length > 0) {
                            // only insert if we actually have data
                            connectionPool.query(
                                'INSERT INTO ' + config.db.database + '.country_counts (date,cc,count) VALUES ?',
                                [countrySpecs],
                                done);
                        } else {
                            done();
                        }
                    };
                }),
                done);
        }],
        function(err) {
            callback(err); // only pass on error, if it exists
        });
};

module.exports.getCountryOutliers = getCountryOutliers;
module.exports.getCountryHistogram = getCountryHistogram;
module.exports.updateCountries = updateCountries;
