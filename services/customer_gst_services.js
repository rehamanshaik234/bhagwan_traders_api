const express = require("express");
const tableNames = require("../helpers/tableNames");
const router = express.Router();
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken");

router.post("/addGst", [authenticateToken.validJWTNeeded, addGst]);

async function addGst(req, res) {
  var resp = new Object();
  try {
    var body = req.body;
    const result = await fndb.addNewItem(tableNames.customer_gsts, body);
    if (result != null) {
      resp = {
        status: true,
        message: `GST Added Successfully`,
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
