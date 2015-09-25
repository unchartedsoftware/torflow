attribute highp vec4 aPositions;
attribute highp vec4 aOffset;

uniform highp mat4 uProjectionMatrix;
uniform highp float uTime;

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
    highp vec2 offset = aOffset.xy;
    highp float speed = aOffset.z;
    highp float timeOffset = speed * aOffset.w;
    highp float noise = rand( timeOffset, offset.x );
    // calc t and interpolate the position
    highp float t = mod( uTime + timeOffset, speed ) / speed;
    highp vec2 position = startPos + ( stopPos - startPos ) * t;
    // calc positional offset
    highp vec2 fixedOffset = sin( t * PI ) * offset;
    // calc cosine offset
    highp float period = floor( noise * MAX_PERIOD ) / 2.0;
    highp float phase = 0.0; //noise * PI_2;
    highp vec2 sinOffset = sin( t * PI_2 * period + phase ) * offset;
    // set point size
    gl_PointSize = 1.0;
    // set position
    gl_Position = uProjectionMatrix * vec4( position + fixedOffset + sinOffset, 0.0, 1.0 );
}
