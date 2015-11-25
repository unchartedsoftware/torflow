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
    var config = {
        // bandwidth color ramp
        bandwidth_color_ramp: [
            'rgb(64,0,128)',
            'rgb(30,155,223)'
        ],
        // connections color ramp
        connections_color_ramp: [
            'rgb(64,0,128)',
            'rgb(30,115,223)'
        ],
        // country connections color ramp
        countries_color_ramp: [
            'rgb(64,0,128)',
            'rgb(50,100,255)'
        ],
        // particle colors
        particle_hidden_color: [1.0, 0.4, 0.0],
        particle_general_color: [0.1, 0.3, 0.6],
        // node count config
        node_count: 500,
        node_count_min: 100,
        node_count_max : 2000,
        // node mobile factor
        node_mobile_factor: 0.5,
        node_radius : {
            min : 5,
            max : 40
        },
        // country geo json
        country_count: 50,
        country_count_min: 5,
        country_count_max : 200,
        // country mobile factor
        country_mobile_factor: 0.2,
        // particle count config
        particle_count : 400000,
        particle_count_min : 100000,
        particle_count_max : 5000000,
        // particle path offset config
        particle_offset : 0.10,
        particle_min_offset: 0.0001,
        particle_max_offset: 4.0,
        // particle size config
        particle_size: 1,
        particle_min_size : 1,
        particle_max_size : 10,
        particle_zoom_scale: function( zoom, config_particle_size ) {
            return config_particle_size * Math.max( 1, Math.pow(2, zoom - 4 ) );
        },
        // particle speed config
        particle_base_speed_ms : 60000, // ms for particle to circle the earth
        particle_speed_min_factor : 0.01,
        particle_speed_max_factor : 4.0,
        // particle mobile factor
        particle_mobile_factor: 0.3,
        // hidden services
        hiddenServiceProbability : 0.04,
        // html config
        title : 'TorFlow',
        summary :
            '<h2>Data Flow in the Tor Network</h2>' +
            '<p>The Tor network is a group of volunteer-operated servers (relays) that allows people to improve their privacy and' +
            ' security on the Internet. Tor\'s users employ this network by connecting through a series of virtual tunnels' +
            ' rather than making a direct connection, thus allowing both organizations and individuals to share information ' +
            'over public networks without compromising their privacy.<a href="https://www.torproject.org/about/overview.html.en"><sup>[1]</sup></a></p>' +
            '<p>The following visualization shows information flow between relay servers for a selected day.</p>' +
            '<p>Each circle represents the aggregated bandwidth of relay servers grouped by proximity. Hover over a circle to see information about that group.</p>' +
            '<p>Each colored country represents a country that is responsible for the top N client connections. Click on the country to display the distribution by time and the outlier counts.</p>' +
            '<p>Use the date slider to select the simulation date.</p>',
        summary_mobile :
            '<h2>Data Flow in the Tor Network</h2>' +
            '<p>The Tor network is a group of volunteer-operated servers (relays) that allows people to improve their privacy and' +
            ' security on the Internet. Tor\'s users employ this network by connecting through a series of virtual tunnels' +
            ' rather than making a direct connection, thus allowing both organizations and individuals to share information ' +
            'over public networks without compromising their privacy.<a href="https://www.torproject.org/about/overview.html.en"><sup>[1]</sup></a></p>' +
            '<p>The following visualization shows information flow between relay servers for a selected day.</p>',
        // base layer config
        localMapServer: false,
        // map starting position
        desktop_zoom: {
            min: 3,
            start: 4
        },
        mobile_zoom: {
            min: 2,
            start: 2
        },
        mapAttribution:
            '<span class="attribution">' +
                'Map tiles by ' +
                '<a href="http://cartodb.com/attributions">CartoDB</a>' +
                '<div class="uncharted-logo">' +
                    '<a href="https://uncharted.software" target="_blank">' +
                        '<img src="/img/uncharted-logo-white.png">' +
                    '</a>' +
                '</div>' +
            '</span>'
    };

    if (config.localMapServer) {
        config.maxZoom = 6;
    }

    module.exports = config;

}());
