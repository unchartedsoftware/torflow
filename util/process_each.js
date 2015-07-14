var uuid = require('./uuid');
var activeAsyncProcesses = {};

/**
 * Utility function to process an asynchronous routine (iterator) in order
 * @param array - array of arguments to passed to iterator
 * @param iterator - a function that gets array[idx] as an argument and a callback
 *    function to call when complete
 *    ie/
 *    processEach([1,2,3],function(i,onComplete) {
	 * 		async_operation(i, function() {
	 * 			onComplete();
	 * 		}
	 * 	}
 *    Will always return in order 1,2,3
 */
var processEach = function (array, iterator, onComplete) {

	var id = uuid.generate();
	activeAsyncProcesses[id] = true;

	var next = function () {
		idx++;
		if (idx < array.length && activeAsyncProcesses[id]) {
			iterator(array[idx], function () {
				next.call();
			});
		} else if (activeAsyncProcesses[id]) {
			delete activeAsyncProcesses[id];
			if (onComplete) {
				onComplete();
			}
		}
	};
	var idx = -1;
	next();

	return id;
};

/**
 * Cancels an async sequence given an id
 * @param id - process id return from process.each
 */
var cancelProcess = function (id) {
	if (activeAsyncProcesses[id]) {
		delete activeAsyncProcesses[id];
	}
};

/**
 * Cancels all async processes
 */
var cancelAllProcesses = function () {
	for (var key in activeAsyncProcesses) {
		if (activeAsyncProcesses.hasOwnProperty(key)) {
			cancelProcess(key);
		}
	}
};

/**
 * Returns a truthy value if the process is active
 * @param id - id of process return
 * @returns {*}
 */
var isActive = function(id) {
	return activeAsyncProcesses[id];
};


exports.each = processEach;
exports.cancel = cancelProcess;
exports.cancelAll = cancelAllProcesses;
exports.isActive = isActive;

