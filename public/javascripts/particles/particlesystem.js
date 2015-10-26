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

var worker = this;

(function() {
    'use strict';

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

    var _generateParticles = function(spec, nodes) {
        var PROGRESS_STEP = spec.count / 1000;
        var buffer = new Float32Array( spec.count * 8 );
        var offset = spec.offset;

        for ( var i=0; i<spec.count; i++ ) {
            var pair = _getProbabilisticPair(nodes);
            var sign = Math.random() > 0.5 ? 1 : -1;
            var t0 = Math.random() / 2;
            var t1 = Math.random() / 2 + 0.5;
            // start position
            buffer[ i*8 ] = pair.source.x;
            buffer[ i*8+1 ] = pair.source.y;
            // stop position
            buffer[ i*8+2 ] = pair.dest.x;
            buffer[ i*8+3 ] = pair.dest.y;
            // bezier curve sub point parameters
            buffer[ i*8+4 ] = t0;
            buffer[ i*8+5 ] = sign * Math.random() * offset;
            buffer[ i*8+6 ] = t1;
            buffer[ i*8+7 ] = sign * Math.random() * offset;
            // print progress
            if ( (i+1) % PROGRESS_STEP === 0 ) {
                worker.postMessage({
                    type: 'progress',
                    progress: i / (spec.count-1)
                });
            }
        }

        var result = {
            type: 'complete',
            buffer: buffer.buffer
        };

        worker.postMessage( result, [ result.buffer ] );
    };

    worker.addEventListener( 'message', function( e ) {
        if ( e.data.type === 'start' ) {
            _generateParticles( e.data.spec, e.data.nodes );
        }
    });

}());
