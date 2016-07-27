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
