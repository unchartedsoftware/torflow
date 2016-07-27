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

    function _createContainer() {
        if ( $('.loader-container').length === 0 ) {
            $( document.body ).append( $('<div class="loader-container"></div>') );
        }
    }

    var LoadingBar = function() {
        this._percent = 0;
        this._loaderCount = 0;
        this._$loader = $('<div class="loader-bar"></div>');
        _createContainer();
        $('.loader-container').append( this._$loader );
    };

    LoadingBar.prototype.update = function( percent ) {
        if ( this._percent < percent ) {
            this._percent = percent;
            this._$loader.css({
                width: this._percent * 100 + '%',
                opacity: 1.0 - ( this._percent/2 )
            });
            if ( this._percent === 1 ) {
                var that  = this;
                this._$loader.animate({
                    opacity: 0
                }, 400, function() {
                    that._$loader.remove();
                    that._$loader = null;
                });
            }
        }
    };

    LoadingBar.prototype.cancel = function() {
        if ( this._$loader ) {
            this._$loader.finish();
        }
        if ( this._$loader ) {
            this._$loader.remove();
        }
    };

    LoadingBar.prototype.finish = function() {
        this._$loader.animate({
            opacity: 0
        }, 400, function() {
            this._$loader.remove();
        });
    };

    module.exports = LoadingBar;

}());
