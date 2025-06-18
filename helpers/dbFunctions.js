const tables = require("./tableNames.js");
const tablecols = require("./tableColumns.js");
const fnCommon = require("./commonFunctions");
const mysql = require("./mySQLConnector.js");
const e = require("express");

module.exports = {
  getItemById,
  getItemByColumn,
  getAllItems,
  addNewItem,
  updateItem,
  deleteItem,
  customQuery,
  addOrUpdateItem,
};

async function transformColumns(tableName, result) {
  const cols = tablecols.getColumns(tableName);
  var colKeys = Object.keys(cols);
  var colVals = Object.values(cols);
  var newResult = [];

  for (let i = 0; i < result.length; i++) {
    const row = JSON.stringify(result[i]);
    var item = {};

    JSON.parse(row, function (k, v) {
      let idx = colVals.indexOf(k);
      if (idx >= 0) {
        item[colKeys[idx]] = v;
      } else if (k.length > 0) {
        item[k] = v;
      }
    });

    if (Object.keys(item).length > 0) {
      newResult.push(item);
    }
  }

  return newResult;
}

async function sqlTransaction(queryText, dataVlues) {
  const connection = await mysql.connection();
  try {
    await connection.query("START TRANSACTION");
    var result = await connection.query(queryText, dataVlues);
    await connection.query("COMMIT");
    return result;
  } catch (err) {
    await connection.query("ROLLBACK");
    fnCommon.logErrorMsg("dbFunctions - sqlTransaction", null, err.message);
    throw err;
  } finally {
    await connection.release();
  }
}

async function getItemById(tableName, dataId) {
  try {
    const keyCol = tablecols.getKeyColumn(tableName);
    const queryText =
      "SELECT * FROM " + tableName + " WHERE " + keyCol + " = " + dataId;
    const result = await sqlTransaction(queryText, "");
    var resultArray = await transformColumns(tableName, result);
    return resultArray.length > 0 ? resultArray[0] : null;
  } catch (err) {
    fnCommon.logErrorMsg("dbFunctions - getAllItems", null, err.message);
    return null;
  }
}

async function getItemByColumn(tableName, colName, colValue, isNumber = false) {
  const keyCol = tablecols.getKeyColumn(tableName);
  let queryText = "SELECT * FROM " + tableName + " WHERE " + colName + " = ";
  if (isNumber) {
    queryText += colValue;
  } else {
    queryText += "'" + colValue + "'";
  }
  try {
    const result = await sqlTransaction(queryText, "");
    var resultArray = await transformColumns(tableName, result);
    return resultArray;
  } catch (err) {
    fnCommon.logErrorMsg(
      "dbFunctions - getItemByColumn",
      queryText,
      err.message
    );
    return null;
  }
}

async function getAllItems(tableName) {
  try {
    const queryText = "SELECT * FROM " + tableName;
    const result = await sqlTransaction(queryText, "");
    var resultArray = await transformColumns(tableName, result);
    return resultArray;
  } catch (err) {
    fnCommon.logErrorMsg("dbFunctions - getAllItems", null, err.message);
    return null;
  }
}

async function addNewItem(tableName, data) {
  try {
    const cols = tablecols.getColumns(tableName);
    var dataVal = {};
    var colKeys = Object.keys(cols);
    var colVals = Object.values(cols);
    for (i = 0; i < colKeys.length; i++) {
      var k = colKeys[i];
      dataVal[colVals[i]] = data[k];
    }
    const queryText = "INSERT INTO " + tableName + " SET ?";
    var result = await sqlTransaction(queryText, dataVal);
    return result.affectedRows > 0 ? result.insertId : 0;
  } catch (err) {
    fnCommon.logErrorMsg(
      "dbFunctions - addNewItem - table data",
      null,
      tableName + " - " + JSON.stringify(data)
    );
    fnCommon.logErrorMsg("dbFunctions - addNewItem", null, err.sqlMessage);
    return null;
  }
}

async function updateItem(tableName, dataId, data) {
  try {
    const cols = tablecols.getColumns(tableName);
    const keyCol = tablecols.getKeyColumn(tableName);
    var dataVal = {};
    var colKeys = Object.keys(cols);
    var colVals = Object.values(cols);
    for (i = 0; i < colKeys.length; i++) {
      var k = colKeys[i];
      if (data[k] != null) {
        dataVal[colVals[i]] = data[k];
      }
    }
    const columns = Object.keys(dataVal);
    const values = Object.values(dataVal);
    let queryText =
      "UPDATE " +
      tableName +
      " SET " +
      columns.join(" = ?, ") +
      " = ?  WHERE " +
      keyCol +
      " = " +
      dataId;
    const result = await sqlTransaction(queryText, values);
    if (result.affectedRows == 0) {
      fnCommon.logErrorMsg(
        "dbFunctions - updateItem - db result",
        null,
        result
      );
    }
    return result.affectedRows > 0 ? true : false;
  } catch (err) {
    fnCommon.logErrorMsg("dbFunctions - updateItem", null, err.message);
    return null;
  }
}

async function addOrUpdateItem(tableName, dataId, data) {
  try {
    const keyCol = tablecols.getKeyColumn(tableName);

    // 1. Check if item exists
    const checkQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${keyCol} = ?`;
    const checkResult = await sqlTransaction(checkQuery, [dataId]);
    if (checkResult[0].count > 0) {
      // 2. Exists → Update
      return await updateItem(tableName, dataId, data);
    } else {
      // 3. Doesn't exist → Insert
      const cols = tablecols.getColumns(tableName);
      const colKeys = Object.keys(cols);
      const colVals = Object.values(cols);

      let insertCols = [];
      let insertVals = [];
      let placeholders = [];

      for (let i = 0; i < colKeys.length; i++) {
        let k = colKeys[i];
        if (data[k] != null) {
          insertCols.push(colVals[i]);
          insertVals.push(data[k]);
          placeholders.push("?");
        }
      }

      const insertQuery = `INSERT INTO ${tableName} (${insertCols.join(
        ", "
      )}) VALUES (${placeholders.join(", ")})`;
      const result = await sqlTransaction(insertQuery, insertVals);
      return result.affectedRows > 0 ? true : false;
    }
  } catch (err) {
    fnCommon.logErrorMsg("dbFunctions - addOrUpdateItem", null, err.message);
    return null;
  }
}

async function deleteItem(tableName, dataId) {
  try {
    const keyCol = tablecols.getKeyColumn(tableName);
    const queryText =
      "DELETE FROM " + tableName + " WHERE " + keyCol + " = " + dataId;
    const result = await sqlTransaction(queryText, "");
    return result;
  } catch (err) {
    fnCommon.logErrorMsg("dbFunctions - deleteItem", null, err.message);
    return null;
  }
}

async function customQuery(tableName, queryText) {
  try {
    const result = await sqlTransaction(queryText, "");
    var resultArray = await transformColumns(tableName, result);
    if (resultArray && resultArray.length > 0) {
      return resultArray;
    } else {
      return result;
    }
  } catch (err) {
    fnCommon.logErrorMsg("dbFunctions - customQuery", null, queryText);
    fnCommon.logErrorMsg("dbFunctions - customQuery", null, err.message);
    return null;
  }
}
