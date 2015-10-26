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

(function() {
    'use strict';


    var chartLabel = require('./chartlabel');

    var OutlierBarChart = function(container) {
        this._container = container;
        this._data = null;
        this._margin = {top: 30, right: 10, bottom: 85, left: 70};
        this._width = $(container).width() - this._margin.left - this._margin.right;
        this._height = $(container).height() - this._margin.top - this._margin.bottom;
        this._colorStops = ['#0000ff','#898989','#ff0000'];
        this._title = '';
        this._onClick = null;
    };

    OutlierBarChart.prototype.data = function(data) {
        if (arguments.length === 0) {
            return this._data;
        }
        this._data = data.map(function(value) {
            return {
                x: value.date,
                y: value.client_count,
                position: value.position
            };
        });
        this._update();
        return this;
    };

    OutlierBarChart.prototype.title = function(title) {
        if (arguments.length === 0) {
            return this._title;
        }
        this._title = title;
        this._update();
        return this;
    };

    OutlierBarChart.prototype.margin = function(margin) {
        if (arguments.length === 0) {
            return this._margin;
        }
        this._margin = margin;
        this._update();
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
        // Clear container
        this._container.find('svg').remove();
        // Set local scope vars
        var height = this._height;
        var width = this._width;
        var margin = this._margin;
        var colorStops = this._colorStops;
        // Set value ranges
        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0, 0.01);
        var y = d3.scale.sqrt()
            .range([height, 0]);
        // Set value domains
        x.domain(this._data.map(function(d) {
            return d.x;
        }));
        y.domain([0, d3.max(this._data, function(d) {
            return d.y;
        })]);
        // Create axes
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom');
        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(5)
            .orient('left');
        // Create chart container
        var svg = d3.select($(this._container)[0]).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        // Create title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 3)
            .attr('text-anchor', 'middle')
            .attr('class', 'chart-title')
            .text(this.title());
        // Create x-axis
        var svgXAxis = svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + (height+1) + ')')
            .call(xAxis);
        svgXAxis.selectAll('text')
            .attr('transform', 'rotate(-45), translate(-38,0)');
        svgXAxis.append('text')
            .attr('class', 'x-axis-title')
            .attr('x', width / 2 )
            .style('text-anchor', 'middle')
            .attr('y', margin.bottom * 0.95 )
            .attr('font-size', '14px')
            .text('Outlier Dates');
        // Create y-axis
        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
            .attr('class', 'y-axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(height / 2))
            .attr('y', -margin.left)
            .attr('font-size', '14px')
            .attr('dy', '14px')
            .style('text-anchor', 'middle')
            .text('Connections');
        // Create color interpolators
        var halfLength = (this._data.length-1) / 2;
        var positiveInterpolator = d3.scale.sqrt()
            .domain([halfLength,0])
            .interpolate(d3.interpolateRgb)
            .range([colorStops[0], colorStops[1]]);
        var negativeInterpolator = d3.scale.sqrt()
            .domain([0,-halfLength])
            .interpolate(d3.interpolateRgb)
            .range([colorStops[1], colorStops[2]]);
        // Create bars
        var bars = svg.selectAll('.bar')
            .data(this._data)
            .enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', function(d) {
                return 'translate(' + x(d.x) + ', 0)';
            })
            .attr('width', x.rangeBand())
            .attr('height', height);
        // Create background bars
        bars.append('rect')
            .attr('class', 'background-bar')
            .attr('width', x.rangeBand()+1)
            .attr('height', height+1);
        // Create foreground bars
        bars.append('rect')
            .attr('class', 'foreground-bar')
            .attr('fill', function(d) {
                if (d.position > 0) {
                    return positiveInterpolator(d.position);
                } else {
                    return negativeInterpolator(d.position);
                }
            })
            .attr('stroke', '#000')
            .attr('width', x.rangeBand())
            .attr('height', function(d) {
                return height - y(d.y);
            })
            .attr('y', function(d) {
                return y(d.y);
            });
        // Add hover over tooltips
        chartLabel.addLabels({
            svg: svg,
            selector: '.bar',
            label: function(x,y) {
                if (x === 'Average') {
                    return '<div class="chart-hover-label">'+
                        '<div style="float:left; padding-right:10px;">Average Count: </div>' +
                        '<div style="float:right">' + y + '</div>' +
                        '<div style="clear:both"></div>' +
                    '</div>';
                } else {
                    return '<div class="chart-hover-label">'+
                        '<div style="float:left; padding-right:10px;">Date: </div>' +
                        '<div style="float:right">' + x + '</div>' +
                        '<div style="clear:both"></div>' +
                        '<div style="float:left; padding-right:10px;">Count: </div>' +
                        '<div style="float:right">' + y + '</div>' +
                        '<div style="clear:both"></div>' +
                    '</div>';
                }
            }
        });
        // Set click event handler
        if (this._onClick) {
            svg.selectAll('.bar').on('click', function () {
                self._onClick(this.__data__);
            });
        }
    };

    module.exports = OutlierBarChart;

}());
