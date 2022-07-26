const express = require("express");
const router = express.Router();
const JWT = require("jsonwebtoken");
const dotenv = require("dotenv");
const Users = require("../models/userModel");
const Orders = require("../models/OrdersModel");
const SellerModel = require("../models/SellerModel");
const Products = require("../models/productModel");
const userModel = require("../models/userModel");
const location = require("../models/LocationModelForView");

//config the dotenv
dotenv.config({ path: "../config/config.env" });

//to get the total sales till date
router.post("/admin/order/count", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "not authorized to view this content",
      });
    }
    const orders = await Orders.find();
    return res.status(200).json({ success: true, count: orders.length });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get the total sum of the price of order till date
router.post("/admin/order/price", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: "not authorized to view this content",
      });
    }
    const order = await Orders.find();
    let price = 0;
    for (let i = 0; i < order.length; i++) {
      price += parseInt(order[i].price) * parseInt(order[i].quantity);
    }
    deliveryCharges = order.length * 200;
    return res
      .status(200)
      .json({ success: true, amount: price, deliveryCharge: deliveryCharges });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get all the user details
router.post("/admin/user/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const users = await Users.find();
    const newArr = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i].role === "user") {
        newArr.push(users[i]);
      }
    }
    return res.status(200).json({ success: true, users: newArr });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get the details of every seller
router.post("/admin/seller/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const seller = await SellerModel.find();
    return res.status(200).json({ success: true, sellers: seller });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "interal server error" });
  }
});

//to get the amount that the seller has made till now
router.post("/admin/seller/amount/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ succes: false, message: "not authorized to access" });
    }
    const order = await Orders.find();
    const seller = await SellerModel.findById(req.params.id);
    let price = 0;
    for (let i = 0; i < seller.products.length; i++) {
      for (let j = 0; j < order.length; j++) {
        if (
          seller.products[i].Productid.toString() === order[j].id.toString()
        ) {
          price += parseInt(order[j].price) * parseInt(order[j].quantity);
        }
      }
    }
    return res.status(200).json({ success: true, price: price });
  } catch (error) {
    return res
      .status(500)
      .json({ succes: false, message: "internal server error" });
  }
});

//route to remove the seller from the list
router.post("/admin/seller/delete/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const seller = await SellerModel.findById(req.params.id);
    const product = await Products.deleteMany({ user: seller._id });
    const user1 = await Users.findOne({ email: seller.email });
    const seller1 = await SellerModel.findByIdAndDelete(req.params.id);
    user1.role = "user";
    await user1.save();
    return res.status(200).json({ success: true, message: "seller deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to delete a user
router.post("/admin/user/delete/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const user1 = await Users.findById(req.params.id);
    if (!user1) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const user2 = await Users.findByIdAndDelete(req.params.id);
    //(user2);
    return res.status(200).json({ success: true, message: "user deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to chnage the role of the user to admin
router.post("/admin/user/admin/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res.status(404).json({ success: true, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const user1 = await Users.findById(req.params.id);
    if (!user1) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user1.email === user.email) {
      return res.status(401).json({ success: false, message: "not allowed" });
    }
    user1.role = "admin";
    await user1.save();
    return res
      .status(200)
      .json({ success: true, message: "user role changed" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to get the details of a particular user
router.post("/admin/user/get/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const user1 = await Users.findById(req.params.id);
    if (!user1) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "user found", user: user1 });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to get the seller details for the admin
router.post("/admin/seller/get/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const seller = await SellerModel.findById(req.params.id);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    return res.status(200).json({ success: true, seller: seller });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get the state where the most viewers are
router.post("/admin/location/max", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const locations = await location.find();
    let max = 0;
    let count = 0;
    let curr_state = "";
    let max_state = "";
    for (let i = 0; i < locations.length; i++) {
      curr_state = locations[i].state;
      for (let k = 0; k < locations[i].city.length; k++) {
        count += parseInt(locations[i].city[k].count);
      }
      if (count > max) {
        max = count;
        max_state = curr_state;
      }
      count = 0;
      curr_state = "";
    }
    return res.status(200).json({ success: true, state: max_state });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get the details of the admin
router.post("/admin/me", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    return res.status(200).json({ success: true, user: user });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get all the admins
router.post("/admin/admin/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const newArr = [];
    const user1 = await Users.find();
    for (let i = 0; i < user1.length; i++) {
      if (user1[i].role === "admin") {
        newArr.push(user1[i]);
      }
    }
    return res.status(200).json({ success: true, admin: newArr });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to make a admin user
router.post("/admin/change/admin/user", async (req, res) => {
  try {
    const { token, email } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const user1 = await Users.findOne({ email: email });
    if (!user1) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    user1.role = "user";
    await user1.save();
    return res.status(200).json({ success: true, message: "admin made user" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

module.exports = router;
