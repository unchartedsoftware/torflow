var LineLayer = require('./layers/linelayer');
var DotLayer = require('./layers/dotlayer');
var MapParticleSimulation = require('./particles/mapparticlesimulation');

var PARTICLE_COUNT = 1000;

/**
 * Creates the TorFlow front-end app
 * @constructor
 */
var App = function() {

};

App.prototype = _.extend(App.prototype, {

    _clusters : {},     // zoom level -> list of clusters

    _particleSimulation : null,

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
            var ibreak = 0;
            ibreak++;
            //console.log('Edge count: ' + flow.length);

            var MIN_RADIUS = 15;
            var MAX_RADIUS = 30;

            /* Add a LatLng object to each item in the dataset */
            nodes.objects.forEach(function(d,i) {
                d.latLng = new L.LatLng(d.circle.coordinates[0],
                    d.circle.coordinates[1]);
                idToLatLng[d.circle.id] = d.latLng;
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


            var defaultIcon = L.divIcon({
                className: 'relay-cluster',
                iconSize:L.point(MIN_RADIUS, MIN_RADIUS)
            });


             for (var i = 0; i < nodes.objects.length; i++) {
                 var d = nodes.objects[i];
                 var title = d.circle.id;
                 var marker = L.marker(d.latLng, {icon: defaultIcon});
                 marker.data = d;
                 marker.bindPopup(title);
                 markers.addLayer(marker);
             }
            map.addLayer(markers);

            var trailLayer = new DotLayer()
                .fillStyle('rgba(0,0,255,0.03');
            var headLayer = new DotLayer()
                .fillStyle('rgba(255,255,255,0.8');
            self._particleSimulation = new MapParticleSimulation(nodes.objects,PARTICLE_COUNT,map)
                .start()
                .onPositionsAvailable(function(positions) {
                    headLayer.clear();
                    positions.forEach(function(pos) {
                        trailLayer.add(pos.latLng);
                        headLayer.add(pos.latLng);
                    });
                });
            trailLayer.addTo(map);
            headLayer.addTo(map);





            //// Create line layer and add edges
            //var lineLayer = new LineLayer();
            //flow.forEach(function(edge) {
            //    //lineLayer.addLine(idToLatLng[edge.source],idToLatLng[edge.target]);
            //});
            //lineLayer.addTo(map);
        });
    }
});

exports.App = App;