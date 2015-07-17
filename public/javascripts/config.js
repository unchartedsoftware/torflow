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

var DEFAULT_PARTICLE_VELOCITY = 0.2;

var config = {
    particle_count : 750,
    node_radius : {
        min : 5,
        max : 30
    },
    particle_velocity : DEFAULT_PARTICLE_VELOCITY,
    particle_velocity_zoom : function(zoomLevel) {
        return DEFAULT_PARTICLE_VELOCITY * (0.8)*zoomLevel;
    },
    particle_velocity_variance_scale : {
        min : 0.5,
        max : 1.5
    },
    dot : {
        thickness : 3,
        headFill : 'rgba(255,255,255,0.8)',
        tailFill : {
            r : 0,
            g : 0,
            b : 255
        },
        tailFillHidden : {
            r : 255,
            g : 0,
            b : 0
        },
        tailSegments : 3,
        tailSegmentLength : 15
    },
    title : 'Data Flow in the Tor Network',
    summary : 'Blah blah blah this is a summary of something that should probably describe what we\'re seeing',
    hiddenServiceProbability : 0.04
};

module.exports = config;