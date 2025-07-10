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
var server = http.createServer(app);
const io = SocketIO(server);


app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 100000 })
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(cors());

app.get("/materialmartapi/", (req, res) => {
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


// api routes
app.use("/materialmartapi/common", require("./services/commonservice"));
app.use("/materialmartapi/auth", require("./services/auth_service"));
app.use("/materialmartapi/customer", require("./services/customerservices"));
app.use("/materialmartapi/addresses", require("./services/addresses_service"));
app.use(
  "/materialmartapi/customerGst",
  require("./services/customer_gst_services")
);


// prod
//server.listen();
server.listen(3000, async () => {
  console.log(await connection());
  console.log("Listening on port 3000");
});

io.on("connection", (socket) => { 
    order_tracking(socket, io);
    order_delivery_tracking(socket, io);
  });