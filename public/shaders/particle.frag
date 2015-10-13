uniform highp vec3 uColor;
uniform highp float uOpacity;

void main() {
    gl_FragColor = vec4( uColor, uOpacity );
}
