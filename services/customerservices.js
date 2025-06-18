const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
var CryptoJS = require("crypto-js");
const authenticateToken = require("../helpers/authtoken");
const tables = require("../helpers/tableNames.js");
const tablecols = require("../helpers/tableColumns.js");
const fnCommon = require("../helpers/commonFunctions.js");
const fndb = require("../helpers/dbFunctions.js");
const apiConfig = require("../config/config.json");
const tableNames = require("../helpers/tableNames.js");

router.post("/registerCustomer", registerCustomer);
router.post("/getCustomers", [authenticateToken.validJWTNeeded, getCustomers]);
router.post("/getCustomerById/:id", [
  authenticateToken.validJWTNeeded,
  getCustomerDetByRefId,
]);

module.exports = router;

async function registerCustomer(req, res) {
  var resp = new Object();
  try {
    var result;
    var isExist = await fndb.getItemByColumn(
      tableNames.customers,
      tablecols.CustomerCols.number,
      req.body.number
    );
    if (isExist.length > 0) {
      result = isExist[0].id;
    } else {
      result = await fndb.addNewItem(tableNames.customers, req.body);
    }
    if (result) {
      const token = jwt.sign({ sub: result }, apiConfig.jwtSecret);
      resp.success = true;
      resp.token = token;
      resp.message = "Successfully Login";
    } else {
      resp.success = false;
      resp.message = "Unable to Process Request";
    }
  } catch (err) {
    fnCommon.logErrorMsg("Customer Service - getUsers", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function getCustomers(req, res) {
  var resp = new Object();
  try {
    var result;
    if (req.body.id) {
      result = await fndb.getItemById(tables.Users, req.body.id);
    } else if (req.body.onlyActive) {
      result = await fndb.getActiveBranchItems(tables.Users, req.body.branchId);
    } else {
      result = await fndb.getAllBranchItems(tables.Users, req.body.branchId);
    }

    if (result) {
      for (var i = 0; i < result.length; i++) {
        result[i].UserPassword = "";
      }
    }
    resp.result = result;
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("User Service - getUsers", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}

async function deleteUser(req, res) {
  var resp = new Object();
  try {
    var result = await fndb.deleteItem(tables.Users, req.params.id);
    resp.result = result;
    resp.success = true;
    resp.message = "Save data";
  } catch (err) {
    fnCommon.logErrorMsg("User Service - deleteUser", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in delete information";
  }
  return res.send(resp);
}

async function getCustomerDetByRefId(usr) {
  var userDet = new Object();
  let result;
  switch (usr.UserRoleId) {
    case 1:
    case 2:
      userDet.fullName = usr.userName + " (Administrator)";
      userDet.routeNo = 0;
      break;
    case 3:
      result = await fndb.getItemById(tables.Driver, usr.RefId);
      if (result) {
        userDet.fullName = result.fullName;
        userDet.routeNo = 1;
      }
      break;
    case 4:
      result = await fndb.getItemById(tables.Student, usr.RefId);
      if (result) {
        userDet.fullName = result.fullName;
        userDet.routeNo = result.routeNo;
      }
      break;
    default:
      userDet.fullName = usr.userName;
  }
  return userDet;
}
