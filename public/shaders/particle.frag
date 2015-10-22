precision mediump float;

uniform vec3 uColor;
uniform float uOpacity;

void main() {
    gl_FragColor = vec4( uColor, uOpacity );
}
