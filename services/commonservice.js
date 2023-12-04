const express = require("express");
const router = express.Router();
const authenticateToken = require("../helpers/authtoken");
const tables = require("../helpers/tableNames.js");
const tablecols = require("../helpers/tableColumns.js");
const fnCommon = require("../helpers/commonFunctions.js");
const fndb = require("../helpers/dbFunctions.js");
const tableNames = require("../helpers/tableNames.js");

router.post("/logInfoMsg", [authenticateToken.validJWTNeeded, logInfoMsg]);

router.get("/getBranchList", [authenticateToken.validJWTNeeded, getBranchList]);
router.get("/getBranch/:id", [authenticateToken.validJWTNeeded, getBranch]);
router.post("/saveBranch", [authenticateToken.validJWTNeeded, saveBranch]);
router.delete("/deleteBranch/:id", [
  authenticateToken.validJWTNeeded,
  deleteBranch,
]);

router.post("/getStudentsByRoute", [
  authenticateToken.validJWTNeeded,
  getStudentsByRoute,
]);
router.get("/getStudent/:id", [authenticateToken.validJWTNeeded, getStudent]);
router.post("/saveStudent", [authenticateToken.validJWTNeeded, saveStudent]);
router.delete("/deleteStudent/:id", [
  authenticateToken.validJWTNeeded,
  deleteStudent,
]);

router.get("/getDriver/:id", [authenticateToken.validJWTNeeded, getDriver]);
router.post("/saveDriver", [authenticateToken.validJWTNeeded, saveDriver]);
router.delete("/deleteDriver/:id", [
  authenticateToken.validJWTNeeded,
  deleteDriver,
]);

router.get("/getVehicle/:id", [authenticateToken.validJWTNeeded, getVehicle]);
router.post("/saveVehicle", [authenticateToken.validJWTNeeded, saveVehicle]);
router.delete("/deleteVehicle/:id", [
  authenticateToken.validJWTNeeded,
  deleteVehicle,
]);

router.get("/getAssignedDriverRoute/:id", [
  authenticateToken.validJWTNeeded,
  getAssignedDriverRoute,
]);
router.get("/getAssignedStudentRoute/:id", [
  authenticateToken.validJWTNeeded,
  getAssignedStudentRoute,
]);
router.post("/getRoute", [authenticateToken.validJWTNeeded, getRoute]);
router.get("/getAllRoutes/:branchId", [
  authenticateToken.validJWTNeeded,
  getAllRoutes,
]);
router.get("/getCurrentLocation/:id", [
  authenticateToken.validJWTNeeded,
  getCurrentLocation,
]);
router.get("/getAllVehicleInfo/:id", [
  authenticateToken.validJWTNeeded,
  getAllVehicleInfo,
]);
router.get("/getAllDrivers/:branchId", [
  authenticateToken.validJWTNeeded,
  getAllDrivers,
]);
router.post("/saveCurrentLocation", [
  authenticateToken.validJWTNeeded,
  saveCurrentLocation,
]);
router.post("/assignDriver", [authenticateToken.validJWTNeeded, assignDriver]);
router.put("/updateAssignedDriver", [
  authenticateToken.validJWTNeeded,
  updateAssignedDriver,
]);
router.put("/updateRoute", [authenticateToken.validJWTNeeded, updateRoute]);

module.exports = router;

async function logInfoMsg(req, res) {
  fnCommon.logInfoMsg(req.body.msg);
  return res.send(true);
}

async function getBranchList(req, res) {
  var resp = new Object();
  try {
    resp.result = await fndb.getAllItems(tables.Branch);
    resp.success = true;
    resp.message = "All Branch List";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - getBranchList", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getBranch(req, res) {
  var resp = new Object();
  try {
    resp.result = await fndb.getItemById(tables.Branch, req.params.id);
    resp.success = true;
    resp.message = "Branch data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - getBranch", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function saveBranch(req, res) {
  var resp = new Object();
  try {
    if (req.body.id) {
      dbresult = await fndb.updateItem(tables.Branch, req.body.id, req.body);
    } else {
      dbresult = await fndb.addNewItem(tables.Branch, req.body);
    }
    resp.result = null;
    resp.success = true;
    resp.message = "Saved data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - saveBranch", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function deleteBranch(req, res) {
  var resp = new Object();
  try {
    resp.result = await fndb.deleteItem(tables.Branch, req.params.id);
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - deleteBranch", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getStudentsByRoute(req, res) {
  var resp = new Object();
  var routeId = req.body.routeId;
  var branchId = req.body.branchId;
  try {
    const sql =
      "select * from student where branch_id = " +
      branchId +
      " and route_id = " +
      routeId;
    resp.result = await fndb.customQuery(tableNames.Student, sql);
    resp.success = true;
    resp.message = "Students by Route";
  } catch (err) {
    fnCommon.logErrorMsg(
      "Common Service - getStudentsByRoute",
      req,
      err.message
    );
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getStudent(req, res) {
  var resp = new Object();
  try {
    resp.result = await fndb.getItemById(tables.Student, req.params.id);
    resp.success = true;
    resp.message = "Students by Route";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - getStudent", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function saveStudent(req, res) {
  var resp = new Object();
  try {
    if (req.body.id) {
      dbresult = await fndb.updateItem(tables.Student, req.body.id, req.body);
    } else {
      dbresult = await fndb.addNewItem(tables.Student, req.body);
    }
    resp.result = null;
    resp.success = true;
    resp.message = "Saved data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - saveStudent", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function deleteStudent(req, res) {
  var resp = new Object();
  try {
    resp.result = await fndb.deleteItem(tables.Student, req.params.id);
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - deleteStudent", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getDriver(req, res) {
  var resp = new Object();
  try {
    if (req.params.id > 0) {
      resp.result = await fndb.getItemById(tables.Driver, req.params.id);
    } else {
      resp.result = await fndb.getAllItems(tables.Driver);
    }
    resp.success = true;
    resp.message = "Students by Route";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - getDriver", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function saveDriver(req, res) {
  var resp = new Object();
  try {
    if (req.body.id) {
      dbresult = await fndb.updateItem(tables.Driver, req.body.Id, req.body);
    } else {
      dbresult = await fndb.addNewItem(tables.Driver, req.body);
    }
    resp.result = null;
    resp.success = true;
    resp.message = "Error: Error in getting information";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - saveDriver", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function deleteDriver(req, res) {
  var resp = new Object();
  try {
    resp.result = await fndb.deleteItem(tables.Driver, req.params.id);
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - deleteDriver", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getVehicle(req, res) {
  var resp = new Object();
  try {
    resp.result = await fndb.getItemById(tables.Vehicle, req.params.id);
    resp.success = true;
    resp.message = "Vehicles List";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - getVehicle", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function saveVehicle(req, res) {
  var resp = new Object();
  try {
    if (req.body.id) {
      dbresult = await fndb.updateItem(tables.Vehicle, req.body.Id, req.body);
    } else {
      dbresult = await fndb.addNewItem(tables.Vehicle, req.body);
    }
    resp.result = null;
    resp.success = true;
    resp.message = "Error: Error in getting information";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - saveVehicle", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function deleteVehicle(req, res) {
  var resp = new Object();
  try {
    resp.result = await fndb.deleteItem(tables.Vehicle, req.params.id);
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("Common Service - deleteVehicler", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getAssignedStudentRoute(req, res) {
  var resp = new Object();
  try {
    let routeCols = tablecols.getColumns(tables.VehicleRoute);
    var student = await fndb.getItemById(tables.Student, req.params.id);
    var studentRoute = await fndb.getItemByColumn(
      tables.VehicleRoute,
      routeCols.routeId,
      student.routeId
    );
    if (studentRoute.length > 0) {
      resp.result = studentRoute;
      resp.success = true;
      resp.message = "All data";
    } else {
      resp.result = [];
      resp.success = true;
      resp.message = "No Routes Found";
    }
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

async function getAssignedDriverRoute(req, res) {
  var resp = new Object();
  try {
    let cols = tablecols.getColumns(tables.VehicleRoute);
    var dbresult = await fndb.getItemByColumn(
      tables.VehicleRoute,
      cols.driverId,
      parseInt(req.params.id)
    );
    resp.result = dbresult;
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

async function getAllRoutes(req, res) {
  var resp = new Object();
  try {
    let cols = tablecols.getColumns(tables.VehicleRoute);
    var branchId = parseInt(req.params.branchId);
    var dbresult = "";
    let sql =
      "select * from " +
      tables.VehicleRoute +
      " where " +
      cols.branchId +
      " = " +
      branchId;
    dbresult = await fndb.customQuery(tables.VehicleRoute, sql);
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

async function getAllDrivers(req, res) {
  var resp = new Object();
  try {
    let cols = tablecols.getColumns(tables.Driver);
    var branchId = parseInt(req.params.branchId);
    var dbresult = "";
    let sql =
      "select * from " +
      tables.Driver +
      " where " +
      cols.branchId +
      " = " +
      branchId;
    dbresult = await fndb.customQuery(tables.VehicleRoute, sql);
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
    var sql =
      "SELECT vehicle_route.*, vehicle.*, driver.* FROM vehicle LEFT JOIN vehicle_route ON vehicle.vehicle_id = vehicle_route.vehicle_id LEFT JOIN driver ON vehicle_route.driver_id = driver.driver_id WHERE " +
      "vehicle_route.branch_id =" +
      branchId +
      " OR vehicle_route.branch_id IS NULL";

    resp.result = await fndb.customQuery(null, sql); //If data coming rfrom multiple tables use null
    resp.success = true;
    resp.message = "Saved data";
  } catch (err) {
    fnCommon.logErrorMsg(
      "Common Service - getAllVehicleInfo",
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
    const routeNumber = await fndb.getItemByColumn(
      tableNames.VehicleRoute,
      vehicleRouteCols.routeNumber,
      data.routeNumber
    );
    if (routeNumber.length == 0) {
      await fndb.addNewItem(tables.VehicleRoute, data);
      resp.result = true;
      resp.success = true;
      resp.message = "Data Updated";
    } else {
      resp.result = {};
      resp.success = false;
      resp.message = "RouteNumber Already In Use";
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
    resp.result = await fndb.updateItem(
      tables.VehicleRoute,
      data.routeId,
      data
    );
    resp.success = true;
    resp.message = "Data Updated";
  } catch (err) {
    fnCommon.logErrorMsg("User Service - updateUser", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in Assign Driver - common service";
  }
  return res.send(resp);
}
