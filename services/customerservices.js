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
router.get("/getCustomerById", [
  authenticateToken.validJWTNeeded,
  getCustomerDetByRefId,
]);

module.exports = router;

async function registerCustomer(req, res) {
  var resp = new Object();
  fnCommon.logErrorMsg("Customer Service - RegisterCustomer", req, req.body);
  try {
    var customerData = new Object();
    var isExist = await fndb.getItemByColumn(
      tableNames.customers,
      tablecols.CustomerCols.number,
      req.body.number
    );
    if (isExist.length > 0) {
      customerData = isExist[0];
    } else {
      var _result = await fndb.addNewItem(tableNames.customers, req.body);
      customerData.id = _result;
      customerData.number = req.body.number;
    }
    if (customerData) {
      const token = jwt.sign({ sub: customerData.id }, apiConfig.jwtSecret);
      var customerGstsData = await fndb.getAllItemsByID(
        tables.customer_gsts,
        tablecols.CustomerGstCols.customer_id,
        customerData.id
      );
      if(req.body.fcm_token) {
        customerData.fcm_token = req.body.fcm_token;
        await fndb.updateItem(
          tables.customers,
          customerData.id,
          { fcm_token: customerData.fcm_token }
        );
      }
      customerData.is_added_gst = customerGstsData.length > 0;
      resp.success = true;
      resp.token = token;
      resp.data = customerData;
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
      result = await fndb.getItemById(tables.users, req.body.id);
    } else if (req.body.onlyActive) {
      result = await fndb.getActiveBranchItems(tables.users, req.body.branchId);
    } else {
      result = await fndb.getAllBranchItems(tables.users, req.body.branchId);
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

async function getCustomerDetByRefId(req, resp) {
  var userDet = new Object();
  let result = await fndb.getItemById(tableNames.customers, req.query.id);
  console.log(result);
  userDet = result;
  return resp.send(userDet);
}
