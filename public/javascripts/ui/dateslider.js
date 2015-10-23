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

var _getMoment = function(dates, index) {
    return moment(dates[index]);
};

var _getFriendlyDate = function(dates,index) {
    return _getMoment(dates,index).format('dddd, MMMM Do YYYY');
};

var _getISODate = function(dates, index) {
    var m = _getMoment(dates, index)
        .hours(0)
        .minutes(0)
        .seconds(0);
    return m.format();
};

var _getDateIndex = function(dates, day, month, year) {
    var prefix = year + '-' + month + '-' + day;
    for (var i = 0; i < dates.length; i++) {
        if (dates[i].indexOf(prefix) === 0) {
            return i;
        }
    }
    return -1;
};

var _getDateIndexFromHash = function(dates) {
    var index;
    try {
        var hash = window.location.hash.replace('#/', '');
        if (hash !== '') {
            var datePieces = hash.split('_');
            var year = datePieces[0];
            var month = ('0' + datePieces[1]).slice(-2);
            var day = ('0' + datePieces[2]).slice(-2);
            index = _getDateIndex(dates, day, month, year);
        }
    } catch (e) {
        window.location.hash = '#/';
    }
    return index;
};

var _setDateHash = function(dates, dateIndex) {
    var hashIndex = _getDateIndexFromHash(dates);
    if ( hashIndex !== dateIndex ) {
        var m = _getMoment(dates, dateIndex);
        window.location.hash = '#/' + m.year() + '_' + (m.month()+1) + '_' + m.date();
    }
};

var _setDateIndex = function(dateSlider, dateIndex) {
    if ( dateSlider._dateIndex !== dateIndex ) {
        dateSlider._dateIndex = dateIndex;
        dateSlider._$slider.slider('setValue', dateIndex);
        dateSlider._$container.find('.date-label').text(dateSlider.getDateString());
        dateSlider._$slider.trigger('slideStop');
    }
};

var DateSlider = function(spec) {
    var self = this;
    // parse inputs
    spec = spec || {};
    this._dates = spec.dates;
    var hashIndex = _getDateIndexFromHash(this._dates);
    this._dateIndex = hashIndex !== undefined ? hashIndex : this._dates.length-1;
    // create container element
    this._$container = $(
            '<div class="map-control-element" data-toggle="buttons">' +
                '<label class="btn btn-xs btn-primary date-slider-button left">' +
                    '<input class="hidden-filter-input" type="button" name="hidden-options">-' +
                '</label>' +
                '<input class="slider"' +
                    'data-slider-min="0" ' +
                    'data-slider-max="'+(this._dates.length-1)+'" ' +
                    'data-slider-step="1" ' +
                    'data-slider-value="'+this._dateIndex+'"/>' +
                '<label class="btn btn-xs btn-primary date-slider-button right">' +
                    '<input class="hidden-filter-input" type="button" name="hidden-options">+' +
                '</label>' +
                '<div class="padded-left padded-right date-label">'+this.getDateString()+'</div>' +
            '</div>');
    // create slider and attach callbacks
    this._$slider = this._$container.find('.slider');
    // attach button callbacks
    this._$left = this._$container.find('.date-slider-button.left');
    this._$right = this._$container.find('.date-slider-button.right');

    this._$left.click(function() {
        _setDateIndex(self, Math.max(self._dateIndex-1, 0));
    });
    this._$right.click(function() {
        _setDateIndex(self, Math.min(self._dateIndex+1, self._dates.length-1));
    });

    this._$slider.slider({ tooltip: 'hide' });
    if ($.isFunction(spec.slideStart)) {
        this._$slider.on('slideStart', spec.slideStart);
    }
    if ($.isFunction(spec.slideStop)) {
        this._$slider.on('slideStop', spec.slideStop);
    }
    if ($.isFunction(spec.change)) {
        this._$slider.on('change', spec.change);
    }
    if ($.isFunction(spec.slide)) {
        this._$slider.on('slide', spec.slide);
    }
    this._$slider.on('change', function( event ) {
        self._dateIndex = event.value.newValue;
        self._$container.find('.date-label').text(self.getDateString());
    });

    this._$slider.on('slideStop', function() {
        _setDateHash(self._dates, self._dateIndex);
    });

    $(window).on('hashchange', function() {
        var hashIndex = _getDateIndexFromHash(self._dates);
        var dateIndex = hashIndex !== undefined ? hashIndex : self._dates.length-1;
        _setDateIndex(self,dateIndex);
    });
};

DateSlider.prototype.getElement = function() {
    return this._$container;
};

DateSlider.prototype.getDateString = function() {
    return _getFriendlyDate(this._dates, this._dateIndex);
};

DateSlider.prototype.getISODate = function() {
    return _getISODate(this._dates,this._dateIndex);
};

module.exports = DateSlider;
