var VERSION = 1.0;
var COLUMNS = ['Name','Fingerprint','Flags','IP','OrPort','ObservedBW','Uptime','GuardClients','DirClients','Longitude','Latitude'];
var DB_ORDER = 'fingerprint,name,flags,ip,port,bandwidth,dirclients,lat,lng,date';
var parseLine = function(csvLine,dateStr) {
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

module.exports.VERSION = VERSION;
module.exports.COLUMNS = COLUMNS;
module.exports.DB_ORDER = DB_ORDER;
module.exports.parseLine = parseLine;