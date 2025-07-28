const express = require("express");
const router = express.Router();
const authenticateToken = require("../../helpers/dashboard/authtoken");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");

router.post("/logInfoMsg", [authenticateToken.validJWTNeeded, logInfoMsg]);

module.exports = router;

async function logInfoMsg(req, res) {
  fnCommon.logInfoMsg(req.body.msg);
  return res.send(true);
}
