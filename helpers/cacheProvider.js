let nodeCache = require('node-cache');
let cache = null;

exports.start = function (done) {
    if (cache) return done();

    cache = new nodeCache({ stdTTL: 100, checkperiod: 120, useClones: false });
}

exports.instance = function () {
    return cache;
}