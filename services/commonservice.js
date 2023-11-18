const express = require("express");
const router = express.Router();
const authenticateToken = require("../helpers/authtoken");
const tables = require("../helpers/tableNames.js");
const tablecols = require("../helpers/tableColumns.js");
const fnCommon = require("../helpers/commonFunctions.js");
const fndb = require("../helpers/dbFunctions.js");

router.post("/logInfoMsg", [authenticateToken.validJWTNeeded, logInfoMsg]);

router.get("/getAssignedDriverRoute/:id", [getAssignedDriverRoute]);
router.get("/getRoute/:id", [getRoute]);
router.get("/getCurrentLocation/:id", [getCurrentLocation]);
router.post("/saveCurrentLocation", [saveCurrentLocation]);

module.exports = router;

async function logInfoMsg(req, res) {
  fnCommon.logInfoMsg(req.body.msg);
  return res.send(true);
}

async function getAssignedDriverRoute(req, res) {
  var resp = new Object();
  try {
    let cols = tablecols.getColumns(tables.Users);
    var dbresult = await fndb.getItemByColumn(tables.VehicleRoute, cols.driverId, parseInt(req.params.id));
    resp.result = dbresult.length > 0 ? dbresult[0] : new Object();
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - getAssignedDriverRoute", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getRoute(req, res) {
  var resp = new Object();
  try {
    var routeId = parseInt(req.params.id);
    var dbresult = '';
    if(routeId > 0) {
      dbresult = await fndb.getItemById(tables.VehicleRoute, routeId);
    } else {
      dbresult = await fndb.getAllItems(tables.VehicleRoute);
    }
    resp.result = dbresult;
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - getRoute", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getCurrentLocation(req, res) {
  var resp = new Object();
  try {
    var sql = "select * from vehicle_route where route_id = " + parseInt(req.params.id);
    resp.result = await fndb.customQuery(tables.VehicleRoute, sql);
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - getCurrentLocation", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function saveCurrentLocation(req, res) {
  var resp = new Object();
  try {
    var routeId = parseInt(req.body.routeId);
    var currLat = req.body.currentLatitude;
    var currLong = req.body.currentLongitude;
    var timeStamp = req.body.lastUpdateTime;
    var isOnline = parseInt(req.body.isOnline);
    var sql = "update vehicle_route set current_latitude = '" + currLat + "', current_longitude = '" + currLong + "', last_update_time = '" + timeStamp + "', is_online = " + isOnline + 
          " where route_id = " + routeId;
    await fndb.customQuery(tables.VehicleRoute, sql)
    resp.result = req.body;
    resp.success = true;
    resp.message = "Saved data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - saveCurrentLocation", req, err.message);
    resp.result = req.body;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
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