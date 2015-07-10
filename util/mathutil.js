function minmax(list) {
    var min = Number.MAX_VALUE;
    var max = Number.MIN_VALUE;
    list.forEach(function(element) {
        min = Math.min(min,element);
        max = Math.max(max,element);
    });
    return {
        min : min,
        max : max
    };
}

module.exports.minmax = minmax;