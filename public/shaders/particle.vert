attribute highp vec4 aPositions;
attribute highp vec3 aOffset;

uniform highp mat4 uProjectionMatrix;
uniform highp float uTime;

void main() {
    // extract components
    highp vec2 startPos = aPositions.xy;
    highp vec2 stopPos = aPositions.zw;
    highp vec2 offset = aOffset.xy;
    highp float speed = aOffset.z;
    // calc t and q values
    highp float t = mod( uTime, speed ) / speed;
    highp float q = sin( t * 3.1415926 );
    // calc interpolated position and offset
    highp vec2 interpOffset = offset * q;
    highp vec2 interpPos = startPos + (offset / 3.0) + ( stopPos - startPos ) * t;
    // set point size
    gl_PointSize = 2.0;
    // set position
    gl_Position = uProjectionMatrix * vec4( interpPos + interpOffset, 0.0, 1.0 );
}
