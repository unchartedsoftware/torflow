/**
 Copyright 2016 Uncharted Software Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

(function() {
    'use strict';
    
    var express = require('express');
    var datesDB = require('../db/dates');
    var router = express.Router();
    var async = require('async');

    /**
     * GET /dates
     */
    router.get('/', function(req, res) {
        async.parallel({
                dates: datesDB.getDates,
                min: datesDB.getMinBandwidth,
                max: datesDB.getMaxBandwidth
            },
            function(err, data) {
                if (err) {
                    console.log(err.message);
                    res.status(500).send('Dates data could not be retrieved.');
                } else {
                    res.send({
                        dates: data.dates.dates,
                        bandwidths: data.dates.bandwidths,
                        min: data.min,
                        max: data.max
                    });
                }
            });
    });

    module.exports = router;


}());
