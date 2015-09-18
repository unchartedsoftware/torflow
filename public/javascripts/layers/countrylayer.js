var CountryLayer = function(map) {
    this._map = map;
    this._element = d3.select(map.getPanes().overlayPane).append('svg');
    this._g = this._element.append('g').attr('class','leaflet-zoom-hide');
};
CountryLayer = _.extend(CountryLayer.prototype, {

    set : function(countryCodeToCount) {
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
            .done(function( data ) {
                var ibreak = 0;
                ibreak++;
                console.log(data);
            })
            .fail(function(err) {

            });
    },

    getElement : function() {
        return this._element;
    },
    getGroup : function() {
        return this._g;
    }
});
module.exports = CountryLayer;