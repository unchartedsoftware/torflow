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
