const express = require("express");
const router = express.Router();
const authenticateToken = require("../../helpers/dashboard/authtoken.js");
const tables = require("../../helpers/dashboard/tableNames.js");
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");
const { uploadProductImage,deleteProductImage } = require("../../helpers/dashboard/fileupload.js");
const { AddressCols } = require("../../helpers/dashboard/tableColumns.js");
const path = require("path");

router.put("/editProduct/:id", [authenticateToken.validJWTNeeded, handleEditProductUpload, editProduct]);
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

function handleEditProductUpload(req, res, next) {
  uploadProductImage.fields([
    { name: "add_images", maxCount: 20 },
    { name: "add_images[]", maxCount: 20 },
    { name: "files", maxCount: 20 },
    { name: "files[]", maxCount: 20 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).send({
        success: false,
        message: err.message,
      });
    }

    next();
  });
}

function getUploadedFiles(reqFiles) {
  if (!reqFiles) {
    return [];
  }

  if (Array.isArray(reqFiles)) {
    return reqFiles;
  }

  return [
    ...(reqFiles.add_images || []),
    ...(reqFiles["add_images[]"] || []),
    ...(reqFiles.files || []),
    ...(reqFiles["files[]"] || []),
  ];
}

async function getProductAssociations(productId) {
  const [product_variants, product_brand_prices] = await Promise.all([
    fndb.getAllItemsByID(tables.productVariants, "product_id", productId),
    fndb.getAllItemsByID(tables.product_brand_prices, "product_id", productId),
  ]);

  return {
    product_variants: product_variants || [],
    product_brand_prices: product_brand_prices || [],
  };
}

async function editProduct(req, res) {
  let resp = {};
  try {
    const id = req.params.id;
    const { product_variants, product_brand_prices, deleted_variants, deleted_brand_prices } = req.body;
    let updateData = JSON.parse(JSON.stringify(req.body));
    const prevImages = req.body.deleted_images ? JSON.parse(req.body.deleted_images) : [];
    const uploadedFiles = getUploadedFiles(req.files);
    const newImages = uploadedFiles.map((file) => `https://materialmart.shop/uploads/product/${file.filename}`);

    const parseJsonArray = (value) => {
      if (value === undefined) return undefined;
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch (e) {
          return null;
        }
      }
      return null;
    };

    const parsedVariants = parseJsonArray(product_variants);
    const parsedBrandPrices = parseJsonArray(product_brand_prices);
    const parsedDeletedVariants = parseJsonArray(deleted_variants);
    const parsedDeletedBrandPrices = parseJsonArray(deleted_brand_prices);

    if (prevImages.length === 0 && newImages.length > 0) {
      updateData.image_url = newImages[0];
    }

    if (updateData.deleted_images) {
      delete updateData.deleted_images;
    }
    if (updateData.product_variants !== undefined) {
      delete updateData.product_variants;
    }
    if (updateData.product_brand_prices !== undefined) {
      delete updateData.product_brand_prices;
    }
    if (updateData.deleted_variants !== undefined) {
      delete updateData.deleted_variants;
    }
    if (updateData.deleted_brand_prices !== undefined) {
      delete updateData.deleted_brand_prices;
    }

    if (updateData.stock !== undefined && updateData.stock !== "") {
      updateData.stock = Number(updateData.stock);
    }
    if (updateData.price !== undefined && updateData.price !== "") {
      updateData.price = Number(updateData.price);
    }
    if (updateData.brand_id !== undefined && updateData.brand_id !== "") {
      updateData.brand_id = Number(updateData.brand_id);
    }
    if (updateData.category_id !== undefined && updateData.category_id !== "") {
      updateData.category_id = Number(updateData.category_id);
    }
    if (updateData.sub_category_id !== undefined && updateData.sub_category_id !== "") {
      updateData.sub_category_id = Number(updateData.sub_category_id);
    }

    // Add new images
    await Promise.all(
      newImages.map(async (url) => {
        await fndb.addNewItem(tables.product_images, {
          product_id: parseInt(id),
          image_url: url,
        });
      })
    );

    // Remove deleted images
    await Promise.all(
      prevImages.map(async (url) => {
        await fndb.customQuery(
          tables.product_images,
          `DELETE FROM ${tables.product_images} WHERE image_url = ?`,
          [url]
        );
        deleteProductImage(url);
      })
    );

    // Update core product data
    const result = await fndb.updateItem(tables.products, id, updateData);

    // Delete specific variants if provided
    if (parsedDeletedVariants && Array.isArray(parsedDeletedVariants)) {
      await Promise.all(
        parsedDeletedVariants.map(async (variantId) => {
          await fndb.customQuery(
            tables.productVariants,
            `DELETE FROM ${tables.productVariants} WHERE id = ? AND product_id = ?`,
            [variantId, id]
          );
        })
      );
    }

    // Add new variants if provided
    if (parsedVariants && Array.isArray(parsedVariants)) {
      await Promise.all(
        parsedVariants.map(async (variant) => {
          variant.product_id = parseInt(id);
          await fndb.addNewItem(tables.productVariants, variant);
        })
      );
    }

    // Delete specific brand prices if provided
    if (parsedDeletedBrandPrices && Array.isArray(parsedDeletedBrandPrices)) {
      await Promise.all(
        parsedDeletedBrandPrices.map(async (priceId) => {
          await fndb.customQuery(
            tables.product_brand_prices,
            `DELETE FROM ${tables.product_brand_prices} WHERE id = ? AND product_id = ?`,
            [priceId, id]
          );
        })
      );
    }

    // Add new brand prices if provided
    if (parsedBrandPrices && Array.isArray(parsedBrandPrices)) {
      await Promise.all(
        parsedBrandPrices.map(async (price) => {
          price.product_id = parseInt(id);
          await fndb.addNewItem(tables.product_brand_prices, price);
        })
      );
    }

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
    const finalResult = await Promise.all(
      result.map(async (product) => {
        const images = await fndb.getAllItemsByID(
          tables.product_images,
          "product_id",
          product.id
        );
        const associations = await getProductAssociations(product.id);

        return {
          ...product,
          image_urls: images.map((image) => image.image_url),
          ...associations,
        };
      })
    );

    resp.success = true;
    resp.message = "Products fetched successfully";
    resp.result = finalResult;
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
    const updateData = { is_active : 1 };
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
    const {product_variants, product_brand_prices} = req.body;
    if(fileUrls.length > 0) {
      body.image_url = fileUrls[0]; // Set the first image URL as the main image
    }
    if(product_variants){
      delete body.product_variants;
    }
    if(product_brand_prices){
      delete body.product_brand_prices;
    }

    // Parse product_variants if it's a string
    let parsedVariants = product_variants;
    if (typeof parsedVariants === 'string') {
      try {
        parsedVariants = JSON.parse(parsedVariants);
      } catch (e) {
        parsedVariants = null;
      }
    }

    // Parse product_brand_prices if it's a string
    let parsedBrandPrices = product_brand_prices;
    if (typeof parsedBrandPrices === 'string') {
      try {
        parsedBrandPrices = JSON.parse(parsedBrandPrices);
      } catch (e) {
        parsedBrandPrices = null;
      }
    }

    const result = await fndb.addNewItem(tables.products, body);
    if (result != null) {
      body.id = result; // Get the inserted ID from the result.
      body.created_at = new Date().toISOString();
      console.log("New Product ID:", parsedVariants);
      if(parsedVariants && Array.isArray(parsedVariants)){
        await Promise.all(parsedVariants.map(async (variant) => {
          variant.product_id = result;
          await fndb.addNewItem(tables.productVariants, variant);
        }));
      }
      if(parsedBrandPrices && Array.isArray(parsedBrandPrices)){
        await Promise.all(parsedBrandPrices.map(async (price) => {
          price.product_id = result;
          await fndb.addNewItem(tables.product_brand_prices, price);
        }));
      }

      body.product_variants = Array.isArray(parsedVariants) ? parsedVariants : [];
      body.product_brand_prices = Array.isArray(parsedBrandPrices) ? parsedBrandPrices : [];

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
    if (brand_id) conditions.push(`EXISTS (SELECT 1 FROM ${tables.product_brand_prices} pbp WHERE pbp.product_id = p.id AND pbp.brand_id = ${brand_id})`);
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
    const finalData = await Promise.all(
      result.map(async (row) => {
        let image_urls = [];
        try {
          image_urls = JSON.parse(row.image_urls || "[]");
        } catch (e) {}

        const associations = await getProductAssociations(row.id);

        const data = {
          ...row,
          image_urls,
          ...associations,
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
      })
    );

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
      const associations = await getProductAssociations(product.id);
      Object.assign(product, associations);

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
          const associations = await getProductAssociations(product.id);
          Object.assign(product, associations);

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
