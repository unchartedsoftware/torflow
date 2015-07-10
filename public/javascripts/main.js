/**
 * Creates the TorFlow front-end app
 * @constructor
 */
var App = function() {

};

App.prototype = _.extend(App.prototype, {

    /**
     * Application startup.
     */
    start : function() {

        var map = L.map('map').setView([-41.2858, 174.7868], 13);
        var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tiles.mapbox.com/v3/examples.map-0l53fhk2/{z}/{x}/{y}.png', {
                attribution: '&copy; ' + mapLink + ' Contributors',
                maxZoom: 18,
            }).addTo(map);

        /* Initialize the SVG layer */
        map._initPathRoot()

        /* We simply pick up the SVG from the map object */
        var svg = d3.select('#map').select('svg'),
            g = svg.append('g');

        d3.json('/nodes', function(collection) {
            /* Add a LatLng object to each item in the dataset */
            collection.objects.forEach(function(d) {
                d.LatLng = new L.LatLng(d.circle.coordinates[0],
                    d.circle.coordinates[1]);
            });

            var MIN_RADIUS = 2;
            var MAX_RADIUS = 20;

            var feature = g.selectAll('circle')
                .data(collection.objects)
                .enter().append('circle')
                .style('stroke', 'black')
                .style('opacity', 0.6)
                .style('fill', 'red')
                .attr('r', function(d) {
                    return MIN_RADIUS + (MAX_RADIUS-MIN_RADIUS)* d.circle.bandwidth;
                });

            function update() {
                feature.attr('transform',
                    function(d) {
                        return 'translate('+
                            map.latLngToLayerPoint(d.LatLng).x +','+
                            map.latLngToLayerPoint(d.LatLng).y +')';
                    }
                );
            }

            map.on('viewreset', update);
            update();
        });
    }
});

exports.App = App;