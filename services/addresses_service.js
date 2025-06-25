const express = require("express");
const { getOtpNumber } = require("../helpers/commonFunctions");
const tableNames = require("../helpers/tableNames");
const router = express.Router();
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken");

router.post("/addAddress", [authenticateToken.validJWTNeeded, addAddress]);
router.post("/updateAddress", [
  authenticateToken.validJWTNeeded,
  updateAddress,
]);
router.get("/allAddresses", [
  authenticateToken.validJWTNeeded,
  getAllAddresses,
]);
router.get("/addressById", [authenticateToken.validJWTNeeded, getAddresseById]);

async function addAddress(req, res) {
  var resp = new Object();
  try {
    var body = req.body;
    const result = await fndb.addNewItem(tableNames.addresses, body);
    console.log(result);
    if (result != null) {
      const addresses = await fndb.getAllItemsByID(
        tableNames.addresses,
        AddressCols.customer_id,
        body.customer_id
      );
      resp = {
        status: true,
        message: `Address Added Successfully`,
        data: addresses,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function updateAddress(req, res) {
  var resp = new Object();
  try {
    var body = req.body;
    const result = await fndb.updateItem(tableNames.addresses, body.id, body);
    console.log(result);
    if (result != null) {
      const addresses = await fndb.getItemById(tableNames.addresses, body.id);
      resp = {
        status: true,
        message: `Address Added Successfully`,
        data: addresses,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function getAllAddresses(req, res) {
  var resp = new Object();
  try {
    const result = await fndb.getItemByColumn(
      tableNames.addresses,
      AddressCols.customer_id,
      req.query.id,
      true
    );
    resp = {
      status: result.length > 0 ? true : false,
      data: result,
    };
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function getAddresseById(req, res) {
  var resp = new Object();
  try {
    const result = await fndb.getItemById(tableNames.addresses, req.query.id);
    resp = {
      status: result ? true : false,
      data: result,
    };
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

module.exports = router;
