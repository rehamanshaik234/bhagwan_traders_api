const express = require("express");
const router = express.Router();
const authenticateToken = require("../../helpers/dashboard/authtoken.js");
const tables = require("../../helpers/dashboard/tableNames.js");
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");
const { uploadProductImage } = require("../../helpers/dashboard/fileupload.js");
const { AddressCols } = require("../../helpers/dashboard/tableColumns.js");
const path = require("path");


router.put("/editProduct/:id", [authenticateToken.validJWTNeeded, editProduct]);
router.get("/getProducts", [authenticateToken.validJWTNeeded, getProducts]);
router.put("/updateQuantity/:id", [authenticateToken.validJWTNeeded, updateQuantity]);
router.put("/disableProduct/:id", [authenticateToken.validJWTNeeded, toggleProductStatus]);
router.get("/getAllProducts", [authenticateToken.validJWTNeeded, getAllProducts]);
router.get("/getAllBrands", [authenticateToken.validJWTNeeded, getAllBrands]);
router.put("/enableProduct/:id", [authenticateToken.validJWTNeeded, enableProduct]);

router.post("/addProduct", [authenticateToken.validJWTNeeded, uploadProductImage.array("files"), addProduct]);
router.get("/productById", [authenticateToken.validJWTNeeded, getProductById]);
router.get("/allProducts", [authenticateToken.validJWTNeeded, getAllProducts]);

// Function to get products by subcategory ID
router.get("/productsBySubCategoryId", [authenticateToken.validJWTNeeded, getProductsBySubCategoryId]);


module.exports = router;

/**
 * @get /getProducts?brand_id=1&is_active=1
 *
 * @all_products_with_pagination
 * @get /getAllProducts?category_id=2&is_active=1&page=2&limit=5
 *
 * @optional_queries
 *  ?brand_id=1&category_id=2&name=shirt&is_active=1&page=1&limit=10&sort=created_at&order=desc
 *
 */


function validateProduct(data) {
  const requiredFields = [
    "name",
    "description",
    "price",
    "stock",
    "brand_id",
    "category_id",
  ];
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  if (isNaN(data.price) || isNaN(data.stock)) {
    return "Price and stock must be numeric";
  }

  return null;
}

async function editProduct(req, res) {
  let resp = {};
  try {
    const id = req.params.id;
    const updateData = req.body;
    const result = await fndb.updateItem(tables.products, id, updateData);
    resp.success = true;
    resp.message = "Product updated successfully";
    resp.result = result;
  } catch (err) {
    await fnCommon.logErrorMsg("editProduct", req, err.message);
    resp.success = false;
    resp.message = "Error updating product";
  }
  return res.send(resp);
}

async function getProducts(req, res) {
  let resp = {};
  try {
    const { brand_id, category_id, name, is_active } = req.query;
    let conditions = [];

    if (brand_id) conditions.push(`brand_id = ${brand_id}`);
    if (category_id) conditions.push(`category_id = ${category_id}`);
    if (name) conditions.push(`name LIKE '%${name}%'`);
    if (is_active !== undefined) conditions.push(`is_active = ${is_active}`);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM ${tables.products} ${whereClause}`;

    const result = await fndb.customQuery(tables.products, query);
    resp.success = true;
    resp.message = "Products fetched successfully";
    resp.result = result;
  } catch (err) {
    await fnCommon.logErrorMsg("getProducts", req, err.message);
    resp.success = false;
    resp.message = "Error fetching products";
  }
  return res.send(resp);
}

async function updateQuantity(req, res) {
  let resp = {};
  try {
    const id = req.params.id;
    const { stock } = req.body;

    if (typeof stock !== "number") {
      return res.send({
        success: false,
        message: "Stock must be a number",
      });
    }

    const result = await fndb.updateItem(tables.products, id, { stock });
    resp.success = true;
    resp.message = "Stock quantity updated";
    resp.result = result;
  } catch (err) {
    await fnCommon.logErrorMsg("updateQuantity", req, err.message);
    resp.success = false;
    resp.message = "Error updating stock quantity";
  }
  return res.send(resp);
}

async function toggleProductStatus(req, res) {
  const resp = {};
  const productId = req.params.id;
  const { is_active } = req.body;

  try {
    if (typeof is_active !== "number" || ![0, 1].includes(is_active)) {
      return res.status(400).send({
        success: false,
        message: "Invalid is_active value. Must be 0 or 1.",
      });
    }

    const product = await fndb.getItemById(tables.products, productId);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    const updated = await fndb.updateItem(tables.products, productId, {
      is_active: is_active,
    });

    resp.success = updated;
    resp.message = updated ? "Product status updated" : "No changes made";
    return res.send(resp);
  } catch (err) {
    fnCommon.logErrorMsg("toggleProductStatus", req, err.message);
    return res.status(500).send({
      success: false,
      message: "Server error while updating product status",
    });
  }
}

// async function getAllProducts(req, res) {
//   try {
//     const {
//       brand_id,
//       category_id,
//       name,
//       is_active,
//       page = 1,
//       limit = 10,
//       sort = "created_at",
//       order = "desc",
//     } = req.query;

//     let whereClauses = [];
//     if (brand_id) whereClauses.push(`brand_id = ${brand_id}`);
//     if (category_id) whereClauses.push(`category_id = ${category_id}`);
//     if (name) whereClauses.push(`name LIKE '%${name}%'`);
//     if (is_active !== undefined) whereClauses.push(`is_active = ${is_active}`);

//     const offset = (page - 1) * limit;

//     let query = `SELECT * FROM ${tables.products}`;
//     if (whereClauses.length > 0) {
//       query += " WHERE " + whereClauses.join(" AND ");
//     }

//     query += ` ORDER BY ${sort} ${order.toUpperCase()} LIMIT ${limit} OFFSET ${offset}`;

//     const result = await fndb.customQuery(tables.products, query);
//     res.send({
//       success: true,
//       data: result,
//       message: "Products fetched successfully",
//       pagination: { page, limit },
//     });
//   } catch (err) {
//     fnCommon.logErrorMsg("getAllProducts", req, err.message);
//     res.status(500).send({
//       success: false,
//       message: "Error fetching products",
//     });
//   }
// }

async function getAllBrands(req, res) {
  try {
    const brands = await fndb.getAllItems(tables.brands);
    res.send({ success: true, data: brands });
  } catch (err) {
    fnCommon.logErrorMsg("getAllBrands", req, err.message);
    res.status(500).send({ success: false, message: "Failed to fetch brands" });
  }
}

async function enableProduct(req, res) {
  const productId = req.params.id;

  try {
    const updateData = { active: 1 };
    const updated = await fndb.updateItem(
      tables.products,
      productId,
      updateData
    );

    if (updated) {
      return res.status(200).json({ message: "Product enabled successfully" });
    } else {
      return res.status(400).json({ message: "Failed to enable product" });
    }
  } catch (err) {
    fnCommon.logErrorMsg("enableProduct", req, err.message);
    res
      .status(500)
      .send({ success: false, message: "Failed to Enable Product" });
  }
}

async function addProduct(req, res) {
  var resp = new Object();
  try {
    const _path = path.join(__dirname, "../../uploads/product");
    const fileUrls = req.files.map(
      (file) =>
        `https://materialmart.shop/uploads/product/${file.filename}`
    ); // Create an array of file URLs
    var body = JSON.parse(JSON.stringify(req.body));
    if(fileUrls.length > 0) {
      body.image_url = fileUrls[0]; // Set the first image URL as the main image
    }
    const result = await fndb.addNewItem(tables.products, body);
    console.log("result", result);
    if (result != null) {
      body.id = result; // Get the inserted ID from the result.
      body.created_at = new Date().toISOString();
      await Promise.all(
        fileUrls.map(async (url, index) => {
          await fndb.addNewItem(tables.product_images, {
            product_id: result,
            image_url: url,
          });
        })
      );
      body.image_urls = fileUrls; // Add the image URLs to the response body
      resp = {
        status: true,
        message: `Product Added Successfully`,
        data: body,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (err) {
    fnCommon.logErrorMsg("addProduct", req, err.message);
    resp = { status: false, error: err };
  }
  return res.send(resp);
}

// async function getAllProducts(req, res) {
//   var resp = new Object();
//   try {
//     var result = await fndb.customQuery(tables.products, `
//                     SELECT 
//                       p.*,
//                       sc.id AS sc_id,
//                       sc.name AS sc_name,
//                       sc.image_url AS sc_image_url,
//                       sc.description AS sc_description,
//                       c.id AS c_id,
//                       c.name AS c_name,
//                       c.image_url AS c_image_url,
//                       c.description AS c_description,
//                       IFNULL((
//                         SELECT JSON_ARRAYAGG(pi.image_url)
//                         FROM product_images pi
//                         WHERE pi.product_id = p.id
//                       ), JSON_ARRAY()) AS image_urls
//                     FROM products p
//                     LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
//                     LEFT JOIN categories c ON sc.category_id = c.id
//                     WHERE p.is_active = 1; `);

//     result = result.map((row) => {
//       let image_urls = [];
//       try {
//         image_urls = JSON.parse(row.image_urls || "[]");
//       } catch (e) {}
//       let data = {
//         ...row,
//         image_urls,
//         sub_category: {
//           id: row.sc_id,
//           name: row.sc_name,
//           image_url: row.sc_image_url,
//           description: row.sc_description,
//         },
//         category: {
//           id: row.c_id,
//           name: row.c_name,
//           image_url: row.c_image_url,
//           description: row.c_description,
//         },
//       };
//       // Clean up redundant fields
//       delete row.sc_id;
//       delete row.sc_name;
//       delete row.sc_description;
//       delete row.c_id;
//       delete row.c_name;
//       delete row.c_description;
//       return data;
//     });

//     if (result != null) {
//       resp = {
//         status: true,
//         message: `Products Retrieved Successfully`,
//         data: result,
//       };
//     } else {
//       resp = { status: false, error: "Query execution error" };
//     }
//   } catch (err) {
//     console.error("Error in getAllProducts:", err);
//     resp = { status: false, error: err };
//     fnCommon.logErrorMsg("getProductById", req, err.message);
//   }
//   return res.send(resp);
// }

async function getAllProducts(req, res) {
  let resp = {};

  try {
    // Extract query params
    const {
      name,
      brand_id,
      category_id,
      sub_category_id,
      is_active = 1,
      page = 1,
      limit = 10,
      sort = "p.created_at",
      order = "DESC"
    } = req.query;

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [`p.is_active = ${is_active}`];
    if (name) conditions.push(`p.name LIKE '%${name}%'`);
    if (brand_id) conditions.push(`p.brand_id = ${brand_id}`);
    if (sub_category_id) conditions.push(`p.sub_category_id = ${sub_category_id}`);
    if (category_id) conditions.push(`sc.category_id = ${category_id}`);

    const conditionStr = conditions.join(" AND ");

    // Main data query
    const result = await fndb.customQuery(tables.products, `
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
      WHERE ${conditionStr}
      ORDER BY ${sort} ${order}
      LIMIT ${limit} OFFSET ${offset};
    `);

    // Count query using same conditions
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE ${conditionStr};
    `;

    const countResultRaw = await fndb.customQuery(tables.products, countQuery);
    const total = countResultRaw?.[0]?.total || 0;

    // Transform result
    const finalData = result.map((row) => {
      let image_urls = [];
      try {
        image_urls = JSON.parse(row.image_urls || "[]");
      } catch (e) {}

      const data = {
        ...row,
        image_urls,
        sub_category: {
          id: row.sc_id,
          name: row.sc_name,
          image_url: row.sc_image_url,
          description: row.sc_description,
        },
        category: {
          id: row.c_id,
          name: row.c_name,
          image_url: row.c_image_url,
          description: row.c_description,
        },
      };

      // Clean up extra fields
      delete data.sc_id;
      delete data.sc_name;
      delete data.sc_description;
      delete data.c_id;
      delete data.c_name;
      delete data.c_description;

      return data;
    });

    resp = {
      success: true,
      status: true,
      message: "Products Retrieved Successfully",
      data: finalData,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    };
  } catch (err) {
    console.error("Error in getAllProducts:", err);
    resp = { success: false, status: false, error: err.message };
    fnCommon.logErrorMsg("getAllProducts", req, err.message);
  }

  return res.send(resp);
}



async function getProductById(req, res) {
  let resp = {};
  try {
    const productId = req.query.id;
    console.log("Product ID:", productId);

    // Get product with sub_category and category details
    const result = await fndb.customQuery(
      tables.products,
      `
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
      WHERE p.is_active = 1 AND p.id = ?`,
      [productId]
    );

    console.log("result", result);

    if (result && result.length > 0) {
      const product = result[0];

      // Get images
      const images = await fndb.getAllItemsByID(
        tables.product_images,
        "product_id",
        productId
      );
      product.image_urls = images.map((image) => image.image_url);

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
    const result = await fndb.customQuery(
      tables.products,
      `
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
    `,
      [subCategoryId]
    );

    if (result && result.length > 0) {
      const productsWithDetails = await Promise.all(
        result.map(async (product) => {
          // Get images for each product
          const images = await fndb.getAllItemsByID(
            tables.product_images,
            "product_id",
            product.id
          );
          product.image_urls = images.map((image) => image.image_url);

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
        })
      );

      resp = {
        status: true,
        message: `Products Retrieved Successfully for Sub Category ID ${subCategoryId}`,
        data: productsWithDetails,
      };
    } else {
      resp = {
        status: false,
        error: "No products found for given sub-category",
      };
    }
  } catch (error) {
    resp = { status: false, error: error.message };
  }

  return res.send(resp);
}
