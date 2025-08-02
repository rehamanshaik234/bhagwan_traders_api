const express = require("express");
const router = express.Router();
const authenticateToken = require("../../helpers/dashboard/authtoken");
const tables = require("../../helpers/dashboard/tableNames.js");
const tablecols = require("../../helpers/dashboard/tableColumns.js");
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");
const { AddressCols } = require("../../helpers/dashboard/tableColumns.js");
const {uploadCategoryImage}= require("../../helpers/dashboard/fileupload.js");
const path = require("path");

router.post("/addCategory", [authenticateToken.validJWTNeeded, uploadCategoryImage.single('file') ,addCategory]);
router.get("/categoryById", [authenticateToken.validJWTNeeded, getCategoryById]);  
router.get("/allCategories", [authenticateToken.validJWTNeeded, getAllCategories]);


router.get("/getAll", [authenticateToken.validJWTNeeded, getAllCategories]);
router.post("/add", [authenticateToken.validJWTNeeded, addCategory]);
router.put("/edit/:id", [authenticateToken.validJWTNeeded, editCategory]);
router.delete("/delete/:id", [authenticateToken.validJWTNeeded, deleteCategory]);

module.exports = router;



// async function addCategory(req, res) {
//   try {
//     const { name, description, image_url } = req.body;
//     if (!name || !description) {
//       return res.status(400).send({ success: false, message: "Missing required fields" });
//     }

//     const category = { name, description, image_url };
//     const result = await fndb.addNewItem(tables.categories, category);
//     res.send({ success: true, message: "Category added", category_id: result });
//   } catch (err) {
//     fnCommon.logErrorMsg("addCategory", req, err.message);
//     res.status(500).send({ success: false, message: "Error adding category" });
//   }
// }

async function editCategory(req, res) {
  try {
    const categoryId = req.params.id;
    const updates = req.body;

    const result = await fndb.updateItem(tables.categories, categoryId, updates);
    if (!result) throw new Error("Category not updated");

    res.send({ success: true, message: "Category updated" });
  } catch (err) {
    fnCommon.logErrorMsg("editCategory", req, err.message);
    res.status(500).send({ success: false, message: "Error updating category" });
  }
}

async function deleteCategory(req, res) {
  try {
    const categoryId = req.params.id;
    await fndb.deleteItem(tables.categories, categoryId);
    res.send({ success: true, message: "Category deleted" });
  } catch (err) {
    fnCommon.logErrorMsg("deleteCategory", req, err.message);
    res.status(500).send({ success: false, message: "Error deleting category" });
  }
}

async function addCategory(req, res) {
  var resp = new Object();
  try {
    const _path = path.join(__dirname, "../../uploads/category");
    const fileUrl = `https://materialmart.shop/uploads/category/${req.file.filename}`;
    var body = req.body;
    body.image_url = fileUrl; // Set the image URL from the uploaded file
    const result = await fndb.addNewItem(tables.categories, body);
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
  } catch (err) {
    fnCommon.logErrorMsg("addCategory", req, err.message);
    resp = { status: false, error: err };
  }
  return res.send(resp);
}

async function getAllCategories(req, res) {
  var resp = new Object();
  try {
    const result = await fndb.getAllItems(tables.categories);
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
    const result = await fndb.getItemById(tables.categories, categoryId);
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
