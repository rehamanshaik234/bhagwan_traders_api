const cacheProvider = require('./cacheProvider');

module.exports = {
    getDataFromCache,
    setDataToCache,
    removeCache,
    getKeys,
    IsKeyExist,
    removeAllCache
}

async function getDataFromCache(key) {
    return cacheProvider.instance().get(key);
}
async function setDataToCache(key, data) {
    cacheProvider.instance().set(key, data);
}
async function removeCache(key) {
    cacheProvider.instance().del(key);
}
async function getKeys() {
    return cacheProvider.instance().keys();
}
async function IsKeyExist(key) {
    return cacheProvider.instance().has(key);
}
async function removeAllCache() {
    cacheProvider.instance().flushAll();
    cacheProvider.instance().flushStats();
}