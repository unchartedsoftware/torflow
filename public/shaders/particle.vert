precision highp float;

attribute vec4 aPositions;
attribute vec4 aOffsets;

uniform mat4 uProjectionMatrix;
uniform float uTime;
uniform float uPointSize;
uniform float uSpeedFactor;
uniform float uOffsetFactor;

float B1(float t) {
    return t*t*t;
}

float B2(float t) {
    return 3.0*t*t*(1.0-t);
}

float B3(float t) {
    return 3.0*t*(1.0-t)*(1.0-t);
}

float B4(float t) {
    return (1.0-t)*(1.0-t)*(1.0-t);
}

vec2 getBezier(float percent, vec2 C1, vec2 C2, vec2 C3, vec2 C4) {
    return vec2(
        C1.x*B1(percent) + C2.x*B2(percent) + C3.x*B3(percent) + C4.x*B4(percent),
        C1.y*B1(percent) + C2.y*B2(percent) + C3.y*B3(percent) + C4.y*B4(percent)
    );
}

float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    // get start and end positions
    vec2 startPos = aPositions.xy;
    vec2 endPos = aPositions.zw;
    // get signed horizontal distance between start and end positions
    float a = endPos.x - startPos.x;
    // determine if the path the particle takes should wrap around the
    // pacific ocean
    if (startPos.x < 0.5 && endPos.x > 0.5) {
        float b = (1.0 - endPos.x) + startPos.x;
        if (a > b) {
            // wrap endpoint west around the pacific
            endPos.x -= 1.0;
        }
    } else if (startPos.x > 0.5 && endPos.x < 0.5) {
        float b = startPos.x - (1.0 + endPos.x);
        if (a < b) {
            // wrap endpoint east around the pacific
            endPos.x += 1.0;
        }
    }
    // get difference vector and distance
    vec2 diff = endPos - startPos;
    float dist = length( diff );
    // get normalize vector perpendicular to path
    vec2 perp = normalize( cross( vec3( diff, 0.0 ), vec3( 0.0, 0.0, 1.0 ) ).xy );
    // get subpoint parameters and offsets
    float t0 = aOffsets.x;
    float t1 = aOffsets.z;
    float offset0 = aOffsets.y * dist * uOffsetFactor;
    float offset1 = aOffsets.w * dist * uOffsetFactor;
    // build sub points
    vec2 p1 = startPos + ( t0 * diff + offset0 * perp );
    vec2 p2 = startPos + ( t1 * diff + offset1 * -perp );
    // get two randum numbers
    float r0 = rand( vec2(p1.x, p2.y) );
    float r1 = rand( vec2(p1.y, p2.x) );
    // normalize speed by distance, vary by random number
    float nSpeed = ( uSpeedFactor + uSpeedFactor * r1 ) * dist;
    float tOffset = r0 * nSpeed;
    float t = mod( uTime + tOffset, nSpeed ) / nSpeed;
    // set point size
    gl_PointSize = uPointSize;
    // get position along the curve
    vec2 pos = getBezier(t, startPos, p1, p2, endPos);
    // set position, be sure to modulos it so that it does not extent beyond
    // the bounds of the map.
    gl_Position = uProjectionMatrix * vec4( mod(pos.x, 1.0), pos.y, 0.0, 1.0 );
}
