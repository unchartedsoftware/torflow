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

var getGeoJSON = function(cc) {
    var json = null;
    if (JSONFileCache[cc]) {
        json = JSONFileCache[cc];
    } else {
        var relativeFilePath = __dirname + '/../data/countries/' + cc.toUpperCase() + '.geo.json';
        var absoluteFilePath = path.resolve(relativeFilePath);

        try {
            json = JSON.parse(fs.readFileSync(absoluteFilePath, 'utf8'));
            json.cc_2 = ccLookup.threeToTwo[cc];
            json.cc_3 = cc;
            JSONFileCache[cc] = json;
        } catch (e) {
            console.log(e.message);
        }
    }
    return json;
};

/* GET home page. */
router.post('/', function(req, res, next) {
    var countryCodes = req.body.cc;

    var result = {};
    if (countryCodes && countryCodes.length) {
        countryCodes.forEach(function (cc) {
            var threeLetterCC = ccLookup.twoToThree[cc.toUpperCase()];
            if (threeLetterCC) {
                result[cc] = getGeoJSON(threeLetterCC);
            }
        });
    }

    res.send(result);
});

module.exports = router;
