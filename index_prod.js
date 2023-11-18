const http = require("http");
const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 100000 })
);

app.use(cors());

app.get("/vctrackingapi/", (req, res) => {
  res.json({ message: "GPS Tracking API Service" });
});

// api routes
app.use("/vctrackingapi/common", require("./services/commonservice"));
app.use("/vctrackingapi/user", require("./services/userservice"));

// start server
var server = http.createServer(app);
server.listen();