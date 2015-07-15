var Lerp = require('./lerp');
var randomrange = function(min,max) {
    return Lerp(min,max,Math.random());
};
module.exports = randomrange;