const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
var CryptoJS = require("crypto-js");
const authenticateToken = require("../helpers/authtoken");
const tables = require("../helpers/tableNames.js");
const tablecols = require("../helpers/tableColumns.js");
const fnCommon = require("../helpers/commonFunctions.js");
const fndb = require("../helpers/dbFunctions.js");
const cacheService = require("./cacheservice");
const apiConfig = require("../config/config.json");

router.post("/registerUser", registerUser);
router.post("/authenticate", authenticate);
router.post("/authenticateOTP", authenticateOTP);
router.post("/getUsers", [authenticateToken.validJWTNeeded, getUsers]);
router.put("/updateUser/:id", [authenticateToken.validJWTNeeded, updateUser]);
router.delete("/deleteUser/:id", [authenticateToken.validJWTNeeded, deleteUser]);

router.put("/userChangePassword/:id", [authenticateToken.validJWTNeeded, userChangePassword]);
router.put("/userResetPassword/:id", [userResetPassword]);

module.exports = router;

async function registerUser(req, res) {
  var resp = new Object();
  try {
    let newUser = req.body;
    var chkUser = await cacheService.getItemByColumnCache(tables.Users,"UserName",newUser.userName);
    if (chkUser && chkUser.length > 0) {
      resp.result = null;
      resp.success = false;
      resp.message = "Error: User already registered";
      return res.send(resp);
    }
    newUser.userPassword = CryptoJS.AES.encrypt(newUser.UserPassword.toString(),apiConfig.userpwdsecret).toString();
    await cacheService.clearTableCache(tables.Users);
    var result = await cacheService.addNewItemCache(tables.Users,newUser);
    resp.result = result;
    resp.success = true;
    resp.message = "Save data";
  } catch (err) {
    fnCommon.logErrorMsg("User Service - registerUser", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in saving information";
  }
  return res.send(resp);
}

async function authenticate(req, res) {
  var resp = new Object();
  try {
    let result = await cacheService.getItemByColumnCache(tables.Users,"userName", req.body.userName);
    if (result && result.length > 0 && result[0].isActive == 1) {
      let usr = result[0];
      var bytes = CryptoJS.AES.decrypt(usr.userPassword.toString(), apiConfig.userpwdsecret);
      var originalPwd = bytes.toString(CryptoJS.enc.Utf8);
      if (req.body.userPassword === originalPwd) {
        delete usr.userPassword;
        delete usr.mobileOTP;
        delete usr.lastLogin;
        delete usr.isActive;

        let udet = await getUserDetByRefId(usr);
        if(udet && udet.fullName) {
          usr.fullName = udet.fullName;
          usr.routeNo = udet.routeNo;
        } else {
          usr.fullName = usr.UserName;
          usr.routeNo = '';
        }

        const token = jwt.sign({ sub: usr.id }, apiConfig.jwtSecret);
        await updateLastLogin(usr.id);
        usr.token = token;
        resp.result = usr;
        resp.success = true;
        resp.message = "user authenticated";
      } else {
        resp.result = null;
        resp.success = false;
        resp.message = "Error: Invalid User Name or Password";
      }
    } else {
      resp.result = null;
      resp.success = false;
      resp.message = "Error: Invalid User Name or Password";
    }
  } catch (err) {
    fnCommon.logErrorMsg("User Service - authenticate", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error in User Login";
  }
  return res.send(resp);
}

async function authenticateOTP(req, res) {
  var resp = new Object();
  try {
    var isStudent = req.body.isStudent;
    let result = await fndb.getItemByColumn(tables.Users,"mobile_no","" + req.body.Mobile, true);
    
    if (result.length > 0) {
      let usr = result[0];
      if (parseInt(req.body.passwordOTP) == parseInt(usr.mobileOTP)) {
        delete usr.userPassword;
        delete usr.mobileOTP;
        delete usr.lastLogin;
        delete usr.isActive;

        let udet = await getUserDetByRefId(usr);
        if(udet && udet.FullName) {
          usr.fullName = udet.fullName;
          usr.routeNo = udet.routeNo;
        } else {
          usr.fullName = usr.UserName;
          usr.routeNo = '';
        }

        const token = jwt.sign({ sub: usr.id }, apiConfig.jwtSecret);
        await updateLastLogin(usr.id);
        usr.token = token;
        resp.result = usr;
        resp.success = true;
        resp.message = "user authenticated";
      } else {
        resp.result = null;
        resp.success = false;
        resp.message = "Error: Invalid OTP";
      }
    } else {
      resp.result = null;
      resp.success = false;
      resp.message = "Error: Invalid Mobile number";
    }
  } catch (err) {
    fnCommon.logErrorMsg("User Service - authenticateOTP", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: User Login";
  }
  return res.send(resp);
}

async function getUsers(req, res) {
  var resp = new Object();
  try {
    var result;
    if(req.body.id) {
      result = await cacheService.getByIdItemCache(tables.Users, req.body.id);
    } else if (req.body.onlyActive) {
      result = await cacheService.getActiveBranchItemsCache(tables.Users, req.body.branchId);
    } else {
      result = await cacheService.getAllBranchItemsCache(tables.Users, req.body.branchId);
    }

    if (result) {
      for(var i=0;i<result.length;i++){
        result[i].UserPassword ="";
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

async function updateUser(req, res) {
  var resp = new Object();
  try {
    let newUser = req.body;
    delete newUser.UserPassword;
    await cacheService.clearTableCache(tables.Users);
    resp.result = await cacheService.updateItemCache(tables.Users,req.params.id,newUser);
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

async function userChangePassword(req, res) {
  var resp = new Object();
  try {
    const keyCol = tablecols.getKeyColumn(tables.Users);
    const cols = tablecols.getColumns(tables.Users);
    const usr = await cacheService.getByIdItemCache(tables.Users,req.params.id);

    var bytes = CryptoJS.AES.decrypt(usr.UserPassword, apiConfig.userpwdsecret);
    var originalPwd = bytes.toString(CryptoJS.enc.Utf8);
    if (originalPwd === req.body.CurrentPassword) {
      let newPwd = CryptoJS.AES.encrypt(req.body.UserPassword.toString(),apiConfig.userpwdsecret).toString();
      let queryText = "UPDATE `" + tables.Users + "` SET `" + cols.UserPassword + "`='" + newPwd + "' WHERE `" + keyCol + "` = " + req.params.id;
      var result = await fndb.customQuery(null, queryText);
      await cacheService.clearTableCache(tables.Users);
      resp.result = result;
      resp.success = true;
      resp.message = "Paassword Changed";
    } else {
      resp.result = null;
      resp.success = false;
      resp.message = "Current password does not match";
    }
  } catch (err) {
    resp.result = null;
    resp.success = false;
    resp.message = "Error in Change password.";
  }
  return res.send(resp);
}

async function deleteUser(req, res) {
  var resp = new Object();
  try {
    await cacheService.clearTableCache(tables.Users);
    var result = await cacheService.deleteItemCache(tables.Users, req.params.id);
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

async function getUserDetByRefId(usr) {
  var userDet = new Object();
  let result;
  switch (usr.UserRoleId) {
        case 1:
          userDet.fullName = usr.userName + " (Administrator)";
          userDet.routeNo = 0;
          break;
        case 2:
          result = await cacheService.getByIdItemCache(tables.Driver, usr.RefId);
          if (result) {
            userDet.fullName = result.fullName;
            userDet.routeNo = 1;
          }
          break;
        case 3:
            result = await cacheService.getByIdItemCache(tables.Student, usr.RefId);
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

async function updateLastLogin(id) {
  try {
    const curDate = new Date();
    const cols = tablecols.getColumns(tables.Users);
    const keyCol = tablecols.getKeyColumn(tables.Users);
    let queryText =
      "UPDATE `" +
      tables.Users +
      "` SET `" +
      cols.lastLogin +
      "` = '" +
      curDate.toISOString() +
      "' WHERE `" +
      keyCol +
      "` = " +
      id;
    fndb.customQuery(null, queryText);
    await cacheService.clearTableCache(tables.Users);
  } catch (err) {
    fnCommon.logErrorMsg("User Service - updateLastLogin", null, err.message);
  }
}

async function userResetPassword(req, res) {
  var resp = new Object();
  try {
    const keyCol = tablecols.getKeyColumn(tables.Users);
    const cols = tablecols.getColumns(tables.Users);
    const usr = await cacheService.getByIdItemCache(
      tables.Users,
      req.params.id
    );

    let newPwd = CryptoJS.AES.encrypt(
      req.body.userPassword.toString(),
      apiConfig.userpwdsecret
    ).toString();

    let queryText =
      "UPDATE `" +
      tables.Users +
      "` SET `" +
      cols.userPassword +
      "`='" +
      newPwd +
      "' WHERE `" +
      keyCol +
      "` = " +
      req.params.id;
    var result = await fndb.customQuery(null, queryText);
    await cacheService.clearTableCache(tables.Users);
    resp.result = result;
    resp.success = true;
    resp.message = "Paassword Changed";
  } catch (err) {
    resp.result = null;
    resp.success = false;
    resp.message = "Error in Change password.";
  }
  return res.send(resp);
}
