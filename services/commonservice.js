const express = require("express");
const router = express.Router();
const authenticateToken = require("../helpers/authtoken");
const tables = require("../helpers/tableNames.js");
const tablecols = require("../helpers/tableColumns.js");
const fnCommon = require("../helpers/commonFunctions.js");
const fndb = require("../helpers/dbFunctions.js");
const tableNames = require("../helpers/tableNames.js");

router.post("/logInfoMsg", [authenticateToken.validJWTNeeded, logInfoMsg]);

router.get("/getAssignedDriverRoute/:id", [getAssignedDriverRoute]);
router.post("/getRoute", [getRoute]);
router.get("/getCurrentLocation/:id", [getCurrentLocation]);
router.get("/getAllVehicleInfo/:id", [getAllVehicleInfo]);
router.post("/saveCurrentLocation", [saveCurrentLocation]);
router.post("/assignDriver", [assignDriver]);
router.put("/updateAssignedDriver", [updateAssignedDriver]);
router.put("/updateRoute", updateRoute);
router.post("/removeAssignedDriver", removeAssignedDriver);

module.exports = router;

async function logInfoMsg(req, res) {
  fnCommon.logInfoMsg(req.body.msg);
  return res.send(true);
}

async function getAssignedDriverRoute(req, res) {
  var resp = new Object();
  try {
    let cols = tablecols.getColumns(tables.VehicleRoute);
    var dbresult = await fndb.getItemByColumn(
      tables.VehicleRoute,
      cols.driverId,
      parseInt(req.params.id)
    );
    resp.result = dbresult.length > 0 ? dbresult[0] : new Object();
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg(
      "Common Service - getAssignedDriverRoute",
      req,
      err.message
    );
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getRoute(req, res) {
  var resp = new Object();
  try {
    let cols = tablecols.getColumns(tables.VehicleRoute);
    var routeId = parseInt(req.body.routeId);
    var branchId = parseInt(req.body.branchId);
    var dbresult = "";
    if (routeId > 0) {
      let sql =
        "select * from " +
        tables.VehicleRoute +
        " where " +
        cols.routeId +
        " = " +
        routeId +
        " and " +
        cols.branchId +
        " = " +
        branchId;
      console.log(sql);
      dbresult = await fndb.customQuery(tables.VehicleRoute, sql);
    } else {
      dbresult = await fndb.getItemByColumn(
        tables.VehicleRoute,
        cols.branchId,
        branchId,
        true
      );
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
    var sql =
      "select * from vehicle_route where route_id = " + parseInt(req.params.id);
    resp.result = await fndb.customQuery(tables.VehicleRoute, sql);
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg(
      "Common Service - getCurrentLocation",
      req,
      err.message
    );
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
    var sql =
      "update vehicle_route set current_latitude = '" +
      currLat +
      "', current_longitude = '" +
      currLong +
      "', last_update_time = '" +
      timeStamp +
      "', is_online = " +
      isOnline +
      " where route_id = " +
      routeId;
    await fndb.customQuery(tables.VehicleRoute, sql);
    resp.result = req.body;
    resp.success = true;
    resp.message = "Saved data";
  } catch (err) {
    fnCommon.logErrorMsg(
      "Common Service - saveCurrentLocation",
      req,
      err.message
    );
    resp.result = req.body;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function registerUser(branchId, mobile, roleId, refId, emailId) {
  try {
    var chkUser = await fndb.getItemByColumn(
      Users,
      "mobile_no",
      mobile.toString().trim(),
      false
    );
    if (chkUser && chkUser.length > 0) {
      var newData = chkUser[0];
      if (roleId == 6) {
        newData.RefId += "," + refId;
        return await fndb.updateItem(Users, chkUser[0].id, newData);
      } else {
        return true;
      }
    } else {
      let newPwd = CryptoJS.encrypt(
        mobile.toString().trim(),
        userpwdsecret
      ).toString();
      var nusr = {
        BranchId: branchId,
        UserRoleId: roleId,
        RefId: refId,
        Mobile: mobile,
        UserName: mobile,
        UserPassword: newPwd,
        IsActive: 1,
      };
      if (roleId == 6) {
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

async function updateRoute(req, res) {
  var resp = new Object();
  try {
    let route = req.body;
    let routeId = route.routeId;
    console.log(routeId);
    delete route.routeId;
    resp.result = await fndb.updateItem(tables.VehicleRoute, routeId, route);
    resp.success = true;
    resp.message = "Data Updated";
  } catch (err) {
    fnCommon.logErrorMsg("User Service - updateUser", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in update user - user service";
  }
  return res.send(resp);
}

async function getAllVehicleInfo(req, res) {
  var resp = new Object();
  try {
    var branchId = parseInt(req.params.id);
    let vehicleRouteCols = tablecols.getColumns(tables.VehicleRoute);
    let vehicleCols = tablecols.getColumns(tables.Vehicle);
    let driverCols = tablecols.getColumns(tables.Driver);
    var sql =
      "SELECT " +
      tableNames.VehicleRoute +
      ".*,  " +
      tableNames.Vehicle +
      ".*,  " +
      tableNames.Driver +
      ".* FROM  " +
      tableNames.Vehicle +
      " LEFT JOIN  " +
      tableNames.VehicleRoute +
      " ON " +
      tableNames.Vehicle +
      ". " +
      vehicleCols.vehicleId +
      " = " +
      tableNames.VehicleRoute +
      "." +
      vehicleRouteCols.vehicleId +
      " LEFT JOIN  " +
      tableNames.Driver +
      " ON  " +
      tableNames.VehicleRoute +
      "." +
      vehicleRouteCols.driverId +
      " =  " +
      tableNames.Driver +
      "." +
      driverCols.driverId +
      " WHERE  " +
      tableNames.VehicleRoute +
      "." +
      vehicleRouteCols.branchId +
      " = " +
      branchId +
      " OR  " +
      tableNames.VehicleRoute +
      "." +
      vehicleRouteCols.branchId +
      " IS NULL";
    resp.result = await fndb.customQuery(tables.VehicleRoute, sql);
    resp.success = true;
    resp.message = "Saved data";
  } catch (err) {
    fnCommon.logErrorMsg(
      "Common Service - saveCurrentLocation",
      req,
      err.message
    );
    resp.result = req.body;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function assignDriver(req, res) {
  var resp = new Object();
  try {
    let data = req.body;
    let vehicleRouteCols = tablecols.getColumns(tables.VehicleRoute);
    console.log(data);
    const driverInfo = await fndb.getItemByColumn(
      tableNames.VehicleRoute,
      vehicleRouteCols.driverId,
      data.driverId
    );
    if (driverInfo.length == 0) {
      const routeNumber = await fndb.getItemByColumn(
        tableNames.VehicleRoute,
        vehicleRouteCols.routeNumber,
        data.routeNumber
      );
      if (routeNumber.length == 0) {
        resp.result = await fndb.addNewItem(tables.VehicleRoute, data);
        resp.success = true;
        resp.message = "Data Updated";
      } else {
        resp.result = {};
        resp.success = false;
        resp.message = "RouteNumber Already In Use";
      }
    } else {
      resp.result = {};
      resp.success = false;
      resp.message = "Driver Already Assigned";
    }
  } catch (err) {
    fnCommon.logErrorMsg("User Service - updateUser", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in Assign Driver - common service";
  }
  return res.send(resp);
}

async function updateAssignedDriver(req, res) {
  var resp = new Object();
  try {
    let data = req.body;
    let vehicleRouteCols = tablecols.getColumns(tables.VehicleRoute);
    console.log(data);
    const driverInfo = await fndb.getItemByColumn(
      tableNames.VehicleRoute,
      vehicleRouteCols.driverId,
      data.driverId
    );
    if (driverInfo.length == 0) {
      resp.result = await fndb.updateItem(
        tables.VehicleRoute,
        data.routeId,
        data
      );
      resp.success = true;
      resp.message = "Data Updated";
    } else {
      resp.result = {};
      resp.success = false;
      resp.message = "Driver Already Assigned";
    }
  } catch (err) {
    fnCommon.logErrorMsg("User Service - updateUser", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in Assign Driver - common service";
  }
  return res.send(resp);
}

async function removeAssignedDriver(req, res) {
  var resp = new Object();
  try {
    let data = req.body;
    resp.result = await fndb.updateItem(
      tables.VehicleRoute,
      data.routeId,
      data
    );
    resp.success = true;
    resp.message = "Driver Removed";
  } catch (err) {
    fnCommon.logErrorMsg("User Service - updateUser", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in update user - user service";
  }
  return res.send(resp);
}
