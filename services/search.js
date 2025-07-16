const express = require("express");
const tableNames = require("../helpers/tableNames");
const router = express.Router();
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols, CustomerGstCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken");

router.post("/mainSearch", [authenticateToken.validJWTNeeded, mainSearch]);


async function mainSearch(req, res) {
  var resp = new Object();
  try {
    var query = req.body.query;
    const result = await fndb.customQuery(`
        SELECT DISTINCT
        name,
        image_url,
        description,
        product_id,
        sub_category_id,
        category_id
        FROM (
            -- Search in products table with proper category_id mapping
            (
                SELECT 
                    p.name,
                    p.image_url,
                    p.description,
                    p.id as product_id,
                    sc.id as sub_category_id,
                    ct.id as category_id
                FROM products p
                LEFT JOIN sub_categories AS sc ON p.sub_category_id = sc.id 
                LEFT JOIN categories AS ct ON ct.id = sc.category_id
                WHERE p.name LIKE '%${query}%' OR p.description LIKE '%${query}%'
            )
            
            UNION ALL
            
            -- Search in sub_categories table with proper category_id mapping
            (
                SELECT 
                    sc.name,
                    sc.image_url,
                    sc.description,
                    NULL as product_id,
                    sc.id as sub_category_id,
                    sc.category_id
                FROM sub_categories sc
                WHERE sc.name LIKE '%${query}%' OR sc.description LIKE '%${query}%'
            )
            
            UNION ALL
            
            -- Search in categories table
            (
                SELECT 
                    c.name,
                    c.image_url,
                    c.description,
                    NULL as product_id,
                    NULL as sub_category_id,
                    c.id as category_id
                FROM categories c
                WHERE c.name LIKE '%${query}%' OR c.description LIKE '%${query}%'
            )
        ) AS all_results
        ORDER BY 
            CASE 
                WHEN product_id IS NOT NULL THEN 1  -- Products first
                WHEN sub_category_id IS NOT NULL THEN 2  -- Sub-categories second
                ELSE 3  -- Categories last
            END,
            name
            LIMIT 10;`);
    if (result != null) {
      resp = {
        status: true,
        message: `Search completed successfully`,
        data: result,
      }
    } else {
      resp = { data:[], status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { data:[], status: false, error: error };
  }
  return res.send(resp);
}


module.exports = router;
