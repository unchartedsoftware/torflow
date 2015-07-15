var deepclone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};
module.exports = deepclone;