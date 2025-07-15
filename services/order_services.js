const express = require("express");
const tableNames = require("../helpers/tableNames");
const router = express.Router();
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols, CustomerGstCols, OrderItemCols, OrderCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken");

router.post("/placeOrder", [authenticateToken.validJWTNeeded, placeOrder]);
router.post("/getCustomerGSTS", [authenticateToken.validJWTNeeded, getCustomerGSTS]);


async function placeOrder(req, res) {
  var resp = new Object();
  try {
    var body = req.body;
    const result = await fndb.addNewItem(tableNames.orders, body.order);
    if (result != null) {
        var orderItems = body.orderItems.map(item => {
          item.order_id = result; // Associate each item with the newly created order
          return item;
        });
        for (let item of orderItems) {
          await fndb.addNewItem(tableNames.orderItems, item);
        }
      resp = {
        status: true,
        message: `Order Placed Successfully`,
        data: {
          order_id: result,
          order_items: orderItems
        }};
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}


module.exports = router;
