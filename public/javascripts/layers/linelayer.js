/**
* Copyright © 2015 Uncharted Software Inc.
*
* Property of Uncharted™, formerly Oculus Info Inc.
* http://uncharted.software/
*
* Released under the MIT License.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is furnished to do
* so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

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
