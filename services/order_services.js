const express = require("express");
const tableNames = require("../helpers/tableNames");
const router = express.Router();
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols, CustomerGstCols, OrderItemCols, OrderCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken");

router.post("/placeOrder", [authenticateToken.validJWTNeeded, placeOrder]);
router.post("/allOrders", [authenticateToken.validJWTNeeded, allOrders]);



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

async function allOrders(req, res) {
  var resp = new Object();
  const { customer_id } = req.body;
  try {
    var result = await fndb.getAllItemsByID(tableNames.orders, OrderCols.customer_id, customer_id, true);
    if (result != null) {
      for (let order of result) {
        const orderItems= await fndb.customQuery(`SELECT order_items.id AS id, order_items.quantity, order_items.price,
              JSON_OBJECT( 'id', products.id, 'name', products.name, 'description', products.description, 'image_url',products.image_url, 'price',products.price, 'is_active',products.is_active, 'stock',products.stock, 'sub_category_id',products.sub_category_id ) AS product FROM order_items 
              LEFT JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?`,[order.id]);
              if (orderItems && orderItems.length > 0) {
                orderItems.forEach(item => {
                  item.product = JSON.parse(item.product);
                });
              } 
        order.order_items = orderItems;
      }
      resp = {
        status: true,
        message: `All Orders Retrieved Successfully`,
        data: result
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
