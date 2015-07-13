var R = 1;

var fromLatLng = function(latLng) {
    return {
        x : R * Math.cos(latLng.lng) * Math.cos(latLng.lat),
        y : R * Math.sin(latLng.lng) * Math.cos(latLng.lat),
        z : R * Math.sin(latLng.lat)
    };
};

var toLatLng = function(sph) {
    return new L.LatLng(Math.asin(sph.z/R), Math.atan(sph.x/sph.z));
};

var slerp = function(p0,p1,theta,t) {
    var s1 = Math.sin((1-t)*theta);
    var s2 = Math.sin(t*theta);
    var s3 = Math.sin(theta);
    return {
        x : (p0.x * s1 + p1.x * s2) / s3,
        y : (p0.y * s1 + p1.y * s2) / s3,
        z : (p0.z * s1 + p1.z * s2) / s3
    };
};

var angleBetween = function(p0,p1) {
    return Math.acos(
        p0.x * p1.x +
        p0.y * p1.y +
        p0.z * p1.z
    );
};

module.exports.fromLatLng = fromLatLng;
module.exports.toLatLng = toLatLng;
module.exports.slerp = slerp;
module.exports.angleBetween = angleBetween;