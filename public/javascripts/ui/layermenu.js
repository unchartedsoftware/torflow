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

var LayerMenu = function(spec) {
    var self = this;
    // parse inputs
    spec = spec || {};
    spec.label = spec.label !== undefined ? spec.label : 'missing-layer-name';
    spec.layer = spec.layer || null;
    if ( !spec.layer ) {
        console.error('LayerMenu constructor must be passed a "layer" attribute');
    }
    // create elements
    this._$menu = $('<div class="map-control-element"></div>');
    this._$head = $('<div class="layer-control-head"></div>');
    this._$body = $('<div class="layer-control-body"></div>');
    this._$title = $('<div class="layer-title">'+spec.label+'</div>');
    this._$toggleIcon = $( !spec.layer.isHidden() ? '<i class="fa fa-check-square-o">' : '<i class="fa fa-square-o">');
    this._$toggle = $('<div class="layer-toggle"></div>');
    this._$toggle.append( this._$toggleIcon );
    // attach callbacks
    var prevHeight;
    this._$head.click( function() {
        if ( spec.layer.isHidden() ) {
            spec.layer.show();
            self._$toggleIcon.removeClass('fa-square-o');
            self._$toggleIcon.addClass('fa-check-square-o');
            self._$body.css({
                height: prevHeight,
                border: ''
            });
            self._$head.css({
                padding: ''
            });
        } else {
            spec.layer.hide();
            self._$toggleIcon.removeClass('fa-check-square-o');
            self._$toggleIcon.addClass('fa-square-o');
            prevHeight = self._$body.outerHeight();
            self._$body.css({
                height: '0px',
                border: 'none'
            });
            self._$head.css({
                padding: 'initial'
            });
        }
    });
    this._$head.append( this._$toggle ).append( this._$title );
    this._$menu.append( this._$head ).append( this._$body );
};

LayerMenu.prototype.getElement = function() {
    return this._$menu;
};

LayerMenu.prototype.getBody = function() {
    return this._$body;
};

module.exports = LayerMenu;
