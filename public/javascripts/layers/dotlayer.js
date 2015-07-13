var DotLayer = L.CanvasLayer.extend({

    _ctx : null,
    _fadeCanvas : null,
    _fadeCtx : null,
    _initialized : false,

    add : function(latLng) {
        if (!this._initialized) {
            return;
        }
        var point = this._map.latLngToContainerPoint(latLng);
        this._ctx.fillRect(point.x,point.y,1,1);
    },

    fade : function() {
        if (!this._fadeCtx) {
            this.clear();
            return;
        }

        // copy
        this._fadeCtx.drawImage(this._canvas, 0, 0);

        // fade back
        this._ctx.save();
        this.clear();
        this._ctx.globalAlpha=this._alphaFade;
        this._ctx.drawImage(this._fadeCanvas,0,0);
        this._fadeCtx.clearRect(0,0,this._width,this._height);
        this._ctx.restore();
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

            if (this._alphaFade) {
                this._fadeCanvas = document.createElement('canvas');
                this._fadeCanvas.width = canvas.width;
                this._fadeCanvas.height = canvas.height;
                this._fadeCtx = this._fadeCanvas.getContext('2d');
            }

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
    },
    alphaFade : function(alpha) {
        this._alphaFade = alpha;
        return this;
    }
});

module.exports = DotLayer;
