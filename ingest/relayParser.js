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

(function() {
    'use strict';

	var VERSION = '1.0.0';
	var COLUMNS = ['Name','Fingerprint','Flags','IP','OrPort','ObservedBW','Uptime','GuardClients','DirClients','Longitude','Latitude'];
	var DB_ORDER = 'fingerprint,name,flags,ip,port,bandwidth,dirclients,lat,lng,date';

	var parseRelayLine = function(csvLine,dateStr) {
		var elements = csvLine.split(',');
		var spec = {
			name 		: elements[0],
			fingerprint : elements[1],
			flags 		: elements[2],
			ip			: elements[3],
			port		: elements[4],
			bandwidth	: elements[5],
			dirclients	: elements[8],
			lng			: elements[9],
			lat			: elements[10],
			date		: dateStr
		};
		return DB_ORDER.split(',').map(function(key) {
			return spec[key];
		});
	};

	var parseCountryCodeLine = function(csvLine,dateStr) {
		var elements = csvLine.split(',');
		var guardClientsStr = elements[7];
		var guardClientsArr = guardClientsStr.split('|');
		var guardClients = {};
		guardClientsArr.forEach(function(guardClient) {
			if (!guardClient || guardClient === '') {
				return;
			} else {
				var gcPieces = guardClient.split(':');
				guardClients[gcPieces[0]] = parseInt(gcPieces[1]);
			}
		});
		return {
			fingerprint : elements[1],
			guardClients : guardClients,
			date : dateStr
		};
	};

	var verify = function(line) {
		var columns = line.replace(')','').split(',');
		if (columns.length !== COLUMNS.length) {
			return new Error('Relay file column format not supported! ' +
				'Line contains ' + columns.length + ' columns, table contains ' +
				COLUMNS.length + '.');
		}
		for (var i = 0; i < columns.length; i++) {
			if (columns[i] !== COLUMNS[i]) {
				return new Error('Relay file format not supported!\n' +
					'Expected: ' + COLUMNS + '\n' +
					'Read:     ' + columns + '\n');
			}
		}
		return false;
	};

	module.exports.VERSION = VERSION;
	module.exports.COLUMNS = COLUMNS;
	module.exports.DB_ORDER = DB_ORDER;
	module.exports.parseRelayLine = parseRelayLine;
	module.exports.parseCountryCodeLine = parseCountryCodeLine;
	module.exports.verify = verify;

}());
