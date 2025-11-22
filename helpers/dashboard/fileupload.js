const multer = require("multer");
const path = require("path");
const fs = require('fs');

// Go outside the project folder
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../../uploads"), // Go one folder up
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const categoryImagesStorage = multer.diskStorage({
  destination: path.join(__dirname, "../../../uploads/category"), // Go one folder up
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const subCategoryImagesStorage = multer.diskStorage({
  destination: path.join(__dirname, "../../../uploads/subcategory"), // Go one folder up
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const productImagesStorage = multer.diskStorage({
  destination: path.join(__dirname, "../../../uploads/product"), // Go one folder up
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});


function deleteProductImage(fileUrl) {
  try {
    if (!fileUrl) return;

    // Extract filename from URL
    const filename = fileUrl.split("/").pop();  

    // Absolute file path in your server
    const filePath = path.join(__dirname, "../../../uploads/product", filename);

    // Check if file exists, then delete
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted file:", filename);
    } else {
      console.log("File not found:", filename);
    }

  } catch (err) {
    console.error("Error deleting file:", err);
  }
}

const upload = multer({ storage });

const uploadCategoryImage = multer({ storage: categoryImagesStorage });
const uploadSubCategoryImage = multer({ storage: subCategoryImagesStorage });
const uploadProductImage = multer({ storage: productImagesStorage });

module.exports = { upload, uploadCategoryImage, uploadSubCategoryImage, uploadProductImage, deleteProductImage};