var LineLayer = require('./layers/linelayer');

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
    start: function () {
        var idToLatLng = {};

        var map = L.map('map').setView([0, 0], 2);
        var mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tiles.mapbox.com/v3/examples.map-0l53fhk2/{z}/{x}/{y}.png', {
                attribution: '&copy; ' + mapLink + ' Contributors',
                maxZoom: 18,
            }).addTo(map);

        /* Initialize the SVG layer */
        map._initPathRoot();


        d3.json('/nodes', function (nodes) {
            d3.json('/flow', function (flow) {

                /* Add a LatLng object to each item in the dataset and create a lookup from id->LatLng Object */
                nodes.objects.forEach(function(d,i) {
                    d.LatLng = new L.LatLng(d.circle.coordinates[0],
                        d.circle.coordinates[1]);
                    idToLatLng[d.circle.id] = d.LatLng;
                });



                 var markers = L.markerClusterGroup();

                 for (var i = 0; i < nodes.objects.length; i++) {
                     var d = nodes.objects[i];
                     var title = d.circle.id;
                     var marker = L.marker(d.LatLng, { title: title });
                     marker.bindPopup(title);
                     markers.addLayer(marker);
                 }
                map.addLayer(markers);




                // Create line layer and add edges
                var lineLayer = new LineLayer();
                flow.forEach(function(edge) {
                    //lineLayer.addLine(idToLatLng[edge.source],idToLatLng[edge.target]);
                });
                lineLayer.addTo(map);

            });
        });
    }
});

exports.App = App;