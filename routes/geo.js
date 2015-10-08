/**
 * Copyright © 2015 Uncharted Software Inc.
 *
 * Property of Uncharted™, formerly Oculus Info Inc.
 * http://uncharted.software/
 *
 * Released under the MIT License.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ccLookup = require('../util/countrycode');
var JSONFileCache = {};

var getGeoJSON = function(cc,onSuccess,onError) {
    if (JSONFileCache[cc]) {
        // exists in cache
        onSuccess(JSONFileCache[cc]);
    } else {
        var relativeFilePath = __dirname + '/../data/countries_medium/' + cc.toUpperCase() + '.geo.json';
        var absoluteFilePath = path.resolve(relativeFilePath);
        fs.readFile( absoluteFilePath, 'utf8', function(err,file) {
            if (err) {
                onError(err);
            } else {
                var json = JSON.parse(file);
                json.cc_2 = ccLookup.threeToTwo[cc];
                json.cc_3 = cc;
                JSONFileCache[cc] = json;
                onSuccess(json);
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
            function(json) {
                res.send(json);
            },
            function() {
                res.send(null);
            });
    } else {
        res.send(null);
    }
});

module.exports = router;
