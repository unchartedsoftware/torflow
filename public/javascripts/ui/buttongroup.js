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

    var ButtonGroupTemplate = require('../templates/buttongroup');

    var ButtonGroup = function(spec) {
        var self = this;
        // parse inputs
        spec = spec || {};
        spec.buttons = spec.buttons || [];
        spec.initialValue = spec.initialValue !== undefined ? spec.initialValue : 0;
        // create buttons
        spec.buttons = spec.buttons.map( function( button, index ) {
            return {
                label: button.label || 'missing-label-' + index,
                className: ( index === spec.initialValue ) ? 'active' : '',
                click: button.click || null,
                leftColor: button.leftColor || button.color,
                rightColor: button.rightColor || button.color
            };
        });
        // create container element
        this._$container = $( ButtonGroupTemplate(spec) );
        this._$group = this._$container.find('.services-btn-group');
        this._$buttons = this._$group.find('.btn-primary');
        // add click callbacks
        spec.buttons.forEach( function( button, index ) {
            var click = button.click || null;
            var $button = $( self._$buttons.get(index) );
            $button.click( function() {
                self._$buttons.removeClass('active');
                $button.addClass('active');
                if ($.isFunction(click)) {
                    click();
                }
            });
        });
    };

    ButtonGroup.prototype.getElement = function() {
        return this._$container;
    };

    module.exports = ButtonGroup;

}());
