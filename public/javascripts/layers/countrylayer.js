var CountryLayer = function(map) {

    this._map = map;
    this._map._initPathRoot();

    var getStyleFn = this._getFeatureStyle.bind(this);
    this._geoJSONLayer = L.geoJson(null,{
        style : getStyleFn
    }).addTo(this._map);

    this._histogram = null;
    this._totalClientCount = null;
    this._geoJSONMap = null;

    this._colorScale =  d3.scale.linear()
        .range(['yellow', 'red']) // or use hex values
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
            weight : 1,
            opacity : 1
        };
    },

    clear : function() {
        this._geoJSONLayer.clearLayers();
    },

    setOpacity : function(opacity) {
        // TODO:  how to handle this?
    }
});
module.exports = CountryLayer;