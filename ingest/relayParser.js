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
