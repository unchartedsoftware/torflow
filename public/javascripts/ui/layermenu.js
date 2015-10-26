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

    var LayerMenuTemplate = require('../templates/layermenu');

    var LayerMenu = function(spec) {
        var self = this;
        // parse inputs
        spec = spec || {};
        spec.label = spec.label !== undefined ? spec.label : 'missing-layer-name';
        spec.layer = spec.layer || null;
        spec.isVisible = !spec.layer.isHidden();
        spec.isMinimized = false;
        if ( !spec.layer ) {
            console.error('LayerMenu constructor must be passed a "layer" attribute');
        }
        // set layer
        this._layer = spec.layer;
        // set minimized
        this._minimized = spec.isMinimized;
        // create elements
        this._$menu = $( LayerMenuTemplate(spec) );
        this._$head = this._$menu.find('.layer-control-head');
        this._$body = this._$menu.find('.layer-control-body');
        this._$title = this._$menu.find('.layer-title');
        this._$toggleIcon = this._$menu.find('.layer-toggle i');
        this._$toggle = this._$menu.find('.layer-toggle');
        this._$minimizeIcon = this._$menu.find('.minimize-toggle i');
        this._$minimize = this._$menu.find('.minimize-toggle');
        // attach callbacks
        this._$toggle.click( function() {
            self.toggleEnabled();
        });
        this._$title.click( function() {
            self.toggleMinimized();
        });
    };

    LayerMenu.prototype.toggleMinimized = function() {
        if ( this._minimized ) {
            this.maximize();
        } else {
            this.minimize();
        }
    };

    LayerMenu.prototype.minimize = function() {
        this._originalHeight = this._$body.outerHeight();
        this._$minimizeIcon.removeClass('fa-minus');
        this._$minimizeIcon.addClass('fa-plus');
        this._$body.css({
            height: '0px',
            border: 'none'
        });
        this._$head.css({
            padding: 'initial'
        });
        this._minimized = true;
    };

    LayerMenu.prototype.maximize = function() {
        this._$minimizeIcon.removeClass('fa-plus');
        this._$minimizeIcon.addClass('fa-minus');
        this._$body.css({
            height: this._originalHeight,
            border: ''
        });
        this._$head.css({
            padding: ''
        });
        this._minimized = false;
    };

    LayerMenu.prototype.toggleEnabled = function() {
        if ( this._layer.isHidden() ) {
            this.enable();
        } else {
            this.disable();
        }
    };

    LayerMenu.prototype.disable = function() {
        this._layer.hide();
        this._$toggleIcon.removeClass('fa-check-square-o');
        this._$toggleIcon.addClass('fa-square-o');
        this._$body.css('opacity', '0.3');
    };

    LayerMenu.prototype.enable = function() {
        this._layer.show();
        this._$toggleIcon.removeClass('fa-square-o');
        this._$toggleIcon.addClass('fa-check-square-o');
        this._$body.css('opacity', '');
    };

    LayerMenu.prototype.getElement = function() {
        return this._$menu;
    };

    LayerMenu.prototype.getBody = function() {
        return this._$body;
    };

    module.exports = LayerMenu;

}());
