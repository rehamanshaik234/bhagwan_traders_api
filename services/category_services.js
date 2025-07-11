const express = require("express");
const tableNames = require("../helpers/tableNames.js");
const router = express.Router();
const path = require("path");
const fndb = require("../helpers/dbFunctions.js");
const { AddressCols } = require("../helpers/tableColumns.js");
const authenticateToken = require("../helpers/authtoken.js");
const {uploadCategoryImage}= require("../helpers/fileupload.js");

router.post("/addCategory", [authenticateToken.validJWTNeeded, uploadCategoryImage.single('file') ,addCategory]);
router.get("/categoryById", [authenticateToken.validJWTNeeded, getCategoryById]);  
router.get("/allCategories", [authenticateToken.validJWTNeeded, getAllCategories]);


async function addCategory(req, res) {
  var resp = new Object();
  try {
    const _path = path.join(__dirname, "../../uploads/category");
    const fileUrl = `https://materialmart.shop/uploads/category/${req.file.filename}`;
    var body = req.body;
    body.image_url = fileUrl; // Set the image URL from the uploaded file
    const result = await fndb.addNewItem(tableNames.categories, body);
    if (result != null) {
      body.id = result; // Get the inserted ID from the result
      body.created_at = new Date().toISOString();
      resp = {
        status: true,
        message: `Category Added Successfully`,
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

async function getAllCategories(req, res) {
  var resp = new Object();
  try {
    const result = await fndb.getAllItems(tableNames.categories);
    if (result != null) {
      resp = {
        status: true,
        message: `Categories Retrieved Successfully`,
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
   

async function getCategoryById(req, res) {
  var resp = new Object();
  try {
    const categoryId = req.query.id;
    const result = await fndb.getItemById(tableNames.categories, categoryId);
    if (result != null) {
      resp = {
        status: true,
        message: `Category Retrieved Successfully`,
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

module.exports = router;
