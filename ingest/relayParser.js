var VERSION = 1.0;
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
		bandwidth	: (elements[5]),
		dirclients	: (elements[8]),
		lat			: (elements[10]),
		lng			: (elements[9]),
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

module.exports.VERSION = VERSION;
module.exports.COLUMNS = COLUMNS;
module.exports.DB_ORDER = DB_ORDER;
module.exports.parseRelayLine = parseRelayLine;
module.exports.parseCountryCodeLine = parseCountryCodeLine;