const twillio = require("twilio");
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twillio(accountSid, authToken);
const express = require("express");
const { getOtpNumber } = require("../helpers/commonFunctions");
const tableNames = require("../helpers/tableNames");
const router = express.Router();
const fndb = require("../helpers/dbFunctions.js");

router.post("/sendOTP", sendOTP);
router.post("/verifyOTP", verifyOTP);

async function sendOTP(req, res) {
  var resp = new Object();
  try {
    var _number = req.body.number;
    var otp = getOtpNumber();
    const message = await client.messages.create({
      to: _number,
      body: `Your Verification Code for Bhagwan Traders is ${otp}`,
      messagingServiceSid: process.env.TWILIO_SERVICE_ID,
    });
    var data = { number: _number, otp: otp };
    const result = await fndb.addOrUpdateItem(
      tableNames.numberOtps,
      _number,
      data
    );
    if (result != null) {
      resp = {
        status: true,
        message: `Successfully sent OTP to ${message.to}`,
      };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function verifyOTP(req, res) {
  var resp = new Object();
  try {
    var _number = req.body.number;
    var _otp = req.body.otp;
    const result = await fndb.getItemById(tableNames.numberOtps, _number);
    if (result != null) {
      console.log(result);
      if (result.otp == _otp) {
        resp = {
          status: true,
          message: `Successfully Verified`,
        };
      } else {
        resp = {
          status: false,
          message: `Invalid OTP`,
        };
      }
    } else {
      resp = { status: false, error: "Number Not Found" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

module.exports = router;
