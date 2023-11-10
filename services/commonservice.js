const express = require("express");
const router = express.Router();
const authenticateToken = require("../helpers/authtoken");
const tables = require("../helpers/tableNames.js");
const tablecols = require("../helpers/tableColumns.js");
const fnCommon = require("../helpers/commonFunctions.js");
const fndb = require("../helpers/dbFunctions.js");
const cacheService = require("./cacheservice");

router.get("/clearAllCache", clearAllCache);
router.post("/logInfoMsg", [authenticateToken.validJWTNeeded, logInfoMsg]);

router.get("/getAssignedDriverRoute/:id", [getAssignedDriverRoute]);
router.get("/getRoute/:id", [getRoute]);
router.get("/getCurrentLocation/:id", [getCurrentLocation]);
router.post("/saveCurrentLocation", [saveCurrentLocation]);

module.exports = router;

async function clearAllCache(req, res) {
  await cacheService.removeAllCache();
  var resp = new Object();
  resp.result = null;
  resp.success = true;
  resp.message = "Cache cleared";
  return res.send(resp);
}

async function logInfoMsg(req, res) {
  fnCommon.logInfoMsg(req.body.msg);
  return res.send(true);
}

async function getAssignedDriverRoute(req, res) {
  var resp = new Object();
  try {
    var dbresult = await cacheService.getItemByColumnCache(tables.VehicleRoute, "driverId", parseInt(req.params.id));
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
      dbresult = await cacheService.getByIdItemCache(tables.VehicleRoute, routeId);
    } else {
      dbresult = await cacheService.getAllItemsCache(tables.VehicleRoute);
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
    await cacheService.clearTableCache(tables.VehicleRoute);
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - saveCurrentLocation", req, err.message);
    resp.result = req.body;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}