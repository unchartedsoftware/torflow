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
var chartLabel = require('./chartlabel');

var DateHistogram = function(container) {
    this._container = container;
    this._data = null;
    this._margin = {top: 30, right: 10, bottom: 40, left: 70};
    this._width = $(container).width() - this._margin.left - this._margin.right;
    this._height = $(container).height() - this._margin.top - this._margin.bottom;
    this._colorStops = d3.scale.sqrt()
        .range(['#ff0000','#0000ff'])
        .domain([0,1]);
    this._title = '';
    this._onClick = null;
};

DateHistogram.prototype.data = function(data) {
    if (arguments.length === 0) {
        return this._data;
    }
    var res = bucket({
        data: data,
        xExtractor: function(value) {
            return moment.utc(value.date).valueOf();
        },
        yExtractor: function(value) {
            return value.count;
        },
        threshold: 0.15,
        maxBucketSize: 30
    });
    this._min = res.min;
    this._max = res.max;
    this._range = res.max - res.min;
    this._data = res.buckets.map( function(d) {
        return {
            x: moment.utc(d.x).format('MMM Do, YYYY'),
            y: d.y
        };
    });
    return this;
};

DateHistogram.prototype.title = function(title) {
    if (arguments.length === 0) {
        return this._title;
    }
    this._title = title;
    return this;
};

DateHistogram.prototype.margin = function(margin) {
    if (arguments.length === 0) {
        return this._margin;
    }
    this._margin = margin;
    return this;
};

DateHistogram.prototype.width = function(width) {
    if (arguments.length === 0) {
        return this._width;
    }
    this._width = width;
    this._update();
    return this;
};

DateHistogram.prototype.height = function(height) {
    if (arguments.length === 0) {
        return this._height;
    }
    this._height = height;
    this._update();
    return this;
};

DateHistogram.prototype.colorStops = function(colorStops) {
    if (arguments.length === 0) {
        return this._colorStops;
    }
    this._colorStops = d3.scale.sqrt()
        .range(colorStops)
        .domain([0, 1]);
    this._update();
    return this;
};

DateHistogram.prototype.draw = function() {
    this._update();
    return this;
};

DateHistogram.prototype.click = function(onClick) {
    if (arguments.length === 0) {
        return this._onClick;
    }
    this._onClick = onClick;
    this._update();
    return this;
};

DateHistogram.prototype._update = function() {
    var self = this;
    if (!this._container || !this._data) {
        return;
    }

    this._container.empty();

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, this.width()]);

    var y = d3.scale.sqrt()
        .range([this.height(), 0], 0.1, 0.0);

    var modFilter = Math.floor(this._data.length / 6);

    var xAxisDates = this._data.filter(function(d,i) {
            return i % modFilter === 0;
        })
        .map(function(d) {
            return d.x;
        });

    var xAxis = d3.svg.axis()
        .scale(x)
        .tickValues(xAxisDates)
        .orient('bottom');

    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(5)
        .orient('left');

    var svg = d3.select($(this._container)[0]).append('svg')
        .attr('width', this._width + this._margin.left + this._margin.right)
        .attr('height', this._height + this._margin.top + this._margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + this._margin.left + ',' + this._margin.top + ')');

    x.domain(this._data.map(function(d) {
        return d.x;
    }));

    y.domain([ 0, this._max ]);

    var svgXAxis = svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (this._height+1) + ')')
        .call(xAxis);

    svgXAxis.append('text')
        .attr('class', 'x-axis-title')
        .attr('x', this.width() / 2 )
        .style('text-anchor', 'middle')
        .attr('y', this._margin.bottom * 0.95 )
        .attr('font-size', '14px')
        .text('Dates');

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('class', 'y-axis-title')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(this.height() / 2))
        .attr('y', -this._margin.left)
        .attr('font-size', '14px')
        .attr('dy', '14px')
        .style('text-anchor', 'middle')
        .text('Client Connections');

    svg.selectAll('.bar')
        .data(this._data)
        .enter()
        .append('rect')
        .attr('class', 'bar date-bar')
        .attr('fill', function(d) {
            return self._colorStops((d.y - self._min) / self._range);
        })
        .attr('stroke', '#000')
        .attr('stroke-opacity', 0.6)
        .attr('x', function(d) {
            return x(d.x);
        })
        .attr('width', this.width() / (this._data.length - 1) )
        .attr('y', function(d) {
            return y(d.y);
        })
        .attr('height', function(d) {
            return self._height - y(d.y);
        });

    chartLabel.addLabels({
        svg: svg,
        selector: '.bar',
        label: function(x,y) {
            return '<div class="chart-hover-label">'+
                '<div style="float:left;">Date: </div>' +
                '<div style="float:right">' + x + '</div>' +
                '<div style="clear:both"></div>' +
                '<div style="float:left;">Avg Count: </div>' +
                '<div style="float:right">' + y + '</div>' +
                '<div style="clear:both"></div>' +
            '</div>';
        }
    });

    svg.append('text')
        .attr('x', (this.width() / 2))
        .attr('y', -this._margin.top / 3)
        .attr('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .text(this.title());

    if (this._onClick) {
        svg.selectAll('.bar').on('click', function () {
            self._onClick(this.__data__);
        });
    }
};

module.exports = DateHistogram;
