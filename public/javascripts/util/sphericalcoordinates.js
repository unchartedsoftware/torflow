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