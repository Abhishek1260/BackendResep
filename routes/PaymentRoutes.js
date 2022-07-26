const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const Razorpay = require("razorpay");
const Products = require("../models/productModel");
const Users = require("../models/userModel");
const JWT = require("jsonwebtoken");
const crypto = require("crypto");
const shortid = require("shortid");
const router = express.Router();

router.post("/checkout/payment/process", async (req, res) => {
  try {
    const newInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const { itemID, token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const product = await Products.findById(itemID);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }

    const price = product.price * user.buyNowCart.quantity;
    let delivery = product.delivery;
    const amount = price + delivery;
    const Orderid = shortid.generate();
    const currency = "INR";
    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: Orderid,
    };
    const order = await newInstance.orders.create(options);
    if (!order) {
      return res
        .status(500)
        .json({ success: false, message: "the server didn't responded" });
    }
    return res.status(200).json({
      success: true,
      message: "order created",
      order,
      quantity: user.buyNowCart.quantity,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

router.post("/checkout/payment/multiple", async (req, res) => {
  try {
    const newInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    //("i am here 1");
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    //(id.id);
    const user = await Users.findById(id.id);
    //("i am here 2");
    //(user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    let price = 0;
    for (let i = 0; i < user.cart.length; i++) {
      price +=
        user.cart[i].price * user.cart[i].quantity + user.cart[i].delivery;
    }
    //("i am here 3");
    const amount = price;
    const Orderid = shortid.generate();
    const currency = "INR";
    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: Orderid,
    };
    //(options);
    //("i am here 4");
    const order = await newInstance.orders.create({
      amount: amount * 100,
      currency: currency,
      receipt: Orderid,
    });
    //(order);
    //("i am here 5");
    if (!order) {
      return res
        .status(500)
        .json({ success: false, message: "the server didn't responded" });
    }
    return res
      .status(200)
      .json({ success: true, message: "order created", order });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

router.post("/checkout/payment/process/buyNowCart", async (req, res) => {
  try {
    const newInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const price = user.buyNowCart.price * user.buyNowCart.quantity;
    const delivery = user.buyNowCart.delivery;
    const amount = price + delivery;
    const Orderid = shortid.generate();
    const currency = "INR";
    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: Orderid,
    };
    const order = await newInstance.orders.create(options);
    if (!order) {
      return res
        .status(500)
        .json({ success: false, message: "the server didn't responded" });
    }
    return res.status(200).json({
      success: true,
      message: "order created",
      order,
      quantity: user.buyNowCart.quantity,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

router.post("/checkout/payment/getAPIkey", async (req, res) => {
  return res
    .status(200)
    .json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

router.post("/checkout/payment/check", async (req, res) => {
  try {
    const { token } = req.body;
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");
    if (!(digest === razorpaySignature)) {
      return res
        .json(401)
        .json({ success: false, message: "payment not legit" });
    }
    const id = JWT.decode(token, process.env.JWT_SECRET);
    return res.status(200).json({ success: true, message: "payment success" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to make the payment for the resep verified
router.post("/checkout/payment/seller/verified", async (req, res) => {
  try {
    const newInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
    const price = 200;
    const amount = price;
    const Orderid = shortid.generate();
    const currency = "INR";
    const options = {
      amount: amount * 100,
      currency: currency,
      receipt: Orderid,
    };
    const order = await newInstance.orders.create(options);
    if (!order) {
      return res
        .status(500)
        .json({ success: false, message: "the server didn't responded" });
    }
    return res
      .status(200)
      .json({ success: true, message: "order created", order });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

module.exports = router;
