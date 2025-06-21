const multer = require("multer");
const path = require("path");

// Go outside the project folder
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"), // Go one folder up
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

module.exports = { upload };
