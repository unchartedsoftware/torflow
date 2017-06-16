precision highp float;

attribute vec4 aPositions;
attribute vec4 aOffsets;

uniform mat4 uProjectionMatrix;
uniform float uTime;
uniform float uPointSize;
uniform float uSpeedFactor;
uniform float uOffsetFactor;

uniform float uMinX;
uniform float uMaxX;

float PI = 3.141592654;

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

vec3 xyToSphere(vec2 xy) {
    float xn = mod(xy.x,1.0);
    if (xn<0.0) xn+=1.0;
    vec2 ll = vec2((xn-0.5)*PI*2.0, (xy.y-0.5)*PI);
    float x = sin(ll.x+PI/2.0)*cos(ll.y);
    float y = sin(ll.y);
    float back = (xn>0.5)?1.0:-1.0;
    return vec3(x, y, back*sqrt(1.0-x*x-y*y));
}

vec2 sphereToXY(vec3 s) {
    return vec2(-atan(s.z,-s.x)/(2.0*PI),
        0.5+atan(s.y, sqrt(s.x*s.x+s.z*s.z))/PI);
}

vec3 getBezier3(float t, vec3 C1, vec3 C2, vec3 C3, vec3 C4) {
    return normalize(vec3(
        C1.x*B1(t) + C2.x*B2(t) + C3.x*B3(t) + C4.x*B4(t),
        C1.y*B1(t) + C2.y*B2(t) + C3.y*B3(t) + C4.y*B4(t),
        C1.z*B1(t) + C2.z*B2(t) + C3.z*B3(t) + C4.z*B4(t)
    ));
}

vec2 sphereInterp(vec2 startPos, vec2 endPos, vec4 aOffsets, float uOffsetFactor, float uSpeedFactor) {
    // Get spherical points (x,y,z) on the unit sphere
    vec3 s1 = xyToSphere(startPos);
    vec3 s4 = xyToSphere(endPos);

    // get difference vector and distance on the unit sphere
    vec3 sdiff = s4 - s1;
    float sdist = acos(dot(s1,s4))/PI;

    // get normalize vector perpendicular to path
    vec3 sperp = normalize(cross(s1,s4));

    // get subpoint parameters and offsets
    float t0 = aOffsets.x;
    float t1 = aOffsets.z;
    float offset0 = aOffsets.y * sdist * uOffsetFactor;
    float offset1 = aOffsets.w * sdist * uOffsetFactor;

    // build sub points
    vec3 s2 = normalize(s1 + (t0 * sdiff + offset0 * sperp));
    vec3 s3 = normalize(s1 + (t1 * sdiff + offset1 * -sperp));

    // get two randum numbers
    float r0 = rand( vec2(s1.x, s2.y) );
    float r1 = rand( vec2(s1.y, s2.x) );

    // normalize speed by distance, vary by random number
    float nSpeed = ( uSpeedFactor + uSpeedFactor * r1 ) * sdist;
    float tOffset = r0 * nSpeed;
    float t = mod( uTime + tOffset, nSpeed ) / nSpeed;

    // Get position along the great arc
    vec3 spos = getBezier3(t, s1, s2, s3, s4);
    return sphereToXY(spos);

}

vec2 mapInterp(vec2 startPos, vec2 endPos, vec4 aOffsets, float uOffsetFactor, float uSpeedFactor) {
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
    // get position along the curve
    vec2 pos = getBezier(t, startPos, p1, p2, endPos);
    return pos;
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

    vec2 pos = sphereInterp(startPos, endPos, aOffsets, uOffsetFactor, uSpeedFactor);

    // set point size
    gl_PointSize = uPointSize;

    // The map coordinates are [0,1] and repeat in every integer interval.
    // Start with pos.x in [0,1]
    pos.x = mod(pos.x, 1.0);

    // Move pos.x to an integer tile so that it lies between [uMinX,uMaxX]
    float leftTile = floor(uMinX);
    pos.x += leftTile;
    if (pos.x<uMinX) pos.x += 1.0;

    gl_Position = uProjectionMatrix * vec4( pos.x, pos.y, 0.0, 1.0 );
}
