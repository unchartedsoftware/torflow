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

    var _ = require('lodash');
    var relayDB = require('../db/relay');

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

    var aggregateRelays = function(dateId,callback) {
        // pull relays for date
        relayDB.getRelays(
            dateId,
            function(err,relays) {
                if (err) {
                    callback(err);
                } else {
                    var nodes = _aggregateNodes(relays);
                    var totalBandwidth = _getTotalBandwidth(nodes);
                    var nodeSpecs = nodes.map(function(node) {
                        return [
                            dateId,
                            node.lat,
                            node.lng,
                            node.x,
                            node.y,
                            node.bandwidth,
                            node.bandwidth / totalBandwidth,
                            node.label
                        ];
                    });
                    callback(null,nodeSpecs);
                }
            });
    };

    module.exports.aggregateRelays = aggregateRelays;

}());
