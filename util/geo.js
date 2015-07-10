/**
 * Computes the average lat/lon from a list of lat/lon points
 * @param points
 * @returns {*}
 */
function average(points) {
    if (points.length === 1)
    {
        return points[0];
    }

    var x = 0;
    var y = 0;
    var z = 0;

    points.forEach(function(point) {
        var latitude = point.lat * Math.PI / 180;
        var longitude = point.lon * Math.PI / 180;

        x += Math.cos(latitude) * Math.cos(longitude);
        y += Math.cos(latitude) * Math.sin(longitude);
        z += Math.sin(latitude);
    });

    var total = points.length;

    x = x / total;
    y = y / total;
    z = z / total;

    var centralLongitude = Math.atan2(y, x);
    var centralSquareRoot = Math.sqrt(x * x + y * y);
    var centralLatitude = Math.atan2(z, centralSquareRoot);

    return {
        lat : centralLatitude * 180 / Math.PI,
        lon : centralLongitude * 180 / Math.PI
    };
}

module.exports.average = average;