var config = {
    particle_count : 750,
    node_radius : {
        min : 5,
        max : 30
    },
    particle_velocity : 0.2,
    particle_velocity_variance_scale : {
        min : 0.5,
        max : 1.5
    },
    dot : {
        thickness : 3,
        headFill : 'rgba(255,255,255,0.8)',
        tailFill : {
            r : 0,
            g : 0,
            b : 255
        },
        tailSegments : 3,
        tailSegmentLength : 15
    }
};

module.exports = config;