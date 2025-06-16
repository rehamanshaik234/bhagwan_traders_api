const http = require("http");
const express = require("express");
const app = express();
const cors = require("cors");
const { connection, pool } = require("./helpers/mySQLConnector");

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 100000 })
);

app.use(cors());

app.get("/bhagwantradersapi/", (req, res) => {
  return res.json({ message: "GPS Tracking API Service" });
});

// api routes
app.use("/bhagwantradersapi/common", require("./services/commonservice"));
app.use("/bhagwantradersapi/user", require("./services/userservice"));

var server = http.createServer(app);

// prod
//server.listen();
server.listen(3000, async () => {
  console.log(await connection());
  console.log("Listening on port 3000");
});
