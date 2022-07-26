const express = require("express");
const connect = require("./server");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyparser = require("body-parser");
const router1 = require("./routes/usersRoutes");
const router2 = require("./routes/productRoutes");
const router3 = require("./routes/SellerRoutes");
const router4 = require("./routes/PaymentRoutes");
const router5 = require("./routes/CloudinaryRoutes");
const router6 = require("./routes/OrderRoutes");
const router7 = require("./routes/AdminRoutes");
const router8 = require("./routes/LocationViewRoutes");
const router9 = require("./routes/ProductAnalyticsRoute");
const path = require("path");
const cookieParser = require("cookie-parser");

dotenv.config({ path: "./config/config.env" });

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use(cors());

app.use(bodyparser.json());

connect();

app.use("/api/v1", router1);
app.use("/api/v2", router2);
app.use("/api/v3", router3);
app.use("/api/v4", router4);
app.use("/api/v5", router5);
app.use("/api/v6", router6);
app.use("/api/v7", router7);
app.use("/api/v8", router8);
app.use("/api/v9", router9);

app.use(express.static(path.join(__dirname, "./client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

app.listen(process.env.PORT, (req, res) => {
  //(`you are running on the http://localhost:${process.env.PORT}`);
});
