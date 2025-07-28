const express = require("express");
const tableNames = require("../../helpers/tableNames.js");
const router = express.Router();
const path = require("path");
const fndb = require("../../helpers/dbFunctions.js");
const { AddressCols } = require("../../helpers/dashboard/tableColumns.js");
const authenticateToken = require("../../helpers/dashboard/authtoken.js");
const {uploadSubCategoryImage}= require("../../helpers/dashboard/fileupload.js");

router.post("/addSubCategory", [authenticateToken.validJWTNeeded, uploadSubCategoryImage.single('file') ,addSubCategory]);
router.get("/subCategoryById", [authenticateToken.validJWTNeeded, getSubCategoryById]);
router.get("/subCategoryByCategoryId", [authenticateToken.validJWTNeeded, getSubCategoryByCategoryId]);
router.get("/allSubCategories", [authenticateToken.validJWTNeeded, getAllSubCategories]);

async function addSubCategory(req, res) {
  var resp = new Object();
  try {
    const _path = path.join(__dirname, "../../uploads/subcategory");
    const fileUrl = `https://materialmart.shop/uploads/subcategory/${req.file.filename}`;
    var body = req.body;
    body.image_url = fileUrl;
    const result = await fndb.addNewItem(tableNames.subCategories, body);
    if (result != null) {
      body.id = result;
      body.created_at = new Date().toISOString();
      resp = {
        status: true,
        message: `Sub Category Added Successfully`,
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

async function getAllSubCategories(req, res) {
  var resp = new Object();
  try {
    var result = await fndb.customQuery(tableNames.subCategories, `
      SELECT sub_categories.*,
          JSON_OBJECT(
            'id', c.id,
            'name', c.name,
            'description', c.description,
            'created_at', c.created_at
          ) AS category
        FROM sub_categories
        LEFT JOIN categories AS c ON sub_categories.category_id = c.id
        ORDER BY sub_categories.created_at DESC;
        `);
    if (result != null) {
      result = result.map(item => {
      try {
        item.category = JSON.parse(item.category || '{}');
      } catch (e) {
        item.category = {};
      }
      return item;});

      resp = {
        status: true,
        message: `Sub Categories Retrieved Successfully`,
        data: result,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (error) {
    resp = { status: false, error: error };
  }
  return res.send(resp);
}

async function getSubCategoryById(req, res) {
  let resp = {};
  try {
    const id = req.query.id;

    const result = await fndb.customQuery(tableNames.subCategories,`
      SELECT 
        sc.*, 
        JSON_OBJECT(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'created_at', c.created_at
        ) AS category
      FROM sub_categories sc
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE sc.id = ?
    `, [id]);

    if (result && result.length > 0) {
      let subCategory = result[0];

      try {
        subCategory.category = JSON.parse(subCategory.category || '{}');
      } catch (e) {
        subCategory.category = {};
      }

      resp = {
        status: true,
        message: `Sub Category Retrieved Successfully`,
        data: subCategory,
      };
    } else {
      resp = { status: false, error: "Sub Category not found" };
    }
  } catch (error) {
    resp = { status: false, error: error.message };
  }

  return res.send(resp);
}


async function getSubCategoryByCategoryId(req, res) {
  let resp = {};
  try {
    const categoryId = req.query.categoryId;

    const result = await fndb.customQuery(tableNames.subCategories,`
      SELECT 
        sc.*, 
        JSON_OBJECT(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'created_at', c.created_at
        ) AS category
      FROM sub_categories sc
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE sc.category_id = ?
      ORDER BY sc.created_at DESC
    `, [categoryId]);

    if (result && result.length > 0) {
      const formatted = result.map(item => {
        try {
          item.category = JSON.parse(item.category || '{}');
        } catch (e) {
          item.category = {};
        }
        return item;
      });

      resp = {
        status: true,
        message: `Sub Categories Retrieved Successfully for Category ID ${categoryId}`,
        data: formatted,
      };
    } else {
      resp = { status: false, error: "No Sub Categories found" };
    }
  } catch (error) {
    resp = { status: false, error: error.message };
  }

  return res.send(resp);
}


module.exports = router;