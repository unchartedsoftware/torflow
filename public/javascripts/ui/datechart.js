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

    var bucket = require('../util/bucket');
    var chartLabel = require('./chartlabel');

    var IS_MOBILE = require('../util/mobile').IS_MOBILE;

    var DateChart = function(container) {
        var self = this;
        this._container = container;
        this._data = null;
        this._margin = {top: 10, right: 10, bottom: 75, left: 10};
        this._colorStops = d3.scale.sqrt()
            .range(['#ff0000','#0000ff'])
            .domain([0,1]);
        this._onClick = null;
        $(window).on('resize', function() {
            self._update();
        });
    };

    DateChart.prototype.data = function(data) {
        if (arguments.length === 0) {
            return this._data;
        }
        var res = bucket({
            data: _.zip(data.dates,data.bandwidths),
            xExtractor: function(value) {
                return moment.utc(value[0]).valueOf();
            },
            yExtractor: function(value) {
                return value[1];
            },
            threshold: 0.015,
            maxBucketSize: 20
        });
        this._min = res.min;
        this._max = res.max;
        this._range = res.max - res.min;
        this._data = res.buckets.map( function(d) {
            return {
                x: moment.utc(d.x).format('MMM Do, YYYY'),
                xRange: moment.utc(d.from).twix(d.to, { allDay: true }),
                y: d.y
            };
        });
        this._update();
        return this;
    };

    DateChart.prototype.updateDate = function(dateStr) {
        var self = this;
        this._activeDate = dateStr;
        if (this._svg) {
            if (this._prev) {
                this._prev.classed('active', false);
            }
            var contains = this._svg
                .selectAll('.bar')
                .filter(function(d) {
                    return (d.xRange.contains(self._activeDate));
                })[0];
            this._prev = d3.select( contains[contains.length-1] );
            this._prev.classed('active', true);
        }
        return this;
    };

    DateChart.prototype.margin = function(margin) {
        if (arguments.length === 0) {
            return this._margin;
        }
        this._margin = margin;
        this._update();
        return this;
    };

    DateChart.prototype.width = function() {
        return $(this._container).width() - this._margin.left - this._margin.right;
    };

    DateChart.prototype.height = function() {
        return $(this._container).height() - this._margin.top - this._margin.bottom;
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
        // Clear container
        this._container.find('svg').remove();
        // Set local scope vars
        var MIN_HEIGHT = 5;
        var NUM_X_LABELS = 7;
        var height = this.height();
        var width = this.width();
        var margin = this._margin;
        var barWidth = width / (this._data.length - 1);
        var colorStops = this._colorStops;
        // Don't draw chart if width is too small.
        if (width < 500) {
            return;
        }
        // Set value ranges
        var x = d3.scale.ordinal()
            .rangeBands([0, this.width()]);
        var y = d3.scale.linear()
            .range([this.height(), 0]);
        // Set value domains
        x.domain(this._data.map(function(d) {
            return d.x;
        }));
        y.domain([ 0, this._max ]);
        // Filter dates
        var modFilter = Math.ceil(this._data.length / NUM_X_LABELS);
        var xAxisDates = this._data.filter(function(d,i) {
                return i % modFilter === 0;
            })
            .map(function(d) {
                return d.x;
            });
        // Create x-axis
        var xAxis = d3.svg.axis()
            .scale(x)
            .tickValues(xAxisDates)
            .orient('bottom');
        // Create chart container
        this._svg = d3.select($(this._container)[0]).append('svg')
            .style('overflow', 'visible')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        // Create x-axis
        this._svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + (height+8) + ')')
            .call(xAxis);
        // Create bars
        var bars = this._svg.selectAll('.bar')
            .data(this._data)
            .enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', function(d) {
                return 'translate(' + x(d.x) + ', 0)';
            })
            .attr('width', barWidth)
            .attr('height', height);
        bars.append('rect')
            .attr('class', 'background-bar')
            .attr('width', barWidth)
            .attr('height', height + MIN_HEIGHT);
        // Create foreground bars
        bars.append('rect')
            .attr('class', 'foreground-bar')
            .attr('fill', function(d) {
                return colorStops((d.y - self._min) / self._range);
            })
            .attr('stroke', '#000')
            .attr('width', barWidth)
            .attr('height', function(d) {
                return height - y(d.y) + MIN_HEIGHT;
            })
            .attr('y', function(d) {
                return y(d.y);
            });
        // Add hover over tooltips
        if (!IS_MOBILE) {
            chartLabel.addLabels({
                svg: this._svg,
                selector: '.bar',
                label: function(x,y,d) {
                    return '<div class="hover-label">' +
                        '<div style="float:left; padding-right:10px;">Date Range: </div>' +
                        '<div style="float:right">' + d.xRange.format() + '</div>' +
                        '<div style="clear:both"></div>' +
                        '<div style="float:left; padding-right:10px;">Avg Bandwidth (GB): </div>' +
                        '<div style="float:right">' + y + '</div>' +
                        '<div style="clear:both"></div>' +
                    '</div>';
                }
            });
        }
        // Set click event handler
        if (this._onClick) {
            this._svg.selectAll('.bar').on('click', function () {
                self._onClick(this.__data__);
            });
        }
        // Select active date
        this.updateDate(this._activeDate);
    };

    module.exports = DateChart;

}());
