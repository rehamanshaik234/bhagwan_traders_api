const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
var CryptoJS = require("crypto-js");
const authenticateToken = require("../../helpers/dashboard/authtoken");
const tables = require("../../helpers/dashboard/tableNames.js");
const tablecols = require("../../helpers/dashboard/tableColumns.js");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const apiConfig = require("../../config/config.json");
const tableNames = require("../../helpers/dashboard/tableNames.js");

router.post("/registerCustomer", registerCustomer);
router.post("/getCustomers", [authenticateToken.validJWTNeeded, getCustomers]);
router.get("/getCustomerById", [authenticateToken.validJWTNeeded, getCustomerDetByRefId]);

router.get("/new", [authenticateToken.validJWTNeeded, getNewCustomers]);
router.get("/stats/daily", [authenticateToken.validJWTNeeded, getDailyCustomerStats]);
router.get("/stats/monthly", [authenticateToken.validJWTNeeded, getMonthlyCustomerStats]);
router.get("/stats/export", [authenticateToken.validJWTNeeded, exportCustomerStats]);

module.exports = router;

/**
 * @get /new
 * @query --> http://localhost:3000/materialmartapi/customers/new
 * @query --> http://localhost:3000/materialmartapi/customers/new?page=1&limit=5
 * @query --> http://localhost:3000/materialmartapi/customers/new?page=1&limit=5&days=7
 * @query --> http://localhost:3000/materialmartapi/customers/new?page=1&limit=5&days=7&name=akshay
 * @query --> http://localhost:3000/materialmartapi/customers/new?page=1&limit=5&days=7&name=akshay&email=akshay@gmail.com
 * @query --> http://localhost:3000/materialmartapi/customers/new?page=1&limit=5&days=7&name=akshay&email=akshay@gmail.com&number=8793112954
 * @query --> http://localhost:3000/materialmartapi/customers/new?name=akshay&email=@gmail.com&page=1&limit=5&from=2025-06-01&to=2025-06-30
 * 
 * 
 * @get /stats/daily
 * @query --> http://localhost:3000/materialmartapi/customers/stats/daily
 * @query --> http://localhost:3000/materialmartapi/customers/stats/daily?days=30
 * 
 * 
 * @get /stats/monthly
 * @query --> http://localhost:3000/materialmartapi/customers/stats/monthly
 * 
 * @get /stats/export (Export Customer Stats (CSV))
 * @query --> http://localhost:3000/materialmartapi/customers/stats/export
 */

async function registerCustomer(req, res) {
  var resp = new Object();
  try {
    var result = new Object();
    var isExist = await fndb.getItemByColumn(
      tableNames.customers,
      tablecols.CustomerCols.number,
      req.body.number
    );
    if (isExist.length > 0) {
      result = isExist[0];
    } else {
      var _result = await fndb.addNewItem(tableNames.customers, req.body);
      result.id = _result;
      result.number = req.body.number;
    }
    if (result) {
      const token = jwt.sign({ sub: result }, apiConfig.jwtSecret);
      resp.success = true;
      resp.token = token;
      resp.customer = result;
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
      result = await fndb.getItemById(tables.Users, req.body.id);
    } else if (req.body.onlyActive) {
      result = await fndb.getActiveBranchItems(tables.Users, req.body.branchId);
    } else {
      result = await fndb.getAllBranchItems(tables.Users, req.body.branchId);
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

async function getNewCustomers(req, res) {
  try {
    const {
      from,
      to,
      page = 1,
      limit = 10,
      name = "",
      email = "",
      number = "",
    } = req.query;

    const offset = (page - 1) * limit;
    let filters = `WHERE 1=1`;

    if (from) filters += ` AND created_at >= '${from}'`;
    if (to) filters += ` AND created_at <= '${to}'`;
    if (name) filters += ` AND name LIKE '%${name}%'`;
    if (email) filters += ` AND email LIKE '%${email}%'`;
    if (number) filters += ` AND number LIKE '%${number}%'`;

    const countQuery = `SELECT COUNT(*) as total FROM ${tables.customers} ${filters}`;
    const dataQuery = `SELECT * FROM ${tables.customers} ${filters} ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const totalResult = await fndb.customQuery(tables.customers, countQuery);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    const data = await fndb.customQuery(tables.customers, dataQuery);

    res.send({
      success: true,
      message: "Filtered & paginated customer list",
      data,
      pagination: { page: parseInt(page), limit: parseInt(limit), totalPages, total },
    });
  } catch (err) {
    fnCommon.logErrorMsg("getNewCustomers", req, err.message);
    res.status(500).send({ success: false, message: "Error fetching new customers" });
  }
}


async function getDailyCustomerStats(req, res) {
  try {
    const days = req.query.days || 30;
    const query = `
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS total_customers
      FROM ${tables.customers}
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${parseInt(days)} DAY)
      GROUP BY date
      ORDER BY date ASC
    `;
    const data = await fndb.customQuery(tables.customers, query);
    res.send({ success: true, data });
  } catch (err) {
    fnCommon.logErrorMsg("getDailyCustomerStats", req, err.message);
    res.status(500).send({ success: false });
  }
}


async function getMonthlyCustomerStats(req, res) {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS total_customers
      FROM ${tables.customers}
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12
    `;
    const data = await fndb.customQuery(tables.customers, query);
    res.send({ success: true, data });
  } catch (err) {
    fnCommon.logErrorMsg("getMonthlyCustomerStats", req, err.message);
    res.status(500).send({ success: false });
  }
}


async function exportCustomerStats(req, res) {
  try {
    const query = `SELECT id, name, email, number, created_at FROM ${tables.customers} ORDER BY created_at DESC`;
    const data = await fndb.customQuery(tables.customers, query);
    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("customer_stats.csv");
    return res.send(csv);
  } catch (err) {
    fnCommon.logErrorMsg("exportCustomerStats", req, err.message);
    res.status(500).send({ success: false });
  }
}
