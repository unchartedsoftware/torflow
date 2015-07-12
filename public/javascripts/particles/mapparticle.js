var Particle = require('./particle');

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
    _postTick : function() {
        //console.log('\t(' + this._position.latLng.lat + ',' + this._position.latLng.lng);
    }
});

module.exports = MapParticle;