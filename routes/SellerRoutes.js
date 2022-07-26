const express = require("express");
const Sellers = require("../models/SellerModel");
const JWT = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/userModel");
const Products = require("../models/productModel");
const bcrypt = require("bcrypt");
const AllProducts = require("../models/AllProductsmodel");
const Analytics = require("../models/ProductAnalyticsModel");
const Orders = require("../models/OrdersModel");

dotenv.config({ path: "../config/config.env" });

const router = express.Router();

//to create a seller account
router.post("/seller/register", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const seller1 = await Sellers.findOne({ email });
    //(password);
    const hashedPassword = await bcrypt.hash(password, 10);
    if (seller1) {
      return res
        .status(404)
        .json({ success: false, message: "user already exists" });
    }
    const user1 = await User.findOne({ email });
    if (user1) {
      return res.status(404).json({
        success: false,
        message: "you are already a user kindly login",
      });
    }
    const seller = await Sellers.create({
      name: name,
      email: email,
      password: hashedPassword,
    });
    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: "seller",
      avatar: {
        publicID: "this is sample id",
        url: "this is a sample url",
      },
    });
    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET);
    res
      .status(201)
      .json({ success: true, message: "the seller is created", token });
  } catch (error) {
    return res
      .status(200)
      .json({ success: false, message: "internal server error" });
  }
});

//route to create a new  product from the seller
router.post("/seller/product/add/:token", async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      condition,
      mainPhoto,
      images,
      percentageConditon,
      warranty,
      DateOfPurchase,
      color,
      batteryHealth,
      scratches,
      subCategory,
    } = req.body;
    const id = JWT.decode(req.params.token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
    let delivery = 0;
    if (price <= 1000) {
      delivery = 40;
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Sellers.findOne({ email: user.email });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message:
          "you are on a user account kindly convert to a seller account to add products",
      });
    }
    const products = await Products.create({
      name: name,
      description: description,
      price: price,
      Stock: stock,
      category: category,
      user: seller._id,
      quality: condition,
      mainPhoto: mainPhoto,
      percentageConditon: percentageConditon,
      warranty: warranty,
      DateOfPurchase: DateOfPurchase,
      color: color,
      batteryHealth: batteryHealth,
      ResepCut: Math.round(price * 0.1),
      scratches: scratches,
      subCategory: subCategory,
      verified: seller.ResepVerified,
      delivery: delivery,
    });
    const productsNew = await AllProducts.create({
      name: name,
      description: description,
      price: price,
      Stock: stock,
      category: category,
      user: seller._id,
      quality: condition,
      mainPhoto: mainPhoto,
      percentageConditon: percentageConditon,
      warranty: warranty,
      DateOfPurchase: DateOfPurchase,
      color: color,
      batteryHealth: batteryHealth,
      scratches: scratches,
      subCategory: subCategory,
      id: products._id,
      resepCut: Math.round(price * 0.1),
      delivery: delivery,
      verified: seller.ResepVerified,
    });
    const analytics = await Analytics.create({
      name: name,
      description: description,
      price: price,
      Stock: stock,
      category: category,
      user: seller._id,
      delivery: delivery,
      resepCut: Math.round(price * 0.1),
      quality: condition,
      mainPhoto: mainPhoto,
      percentageConditon: percentageConditon,
      warranty: warranty,
      DateOfPurchase: DateOfPurchase,
      color: color,
      batteryHealth: batteryHealth,
      scratches: scratches,
      subCategory: subCategory,
      verified: seller.ResepVerified,
      ProductID: products._id,
      clicks: 0,
    });
    //(analytics);
    for (let i = 0; i < images.length; i++) {
      const newArr = {
        url: images[i],
      };
      products.images.push(newArr);
    }
    await products.save();
    const newDict = {
      mainPhoto: mainPhoto,
      name: name,
      Productid: products._id,
      description: description,
      price: price,
      stock: stock,
      resepCut: Math.round(price * 0.1),
      category: category,
      condition: condition,
      percentageConditon: percentageConditon,
      warranty: warranty,
      DateOfPurchase: DateOfPurchase,
      color: color,
      batteryHealth: batteryHealth,
      delivery: delivery,
      scratches: scratches,
      subCategory: subCategory,
    };
    seller.products.push(newDict);
    seller.all.push(newDict);
    await seller.save();
    return res.status(200).json({ success: true, message: "product added" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get all the products of the seller;
router.get("/seller/product/get/:token", async (req, res) => {
  try {
    const id = JWT.decode(req.params.token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
    const product = await Products.find({ user: seller._id });
    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to update the products and make changes in them by the seller in case of change in stock or the quality
router.post("/seller/product/update/:id", async (req, res) => {
  const { token } = req.body;
  const id = JWT.decode(token, process.env.JWT_SECRET);
  const user = await User.findById(id.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "user not found" });
  }
  const seller = await Sellers.findOne({ email: user.email });
  if (!seller) {
    return res
      .status(404)
      .json({ success: false, message: "seller not found" });
  }
  for (let i = 0; i < seller.products.length; i++) {}
  const product = await Products.findById(req.params.id);
  const update = {
    Stock: product.stock,
  };
  if (req.body.stock !== null) {
    update.Stock = req.body.stock;
  }
  const product1 = await Products.findByIdAndUpdate(req.params.id, update);
  return res
    .status(200)
    .json({ success: true, message: "the product is successfully changed" });
});

//to remove a product from the seller list and from the website
router.delete("/seller/product/delete/:id", async (req, res) => {
  const { token } = req.body;
  const id = JWT.decode(token, process.env.JWT);
  const user = await User.findById(id.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "user not found" });
  }
  const seller = await Sellers.findOne({ email: user.email });
  if (!seller) {
    return res
      .status(404)
      .json({ success: false, message: "your account is not seller based" });
  }
  const product = await Products.findById(req.params.id);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "requested product Not found" });
  }
  const product1 = await Products.findByIdAndDelete(req.params.id);
  let newProducts = [];
  for (let i = 0; i < seller.products.length; i++) {
    if (seller.products[i].Productid.toString() !== req.params.id.toString()) {
      newProducts.push(seller.products[i]);
    }
  }
  seller.products = newProducts;
  await seller.save();
  const seller1 = await Sellers.findOne({ email: user.email });
  return res.status(200).json({ success: true, message: "product Removed" });
});

//route to make the seller resep verified;
router.post("/seller/verified/create", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
      //(seller.products[i]);
      seller.products[i].verified = true;
    }
    for (let i = 0; i < seller.all.length; i++) {
      seller.all[i].verified = true;
    }
    const products = await Products.updateMany(
      { user: seller._id },
      { $set: { verified: true } }
    );
    seller.ResepVerified = true;
    await seller.save();
    return res
      .status(200)
      .json({ success: true, message: "seller profile updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to check for the seller verified status
router.post("/seller/verified/check", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
    //(seller);
    //(seller.ResepVerified);
    if (!seller.ResepVerified) {
      return res.status(200).json({
        success: true,
        success1: false,
        message: "seller not verified",
      });
    }
    return res
      .status(200)
      .json({ success: true, success1: true, message: "seller verified" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//get seller from product info
router.post("/seller/find/product/:id", async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const seller = await Sellers.findById(product.user);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    return res.status(200).json({ success: true, seller });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//get seller from product info
router.post("/seller/find/product/:id", async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const seller = await Sellers.findById(product.user);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "seller not found" });
    }
    return res.status(200).json({ success: true, seller });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to create every single product from the seller a verified true;
router.post("/seller/product/verified", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
    if (seller.products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "seller has no products" });
    }
    for (let i = 0; i < seller.products.length; i++) {
      seller.products[i].verified = true;
    }
    await seller.save();
    const product = await Products.find({ user: seller._id });
    if (product.length === 0) {
      return res
        .status(404)
        .json({ success: false, messages: "seller has not products" });
    }
    await Products.updateMany(
      { user: seller._id },
      { $set: { verified: true } }
    );
    return res.status(200).json({ success: true, message: "products updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to get the in Request Products
router.post("/seller/inrequest/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
    return res.status(200).json({ success: true, req: seller.inRequest });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

router.post("/seller/inrequest/more/get", async (req, res) => {
  try {
    const { token, orderid, productid } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
    const sellerDetailsArr = [];
    for (let i = 0; i < seller.inRequest.length; i++) {
      if (
        seller.inRequest[i].productID.toString() === productid.toString() &&
        seller.inRequest[i].orderID.toString() === orderid.toString()
      ) {
        sellerDetailsArr.push(seller.inRequest[i]);
      }
    }
    return res.status(200).json({ success: true, req: sellerDetailsArr });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to remove the product from the inrequest form
router.post("/seller/inrequest/remove", async (req, res) => {
  try {
    const { token, orderid, productid } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
    const newArr = [];
    for (let i = 0; i < seller.inRequest.length; i++) {
      if (
        seller.inRequest[i].productID.toString() === productid.toString() &&
        seller.inRequest[i].orderID.toString() === orderid.toString()
      ) {
        continue;
      }
      newArr.push(seller.inRequest[i]);
    }
    seller.inRequest = newArr;
    await seller.save();
    return res.status(200).json({ success: true, message: "work done" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to make the productAccepted;
router.post("/seller/inrequest/accept", async (req, res) => {
  try {
    const { token, productid, orderid  } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
    const newArr = [];
    const order = await Orders.findOne({ id: productid, PaymentID: orderid });
    order.accepted = true;
    order.rejected = false;
    order.status = "Ordered";
    await order.save();
    const buyer = await User.findById(order.user)
    for (let i = 0; i < buyer.orders.length; i++) {
      if (
        buyer.orders[i].PaymentID.toString() === orderid.toString() &&
        buyer.orders[i].id.toString() === productid.toString()
      ) {
        //("I am here")
        newArr.push({
          condition: buyer.orders[i].condition,
          accepted: true,
          rejected: false,
          id: buyer.orders[i].id,
          name: buyer.orders[i].name,
          price: buyer.orders[i].price,
          quantity: buyer.orders[i].quantity,
          mainPhoto: buyer.orders[i].mainPhoto,
          PaymentID: buyer.orders[i].PaymentID,
          delivery: buyer.orders[i].delivery,
          status: "Ordered",
          placedAt: buyer.orders[i].placedAt,
        });
      } else {
        newArr.push(buyer.orders[i]);
      }
    }
    buyer.orders = newArr
    await buyer.save()
    return res.status(200).json({ success: true, message: "product updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to make the product rejected
router.post("/seller/inrequest/reject", async (req, res) => {
  try {
    const { token, productid, orderid } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(id.id);
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
    const newArr = [];
    const order = await Orders.findOne({ id: productid, PaymentID: orderid });
    order.accepted = false;
    order.rejected = true;
    order.status = "Canceled";
    await order.save();
    const buyer = await User.findById(order.user)
    //(buyer)
    for (let i = 0; i < buyer.orders.length; i++) {
      if (
        buyer.orders[i].PaymentID.toString() === orderid.toString() &&
        buyer.orders[i].id.toString() === productid.toString()
      ) {
        newArr.push({
          condition: buyer.orders[i].condition,
          accepted: false,
          rejected: true,
          id: buyer.orders[i].id,
          name: buyer.orders[i].name,
          price: buyer.orders[i].price,
          quantity: buyer.orders[i].quantity,
          mainPhoto: buyer.orders[i].mainPhoto,
          PaymentID: buyer.orders[i].PaymentID,
          delivery: buyer.orders[i].delivery,
          status: "Canceled",
          placedAt: buyer.orders[i].placedAt,
        });
      } else {
        newArr.push(buyer.orders[i]);
      }
    }
    // //(newArr)
    buyer.orders = newArr;
    await buyer.save()
    return res.status(200).json({ success: true, message: "product updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

module.exports = router;
