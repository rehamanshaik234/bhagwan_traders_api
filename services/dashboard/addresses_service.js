const express = require("express");
const { getOtpNumber } = require("../../helpers/dashboard/commonFunctions");
const tableNames = require("../../helpers/dashboard/tableNames.js");
const router = express.Router();
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const { AddressCols } = require("../../helpers/dashboard/tableColumns.js");

router.post("/addAddress", addAddress);

async function addAddress(req, res) {
  var resp = new Object();
  try {
    var body = req.body;
    const result = await fndb.customQuery(tableNames.addresses, body);
    if (result != null) {
      const addresses = await fndb.getAllItemsByID(
        tableNames.addresses,
        AddressCols.customerId,
        body.customer_id
      );
      resp = {
        status: true,
        message: `Successfully sent OTP to ${message.to}`,
        data: addAddress,
      };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

module.exports = router;
