const express = require("express");
const router = express.Router();
const authenticateToken = require("../../helpers/dashboard/authtoken");
const tables = require("../../helpers/dashboard/tableNames.js");
const tablecols = require("../../helpers/dashboard/tableColumns.js");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const apiConfig = require("../../config/config.json");
const { Parser } = require("json2csv");

const { orders } = tables;
const { OrderCols } = tablecols;


router.get("/nonPendingOrders", [authenticateToken.validJWTNeeded, getNonPendingOrders]);
router.get("/pendingOrder", [authenticateToken.validJWTNeeded, getPendingOrders]);
router.get("/dispatchedOrder", [authenticateToken.validJWTNeeded, getDispatchedOrders]);
router.get("/deliveredOrder", [authenticateToken.validJWTNeeded, getDeliveredOrders]);
router.patch("/updateOrderStatus", [authenticateToken.validJWTNeeded, updateOrderStatus]);

router.get("/summary", [authenticateToken.validJWTNeeded, getOrderSummary]);
router.get("/stats/daily", [authenticateToken.validJWTNeeded, getDailyOrderStats]);
router.get("/stats/monthly", [authenticateToken.validJWTNeeded, getMonthlyOrderStats]);
router.get("/export", [authenticateToken.validJWTNeeded, exportOrders]);

async function getPendingOrders(req, res) {
    try {
        const pendingOrders = await fndb.getItemByColumn(
      orders,
      OrderCols.status,
      "pending"
    );
    console.log("pendingorder", pendingOrders)
    return res.status(200).json({
      success: true,
      message: "Pending orders fetched successfully",
      data: pendingOrders,
    });
    } catch (error) {
       fnCommon.logErrorMsg("getPendingOrders", req, err);
        return res.status(500).json({
        success: false,
        message: "Failed to fetch pending orders",
        }); 
    }
}

async function getNonPendingOrders(req, res) {
  try {
    const query = `
      SELECT * FROM ${orders}
      WHERE ${OrderCols.status} != 'pending'
    `;
    const result = await fndb.customQuery(orders, query);

    return res.status(200).json({
      success: true,
      message: "Non-pending orders fetched successfully",
      data: result,
    });
  } catch (error) {
    fnCommon.logErrorMsg("getNonPendingOrders", req, error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch non-pending orders",
    });
  }
}


async function getDispatchedOrders(req, res) {
    try {
    const dispatchedOrders = await fndb.getItemByColumn(
      orders,
      OrderCols.status,
      "dispatched"
    );
    return res.status(200).json({
      success: true,
      message: "Dispatched orders fetched successfully",
      data: dispatchedOrders,
    });
    } catch (error) {
        fnCommon.logErrorMsg("getDispatchedOrders", req, err);
        return res.status(500).json({
        success: false,
        message: "Failed to fetch dispatched orders",
        });
    }
}

async function getDeliveredOrders(req, res) {
    try {
    const deliveredOrders = await fndb.getItemByColumn(
      orders,
      OrderCols.status,
      "delivered"
    );
    return res.status(200).json({
      success: true,
      message: "Delivered orders fetched successfully",
      data: deliveredOrders,
    });
    } catch (error) {
    fnCommon.logErrorMsg("getDeliveredOrders", req, err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivered orders",
    });
    }
}

async function updateOrderStatus(req, res) {
  const { orderId, newStatus } = req.body;

  if (!orderId || !newStatus) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: orderId or newStatus",
    });
  }

  try {
    const order = await fndb.getItemById(tables.orders, orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending orders can be updated. Current status: ${order.status}`,
      });
    }

    if (newStatus !== "Dispatched") {
      return res.status(400).json({
        success: false,
        message: `Invalid status update. Allowed transition: 'pending' → 'dispatched'`,
      });
    }

    // Update the order
    const updated = await fndb.updateItem(tables.orders, orderId, {
      [tablecols.OrderCols.status]: newStatus,
    });

    if (updated) {
      return res.status(200).json({
        success: true,
        message: `Order ${orderId} updated to '${newStatus}' successfully`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to update order status",
      });
    }
  } catch (err) {
    fnCommon.logErrorMsg("updateOrderStatus", req, err);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating order status",
    });
  }
}

async function getOrderSummary(req, res) {
  try {
    const [pending, dispatched, delivered] = await Promise.all([
      fndb.getItemByColumn(tables.orders, OrderCols.status, "pending"),
      fndb.getItemByColumn(tables.orders, OrderCols.status, "dispatched"),
      fndb.getItemByColumn(tables.orders, OrderCols.status, "delivered"),
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        total: pending.length + dispatched.length + delivered.length,
        pending: pending.length,
        dispatched: dispatched.length,
        delivered: delivered.length,
      },
    });
  } catch (err) {
    fnCommon.logErrorMsg("getOrderSummary", req, err);
    return res.status(500).json({ success: false, message: "Summary error" });
  }
}

async function getDailyOrderStats(req, res) {
  try {
    const query = `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ${tables.orders}
      WHERE created_at >= CURDATE() - INTERVAL 7 DAY
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;
    const result = await fndb.customQuery(tables.orders, query);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    fnCommon.logErrorMsg("getDailyOrderStats", req, err);
    return res.status(500).json({ success: false, message: "Stats error" });
  }
}

async function getMonthlyOrderStats(req, res) {
  try {
    const query = `
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM ${tables.orders}
      WHERE created_at >= CURDATE() - INTERVAL 6 MONTH
      GROUP BY month
      ORDER BY month ASC
    `;
    const result = await fndb.customQuery(tables.orders, query);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    fnCommon.logErrorMsg("getMonthlyOrderStats", req, err);
    return res.status(500).json({ success: false, message: "Monthly stats error" });
  }
}

async function exportOrders(req, res) {
  try {
    const { status = "", from, to } = req.query;
    let whereClause = `WHERE 1=1`;

    if (status) whereClause += ` AND ${OrderCols.status} = '${status}'`;
    if (from) whereClause += ` AND created_at >= '${from}'`;
    if (to) whereClause += ` AND created_at <= '${to}'`;

    const query = `
      SELECT id, customer_id, status, total_amount, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at
      FROM ${tables.orders}
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const result = await fndb.customQuery(tables.orders, query);
    const parser = new Parser();
    const csv = parser.parse(result);

    res.header("Content-Type", "text/csv");
    res.attachment("orders_export.csv");
    return res.send(csv);
  } catch (err) {
    fnCommon.logErrorMsg("exportOrders", req, err);
    return res.status(500).json({ success: false, message: "Export error" });
  }
}



module.exports = router;