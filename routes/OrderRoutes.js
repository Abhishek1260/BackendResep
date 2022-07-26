const express = require("express");
const JWT = require("jsonwebtoken");
const router = express.Router();
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });
const Users = require("../models/userModel");
const Products = require("../models/productModel");
const Seller = require("../models/SellerModel");
const Order = require("../models/OrdersModel");
const OrdersModel = require("../models/OrdersModel");
const { findOne } = require("../models/OrdersModel");
const userModel = require("../models/userModel");
const SellerModel = require("../models/SellerModel");

//to add the product in the order model
router.post("/orders/add", async (req, res) => {
  try {
    const { token, data, orderID } = req.body;
    //(data);
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const newAdd = {
      HouseNo: user.tempAddress.HouseNo,
      state: user.tempAddress.state,
      Street: user.tempAddress.Street,
      pincode: user.tempAddress.pincode,
      city: user.tempAddress.city,
      Landmark: user.tempAddress.Landmark,
    };
    const newArr = [];
    for (let i = 0; i < data.length; i++) {
      newArr.push({
        id: data[i].id,
        name: data[i].name,
        price: data[i].price,
        quantity: data[i].quantity,
        PaymentID: orderID,
        status: "inProgress",
        placedAt: Date.now(),
        mainPhoto: data[i].mainPhoto,
        condition: data[i].condition,
        user: id.id,
        delivery: data[i].delivery,
        address: newAdd,
      });
    }
    const order = await Order.insertMany(newArr);
    return res.status(200).json({ success: true, message: "product updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to update the status of the product from Ordered to shipper
router.post("/order/update/shipped/:id", async (req, res) => {
  // try {
  //("i am here");
  const { token, paymentID, user1 } = req.body;
  const id = JWT.decode(token, process.env.JWT_SECRET);
  const user = await Users.findById(user1.toString());
  if (!user) {
    return res.status(404).json({ success: false, message: "user not found" });
  }
  const order = await Order.findOne({
    id: req.params.id,
    PaymentID: paymentID,
  });
  if (!order) {
    return res
      .status(404)
      .json({ success: false, message: "product not found" });
  }
  order.status = "Shipped";
  await order.save();
  const newArr = [];
  //(user);
  //(newArr);
  //(user.orders.length);
  for (let i = 0; i < user.orders.length; i++) {
    //(order.id.toString());
    if (
      order.id.toString() === user.orders[i].id.toString() &&
      order.PaymentID === user.orders[i].PaymentID
    ) {
      //("this is a good thing");
      const newDict = {
        condition: user.orders[i].condition,
        id: user.orders[i].id,
        name: user.orders[i].name,
        price: user.orders[i].price,
        quantity: user.orders[i].quantity,
        mainPhoto: user.orders[i].mainPhoto,
        status: "Shipped",
        PaymentID: user.orders[i].PaymentID,
        placedAt: user.orders[i].placedAt,
      };
      newArr.push(newDict);
    } else {
      newArr.push(user.orders[i]);
    }
  }
  //(newArr + "this is a array");
  user.orders = newArr;
  await user.save();
  // } catch (error) {
  //     return res.status(500).json({success : false , message : "internal server error"})
  // }
});

//to give the orders to the seller
router.post("/order/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Seller.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const order = await Order.find();
    //(seller + "this is for seller");
    //(order + "this is for order");
    const newArr = [];
    for (let i = 0; i < seller.products.length; i++) {
      for (let j = 0; j < order.length; j++) {
        if (
          seller.products[i].Productid.toString() === order[j].id.toString()
        ) {
          newArr.push(order[j]);
        }
      }
    }
    //(newArr);
    return res.status(200).json({ success: true, product: newArr });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get a particular order
router.post("/order/get/:id", async (req, res) => {
  try {
    const { token, paymentID } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    //(user + "this is for orders");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Seller.findOne({ email: user.email });
    const order = await Order.findOne({
      id: req.params.id,
      PaymentID: paymentID,
    });
    //(order + "this is for orders");
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "order not found" });
    }
    return res.status(200).json({ success: true, order: order });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

router.post("/orders/get/order/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await userModel.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "order not found" });
    }
    return res.status(200).json({ success: true, order: order });
  } catch (error) {
    return res
      .status(500)
      .json({ success: true, message: "internal server error" });
  }
});

//to get the order details using th id tag
router.post("/order/seller/order/get/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "order not found" });
    }
    const product = await Products.findById(order.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const seller1 = await SellerModel.findById(product.user);
    if (!seller1) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    return res.status(200).json({ success: true, order: order });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to chnage the product status
router.post("/order/seller/update/shipped/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await SellerModel.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "order not found" });
    }
    const product = await Products.findById(order.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const seller1 = await SellerModel.findById(product.user);
    if (!seller1) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    if (seller._id.toString() !== seller._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "seller not verified" });
    }
    const newOrder = await Order.findByIdAndUpdate(req.params.id, {
      status: "Shipped",
    });
    const newArr = [];
    const user1 = await Users.findById(order.user);
    if (!user1) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    for (let i = 0; i < user1.orders.length; i++) {
      if (
        user1.orders[i].id.toString() === order.id.toString() &&
        user1.orders[i].PaymentID === order.PaymentID
      ) {
        const newDict = {
          condition: user1.orders[i].condition,
          id: user1.orders[i].id,
          delivery: user1.orders[i].delivery,
          name: user1.orders[i].name,
          price: user1.orders[i].price,
          quantity: user1.orders[i].quantity,
          mainPhoto: user1.orders[i].mainPhoto,
          PaymentID: user1.orders[i].PaymentID,
          status: "Shipped",
          placedAt: user1.orders[i].placedAt,
          accepted: true,
          rejected: false,
        };
        newArr.push(newDict);
      } else {
        newArr.push(user1.orders[i]);
      }
    }
    user1.orders = newArr;
    await user1.save();
    return res.status(200).json({ success: true, message: "updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to find the order given the payment ID and the product ID
router.post("/order/find/orderid/productid", async (req, res) => {
  try {
    const { token, orderid, productid } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await SellerModel.findOne({
      success: false,
      message: "seller not found",
    });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const orders = await Order.findOne({
      id: productid.toString(),
      PaymentID: orderid.toString(),
    });
    if (!orders) {
      return res
        .status(404)
        .json({ success: false, message: "order not found" });
    }
    return res.status(200).json({ success: true, order: orders });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "interal server error" });
  }
});

module.exports = router;
