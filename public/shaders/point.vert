attribute highp vec3 aVertexPosition;

uniform highp mat4 uProjectionMatrix;

void main() {
    gl_PointSize = 5.0;
    // set position
    gl_Position = uProjectionMatrix * vec4( aVertexPosition, 1.0 );
}
