const http = require("http");
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { connection, pool } = require("./helpers/mySQLConnector");

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 100000 })
);

app.use(cors());

app.get("/materialmartapi/", (req, res) => {
  return res.json({ message: "GPS Tracking API Service" });
});

// api routes
app.use("/materialmartapi/common", require("./services/commonservice"));
app.use("/materialmartapi/auth", require("./services/auth_service"));
app.use("/materialmartapi/customer", require("./services/customerservices"));
app.use("/materialmartapi/user", require("./services/userservice"));

var server = http.createServer(app);

// prod
//server.listen();
server.listen(3000, async () => {
  console.log(await connection());
  console.log("Listening on port 3000");
});
