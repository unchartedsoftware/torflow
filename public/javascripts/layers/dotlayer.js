var DotLayer = L.CanvasLayer.extend({

    _ctx : null,
    _initialized : false,

    add : function(pos) {
        if (!this._initialized) {
            return;
        }
        var point = this._map.latLngToContainerPoint(pos.latLng);
        this._ctx.fillRect(point.x,point.y,1,1);
    },

    clear : function() {
        this._ctx.clearRect(0, 0, this._width, this._height);
    },

    render: function() {
        if (!this._initialized) {
            var canvas = this.getCanvas();
            this._ctx = canvas.getContext('2d');
            this._width = canvas.width;
            this._height = canvas.height;

            this.clear();

            this._ctx.fillStyle = this._fillStyle || 'white';
            this._initialized = true;
        }
    }
});

DotLayer.prototype = _.extend(DotLayer.prototype,{
    fillStyle : function(style) {
        this._fillStyle = style;
        return this;
    }
});

module.exports = DotLayer;
