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
            });
        }
    }
};

LoadingBar.prototype.cancel = function() {
    this._$loader.finish();
    this._$loader.remove();
};

LoadingBar.prototype.finish = function() {
    this._$loader.animate({
        opacity: 0
    }, 400, function() {
        this._$loader.remove();
    });
};

module.exports = LoadingBar;
