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

var config = {
    node_radius : {
        min : 5,
        max : 40
    },
    particle_count : 500000,
    particle_offset : 0.01,
    particle_min_offset: 0.0001,
    particle_max_offset: 2.0,
    particle_base_speed_ms : 40000, // ms for particle to circle the earth
    particle_speed_variance_ms : 40000,
    particle_speed_min_factor : 0.01,
    particle_speed_max_factor : 4.0,
    particle_zoom_scale: function( zoom, config_particle_size ) {
        return Math.max( 1, Math.max( config_particle_size, config_particle_size * ( zoom - 3 ) / 2 ) );
    },
    particle_size: 1,
    title : 'TorFlow',
    summary :
        '<h2>Data Flow in the Tor Network</h2>' +
        '<p>The Tor network is a group of volunteer-operated servers (relays) that allows people to improve their privacy and' +
        ' security on the Internet. Tor\'s users employ this network by connecting through a series of virtual tunnels' +
        ' rather than making a direct connection, thus allowing both organizations and individuals to share information ' +
        'over public networks without compromising their privacy.<a href="https://www.torproject.org/about/overview.html.en"><sup>[1]</sup></a></p>' +
        '<p>The following visualization shows information flow between the ~6500 relay servers.  General purpose Tor traffic is shown in blue.  Traffic to hidden services is shown in red.</p>' +
        '<p>Each circle below represents the aggregated bandwidth of relay servers grouped by proximity.  Hover over a circle to see information about that group.  Click on a circle to zoom the map to the contents of the group.</p>' +
        '<p>Use the slider below to select the simulation date.  Checkboxes can be used to configure the display.</p>',
    hiddenServiceProbability : 0.04,
    localMapServer : false,
    mapAttribution:
        '<span class="attribution">' +
            'Map tiles by ' +
            '<a href="http://cartodb.com/attributions#basemaps">CartoDB</a>,' +
            ' under ' +
            '<a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>' +
            '|' +
            '<div class="uncharted-logo">' +
                '<a href="http://uncharted.software" target="_blank">' +
                    '<img style="width:200px;" src="/img/uncharted-logo-white.png">' +
                '</a>' +
            '</div>' +
        '</span>',
    minBrightness : 0.01,
    maxBrightness : 3.0,
    defaultBrightness : 1.0,
    minOpacity : 0,
    maxOpacity : 1,
    defaultOpacity : 0.45
};

if (config.localMapServer) {
    config.maxZoom = 6;
}

module.exports = config;
