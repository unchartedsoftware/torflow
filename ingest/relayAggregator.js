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

var moment = require('moment');
var _ = require('lodash');
var relayDB = require('../db/relay');
var DBUtil = require('../db/db_utils');

var PI = Math.PI;
var PI_D_180 = PI / 180;
var PI_D_4 = PI / 4;
var PI_2 = PI * 2;
var ONE_D_360 = 1/360;

var _getNormalizedPosition = function(latLng) {
    // converts a lat / lng into normalize coordinates
    // [0,0] being top left
    // get x value
    var x = ( latLng.lng + 180 ) * ONE_D_360;
    // convert from degrees to radians
    var latRad = latLng.lat * PI_D_180;
    // get y value
    var mercN = Math.log( Math.tan( PI_D_4 + ( latRad / 2 ) ) );
    var y = 0.5 + ( mercN / PI_2 );
    return {
        x: x,
        y: y
    };
};

var _aggregateNodes = function(relays) {
    // Aggregate on equal lat/lon
    var relaysByBucket = {};
    _.forIn(relays,function(relay) {
        var key = relay.lat.toString() + relay.lng.toString();
        relaysByBucket[key] = relaysByBucket[key] || [];
        if (!relay) {
            console.log('WTFWTFWTF');
            //console.log(relay);
        }
        relaysByBucket[key].push(relay);
    });
    // parse node payloads
    var nodes = [];
    _.forIn(relaysByBucket,function(bucket) {
        // get total bandwidth for the bucket
        var totalBandwidth = _.sum(bucket,function(relay) {
            return relay.bandwidth;
        });
        // take first lat / lon
        var latLng =  {
            lat : bucket[0].lat,
            lng : bucket[0].lng
        };
        var position = _getNormalizedPosition( latLng );
        nodes.push({
            lat: latLng.lat,
            lng: latLng.lng,
            x: position.x,
            y: position.y,
            bandwidth : totalBandwidth,
            label: bucket.length === 1 ? bucket[0].name : bucket.length + ' relays at location'
        });
    });
    return nodes;
};

var _getTotalBandwidth = function(nodes) {
    var sum = 0;
    nodes.forEach(function(node) {
        sum += node.bandwidth;
    });
    return sum;
};

var aggregateRelays = function( dateId, onSuccess, onError ) {
    // get sql date from id
    var sqlDate = DBUtil.getMySQLDate(dateId);
    // pull relays for date
    relayDB.get(
        sqlDate,
        function(relays) {
            var nodes = _aggregateNodes(relays);
            var totalBandwidth = _getTotalBandwidth(nodes);
            // append normalized bandwidth to each node
            nodes.forEach(function(node) {
                node.normalizedBandwidth =  node.bandwidth / totalBandwidth;
            });
            onSuccess( nodes );
        },
        onError );
};

module.exports.aggregateRelays = aggregateRelays;
