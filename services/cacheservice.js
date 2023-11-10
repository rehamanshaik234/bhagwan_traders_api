const cacheManager = require("../helpers/cacheManager");
const tables = require("../helpers/tableNames.js");
const tablecols = require("../helpers/tableColumns.js");
const fnCommon = require("../helpers/commonFunctions.js");
const fndb = require("../helpers/dbFunctions.js");
const CryptoJS = require("crypto-js");

module.exports = {
  getAllItemsCache,
  getByIdItemCache,
  getItemByColumnCache,
  addNewItemCache,
  updateItemCache,
  deleteItemCache,
  clearTableCache,
  removeAllCache,
  registerUser
}

async function getAllItemsCache(tableName) {
  try {
    const cacheKey = fnCommon.getCacheKey(tableName);
    if ((await cacheManager.IsKeyExist(cacheKey)) == true) {
      return await cacheManager.getDataFromCache(cacheKey);
    } else {
      result = await fndb.getAllItems(tableName);
      if (result) {
        cacheManager.setDataToCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    fnCommon.logErrorMsg("Cache Service - getAllItemsCache", null, err.message);
    return null;
  }
}

async function getByIdItemCache(tableName, keyValue) {
  try {
    var apiResult = await getAllItemsCache(tableName);
    var result;
    for (var i = 0; i < apiResult.length; i++) {
      if (apiResult[i].id == keyValue) {
        result = apiResult[i];
        break;
      }
    }
    if (result) {
      return result;
    } else {
      return null;
    }
  } catch (err) {
    fnCommon.logErrorMsg("Cache Service - getByIdItemCache", null, err.message);
    return null;
  }
}

async function getItemByColumnCache(tableName, colName, colValue) {
  try {
    var apiResult = await getAllItemsCache(tableName);
    var results = [];
    for (var i = 0; i < apiResult.length; i++) {
      var apiVal = apiResult[i][colName];
      if(apiVal != null){
        if (colName.toLowerCase().endsWith("id")) {
          if (apiVal == colValue) {
            results.push(apiResult[i]);
          }
        } else {
          if (apiVal.toLowerCase() == colValue.toLowerCase()) {
            results.push(apiResult[i]);
          }
        }
      }
    }
    return results;
  } catch (err) {
    fnCommon.logErrorMsg("Cache Service - getItemByColumnCache", null, err.message);
    return null;
  }
}

async function addNewItemCache(tableName, data) {
 try {
    var result = await fndb.addNewItem(tableName, data);
    if (result) {
     await cacheManager.removeCache(fnCommon.getCacheKey(tableName));
    }
    return result;
  } catch (err) {
    fnCommon.logErrorMsg("Cache Service - addNewItemCache", null, JSON.stringify(err));
    return null;
  }
}

async function updateItemCache(tableName, keyValue, data) {
  try {
    var result = await fndb.updateItem(tableName, keyValue, data);
    if (result) {
     await cacheManager.removeCache(fnCommon.getCacheKey(tableName));
    }
    return result;
  } catch (err) {
    fnCommon.logErrorMsg("Cache Service - updateItemCache", null, err.message);
    return null;
  }
}

async function deleteItemCache(tableName, keyValue) {
  try {
    var result = await fndb.deleteItem(tableName, keyValue);
    if (result) {
      cacheManager.removeCache(fnCommon.getCacheKey(tableName));
    }
    return result;
  } catch (err) {
    fnCommon.logErrorMsg("Cache Service - deleteItemCache", null, err.message);
    return null;
  }
}

async function clearTableCache(tableName) {
  cacheManager.removeCache(fnCommon.getCacheKey(tableName));
}

async function removeAllCache() {
  await cacheManager.removeAllCache();
}

async function registerUser(branchId, mobile, roleId, refId, emailId) {
 try {
    var chkUser = await fndb.getItemByColumn(Users, "mobile_no", mobile.toString().trim(), false);
    if (chkUser && chkUser.length > 0) {
       var newData = chkUser[0];
       if(roleId == 6) {
         newData.RefId += ',' + refId;
         return await fndb.updateItem(Users, chkUser[0].id, newData);
       } else {
        return true;
       }
    } else {
      let newPwd= CryptoJS.encrypt(mobile.toString().trim(), userpwdsecret).toString();
      var nusr = { BranchId: branchId, UserRoleId: roleId, RefId: refId, Mobile: mobile, UserName: mobile, UserPassword: newPwd, IsActive: 1}
      if(roleId == 6) {
        return await addNewItemCache(Users, nusr, "System");
      } else {
        nusr.UserName = emailId;
        return await addNewItemCache(Users, nusr, "System");
      }
      
    }
  } catch (err) {
    fnCommon.logErrorMsg("Cache Service - registerUser", null, err.message);
    return null;
  }
}
