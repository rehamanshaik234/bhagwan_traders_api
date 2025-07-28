// 📈 sale_service.js (Updated for accurate stats + dynamic filters)
const express = require("express");
const router = express.Router();
const fndb = require("../../helpers/dashboard/dbFunctions");
const tables = require("../../helpers/dashboard/tableNames");
const { Parser } = require("json2csv");

// 🎯 Label formatter
function getFormattedLabel(type) {
  switch (type) {
    case "yearly": return "YEAR(o.created_at)";
    case "monthly": return "DATE_FORMAT(o.created_at, '%b %Y')";
    case "daily": return "DATE_FORMAT(o.created_at, '%d %b %Y')";
    default: return "DATE_FORMAT(o.created_at, '%b %Y')";
  }
}

// 🧠 Filters builder
function buildFilters(req) {
  const { product_id, category_id, customer_id, from, to, brand, product } = req.query;
  const filters = [`o.status = 'Delivered'`];

  if (product_id) filters.push(`oi.product_id = ${product_id}`);
  if (category_id) filters.push(`p.category_id = ${category_id}`);
  if (customer_id) filters.push(`o.customer_id = ${customer_id}`);
  if (from) filters.push(`DATE(o.created_at) >= '${from}'`);
  if (to) filters.push(`DATE(o.created_at) <= '${to}'`);
  if (product) filters.push(`p.name LIKE '%${product}%'`);
  if (brand) filters.push(`b.name LIKE '%${brand}%'`);

  return filters.length ? `WHERE ${filters.join(" AND ")}` : "";
}

// 💰 Amount Stats API
router.get("/amount-stats", async (req, res) => {
  try {
    const label = getFormattedLabel(req.query.type);
    const filters = buildFilters(req);

    const query = `
      SELECT ${label} AS label, SUM(o.total_amount) AS total_amount
      FROM ${tables.orders} o
      LEFT JOIN ${tables.orderItems} oi ON o.id = oi.order_id
      LEFT JOIN ${tables.products} p ON p.id = oi.product_id
      LEFT JOIN ${tables.brands} b ON b.id = p.brand_id
      ${filters}
      GROUP BY label ORDER BY o.created_at ASC
    `;

    const result = await fndb.customQuery(tables.orders, query);
    res.send({ success: true, data: result });
  } catch (err) {
    console.error("❌ Error in /amount-stats:", err.message);
    res.status(500).send({ success: false, message: "Error fetching amount stats" });
  }
});

// 📦 Product Quantity Stats API
router.get("/product-stats", async (req, res) => {
  try {
    const label = getFormattedLabel(req.query.type);
    const filters = buildFilters(req);

    const query = `
      SELECT ${label} AS label, SUM(oi.quantity) AS total_quantity
      FROM ${tables.orders} o
      JOIN ${tables.orderItems} oi ON o.id = oi.order_id
      JOIN ${tables.products} p ON p.id = oi.product_id
      JOIN ${tables.brands} b ON b.id = p.brand_id
      ${filters}
      GROUP BY label ORDER BY o.created_at ASC
    `;

    const result = await fndb.customQuery(tables.orderItems, query);
    res.send({ success: true, data: result });
  } catch (err) {
    console.error("❌ Error in /product-stats:", err.message);
    res.status(500).send({ success: false, message: "Error fetching product stats" });
  }
});

// 📤 Export CSV API (downloads happen in frontend)
router.get("/export", async (req, res) => {
  try {
    const { type = "monthly", metric = "amount" } = req.query;
    const label = getFormattedLabel(type);
    const filters = buildFilters(req);

    let query, table;
    if (metric === "product") {
      query = `
        SELECT ${label} AS label, SUM(oi.quantity) AS total_quantity
        FROM ${tables.orders} o
        JOIN ${tables.orderItems} oi ON o.id = oi.order_id
        JOIN ${tables.products} p ON p.id = oi.product_id
        JOIN ${tables.brands} b ON b.id = p.brand_id
        ${filters}
        GROUP BY label ORDER BY o.created_at ASC
      `;
      table = tables.orderItems;
    } else {
      query = `
        SELECT ${label} AS label, SUM(o.total_amount) AS total_amount
        FROM ${tables.orders} o
        LEFT JOIN ${tables.orderItems} oi ON o.id = oi.order_id
        LEFT JOIN ${tables.products} p ON p.id = oi.product_id
        LEFT JOIN ${tables.brands} b ON b.id = p.brand_id
        ${filters}
        GROUP BY label ORDER BY o.created_at ASC
      `;
      table = tables.orders;
    }

    const result = await fndb.customQuery(table, query);
    const fields = Object.keys(result[0] || {});
    const parser = new Parser({ fields });
    const csv = parser.parse(result);

    res.setHeader("Content-Disposition", `attachment; filename=sales_${metric}_${Date.now()}.csv`);
    res.setHeader("Content-Type", "text/csv");
    res.send(csv);
  } catch (err) {
    console.error("❌ Error exporting CSV:", err.message);
    res.status(500).send({ success: false, message: "CSV export failed" });
  }
});

module.exports = router;
