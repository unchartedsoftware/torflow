var Lerp = require('../util/lerp');
var THICKNESS = 3;
var DotLayer = L.CanvasLayer.extend({

    _ctx : null,
    _initialized : false,

    add : function(pos) {
        if (!this._initialized) {
            return;
        }
        var point = this._map.latLngToContainerPoint(pos.latLng);
        var tailDirectionX = 0, tailDirectionY = 0;
        if (pos.source && pos.source.latLng) {
            var sourcePoint = this._map.latLngToContainerPoint(pos.source.latLng);

            tailDirectionX = sourcePoint.x - point.x;
            tailDirectionY = sourcePoint.y - point.y;
            var dirMagnitude = Math.sqrt(tailDirectionX * tailDirectionX + tailDirectionY * tailDirectionY);
            tailDirectionX /= dirMagnitude;
            tailDirectionY /= dirMagnitude;
        }

        // Draw 10 line segments
        var head = {
            x: point.x,
            y: point.y
        };

        var TAIL_SCALE = 30;
        var NUM_SEGMENTS = 3;
        this._ctx.strokeWidth = THICKNESS + 'px';
        for (var i = 0; i < NUM_SEGMENTS; i++) {
            this._ctx.strokeStyle = 'rgba(0,0,255,' + (1.0 - (i/NUM_SEGMENTS)) + ')';

            this._ctx.beginPath();
            this._ctx.moveTo(head.x,head.y);
            this._ctx.lineTo(head.x + (tailDirectionX*TAIL_SCALE), head.y + (tailDirectionY*TAIL_SCALE));
            this._ctx.stroke();
            head.x += (tailDirectionX*TAIL_SCALE);
            head.y += (tailDirectionY*TAIL_SCALE);
        }

        this._ctx.fillRect(point.x - THICKNESS/2,point.y - THICKNESS/2,THICKNESS,THICKNESS);
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
