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

var bucket = require('../util/bucket');

var DateChart = function(container) {
    this._container = container;
    this._data = null;
    this._margin = {top: 10, right: 10, bottom: 50, left: 10};
    this._width = $(container).width() - this._margin.left - this._margin.right;
    this._height = $(container).height() - this._margin.top - this._margin.bottom;
    this._colorStops = d3.scale.sqrt()
        .range(['#ff0000','#0000ff'])
        .domain([0,1]);
    this._onClick = null;
};

DateChart.prototype.data = function(data) {
    if (arguments.length === 0) {
        return this._data;
    }
    var res = bucket({
        data: data.bandwidths,
        xExtractor: function(value,index) {
            return index;
        },
        yExtractor: function(value) {
            return value;
        },
        threshold: 0.015,
        maxBucketSize: 20
    });
    this._min = res.min;
    this._max = res.max;
    this._range = res.max - res.min;
    this._data = res.buckets;
    return this;
};

DateChart.prototype.margin = function(margin) {
    if (arguments.length === 0) {
        return this._margin;
    }
    this._margin = margin;
    return this;
};

DateChart.prototype.width = function(width) {
    if (arguments.length === 0) {
        return this._width;
    }
    this._width = width;
    this._update();
    return this;
};

DateChart.prototype.height = function(height) {
    if (arguments.length === 0) {
        return this._height;
    }
    this._height = height;
    this._update();
    return this;
};

DateChart.prototype.colorStops = function(colorStops) {
    if (arguments.length === 0) {
        return this._colorStops;
    }
    this._colorStops = d3.scale.sqrt()
        .range(colorStops)
        .domain([0, 1]);
    this._update();
    return this;
};

DateChart.prototype.draw = function() {
    this._update();
    return this;
};

DateChart.prototype.click = function(onClick) {
    if (arguments.length === 0) {
        return this._onClick;
    }
    this._onClick = onClick;
    this._update();
    return this;
};

DateChart.prototype._update = function() {
    var self = this;
    if (!this._container || !this._data) {
        return;
    }

    this._container.empty();

    var x = d3.scale.linear()
        .range([0, this.width()]);

    var y = d3.scale.linear()
        .range([this.height(), 0]);

    var svg = d3.select($(this._container)[0]).append('svg')
        .attr('width', this._width + this._margin.left + this._margin.right)
        .attr('height', this._height + this._margin.top + this._margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + this._margin.left + ',' + this._margin.top + ')');

    x.domain([ 0, this._data.length -1 ]);

    y.domain([ 0, this._max ]);

    svg.selectAll('.bar')
        .data(this._data)
        .enter()
        .append('rect')
        .attr('class', function(d,index) {
            return (index === self._dateIndex) ? 'bar date-bar active' : 'bar date-bar';
        })
        .attr('fill', function(d) {
            return self._colorStops((d.y - self._min) / self._range);
        })
        .attr('stroke', '#000')
        .attr('stroke-opacity', 0.8)
        .attr('x', function(d,i) {
            return x(i);
        })
        .attr('width', this.width() / (this._data.length - 1) )
        .attr('y', function(d) {
            return y(d.y);
        })
        .attr('height', function(d) {
            return self._height - y(d.y);
        });

    if (this._onClick) {
        svg.selectAll('.bar').on('click', function () {
            self._onClick(this.__data__);
        });
    }
};

module.exports = DateChart;
