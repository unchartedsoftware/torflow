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
        tailFillHidden : {
            r : 255,
            g : 0,
            b : 0
        },
        tailSegments : 3,
        tailSegmentLength : 15
    },
    title : 'Data Flow in the Tor Network',
    summary : 'Blah blah blah this is a summary of something that should probably describe what we\'re seeing',
    hiddenServiceProbability : 0.04
};

module.exports = config;