const express = require("express");
const tableNames = require("../helpers/tableNames.js");
const router = express.Router();
const path = require("path");
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken.js");
const {uploadProductImage}= require("../helpers/fileupload.js");

router.post("/addProduct", [authenticateToken.validJWTNeeded, uploadProductImage.array('files') ,addProduct]);
router.get("/productById", [authenticateToken.validJWTNeeded, getProductById]);
router.get("/allProducts", [authenticateToken.validJWTNeeded, getAllProducts]);

// Function to get products by subcategory ID
router.get("/productsBySubCategoryId", [authenticateToken.validJWTNeeded, getProductsBySubCategoryId]);
router.get("/searchProducts", [authenticateToken.validJWTNeeded, searchProducts]);



async function addProduct(req, res) {
  var resp = new Object();
  try {
    const _path = path.join(__dirname, "../../uploads/product");
    const fileUrls = req.files.map(file => `https://materialmart.shop/uploads/product/${file.filename}`); // Create an array of file URLs
    var body = req.body;
    body.image_url = fileUrls.length > 0 ? fileUrls[0] : null;
    body.is_active = body.is_active ? 1 : 0; // Ensure is_active is a number (1 or 0)
    const result = await fndb.addNewItem(tableNames.products, body);
    if (result != null) {
      body.id = result; // Get the inserted ID from the result. 
      body.created_at = new Date().toISOString();
      await Promise.all(fileUrls.map(async (url, index) => {
        await fndb.addNewItem(tableNames.product_images, { product_id: result, image_url: url });
      }));
      body.image_urls = fileUrls; // Add the image URLs to the response body
      resp = {
        status: true,
        message: `Product Added Successfully`,
        data: body,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function getAllProducts(req, res) {
  var resp = new Object();
  try {
  var result = await fndb.customQuery(`
                    SELECT 
                      p.*,
                      sc.id AS sc_id,
                      sc.name AS sc_name,
                      sc.image_url AS sc_image_url,
                      sc.description AS sc_description,
                      c.id AS c_id,
                      c.name AS c_name,
                      c.image_url AS c_image_url,
                      c.description AS c_description,
                      IFNULL((
                        SELECT JSON_ARRAYAGG(pi.image_url)
                        FROM product_images pi
                        WHERE pi.product_id = p.id
                      ), JSON_ARRAY()) AS image_urls
                    FROM products p
                    LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
                    LEFT JOIN categories c ON sc.category_id = c.id
                    WHERE p.is_active = 1; `);

    result = result.map(row => {
      let image_urls = [];
      try {
        image_urls = JSON.parse(row.image_urls || '[]');
      } catch (e) {}
      let data = {
        ...row,
        image_urls,
        sub_category: {
          id: row.sc_id,
          name: row.sc_name,
          image_url: row.sc_image_url,
          description: row.sc_description
        },
        category: {
          id: row.c_id,
          name: row.c_name,
          image_url: row.c_image_url,
          description: row.c_description
        }
      };
        // Clean up redundant fields
        delete row.sc_id;
        delete row.sc_name;
        delete row.sc_description;
        delete row.c_id;
        delete row.c_name;
        delete row.c_description;
      return data;
    });

    if (result != null) {
      resp = {
        status: true,
        message: `Products Retrieved Successfully`,
        data: result,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    resp = { status: false, error: error };
  }
  return res.send(resp);
}


async function getProductById(req, res) {
  let resp = {};
  try {
    const productId = req.query.id;
    console.log("Product ID:", productId);

    // Get product with sub_category and category details
    const result = await fndb.customQuery(`
      SELECT 
        p.*,
        sc.id AS sc_id,
        sc.name AS sc_name,
        sc.description AS sc_description,
        c.id AS c_id,
        c.name AS c_name,
        c.description AS c_description
      FROM products p
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE p.is_active = 1 AND p.id = ?`, [productId]);

    if (result && result.length > 0) {
      const product = result[0];

      // Get images
      const images = await fndb.getAllItemsByID(tableNames.product_images, "product_id", productId);
      product.image_urls = images.map(image => image.image_url);

      // Structure nested sub_category and category
      product.sub_category = {
        id: product.sc_id,
        name: product.sc_name,
        description: product.sc_description,
      };
      product.category = {
        id: product.c_id,
        name: product.c_name,
        description: product.c_description,
      };

      // Clean up redundant fields
      delete product.sc_id;
      delete product.sc_name;
      delete product.sc_description;
      delete product.c_id;
      delete product.c_name;
      delete product.c_description;

      resp = {
        status: true,
        message: `Product Retrieved Successfully`,
        data: product,
      };
    } else {
      resp = { status: false, error: "Product not found" };
    }
  } catch (error) {
    resp = { status: false, error: error.message };
  }

  return res.send(resp);
}


async function getProductsBySubCategoryId(req, res) {
  let resp = {};
  try {
    const subCategoryId = req.query.subCategoryId;
    console.log("SubCategory ID:", subCategoryId);

    // Fetch products with joined category and sub-category info
    const result = await fndb.customQuery(`
      SELECT 
        p.*,
        sc.id AS sc_id,
        sc.name AS sc_name,
        sc.description AS sc_description,
        c.id AS c_id,
        c.name AS c_name,
        c.description AS c_description
      FROM products p
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE p.is_active = 1 AND p.sub_category_id = ?
    `, [subCategoryId]);

    if (result && result.length > 0) {
      const productsWithDetails = await Promise.all(result.map(async (product) => {
        // Get images for each product
        const images = await fndb.getAllItemsByID(tableNames.product_images, "product_id", product.id);
        product.image_urls = images.map(image => image.image_url);

        // Structure nested sub_category and category
        product.sub_category = {
          id: product.sc_id,
          name: product.sc_name,
          description: product.sc_description,
        };
        product.category = {
          id: product.c_id,
          name: product.c_name,
          description: product.c_description,
        };

        // Clean up redundant fields
        delete product.sc_id;
        delete product.sc_name;
        delete product.sc_description;
        delete product.c_id;
        delete product.c_name;
        delete product.c_description;

        return product;
      }));

      resp = {
        status: true,
        message: `Products Retrieved Successfully for Sub Category ID ${subCategoryId}`,
        data: productsWithDetails,
      };
    } else {
      resp = { status: false, error: "No products found for given sub-category" };
    }
  } catch (error) {
    resp = { status: false, error: error.message };
  }

  return res.send(resp);
}



async function searchProducts(req, res) {
  let resp = {};
  try {
    const searchTerm = req.query.term;
    const subCategoryId = req.query.subCategoryId;

    // Fetch products matching the search term
    const result = await fndb.customQuery(`
      SELECT 
        p.*,
        sc.id AS sc_id,
        sc.name AS sc_name,
        sc.description AS sc_description,
        c.id AS c_id,
        c.name AS c_name,
        c.description AS c_description
      FROM products p
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE p.is_active = 1 
      AND sc.id = ?
      AND (p.name LIKE ? OR p.description LIKE ?)
    `, [subCategoryId, `%${searchTerm}%`, `%${searchTerm}%`]);

    if (result && result.length > 0) {
      const productsWithDetails = await Promise.all(result.map(async (product) => {
        // Get images for each product
        const images = await fndb.getAllItemsByID(tableNames.product_images, "product_id", product.id);
        product.image_urls = images.map(image => image.image_url);

        // Structure nested sub_category and category
        product.sub_category = {
          id: product.sc_id,
          name: product.sc_name,
          description: product.sc_description,
        };
        product.category = {
          id: product.c_id,
          name: product.c_name,
          description: product.c_description,
        };

        // Clean up redundant fields
        delete product.sc_id;
        delete product.sc_name;
        delete product.sc_description;
        delete product.c_id;
        delete product.c_name;
        delete product.c_description;

        return product;
      }));

      resp = {
        status: true,
        message: `Products Retrieved Successfully for Search Term "${searchTerm}"`,
        data: productsWithDetails,
      };
    } else {
      resp = { status: false, error: "No products found matching the search term" };
    }
  } catch (error) {
    resp = { status: false, error: error.message };
  }

  return res.send(resp);
}





module.exports = router;
