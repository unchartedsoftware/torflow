var fs = require('fs');
var readline = require('readline');
var Geo = require('./geo');

function processRelayData(filename,callback) {
    var relayData = {};     // Fingerprint -> JSON data

    var columns;            // column names

    var firstLine = true;
    var rd = readline.createInterface({
        input: fs.createReadStream(__dirname + '/../data/' + filename),
        output: process.stdout,
        terminal: false
    });

    rd.on('line', function(line) {
        if (firstLine) {
            firstLine = false;
            columns = line.split(',').map(function(column,i) {
                if (i === 5) {
                    return 'gps';
                } else {
                    return column.toLowerCase();
                }
            });
            return;
        }
        var element = {};
        line.split(',').forEach(function(value,i) {
            if (i === 5) {      // gps
                var latlon = value.split('/');
                var lat = parseFloat(latlon[0]);
                var lon = parseFloat(latlon[1]);

                if (isNaN(lat) || isNaN(lon)) {
                    element[columns[i]] = {
                        lat : 0,
                        lon : 0
                    };
                } else {
                    element[columns[i]] = {
                        lat : parseFloat(latlon[0]),
                        lon : parseFloat(latlon[1])
                    };
                }
            } else if ( i === 4) {
                element[columns[i]] = parseFloat(value);    // bandwidth
            } else {
                element[columns[i]] = value;                // string field
            }

        });
        relayData[element.fingerprint] = element;
    });

    rd.on('close',function() {
        callback(relayData);
    });
}

function centerPoint(relayData) {
    return Geo.average(points(relayData));
}

function points(relayData) {
    var points = [];
    Object.keys(relayData).forEach(function(fingerprint) {
        var data = relayData[fingerprint];
        points.push(data.gps);
    });
    return points;
}

function bandwidth(relayData) {
    var bandwidth = [];
    Object.keys(relayData).forEach(function(fingerprint) {
        bandwidth.push(relayData[fingerprint].observedbw);
    });
    return bandwidth;
}

module.exports.processRelayData = processRelayData;
module.exports.centerPoint = centerPoint;
module.exports.points = points;
module.exports.bandwidth = bandwidth;