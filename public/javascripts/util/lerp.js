var lerp = function(min,max,alpha) {
    return min + (max-min) * alpha;
};
module.exports = lerp;