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
    var relayDB = require('../db/relay');
    var DBUtil = require('../db/db_utils');

    /**
     * GET /nodes/:dateid
     */
    router.get('/:dateid', function(req, res) {
        // get sql date from id
        var sqlDate = DBUtil.getMySQLDate(req.params.dateid);
        // pull relays for date
        relayDB.getAggregates(
            sqlDate,
            req.query.count, // get count from query param
            function(err,nodes) {
                if (err) {
                    res.status(500).send('Node data could not be retrieved.');
                } else {
                    res.send(nodes);
                }
            });
    });

    module.exports = router;

}());
