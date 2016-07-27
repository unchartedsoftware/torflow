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

    var BaseLayer = L.TileLayer.extend({

        setBrightness: function( brightness ) {
            this._brightness = brightness;
            $( this._container ).css( '-webkit-filter', 'brightness(' + ( this._brightness * 100 ) + '%)' );
            $( this._container ).css( 'filter', 'brightness(' + ( this._brightness * 100 ) + '%)' );
        },

        getBrightness: function() {
            return ( this._brightness !== undefined ) ? this._brightness : 1;
        },

        show: function() {
            this._hidden = false;
            this._prevMap.addLayer(this);
        },

        hide: function() {
            this._hidden = true;
            this._prevMap = this._map;
            this._map.removeLayer(this);
        },

        isHidden: function() {
            return this._hidden;
        }

    });

    module.exports = BaseLayer;

}());
