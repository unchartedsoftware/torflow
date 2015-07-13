var Particle = require('./particle');
var RandomRange = require('../util/randomrange');

var MapParticle = function(map) {
    this._map = map;
    this._arr = null;
    Particle.call(this);
};

MapParticle.prototype = _.extend(Particle.prototype,{
    _updatePosition : function(alpha) {
        if (this._arr === null) {
            this._arr = [this._source.latLng, this._destination.latLng];
        }
        this._position = L.GeometryUtil.interpolateOnLine(this._map,this._arr,alpha);
    },
    start : function() {
        var source = this._source;
        var dest = this._destination;

        var sourceXY = L.point(this._map.latLngToLayerPoint(source.latLng).x, this._map.latLngToLayerPoint(source.latLng).y);
        var destXY = L.point(this._map.latLngToLayerPoint(dest.latLng).x, this._map.latLngToLayerPoint(dest.latLng).y);

        //console.log('Original: (' + this._source.latLng.lat + ',' + this._source.latLng.lng + ')->(' + this._destination.latLng.lat + ',' + this._destination.latLng.lng + ')');

        var srcToDst = {
            x : destXY.x - sourceXY.x,
            y : destXY.y - sourceXY.y
        };
        var len = Math.sqrt(srcToDst.x * srcToDst.x + srcToDst.y * srcToDst.y);
        srcToDst.x /= len;
        srcToDst.y /= len;

        var channel = RandomRange(-5,5);
        //console.log(channel);
        var perp = {
            x : -srcToDst.y * channel,
            y : srcToDst.x * channel
        };

        sourceXY.x += perp.x;
        sourceXY.y += perp.y;
        destXY.x += perp.x;
        destXY.y += perp.y;

        this._source.latLng = this._map.layerPointToLatLng(sourceXY);
        this._destination.latLng = this._map.layerPointToLatLng(destXY);

        //console.log('Mapped: (' + this._source.latLng.lat + ',' + this._source.latLng.lng + ')->(' + this._destination.latLng.lat + ',' + this._destination.latLng.lng + ')\n');

        this._rafID = this._requestAnimationFrame.call(window,this._tick.bind(this));
    },
    _postTick : function() {
        //console.log('\t(' + this._position.latLng.lat + ',' + this._position.latLng.lng);
    }
});

module.exports = MapParticle;