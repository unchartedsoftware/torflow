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

        /* We simply pick up the SVG from the map object */
        var svg = d3.select('#map').select('svg'),
            g = svg.append('g');

        d3.json('/nodes', function (nodes) {
            d3.json('/flow', function (flow) {

                /* Add a LatLng object to each item in the dataset */
                nodes.objects.forEach(function(d,i) {
                    d.LatLng = new L.LatLng(d.circle.coordinates[0],
                        d.circle.coordinates[1]);
                    idToLatLng[d.circle.id] = d.LatLng;
                });

                var MIN_RADIUS = 3;
                var MAX_RADIUS = 20;

                var circles = g.selectAll('circle')
                    .data(nodes.objects)
                    .enter().append('circle')
                    .style('stroke', 'black')
                    .style('opacity', 0.6)
                    .style('fill', 'white')
                    .attr('r', function(d) {
                        return MIN_RADIUS + (MAX_RADIUS-MIN_RADIUS)* d.circle.bandwidth;
                    });

                function update() {
                    circles.attr('transform',
                        function(d) {
                            return 'translate('+
                                map.latLngToLayerPoint(d.LatLng).x +','+
                                map.latLngToLayerPoint(d.LatLng).y +')';
                        }
                    );
                }

                var BigPointLayer = L.CanvasLayer.extend({

                    renderLine: function(ctx, source, target) {
                        ctx.beginPath();
                        ctx.moveTo(source.x,source.y);
                        ctx.lineTo(target.x,target.y);
                        ctx.stroke();
                    },

                    render: function() {
                        console.log('render');
                        var canvas = this.getCanvas();
                        var ctx = canvas.getContext('2d');

                        ctx.strokeStyle = 'rgba(0, 0, 255, 0.05)';

                        // clear canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        var that = this;
                        flow.forEach(function(edge) {
                            var source = that._map.latLngToContainerPoint(idToLatLng[edge.source]);
                            var target = that._map.latLngToContainerPoint(idToLatLng[edge.target]);
                            that.renderLine(ctx,source,target);
                        });
                    }
                });

                var layer = new BigPointLayer();
                layer.addTo(map);

                map.on('viewreset', update);
                update();
            });
        });
    }
});

exports.App = App;