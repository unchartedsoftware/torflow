var DotLayer = L.CanvasLayer.extend({

    _ctx : null,
    _initialized : false,

    add : function(latLng) {
        if (!this._initialized) {
            return;
        }
        var point = this._map.latLngToContainerPoint(latLng);
        this._ctx.fillRect(point.x,point.y,1,1);
    },

    render: function() {
        if (!this._initialized) {
            var canvas = this.getCanvas();
            this._ctx = canvas.getContext('2d');

            this._ctx.fillStyle = 'rgba(0, 0, 255, 0.01)';
            this._ctx.clearRect(0, 0, canvas.width, canvas.height);
            this._initialized = true;
        }
    }
});

module.exports = DotLayer;
