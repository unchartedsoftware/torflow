var LineLayer = require('./layers/linelayer');

/**
 * Creates the TorFlow front-end app
 * @constructor
 */
var App = function() {

};

App.prototype = _.extend(App.prototype, {

    _clusters : {},     // zoom level -> list of clusters

    _getFlow : function(clusterset) {


    },

    _isVisisble : function(clusterBounds,mapBounds) {
        // TODO: test if cluster bounds is visible in map bounds
        return true;
    },


    /**
     * Application startup.
     */
    start: function () {
        var self = this;
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


                var MIN_RADIUS = 15;
                var MAX_RADIUS = 30;

                /* Add a LatLng object to each item in the dataset and create a lookup from id->LatLng Object */
                nodes.objects.forEach(function(d,i) {
                    d.LatLng = new L.LatLng(d.circle.coordinates[0],
                        d.circle.coordinates[1]);
                    idToLatLng[d.circle.id] = d.LatLng;
                });

                // Initialize zoom -> clusters map
                var minZoom = map.getMinZoom();
                var maxZoom = map.getMaxZoom();
                for (var i = minZoom; i <= maxZoom; i++) {
                    self._clusters[i] = [];
                }

                 var markers = L.markerClusterGroup({
                     removeOutsideVisibleBounds : false,
                     iconCreateFunction: function (cluster) {
                         var markers = cluster.getAllChildMarkers();

                         var dataElements = markers.map(function(marker) {
                             return marker.data.circle;
                         });

                         self._clusters[map.getZoom()].push(cluster);

                         var bandwidth = 0;
                         dataElements.forEach(function(data) {
                             bandwidth += data.bandwidth;
                         });

                         var radius = MIN_RADIUS + (MAX_RADIUS-MIN_RADIUS)*bandwidth;

                         return L.divIcon({
                             className: 'relay-cluster',
                             iconSize: L.point(radius, radius)
                         });
                     },
                 });

                markers.on('animationend', function() {
                    var clusterset = self._clusters[map.getZoom()];
                    self._getFlow(clusterset);
                    console.log('Zoom Level : ' + map.getZoom() + ', Edge Count: ' + clusterset.length * clusterset.length);
                });

                markers.on('')

                var defaultIcon = L.divIcon({
                    className: 'relay-cluster',
                    iconSize:L.point(MIN_RADIUS, MIN_RADIUS)
                });


                 for (var i = 0; i < nodes.objects.length; i++) {
                     var d = nodes.objects[i];
                     var title = d.circle.id;
                     var marker = L.marker(d.LatLng, {icon: defaultIcon});
                     marker.data = d;
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