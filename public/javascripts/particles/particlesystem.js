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
    while (i < nodes.length && rnd > nodes[i].bandwidth) {
        rnd -= nodes[i].bandwidth;
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

var _subtract = function( a, b ) {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
};

var _cross = function( a, b ) {
    return {
        x: ( a.y * b.z ) - ( b.y * a.z ),
        y: (-a.x * b.z ) + ( b.x * a.z ),
        z: ( a.x * b.x ) - ( b.x * a.y )
    };
};

var _length2 = function( v ) {
    return Math.sqrt( v.x * v.x + v.y * v.y );
};

var _length3 = function( v ) {
    return Math.sqrt( v.x * v.x + v.y * v.y + v.z * v.z );
};

var _mult = function( v, s ) {
    return {
        x: v.x * s,
        y: v.y * s,
        z: v.z * s
    };
};

var _normalize = function( v ) {
    var mag = _length3( v );
    if ( mag !== 0 ) {
        return {
            x: v.x / mag,
            y: v.y / mag,
            z: v.z / mag
        };
    }
};

var _generateParticles = function(particleConfig,nodes,count) {
    var LOADING_STEP = count / 100;
    var buffer = new Float32Array( count * 8 );

    for ( var i=0; i<count; i++ ) {
        var pair = _getProbabilisticPair(nodes);
        var start = pair.source.pos,
            end = pair.dest.pos;
        var difference = _subtract( end, start ),
            dist = _length2( difference ),
            speed = particleConfig.speed + particleConfig.variance * Math.random(),
            offset = dist * particleConfig.offset,
            perp = _normalize(
                    _cross({
                        x: difference.x,
                        y: difference.y,
                        z: 0.0
                    }, {
                        x: 0,
                        y: 0,
                        z: 1
                    }) ),
            perpOffset = _mult( perp, -offset/2 + Math.random() * offset );

        buffer[ i*8 ] = start.x;
        buffer[ i*8+1 ] = start.y;
        buffer[ i*8+2 ] = end.x;
        buffer[ i*8+3 ] = end.y;
        buffer[ i*8+4 ] = perpOffset.x;
        buffer[ i*8+5 ] = perpOffset.y;
        buffer[ i*8+6 ] = speed;
        buffer[ i*8+7 ] = Math.random();

        if ( (i+1) % LOADING_STEP === 0 ) {
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
