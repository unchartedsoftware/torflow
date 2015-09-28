attribute highp vec4 aPositions;
attribute highp vec4 aOffset;

uniform highp mat4 uProjectionMatrix;
uniform highp float uTime;
uniform highp float uPointSize;
uniform highp float uSpeedFactor;
uniform highp float uOffsetFactor;

#define PI 3.1415926
#define PI_2 (PI*2.0)
#define MAX_PERIOD 10.0

float rand( float a, float b ) {
    return fract( sin( dot( vec2( a, b ), vec2( 12.9898,78.233 ) ) ) * 43758.5453 );
}

void main() {
    // extract components
    highp vec2 startPos = aPositions.xy;
    highp vec2 stopPos = aPositions.zw;
    highp float offset = aOffset.x * uOffsetFactor;
    highp float speed = aOffset.y / uSpeedFactor;
    highp float rand0 = aOffset.z;
    highp float rand1 = aOffset.w;

    highp vec2 diff = stopPos - startPos;
    highp float dist = length( diff );
    highp float distOffset = dist * offset;
    highp vec2 perp = normalize( cross( vec3( diff, 0.0 ), vec3(0.0, 0.0, 1.0) ).xy );
    highp float nspeed = speed * dist;
    highp float timeOffset = nspeed * rand0;

    // calc t and interpolate the position
    highp float t = mod( uTime + timeOffset, nspeed ) / nspeed;
    highp vec2 position = startPos + ( stopPos - startPos ) * t;
    // calc positional offset
    highp vec2 fixedOffset = sin( t * PI ) * perp * distOffset;
    // calc cosine offset
    highp float period = floor( rand1 * MAX_PERIOD ) / 2.0;
    highp float phase = 0.0; //noise * PI_2;
    highp vec2 sinOffset = sin( t * PI_2 * period + phase ) * perp * distOffset;
    // set point size
    gl_PointSize = uPointSize;
    // set position
    gl_Position = uProjectionMatrix * vec4( position + fixedOffset + sinOffset, 0.0, 1.0 );
}
