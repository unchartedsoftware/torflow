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

    var _addCommas = function (x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    var _isInteger = function(n) {
       return n % 1 === 0;
    };

    module.exports = {
        format: function(num, decimals) {
            decimals = ( decimals !== undefined ) ? decimals : 2;
            return _isInteger(num) ? _addCommas(num) : _addCommas(num.toFixed(2));
        }
    };

}());
