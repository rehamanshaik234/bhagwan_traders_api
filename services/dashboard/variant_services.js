const express = require("express");
const router = express.Router();
const authenticateToken = require("../../helpers/dashboard/authtoken.js");
const tables = require("../../helpers/dashboard/tableNames.js");
const fndb = require("../../helpers/dashboard/dbFunctions.js");
const fnCommon = require("../../helpers/dashboard/commonFunctions.js");
const { uploadProductImage,deleteProductImage } = require("../../helpers/dashboard/fileupload.js");
const { AddressCols } = require("../../helpers/dashboard/tableColumns.js");
const path = require("path");
const { variantTypes } = require("../../helpers/tableNames.js");
const tableNames = require("../../helpers/tableNames.js");



router.post("/addVariant", [authenticateToken.validJWTNeeded, addVariant]);
router.get("/getAllVariants", [authenticateToken.validJWTNeeded, getAllVariants]);
router.delete("/deleteVariant/:id", [authenticateToken.validJWTNeeded, deleteVariant]);
router.put("/editVariant/:id", [authenticateToken.validJWTNeeded, editVariant]);

async function addVariant(req, res){
    try {
        const body = req.body;
        const respone = await fndb.addNewItem(tables.productVariants, body);
        if(respone != null){
            res.status(200).json({ success: true, message: "Variant added successfully", variantId: respone });
        } else {
            res.status(500).json({ success: false, message: "Failed to add variant" });
        }
    } catch (error) {
        console.error("Error adding variant:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function getAllVariants(req, res){
    try {
        // Extract query params
        const {
        name,
        page = 1,
        limit = 10,
        sort = "v.created_at",
        order = "DESC"
        } = req.query;
        const offset = (page - 1) * limit;
        const conditions = [];
        if (name) conditions.push(`v.name LIKE '%${name}%'`);
        const variants = await fndb.customQuery(tableNames.variantTypes, `SELECT * FROM ${tables.variantTypes} AS v ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''} ORDER BY ${sort} ${order} LIMIT ${limit} OFFSET ${offset}`);
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        console.error("Error fetching variants:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function deleteVariant(req, res){
    try {
        const variantId = req.params.id;
        const response = await fndb.deleteItem(tables.productVariants, variantId);
        if(response != null){
            res.status(200).json({ success: true, message: "Variant deleted successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to delete variant" });
        }
    } catch (error) {
        console.error("Error deleting variant:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function editVariant(req, res) {
    try {
        const variantId = req.params.id;
        const body = req.body;
        const response = await fndb.updateItem(tables.productVariants, variantId, body);
        if(response != null){
            res.status(200).json({ success: true, message: "Variant updated successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to update variant" });
        }
    } catch (error) {
        console.error("Error updating variant:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

module.exports = router;
