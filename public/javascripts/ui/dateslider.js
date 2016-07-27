/**
 Copyright 2016 Uncharted Software Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

(function() {
    'use strict';

    var DateSliderTemplate = require('../templates/dateslider');

    var _getMoment = function(dates, index) {
        return moment.utc(dates[index]);
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
                var datePieces = hash.split('-');
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
            window.location.hash = '#/' + m.year() + '-' + (m.month()+1) + '-' + m.date();
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
        spec.maxIndex = spec.dates.length-1;
        spec.initialIndex = this._dateIndex;
        spec.initialDateString = this.getDateString();
        // create container element
        this._$container = $( DateSliderTemplate(spec) );
        // create slider and attach callbacks
        this._$slider = this._$container.find('.slider');
        // attach button callbacks
        this._$left = this._$container.find('.small-button.left');
        this._$right = this._$container.find('.small-button.right');
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

    DateSlider.prototype.setDate = function(dateString) {
        var datePieces = dateString.split('-');
        var year = datePieces[0];
        var month = ('0' + datePieces[1]).slice(-2);
        var day = ('0' + datePieces[2]).slice(-2);
        var dateIndex = _getDateIndex(this._dates, day, month, year);
        _setDateIndex(this, dateIndex);
        _setDateHash(this._dates, dateIndex);
    };

    DateSlider.prototype.getDateString = function() {
        return _getFriendlyDate(this._dates, this._dateIndex);
    };

    DateSlider.prototype.getISODate = function() {
        return _getISODate(this._dates,this._dateIndex);
    };

    module.exports = DateSlider;

}());
