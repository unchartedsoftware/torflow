var LineLayer = L.CanvasLayer.extend({

    _lines : [],

    addLine : function(srcLatLng, dstLatLng) {
        this._lines.push({
            source : srcLatLng,
            dest : dstLatLng
        });
    },

    _renderLine: function(ctx, source, dest) {
        ctx.beginPath();
        ctx.moveTo(source.x,source.y);
        ctx.lineTo(dest.x,dest.y);
        ctx.stroke();
    },

    render: function() {
        var canvas = this.getCanvas();
        var ctx = canvas.getContext('2d');

        ctx.strokeStyle = 'rgba(0, 0, 255, 0.05)';

        // clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var that = this;
        this._lines.forEach(function(line) {
            var source = that._map.latLngToContainerPoint(line.source);
            var dest = that._map.latLngToContainerPoint(line.dest);
            that._renderLine(ctx,source,dest);
        });

    }
});

module.exports = LineLayer;
