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

var OutlierBarChart = function(container) {
    this._container = container;
    this._data = null;
    this._margin = {top: 20, right: 20, bottom: 30, left: 40};

    this._width = $(container).width() - this._margin.left - this._margin.right;
    this._height = $(container).height() - this._margin.top - this._margin.bottom;
    this._colorStops = ['#0000ff','#898989','#ff0000'];

    this._onClick = null;
};

OutlierBarChart.prototype.data = function(data) {
    if (arguments.length === 0) {
        return this._data;
    }
    this._data = data;
    return this;
};

OutlierBarChart.prototype.margin = function(margin) {
    if (arguments.length === 0) {
        return this._margin;
    }
    this._margin = margin;
    return this;
};

OutlierBarChart.prototype.width = function(width) {
    if (arguments.length === 0) {
        return this._width;
    }
    this._width = width;
    this._update();
    return this;
};

OutlierBarChart.prototype.height = function(height) {
    if (arguments.length === 0) {
        return this._height;
    }
    this._height = height;
    this._update();
    return this;
};

OutlierBarChart.prototype.colorStops = function(colorStops) {
    if (arguments.length === 0) {
        return this._colorStops;
    }
    this._colorStops = colorStops;
    this._update();
    return this;
};

OutlierBarChart.prototype.draw = function() {
    this._update();
    return this;
};

OutlierBarChart.prototype.click = function(onClick) {
    if (arguments.length === 0) {
        return this._onClick;
    }
    this._onClick = onClick;
    this._update();
    return this;
};

OutlierBarChart.prototype._update = function() {
    var self = this;
    if (!this._container || !this._data) {
        return;
    }

    this._container.empty();

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, this.width()], 0.1);

    var y = d3.scale.linear()
        .range([this.height(), 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient('left');

    var svg = d3.select($(this._container)[0]).append('svg')
        .attr('width', this._width + this._margin.left + this._margin.right)
        .attr('height', this._height + this._margin.top + this._margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + this._margin.left + ',' + this._margin.top + ')');

    x.domain(this._data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(this._data, function(d) { return d.client_count; })]);

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + this._height + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Frequency');

    var positiveInterpolator = d3.scale.linear()
        .domain([(this._data.length-1)/2,0])
        .interpolate(d3.interpolateRgb)
        .range([this._colorStops[0], this._colorStops[1]]);

    var negativeInterpolator = d3.scale.linear()
        .domain([0,-(this._data.length-1)/2])
        .interpolate(d3.interpolateRgb)
        .range([this._colorStops[1], this._colorStops[2]]);

    svg.selectAll('.bar')
        .data(this._data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('fill',function(d) {
            if (d.position > 0) {
                return positiveInterpolator(d.position);
            } else if (d.position <= 0) {
                return negativeInterpolator(d.position);
            }
        })
        .attr('x', function(d) {
            return x(d.date);
        })
        .attr('width', x.rangeBand())
        .attr('y', function(d) {
            return y(d.client_count);
        })
        .attr('height', function(d) {
            return self._height - y(d.client_count);
        });

    if (this._onClick) {
        svg.selectAll('.bar').on('click', function () {
            self._onClick(this.__data__);
        });
    }
};

module.exports = OutlierBarChart;
