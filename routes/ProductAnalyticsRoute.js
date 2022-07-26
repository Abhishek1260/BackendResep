const express = require("express");
const JWT = require("jsonwebtoken");
const Users = require("../models/userModel");
const Sellers = require("../models/SellerModel");
const Products = require("../models/productModel");
const Analytics = require("../models/ProductAnalyticsModel");
const Orders = require("../models/OrdersModel");
const AllProducts = require("../models/AllProductsmodel");
const dotenv = require("dotenv");

dotenv.config({ path: "../config/cofig.env" });

const router = express.Router();

//router to get the product analytics
router.post("/analytics/get/seller/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const products = await Analytics.findOne({
      ProductID: req.params.id,
      email: user.email,
      user: seller._id,
    });
    if (!products) {
      //("1");
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    return res.status(200).json({ success: true, product: products });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to get the total price of the order
router.post("/analytics/seller/total/price/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    if (product.user.toString() !== seller._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const orders = await Orders.find({ id: product._id });
    let price = 0;
    let quantity = 0;
    for (let i = 0; i < orders.length; i++) {
      price += parseInt(orders[i].price) * parseInt(orders[i].quantity);
      quantity += parseInt(orders[i].quantity);
    }
    return res
      .status(200)
      .json({ success: true, price: price, quantity: quantity });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to chnage the stock of the product across all
router.post("/analytics/seller/stock/change/:id", async (req, res) => {
  try {
    const { token, stock } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    for (let i = 0; i < seller.products.length; i++) {
      if (
        seller.products[i].Productid.toString() === req.params.id.toString()
      ) {
        seller.products[i].stock = stock;
      }
    }
    for (let i = 0; i < seller.all.length; i++) {
      if (seller.all[i].Productid.toString() === req.params.id.toString()) {
        seller.all[i].stock = stock;
      }
    }
    await seller.save();
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    if (product.user.toString() !== seller._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    product.Stock = stock;
    await product.save();
    const Allproduct = await AllProducts.findOne({ id: product._id });
    if (!Allproduct) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    Allproduct.Stock = stock;
    await Allproduct.save();
    const analytics = await Analytics.findOne({ ProductID: product._id });
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "product not found in the analytics page",
      });
    }
    analytics.Stock = stock;
    await analytics.save();
    return res.status(200).json({ success: true, message: "stock updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to change the description for the products
router.post("/analytics/seller/description/change/:id", async (req, res) => {
  try {
    const { token, desci } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const product = await Products.findById(req.params.id);
    if (!product) {
      return re
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    if (product.user.toString() !== seller._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const allProducts = await AllProducts.findOne({ id: product._id });
    if (!allProducts) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const ana = await Analytics.findOne({ ProductID: product._id });
    if (!ana) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    product.description = desci;
    allProducts.description = desci;
    ana.description = desci;
    await product.save();
    await allProducts.save();
    await ana.save();
    for (let i = 0; i < seller.products.length; i++) {
      if (
        seller.products[i].Productid.toString() === req.params.id.toString()
      ) {
        seller.products[i].description = desci;
      }
    }
    for (let i = 0; i < seller.all.length; i++) {
      if (seller.all[i].Productid.toString() === req.params.id.toString()) {
        seller.all[i].description = desci;
      }
    }
    await seller.save();
    return res.status(200).json({ success: true, message: "product updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to change the product condition
router.post("/analytics/seller/condition/change/:id", async (req, res) => {
  try {
    const { condition, token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const products = await Products.findById(req.params.id);
    if (!products) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    if (products.user.toString() !== seller._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const allProducts = await AllProducts.findOne({ id: products._id });
    if (!allProducts) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const Ana = await Analytics.findOne({ ProductID: products._id });
    if (!Ana) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    for (let i = 0; i < seller.products.length; i++) {
      if (
        seller.products[i].Productid.toString() === req.params.id.toString()
      ) {
        seller.products[i].condition = condition;
      }
    }
    for (let i = 0; i < seller.all.length; i++) {
      if (seller.all[i].Productid.toString() === req.params.id.toString()) {
        seller.products[i].all = condition;
      }
    }
    products.quality = condition;
    allProducts.quality = condition;
    Ana.quality = condition;
    await products.save();
    await allProducts.save();
    await Ana.save();
    await seller.save();
    return res.status(200).json({ success: true, message: "product updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to make the product not listed and delete from the database
router.post("/analytics/seller/product/delete/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    if (product.user.toString() !== seller._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const allProducts = await AllProducts.findOne({ id: product._id });
    if (!allProducts) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const Ana = await Analytics.findOne({ ProductID: product._id });
    if (!Ana) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    allProducts.listed = false;
    Ana.listed = false;
    const productDeleted = await Products.findByIdAndDelete(req.params.id);
    for (let i = 0; i < seller.products.length; i++) {
      if (
        seller.products[i].Productid.toString() === req.params.id.toString()
      ) {
        seller.products[i].listed = false;
      }
    }
    for (let i = 0; i < seller.all.length; i++) {
      if (seller.all[i].Productid.toString() === req.params.id.toString()) {
        seller.all[i].listed = false;
      }
    }
    await allProducts.save();
    await Ana.save();
    await seller.save();
    return res.status(200).json({ success: true, message: "updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get the product of the seller
router.post("/analytics/seller/product/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const AllProduct = await AllProducts.find({ user: seller._id });
    return res.status(200).json({ success: true, product: AllProduct });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to deactivate the product
router.post("/analytics/product/seller/deactivate/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    if (product.user.toString() !== seller._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const allProducts = await AllProducts.findOne({ id: product._id });
    if (!allProducts) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const ana = await Analytics.findOne({ ProductID: product._id });
    if (!ana) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    product.listed = false;
    // const newProduct = await Products.findByIdAndDelete(req.params.id);
    ana.listed = false;
    allProducts.listed = false;
    for (let i = 0; i < seller.products.length; i++) {
      if (
        seller.products[i].Productid.toString() === req.params.id.toString()
      ) {
        seller.products[i].listed = false;
        break;
      }
    }
    for (let i = 0; i < seller.all.length; i++) {
      if (seller.all[i].Productid.toString() === req.params.id.toString()) {
        seller.all[i].listed = false;
        break;
      }
    }
    await seller.save();
    await allProducts.save();
    await ana.save();
    await product.save();
    return res.status(200).json({ success: true, message: "product removed" });
  } catch (error) {
    //(error);
    return res
      .status(404)
      .json({ success: false, message: "internal server error" });
  }
});

//router to make the product listed again
router.post("/analytics/product/seller/activate/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found 1" });
    }
    if (product.user.toString() !== seller._id.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const allProducts = await AllProducts.findOne({ id: product._id });
    if (!allProducts) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const ana = await Analytics.findOne({ ProductID: product._id });
    if (!ana) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    product.listed = true;
    // const newProduct = await Products.findByIdAndDelete(req.params.id);
    ana.listed = true;
    allProducts.listed = true;
    for (let i = 0; i < seller.products.length; i++) {
      if (
        seller.products[i].Productid.toString() === req.params.id.toString()
      ) {
        seller.products[i].listed = true;
        break;
      }
    }
    for (let i = 0; i < seller.all.length; i++) {
      if (seller.all[i].Productid.toString() === req.params.id.toString()) {
        seller.all[i].listed = true;
        break;
      }
    }
    await seller.save();
    await allProducts.save();
    await ana.save();
    await product.save();
    return res.status(200).json({ success: true, message: "product removed" });
  } catch (error) {}
});

module.exports = router;
