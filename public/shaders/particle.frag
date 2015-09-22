//uniform sampler2D uPointSampler;

void main() {
    //highp vec3 texelColor = texture2D( uPointSampler, gl_PointCoord ).rgb;
    gl_FragColor = vec4( 0.1, 0.3, 0.6, 0.6 );
}
