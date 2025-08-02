const express = require("express");
const tableNames = require("../helpers/tableNames");
const router = express.Router();
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols, CustomerGstCols, OrderItemCols, OrderCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken");

router.post("/placeOrder", [authenticateToken.validJWTNeeded, placeOrder]);
router.post("/allOrders", [authenticateToken.validJWTNeeded, allOrders]);
router.post("/ordersbyStatus", [authenticateToken.validJWTNeeded, ordersByStatus]);
router.post("/updateOrder", [authenticateToken.validJWTNeeded, updateOrder]);
router.post("/getPickedOrders", [authenticateToken.validJWTNeeded, getPickedOrders]);
router.post("/ordersHistory", [authenticateToken.validJWTNeeded, ordersHistory]);


//status: Preparing, Dispatched, Picked, OutForDelivery, Delivered, Cancelled, Returned
async function placeOrder(req, res) {
  var resp = new Object();
  try {
    var body = req.body;
    var productStocks= [];
    if(body.orderItems && body.orderItems.length > 0) {
      for (let item of body.orderItems) {
        const product = await fndb.getItemById(tableNames.products, item.product_id);
        if (product && product.stock < item.quantity) {
          resp = { status: false, error: `Insufficient stock for product ${product.name}`, product_id: item.product_id };
          return res.send(resp);
        }else{
          productStocks.push({ product_id: item.product_id, available_quantity: parseInt(`${product.stock}`), quantity: parseInt(`${item.quantity}`) });
        }
      }
    }
    const result = await fndb.addNewItem(tableNames.orders, body.order);
    if (result != null) {
        var orderItems = body.orderItems.map(item => {
          item.order_id = result; // Associate each item with the newly created order
          return item;
        });
        for (let item of orderItems) {
          await fndb.addNewItem(tableNames.orderItems, item);
        }
        // Update product stock after placing the order
        for (let stock of productStocks) {
          await fndb.updateItem(tableNames.products, stock.product_id, { stock: stock.available_quantity - stock.quantity });
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
    console.error("Error placing order:", error);
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

// Fetch all orders for a customer
// Optionally filter by status
async function allOrders(req, res) {
  var resp = new Object();
  const { customer_id, status} = req.body;
  try {
    var result = await fndb.getAllItemsByID(tableNames.orders, OrderCols.customer_id, customer_id, true,true);
    if (status) {
      result = result.filter(order => order.status === status);
    }
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

async function ordersByStatus(req, res) {
  var resp = new Object();
  const { status,customer_id,delivery_partner_id } = req.body;
  try {
  var result = await fndb.customQuery(`
    SELECT 
      orders.id,
      orders.customer_id,
      orders.delivery_partner_id,
      orders.address_id,
      orders.status,
      orders.total_amount,
      orders.created_at,
      orders.updated_at,
      orders.shipping_address,
      JSON_OBJECT('id', customers.id, 'name', customers.name, 'number', customers.number, 'fcm_token', customers.fcm_token) AS customer,
      JSON_OBJECT('id', delivery_partner.id, 'name', delivery_partner.name, 'number', delivery_partner.number, 'fcm_token', delivery_partner.fcm_token) AS delivery_partner,
      JSON_OBJECT('id', customer_gsts.id, 'gst_number', customer_gsts.gst_number, 'shop_name', customer_gsts.shop_name, 'gst_address', customer_gsts.gst_address) AS customer_gst,
      JSON_OBJECT('id', addresses.id, 'address_line', addresses.address_line, 'city', addresses.city, 'state', addresses.state, 'postal_code', addresses.postal_code, 'latitude', addresses.latitude, 'longitude', addresses.longitude, 'house_number', addresses.house_number, 'building_name', addresses.building_name) AS address
    FROM ${tableNames.orders}
    LEFT JOIN ${tableNames.customers} ON orders.customer_id = customers.id
    LEFT JOIN ${tableNames.delivery_partner} ON orders.delivery_partner_id = delivery_partner.id
    LEFT JOIN ${tableNames.addresses} ON orders.address_id = addresses.id
    LEFT JOIN ${tableNames.customer_gsts} ON orders.customer_gst_id = customer_gsts.id
    WHERE orders.status = ?
    ${customer_id ? `AND orders.customer_id = ?` : ''}
    ${delivery_partner_id ? `AND orders.delivery_partner_id = ?` : ''}
    ORDER BY orders.updated_at DESC`, 
    customer_id ? [status, customer_id] :
    delivery_partner_id ? [status, delivery_partner_id] : [status]);
    if (result != null) {
      result = result.map(order => {
        order.customer = JSON.parse(order.customer);
        order.delivery_partner = JSON.parse(order.delivery_partner);
        order.address = JSON.parse(order.address);
        order.customer_gst = JSON.parse(order.customer_gst);
        return order;
      });
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

async function ordersHistory(req, res) {
  var resp = new Object();
  const { status,customer_id,delivery_partner_id } = req.body;
  try {
  var result = await fndb.customQuery(`
    SELECT 
      orders.id,
      orders.customer_id,
      orders.delivery_partner_id,
      orders.address_id,
      orders.status,
      orders.total_amount,
      orders.created_at,
      orders.updated_at,
      orders.shipping_address,
      JSON_OBJECT('id', customers.id, 'name', customers.name, 'number', customers.number, 'fcm_token', customers.fcm_token) AS customer,
      JSON_OBJECT('id', delivery_partner.id, 'name', delivery_partner.name, 'number', delivery_partner.number, 'fcm_token', delivery_partner.fcm_token) AS delivery_partner,
      JSON_OBJECT('id', customer_gsts.id, 'gst_number', customer_gsts.gst_number, 'shop_name', customer_gsts.shop_name, 'gst_address', customer_gsts.gst_address) AS customer_gst,
      JSON_OBJECT('id', addresses.id, 'address_line', addresses.address_line, 'city', addresses.city, 'state', addresses.state, 'postal_code', addresses.postal_code, 'latitude', addresses.latitude, 'longitude', addresses.longitude, 'house_number', addresses.house_number, 'building_name', addresses.building_name) AS address
    FROM ${tableNames.orders}
    LEFT JOIN ${tableNames.customers} ON orders.customer_id = customers.id
    LEFT JOIN ${tableNames.delivery_partner} ON orders.delivery_partner_id = delivery_partner.id
    LEFT JOIN ${tableNames.addresses} ON orders.address_id = addresses.id
    LEFT JOIN ${tableNames.customer_gsts} ON orders.customer_gst_id = customer_gsts.id
    WHERE orders.status IN (${status.map((s) => `'${s}'`).join(', ')})
    ${customer_id ? `AND orders.customer_id = ?` : ''}
    ${delivery_partner_id ? `AND orders.delivery_partner_id = ?` : ''}
    ORDER BY orders.updated_at DESC`, 
    customer_id ? [customer_id] :
    delivery_partner_id ? [delivery_partner_id]:null);
    if (result != null) {
      result = result.map(order => {
        order.customer = JSON.parse(order.customer);
        order.delivery_partner = JSON.parse(order.delivery_partner);
        order.address = JSON.parse(order.address);
        order.customer_gst = JSON.parse(order.customer_gst);
        return order;
      });
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
    console.error("Error fetching order history:", error);
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function updateOrder(req, res) {
  var resp = new Object();
  try {
    const { order_id, status } = req.body;
    const data = req.body;
    delete data.order_id; 
    let updatedOrder = null;
    const result = await fndb.updateItem(tableNames.orders, order_id, data);
    if (result) {
      // Fetch the updated order with all related data
      updatedOrder = await fndb.customQuery(`
        SELECT 
          orders.id,
          orders.customer_id,
          orders.delivery_partner_id,
          orders.address_id,
          orders.status,
          orders.total_amount,
          orders.created_at,
          orders.updated_at,
          orders.shipping_address,
          JSON_OBJECT('id', customers.id, 'name', customers.name, 'number', customers.number, 'fcm_token', customers.fcm_token) AS customer,
          JSON_OBJECT('id', delivery_partner.id, 'name', delivery_partner.name, 'number', delivery_partner.number, 'fcm_token', delivery_partner.fcm_token) AS delivery_partner,
          JSON_OBJECT('id', customer_gsts.id, 'gst_number', customer_gsts.gst_number, 'shop_name', customer_gsts.shop_name, 'gst_address', customer_gsts.gst_address) AS customer_gst,
          JSON_OBJECT('id', addresses.id, 'address_line', addresses.address_line, 'city', addresses.city, 'state', addresses.state, 'postal_code', addresses.postal_code, 'latitude', addresses.latitude, 'longitude', addresses.longitude, 'house_number', addresses.house_number, 'building_name', addresses.building_name) AS address
        FROM ${tableNames.orders}
        LEFT JOIN ${tableNames.customers} ON orders.customer_id = customers.id
        LEFT JOIN ${tableNames.delivery_partner} ON orders.delivery_partner_id = delivery_partner.id
        LEFT JOIN ${tableNames.addresses} ON orders.address_id = addresses.id
        LEFT JOIN ${tableNames.customer_gsts} ON orders.customer_gst_id = customer_gsts.id
        WHERE orders.id = ?`, [order_id]);

      if (updatedOrder && updatedOrder.length > 0) {
        updatedOrder = updatedOrder[0]; // Get the first (and only) result
        
        // Parse JSON objects
        updatedOrder.customer = JSON.parse(updatedOrder.customer);
        updatedOrder.delivery_partner = JSON.parse(updatedOrder.delivery_partner);
        updatedOrder.address = JSON.parse(updatedOrder.address);
        updatedOrder.customer_gst = JSON.parse(updatedOrder.customer_gst);
        updatedOrder.status = status; // Update the status in the response
        // Get order items
        const orderItems = await fndb.customQuery(`SELECT order_items.id AS id, order_items.quantity, order_items.price,
              JSON_OBJECT( 'id', products.id, 'name', products.name, 'description', products.description, 'image_url',products.image_url, 'price',products.price, 'is_active',products.is_active, 'stock',products.stock, 'sub_category_id',products.sub_category_id ) AS product FROM order_items 
              LEFT JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?`, [order_id]);
        
        if (orderItems && orderItems.length > 0) {
          orderItems.forEach(item => {
            item.product = JSON.parse(item.product);
          });
        }
        
        updatedOrder.order_items = orderItems;
      }   
      
      resp = {
        status: true,
        message: `Order Updated Successfully`,
        data: updatedOrder
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}


async function getPickedOrders(req, res) {
  var resp = new Object();
  try {
    var result = await fndb.customQuery(`
      SELECT 
        orders.id,
        orders.customer_id,
        orders.delivery_partner_id,
        orders.address_id,
        orders.status,
        orders.total_amount,
        orders.created_at,
        orders.updated_at,
        orders.shipping_address,
        JSON_OBJECT('id', customers.id, 'name', customers.name, 'number', customers.number, 'fcm_token', customers.fcm_token) AS customer,
        JSON_OBJECT('id', delivery_partner.id, 'name', delivery_partner.name, 'number', delivery_partner.number, 'fcm_token', delivery_partner.fcm_token) AS delivery_partner,
        JSON_OBJECT('id', customer_gsts.id, 'gst_number', customer_gsts.gst_number, 'shop_name', customer_gsts.shop_name, 'gst_address', customer_gsts.gst_address) AS customer_gst,
        JSON_OBJECT('id', addresses.id, 'address_line', addresses.address_line, 'city', addresses.city, 'state', addresses.state, 'postal_code', addresses.postal_code, 'latitude', addresses.latitude, 'longitude', addresses.longitude, 'house_number', addresses.house_number, 'building_name', addresses.building_name) AS address
      FROM ${tableNames.orders}
      LEFT JOIN ${tableNames.customers} ON orders.customer_id = customers.id
      LEFT JOIN ${tableNames.delivery_partner} ON orders.delivery_partner_id = delivery_partner.id
      LEFT JOIN ${tableNames.addresses} ON orders.address_id = addresses.id
      LEFT JOIN ${tableNames.customer_gsts} ON orders.customer_gst_id = customer_gsts.id
      WHERE orders.status IN (?) AND delivery_partner.id = ?
      ORDER BY orders.created_at DESC`, [[...req.body.status, 'Picked'], req.body.deliveryPartnerId]);

    if (result && result.length > 0) {
      result.forEach(order => {
        order.customer = JSON.parse(order.customer);
        order.delivery_partner = JSON.parse(order.delivery_partner);
        order.address = JSON.parse(order.address);
        order.customer_gst = JSON.parse(order.customer_gst);
      });
    }
    resp.result = result;
    resp.success = true;
    resp.message = "All data";
  } catch (err) {
    fnCommon.logErrorMsg("Order Service - getPickedOrders", req, err.message);
    resp.result = null;
    resp.success = false;
    resp.message = "Error: Error in getting information";
  }
  return res.send(resp);
}


module.exports = router;
