var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.send(
        {
            'objects': [
            {
                'circle': {
                    'coordinates': [
                        -40.00,
                        174.77
                    ]
                }
            },
            {
                'circle': {
                    'coordinates': [
                        -41.29,
                        174.76
                    ]
                }
            },
            {
                'circle': {
                    'coordinates': [
                        -41.30,
                        174.79
                    ]
                }
            },
            {
                'circle': {
                    'coordinates': [
                        -41.27,
                        174.80
                    ]
                }
            },
            {
                'circle': {
                    'coordinates': [
                        -41.29,
                        174.78
                    ]
                }
            }
        ]
    });
});

module.exports = router;
