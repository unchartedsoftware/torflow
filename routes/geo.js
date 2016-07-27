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
    var fs = require('fs');
    var path = require('path');
    var ccLookup = require('../util/countrycode');
    var JSONFileCache = {};

    var getGeoJSON = function(cc,callback) {
        if (JSONFileCache[cc]) {
            // exists in cache
            callback(null,JSONFileCache[cc]);
        } else {
            var relativeFilePath = __dirname + '/../data/countries_medium/' + cc.toUpperCase() + '.geo.json';
            var absoluteFilePath = path.resolve(relativeFilePath);
            fs.readFile( absoluteFilePath, 'utf8', function(err,file) {
                if (err) {
                    callback(err);
                } else {
                    var json = JSON.parse(file);
                    json.cc_2 = ccLookup.threeToTwo[cc];
                    json.cc_3 = cc;
                    JSONFileCache[cc] = json;
                    callback(null,json);
                }
            });
        }
    };

    /**
     * GET /geo/
     */
    router.get('/:countrycode', function(req, res) {
        var twoLetterCC = req.params.countrycode.toUpperCase(),
            threeLetterCC = ccLookup.twoToThree[twoLetterCC];
        if (threeLetterCC) {
            getGeoJSON(
                threeLetterCC,
                function(err,json) {
                    if (err) {
                        res.send(null);
                    } else {
                        res.send(json);
                    }
                });
        } else {
            res.send(null);
        }
    });

    module.exports = router;

}());
