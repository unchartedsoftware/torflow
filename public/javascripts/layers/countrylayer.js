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

var CountryLayer = function(map) {
    this._map = map;
    this._map._initPathRoot();
    this._geoJSONLayer = L.geoJson(null,{
        style : this._getFeatureStyle.bind(this)
    }).addTo(this._map);
    this._histogram = null;
    this._totalClientCount = null;
    this._geoJSONMap = null;
    this._colorScale = d3.scale.linear()
        .range(['white', 'blue']) // or use hex values
        .domain([0,1]);
};
CountryLayer.prototype = _.extend(CountryLayer.prototype, {

    set : function(countryCodeToCount) {
        var self = this;
        this._histogram = countryCodeToCount;
        var CC = Object.keys(countryCodeToCount);
        var request = {
            url: '/geo',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            async: true,
            data: JSON.stringify({
                cc:CC
            })
        };

        $.ajax(request)
            .done(function( geoJSONMap ) {
                self._geoJSONMap = geoJSONMap;
                self._render();
            })
            .fail(function(err) {
                console.log(err);
            });
    },

    _render : function() {
        var self = this;

        // Total up all the clients we can render
        this._totalClientCount = 0;
        this._maxClientCount = 0;
        Object.keys(this._geoJSONMap).forEach(function(cc) {
            var countryFeatures = self._geoJSONMap[cc];
            if (countryFeatures) {
                self._totalClientCount += self._histogram[cc];
                self._maxClientCount = Math.max(self._histogram[cc],self._maxClientCount);
            }
        });

        // And add each one to the map
        Object.keys(this._geoJSONMap).forEach(function(cc) {
            var countryFeatures = self._geoJSONMap[cc];
            if (countryFeatures) {
                self._geoJSONLayer.addData(countryFeatures);
            }
        });
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
        var cc = this._threeLetterToTwoLetter(feature.id);
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
