const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
var CryptoJS = require("crypto-js");
const authenticateToken = require("../helpers/authtoken.js");
const tables = require("../helpers/tableNames.js");
const tablecols = require("../helpers/tableColumns.js");
const fnCommon = require("../helpers/commonFunctions.js");
const fndb = require("../helpers/dbFunctions.js");
const apiConfig = require("../config/config.json");
const tableNames = require("../helpers/tableNames.js");

router.post("/registerDeliveryPartner", registerDeliveryPartner);
// router.post("/getDeliveryPersons", [authenticateToken.validJWTNeeded, getDeliveryPersons]);
// router.get("/getCustomerById", [
//   authenticateToken.validJWTNeeded,
//   getCustomerDetByRefId,
// ]);

module.exports = router;

async function registerDeliveryPartner(req, res) {
  var resp = new Object();
  try {
    var deliveryPartnerData = new Object();
    var isExist = await fndb.getItemByColumn(
      tableNames.delivery_partner,
      tablecols.DeliveryPartnerCols.number,
      req.body.number
    );
    if (isExist.length > 0) {
      deliveryPartnerData = isExist[0];
    } else {
      var _result = await fndb.addNewItem(tableNames.delivery_partner, req.body);
      deliveryPartnerData.id = _result;
      deliveryPartnerData.number = req.body.number;
    }
    if (deliveryPartnerData) {
      const token = jwt.sign({ sub: deliveryPartnerData.id }, apiConfig.jwtSecret);
      if(req.body.fcm_token && isExist.length > 0) {
        deliveryPartnerData.fcm_token = req.body.fcm_token;
        await fndb.updateItem(
          tables.delivery_partner,
          deliveryPartnerData.id,
          { fcm_token: deliveryPartnerData.fcm_token }
        );
      }
      resp.success = true;
      resp.token = token;
      resp.data = deliveryPartnerData;
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

async function getDeliveryPersons(req, res) {
  var resp = new Object();
  try {
    var result;
    if (req.body.id) {
      result = await fndb.getItemById(tables.delivery_partner, req.body.id);
    } else if (req.body.onlyActive) {
      result = await fndb.getActiveBranchItems(tables.delivery_partner, req.body.branchId);
    } else {
      result = await fndb.getAllBranchItems(tables.delivery_partner, req.body.branchId);
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
