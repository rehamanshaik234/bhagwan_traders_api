const express = require("express");
const tableNames = require("../helpers/tableNames");
const router = express.Router();
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols, CustomerGstCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken");
const { get } = require("http");

router.post("/addGst", [authenticateToken.validJWTNeeded, addGst]);
router.get("/getCustomerGSTS", [authenticateToken.validJWTNeeded, getCustomerGSTS]);
router.get("/getCustomerGST", [authenticateToken.validJWTNeeded, getCustomerGST]);


async function addGst(req, res) {
  var resp = new Object();
  try {
    var body = req.body;
    const result = await fndb.addNewItem(tableNames.customer_gsts, body);
    if (result != null) {
      const customerGsts = await fndb.getAllItemsByID(tableNames.customer_gsts, CustomerGstCols.customer_id, customer_id);
      resp = {
        status: true,
        message: `GST Added Successfully`,
        data: customerGsts,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function getCustomerGSTS(req, res) {
  var resp = new Object();
  try {
    var customer_id = req.query.customer_id;
    const result = await fndb.getAllItemsByID(tableNames.customer_gsts, CustomerGstCols.customer_id, customer_id);
    if (result != null) {
      resp = {
        status: true,
        message: `GST Retrieved Successfully`,
        data: result,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function getCustomerGST(req, res) {
  var resp = new Object();
  try {
    var gst_number = req.query.gst_number;
    const result = await fndb.getItemByColumn(tableNames.customer_gsts, CustomerGstCols.gst_number, gst_number);
    if (result != null) {
      resp = {
        status: true,
        message: `GST Retrieved Successfully`,
        data: result,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

module.exports = router;
