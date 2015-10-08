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

var CountryLayer = function() {
    this._geoJSONLayer = L.geoJson(null,{
        style : this._getFeatureStyle.bind(this)
    });
    this._histogram = null;
    this._geoJSONMap = {};
    this._colorScale = d3.scale.linear()
        .range(['rgba(0,0,255,0.2)', 'rgba(0,0,255,1.0)']) // or use hex values
        .domain([0,1]);
};

CountryLayer.prototype = _.extend(CountryLayer.prototype, {

    addTo: function(map) {
        this._map = map;
        this._geoJSONLayer.addTo(map);
        return this;
    },

    set : function(histogram) {
        var self = this;
        // store country / count histogram
        this._histogram = histogram;
        // store timestamp of request, if this changes during a batch
        // it will cancel the entire series operation, preventing stale
        // requests
        var currentTimestamp = Date.now();
        this._requestTimestamp = currentTimestamp;
        // update max client count
        this._maxClientCount = _.max( this._histogram );
        // build requests array
        var requests = [];
        _.forEach(this._histogram, function(count,countryCode) {
            if ( count === 0 ) {
                return;
            }
            if (self._geoJSONMap[countryCode]) {
                // we already have the geoJSON
                requests.push( function(done) {
                    self._render(countryCode);
                    done(self._requestTimestamp !== currentTimestamp);
                });
            } else {
                // request geoJSON from server
                requests.push( function(done) {
                    var request = {
                        url: '/geo/' + countryCode,
                        type: 'GET',
                        contentType: 'application/json; charset=utf-8',
                        async: true
                    };
                    $.ajax(request)
                        .done(function (geoJSON) {
                            self._geoJSONMap[countryCode] = geoJSON;
                            self._render(countryCode);
                            done(self._requestTimestamp !== currentTimestamp);
                        })
                        .fail(function (err) {
                            console.log(err);
                            done(self._requestTimestamp !== currentTimestamp);
                        });
                });
            }
        });
        // execute the requests one at a time to prevent browser from locking
        async.series(requests);
    },

    _render : function(countryCode) {
        var geoJSON = this._geoJSONMap[countryCode];
        if (geoJSON) {
            this._geoJSONLayer.addData(geoJSON);
        }
    },

    _threeLetterToTwoLetter : function(cc_threeLetter) {
        var self = this;
        var cc_twoLetter = Object.keys(this._geoJSONMap).filter(function(cc) {
            return self._geoJSONMap[cc] && self._geoJSONMap[cc].cc_3 === cc_threeLetter.toUpperCase();
        });
        if (cc_twoLetter && cc_twoLetter.length) {
            return cc_twoLetter[0];
        } else {
            return null;
        }
    },

    _getFeatureStyle : function(feature) {
        var cc = this._threeLetterToTwoLetter(feature.id || feature.properties.ISO_A3);
        var relativePercentage = this._histogram[cc] / this._maxClientCount;
        var fillColor = this._colorScale(relativePercentage);
        return {
            color : fillColor,
            weight : 0,
            opacity : 0.3
        };
    },

    clear : function() {
        this._geoJSONLayer.clearLayers();
    },

    setOpacity : function() {
        // TODO:  how to handle this?
    }

});
module.exports = CountryLayer;
