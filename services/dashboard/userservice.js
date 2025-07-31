const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");

const authenticateToken = require("../../helpers/dashboard/authtoken");
const tables = require("../../helpers/dashboard/tableNames.js");
const tablecols = require("../../helpers/dashboard/tableColumns.js");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const apiConfig = require("../../config/config.json");
const { pool } = require("../../helpers/dashboard/mySQLConnector.js");
const { UserCols } = require("../../helpers/tableColumns.js");

const usrCols = tablecols.getColumns(tables.users);

router.post("/registerUser", registerUser);
router.post("/authenticate", authenticate);
router.post("/save-fcm-token", saveFcmToken);
router.get("/getUsers", authenticateToken.validJWTNeeded, getUsers);
router.put("/updateUser/:id", authenticateToken.validJWTNeeded, updateUser);
router.delete("/deleteUser/:id", authenticateToken.validJWTNeeded, deleteUser);
router.put("/userChangePassword/:id", authenticateToken.validJWTNeeded, userChangePassword);
router.put("/userResetPassword/:id", userResetPassword);
router.post("/addUser", authenticateToken.validJWTNeeded, addUser);

module.exports = router;


async function registerUser(req, res) {
  var resp = {};
  try {
    let newUser = req.body;

    const usrCols = tablecols.getColumns(tables.users);
    
    const existingUser = await fndb.getItemByColumn(
      tables.users,
      usrCols.name,
      newUser.UserName
    );
    if (existingUser && existingUser.length > 0) {
      return res.send({
        success: false,
        message: "User already registered",
        result: null,
      });
    }

    if (!newUser.email || newUser.email.trim() === "") {
      newUser.email = `${newUser.UserName}@example.com`;
    }

    newUser[usrCols.password] = CryptoJS.AES.encrypt(
      newUser.UserPassword.toString(),
      apiConfig.userpwdsecret
    ).toString();

    delete newUser.UserPassword;

    const userToSave = {
      [usrCols.name]: newUser.UserName,
      [usrCols.password]: newUser[usrCols.password],
      [usrCols.email]: newUser.email,
    };

    const result = await fndb.addNewItem(tables.users, userToSave);

    resp = {
      success: true,
      message: "User registered",
      result: result,
    };
  } catch (err) {
    await fnCommon.logErrorMsg("User Service - registerUser", req, err.message);
    resp = {
      success: false,
      message: "Error: Error in saving information",
      result: null,
    };
  }

  return res.send(resp);
}

async function authenticate(req, res) {
  let resp = {};
  try {
    const credentials = req.body;
    const usrCols = tablecols.getColumns(tables.users);

    const user = await fndb.getItemByColumn(
      tables.users,
      UserCols.email,
      credentials.UserName
    );

    if (!user || user.length === 0) {
      resp.success = false;
      resp.message = "User not found";
      return res.send(resp);
    }

    const userData = user[0];

    const password = userData?.password;


    if (!password) {
      resp.success = false;
      resp.message = "Password not found";
      return res.send(resp);
    }

    if (password !== credentials.UserPassword) {
      resp.success = false;
      resp.message = "Invalid password";
      return res.send(resp);
    }

    const token = jwt.sign(
      {
        id: userData[usrCols.id],
        name: userData[usrCols.name],
        email: userData[usrCols.email],
      },
      apiConfig.jwtSecret,
      {
        expiresIn: "2d",
      }
    );

    resp.success = true;
    resp.message = "Authenticated successfully";
    resp.token = token;
    resp.user = {
      id: userData[usrCols.id],
      name: userData[usrCols.name],
      email: userData[usrCols.email],
      role: userData[usrCols.role] || "User",
    };

    return res.send(resp);
  } catch (err) {
    await fnCommon.logErrorMsg("authenticate", req, err.message);
    resp.success = false;
    resp.message = "Error during authentication";
    return res.send(resp);
  }
}

async function updateUserFcmToken(userId, token) {
  const tableName = "users";
  const queryText = `UPDATE ${tableName} SET fcm_token = ? WHERE id = ?`;
  const queryParams = [token, userId];

  try {
    const result = await fndb.customQuery(tableName, queryText, queryParams);
    return result;
  } catch (err) {
    await fnCommon.logErrorMsg("updateUserFcmToken", null, err.message);
    return null;
  }
}

async function saveFcmToken(req, res) {
 const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ message: "userId and token are required" });
  }

  try {
    const result = await updateUserFcmToken(userId, token);

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or not updated" });
    }

    return res.status(200).json({ message: "FCM token updated" });
  } catch (err) {
    console.error("Error updating FCM token:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getUsers(req, res) {
  try {
    const users = await fndb.getAllItems(tables.users);
    return res.send({ success: true, users });
  } catch (err) {
    fnCommon.logErrorMsg("getUsers", req, err.message);
    return res.status(500).send({ success: false, message: "Failed to get users" });
  }
}

async function updateUser(req, res) {
  try {
    const result = await fndb.updateItem(tables.users, req.params.id, req.body);
    return res.send({
      success: result,
      message: result ? "User updated" : "Update failed",
    });
  } catch (err) {
    fnCommon.logErrorMsg("updateUser", req, err.message);
    return res.status(500).send({ success: false, message: "Update error" });
  }
}

async function deleteUser(req, res) {
  try {
    const result = await fndb.deleteItem(tables.users, req.params.id);
    if (result && result.affectedRows > 0) {
      return res.send({ success: true, message: "User deleted" });
    } else {
      return res.status(400).send({ success: false, message: "User not found or already deleted" });
    }
  } catch (err) {
    fnCommon.logErrorMsg("deleteUser", req, err.message);
    return res.status(500).send({ success: false, message: "Delete failed" });
  }
}

async function userChangePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await fndb.getItemById(tables.users, req.params.id);

    if (!user || !user.password_hash) {
      return res.status(400).send({ success: false, message: "User or password not found" });
    }


    console.log("Entered currentPassword:", currentPassword);

    if (user.password_hash !== currentPassword) {
      return res.send({ success: false, message: "Current password is incorrect" });
    }

    const result = await fndb.updateItem(tables.users, req.params.id, {
      password_hash: newPassword,
    });

    return res.send({
      success: result,
      message: result ? "Password updated" : "Update failed",
    });
  } catch (err) {
    fnCommon.logErrorMsg("userChangePassword", req, err.message);
    return res.status(500).send({ success: false, message: "Password change failed" });
  }
}


async function userResetPassword(req, res) {
  try {
    const { newPassword } = req.body;

    const result = await fndb.updateItem(tables.users, req.params.id, {
      [usrCols.password]: newPassword,
    });

    return res.send({ success: result, message: result ? "Password reset" : "Reset failed" });
  } catch (err) {
    fnCommon.logErrorMsg("userResetPassword", req, err.message);
    return res.status(500).send({ success: false, message: "Reset error" });
  }
}

async function addUser(req, res) {
  try {
    const { name, email, password, role } = req.body;
    // const encryptedPwd = CryptoJS.AES.encrypt(password, apiConfig.userpwdsecret).toString();
    
    const userObj = {
      name,
      email,
      password_hash: password,
      role,
      created_at: new Date()
    };

    const result = await fndb.addNewItem(tables.users, userObj);
    console.log(result)

    return res.send({ success: true, message: "User added", result });
  } catch (err) {
    fnCommon.logErrorMsg("addUser", req, err.message);
    return res.status(500).send({ success: false, message: "User creation failed" });
  }
}
