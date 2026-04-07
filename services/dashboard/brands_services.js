const express = require("express");
const router = express.Router();
const authenticateToken = require("../../helpers/dashboard/authtoken");
const tables = require("../../helpers/dashboard/tableNames.js");
const tablecols = require("../../helpers/dashboard/tableColumns.js");
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");
const {uploadBrandImage, deleteBrandImage}= require("../../helpers/dashboard/fileupload.js");
const path = require("path");

router.post("/addBrand", [authenticateToken.validJWTNeeded, uploadBrandImage.single('file') ,addBrand]);
router.get("/brandById", [authenticateToken.validJWTNeeded, getBrandById]);  
router.get("/allBrands", [authenticateToken.validJWTNeeded, getAllBrands]);

router.post("/add", [authenticateToken.validJWTNeeded, uploadBrandImage.single('file'), addBrand]);
router.put("/edit/:id", [authenticateToken.validJWTNeeded, uploadBrandImage.single('file'), editBrand]);
router.delete("/delete/:id", [authenticateToken.validJWTNeeded, deleteBrand]);

module.exports = router;

async function addBrand(req, res) {
  var resp = new Object();
  try {
    const _path = path.join(__dirname, "../../uploads/brand");
    const fileUrl = `https://materialmart.shop/uploads/brand/${req.file.filename}`;
    var body = req.body;
    body.image_url = fileUrl; // Set the image URL from the uploaded file
    const uploadResult = await uploadBrandImage(req, res);
    if (!uploadResult) {
      return res.status(500).json({ status: false, error: "Image upload failed" });
    }
    const result = await fndb.addNewItem(tables.brands, body);
    if (result != null) {
      body.id = result; // Get the inserted ID from the result
      body.created_at = new Date().toISOString();
      resp = {
        status: true,
        message: `Brand Added Successfully`,
        data: body,
      };
    } else {
      resp = { status: false, error: "Query execution error" };
    }
  } catch (err) {
    fnCommon.logErrorMsg("addBrand", req, err.message);
    resp = { status: false, error: err };
  }
  return res.send(resp);
}

async function getAllBrands(req, res) {
  var resp = new Object();
  try {
    const {name} = req.query;
    let result;
    if(name) {
      result = await fndb.customQuery(`SELECT * FROM ${tables.brands} WHERE name LIKE ?`, [`%${name}%`]);
    } else {
      result = await fndb.getAllItems(tables.brands);
    }
    if (result != null) {
      resp = {
        status: true,
        message: `Brands Retrieved Successfully`,
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

async function getBrandById(req, res) {
  var resp = new Object();
  try {
    const brandId = req.query.id;
    const result = await fndb.getItemById(tables.brands, brandId);
    if (result != null) {
      resp = {
        status: true,
        message: `Brand Retrieved Successfully`,
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

async function editBrand(req, res) {
  try {
    const brandId = req.params.id;
    const updates = req.body;

    // Handle image upload
    if (req.file) {
      const fileUrl = `https://materialmart.shop/uploads/brand/${req.file.filename}`;
      updates.image_url = fileUrl;

      // Get the old brand to delete the old image
      const oldBrand = await fndb.getItemById(tables.brands, brandId);
      if (oldBrand && oldBrand.image_url) {
        deleteBrandImage(oldBrand.image_url);
      }
    }

    if(req.file){
      const uploadResult = await uploadBrandImage(req, res);
      if (!uploadResult) {
        return res.status(500).json({ success: false, message: "Image upload failed" });
      }
    }

    const result = await fndb.updateItem(tables.brands, brandId, updates);
    if (!result) throw new Error("Brand not updated");

    res.send({ success: true, message: "Brand updated" });
  } catch (err) {
    fnCommon.logErrorMsg("editBrand", req, err.message);
    res.status(500).send({ success: false, message: "Error updating brand" });
  }
}

async function deleteBrand(req, res) {
  try {
    const brandId = req.params.id;
    await fndb.deleteItem(tables.brands, brandId);
    res.send({ success: true, message: "Brand deleted" });
  } catch (err) {
    fnCommon.logErrorMsg("deleteBrand", req, err.message);
    res.status(500).send({ success: false, message: "Error deleting brand" });
  }
}