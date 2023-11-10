const http = require("http");
const express = require("express");
const app = express();
const cors = require("cors");
let cacheProvider = require("./helpers/cacheProvider");

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 100000 })
);

app.use(cors());

cacheProvider.start();

app.get("/gpsapi/", (req, res) => {
  res.json({ message: "GPS Tracking API Service" });
});

// api routes
app.use("/gpsapi/common", require("./services/commonservice"));
app.use("/gpsapi/user", require("./services/userservice"));

var server = http.createServer(app);

// prod
//server.listen();
server.listen(3000, () => {
  console.log('Listening on port 3000');
});