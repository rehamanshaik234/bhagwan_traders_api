const multer = require("multer");
const path = require("path");

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

const upload = multer({ storage });

const uploadCategoryImage = multer({ storage: categoryImagesStorage });
const uploadSubCategoryImage = multer({ storage: subCategoryImagesStorage });
const uploadProductImage = multer({ storage: productImagesStorage });

module.exports = { upload, uploadCategoryImage, uploadSubCategoryImage, uploadProductImage };