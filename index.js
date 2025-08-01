const http = require("http");
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { connection, pool } = require("./helpers/mySQLConnector");
const { upload } = require("./helpers/fileupload");
const  SocketIO= require("socket.io");
const order_tracking = require("./services/socket/orders_tracking");
const order_delivery_tracking = require("./services/socket/order_delivery_tracking");
const { GoogleAuth } = require("google-auth-library");
const { getAccessToken } = require("./helpers/google_token_service");
var server = http.createServer(app);
const io = SocketIO(server);


app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 100000 })
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(cors());

app.get("/materialmartapi", (req, res) => {
  return res.json({ message: "GPS Tracking API Service" });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const _path = path.join(__dirname, "../../uploads");
    const fileUrl = `${_path.replace("\\", "/")}/${req.file.filename}`;
    res.json({
      message: "File uploaded successfully",
      fileUrl: fileUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//akshay services
app.use("/materialmartapi/dashboard/common", require("./services/dashboard/commonservice"));
app.use("/materialmartapi/dashboard/auth", require("./services/dashboard/auth_service"));
app.use("/materialmartapi/dashboard/customer", require("./services/dashboard/customerservices"));
app.use("/materialmartapi/dashboard/user", require("./services/dashboard/userservice"));
app.use("/materialmartapi/dashboard/orders", require("./services/dashboard/orders_service"));
app.use("/materialmartapi/dashboard/products", require("./services/dashboard/product_services"));
app.use("/materialmartapi/dashboard/sales", require("./services/dashboard/sale_service"));
app.use("/materialmartapi/dashboard/categories", require("./services/dashboard/category_service"));
app.use(
  "/materialmartapi/dashboard/subcategories",
  require("./services/dashboard/sub_category_services")
);


// api routes
app.use("/materialmartapi/common", require("./services/commonservice"));
app.use("/materialmartapi/auth", require("./services/auth_service"));
app.use("/materialmartapi/customer", require("./services/customerservices"));
app.use("/materialmartapi/deliveryPartner", require("./services/delivery_partner_services"));
app.use("/materialmartapi/addresses", require("./services/addresses_service"));
app.use("/materialmartapi/categories", require("./services/category_services"));
app.use(
  "/materialmartapi/subcategories",
  require("./services/sub_category_services")
);

app.use(
  "/materialmartapi/customerGst",
  require("./services/customer_gst_services")
);

app.use("/materialmartapi/products", require("./services/product_services"));
app.use("/materialmartapi/orders", require("./services/order_services"));
app.use("/materialmartapi/search", require("./services/search"));
app.use("/materialmartapi/notifications", require("./services/notification_service"));


// prod
//server.listen();
server.listen(3000, async () => {
  console.log("Listening on port 3000");
});

io.on("connection", (socket) => { 
    order_tracking(socket, io);
    order_delivery_tracking(socket, io);
  });