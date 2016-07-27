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
    var router = express.Router();
    var countryDB = require('../db/country');

    /**
     * GET /histogram/:countrycode
     */
    router.get('/:countrycode', function(req, res) {
        var cc = req.params.countrycode.toLowerCase();
        countryDB.getDateHistogram(cc,function(err,json) {
            if (err) {
                res.send(null);
            } else {
                res.send(json);
            }
        });
    });

    module.exports = router;
    
}());
