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

var _getProbabilisticNodeIndex = function( nodes ) {
    var rnd = Math.random();
    var i = 0;
    while (i < nodes.length && rnd > nodes[i].normalized_bandwidth) {
        rnd -= nodes[i].normalized_bandwidth;
        i++;
    }
    return Math.min(i,nodes.length-1);
};

var _getProbabilisticPair = function( nodes ) {
    var MAX_TRIES = 500;
    var tries = 0;
    var source = _getProbabilisticNodeIndex( nodes );
    var dest = _getProbabilisticNodeIndex( nodes );
    while (source === dest) {
        dest = _getProbabilisticNodeIndex( nodes );
        tries++;
        if (tries === MAX_TRIES) {
            throw 'Cannot find destination. Something is wrong with the probaility bandwidths on your nodes!';
        }
    }
    return {
        source : nodes[source],
        dest : nodes[dest]
    };
};

var _generateParticles = function(particleConfig,nodes,count) {
    var PROGRESS_STEP = count / 1000;
    var buffer = new Float32Array( count * 8 );

    for ( var i=0; i<count; i++ ) {
        var pair = _getProbabilisticPair(nodes);
        var start = {
            x: pair.source.x,
            y: pair.source.y
        };
        var end = {
            x: pair.dest.x,
            y: pair.dest.y
        };
        var speed = particleConfig.speed + particleConfig.variance * Math.random();
        var offset = particleConfig.offset;

        buffer[ i*8 ] = start.x;
        buffer[ i*8+1 ] = start.y;
        buffer[ i*8+2 ] = end.x;
        buffer[ i*8+3 ] = end.y;
        buffer[ i*8+4 ] = offset;
        buffer[ i*8+5 ] = speed;
        buffer[ i*8+6 ] = Math.random();
        buffer[ i*8+7 ] = Math.random();

        if ( (i+1) % PROGRESS_STEP === 0 ) {
            this.postMessage({
                type: 'progress',
                progress: i / (particleConfig.count-1)
            });
        }
    }

    var result = {
        type: 'complete',
        buffer: buffer.buffer
    };

    this.postMessage( result, [ result.buffer ] );
};

this.addEventListener( 'message', function( e ) {
    if ( e.data.type === 'start' ) {
        _generateParticles( e.data.particleConfig, e.data.nodes, e.data.count );
    }
});
