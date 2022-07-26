const express = require("express");
const Users = require("../models/userModel");
const bcrypt = require("bcrypt");
const JWTToken = require("jsonwebtoken");
const router = express.Router();
const dotenv = require("dotenv");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const Products = require("../models/productModel");
const Seller = require("../models/SellerModel");

dotenv.config({ path: "../config/config.env" });

//to register the user
router.post("/user/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user1 = await Users.findOne({ email });
    if (user1) {
      return res
        .status(400)
        .json({ success: false, message: "user already exists" });
    }
    const user = await Users.create({
      name,
      email,
      password: hashedPassword,
      avatar: {
        publicID: "this is sample id",
        url: "this is a sample url",
      },
    });
    const token = JWTToken.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES,
    });
    const options = {
      httpOnly: true,
    };
    return res.status(201).cookie("token", token, options).json({
      success: true,
      message: "the user is created successfully",
      token,
    });
  } catch (error) {
    //(error);
    return res.status(401).json({
      success: false,
      message: "Not a valid email",
    });
  }
});

//to login the user;
router.post("/user/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({
      success: false,
      message: "please enter your email and password",
    });
  }
  const user = await Users.findOne({ email }).select("+password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const result = await bcrypt.compare(password, user.password);
  if (!result) {
    return res
      .status(404)
      .json({ success: false, message: "user not found :P" });
  }
  const token = JWTToken.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  const options = {
    httpOnly: true,
  };
  return res
    .status(201)
    .cookie("token", token, options)
    .json({ success: true, message: "login success", token });
});

//to logout user
router.get("/user/logoff", async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(403)
        .json({ success: false, message: "User not logged off" });
    }
    return res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
      .json({ success: true, message: "logoff success" });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "internal server error" });
  }
});

//to generate a forgot password token
router.post("/user/reset", async (req, res) => {
  try {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const user = await Users.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not foundF" });
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
    user.OTP = otp;
    // user.resetPasswordToken = resetPasswordHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; //
    user.save();
    const restPasswordToken = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/user/reset/${resetToken}`;
    // const message = `your reset password link is :- \n\n\ ${restPasswordToken} \n\n\ if haven't requested kindly ignore`
    const message = `your reset password OTP is :- \n\n\ ${otp} \n\n\ if haven't requested kindly ignore`;
    try {
      await sendEmail({
        email: user.email,
        subject: "shopping password recovery",
        message: message,
      });

      return res.status(200).json({
        success: true,
        message: `email sent to ${user.email} successfully`,
      });
    } catch (error) {
      // user.resetPasswordToken = undefined;
      user.OTP = undefined;
      user.resetPasswordExpire = undefined;
      user.save();
      //(error);
      return res
        .status(500)
        .json({ success: false, message: "kindly try again later" });
    }
  } catch (error) {
    return res
      .status(404)
      .json({ success: false, message: "internal server error" });
  }
});

//to change the password for the token
router.put("/user/reset/:token", async (req, res) => {
  try {
    const resetPasswordHash = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await Users.findOne({
      resetPasswordToken: resetPasswordHash,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "reset password token is invalid or expired",
      });
    }
    if (req.body.pass !== req.body.confirmPass) {
      return res
        .status(400)
        .json({ success: false, message: "passwords doesn't match" });
    }
    user.password = await bcrypt.hash(req.body.pass, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return res.status(201).json({ success: true, message: "password changed" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route for the OTP authentication
router.post("/user/reset/OTP", async (req, res) => {
  try {
    const user = await Users.findOne({
      OTP: req.body.OTP,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "reset password token is invalid or expired",
      });
    }
    user.OTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return res.status(201).json({ success: true, message: "OTP verified" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

router.post("/user/reset/OTP/rebuild", async (req, res) => {
  try {
    const user = await Users.findOne({
      OTP: req.body.OTP,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "reset password token is invalid or expired",
      });
    }
    return res.status(201).json({ success: true, message: "OTP verified" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to check set the password
router.post("/user/reset/password/rebuild", async (req, res) => {
  try {
    const { Pass, cPass, OTP } = req.body;
    const user = await Users.findOne({
      OTP: OTP,
      resetPasswordExpire: { $gt: Date.now() },
    });
    //(Pass);
    //(cPass);
    //(OTP);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "reset password token is invalid or expired",
      });
    }
    if (!(Pass === cPass)) {
      return res
        .status(404)
        .json({ success: false, message: "confirm password doesnt match" });
    }
    user.password = await bcrypt.hash(Pass, 10);
    user.OTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "the passwords changed" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to check set the password
router.post("/user/reset/password", async (req, res) => {
  try {
    const { Pass, cPass, email } = req.body;
    const user = await Users.findOne({ email });
    if (!(Pass === cPass)) {
      return res
        .status(404)
        .json({ success: false, message: "confirm password doesnt match" });
    }
    user.password = await bcrypt.hash(Pass, 10);
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "the passwords changed" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get user details
router.put("/user/me/:token", async (req, res) => {
  try {
    if (!req.params.token) {
      return res
        .status(404)
        .json({ success: false, message: "kindly login first" });
    }
    const id = JWTToken.decode(req.params.token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    return res.status(200).json({ success: true, message: "user found", user });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to add the products in the buy now cart
router.post("/user/buynow/add/:id", async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const { quantity, token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    //(id);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    let delivery = 0;
    if (product.price <= 1000) {
      delivery = 40;
    }
    const cart = {
      name: product.name,
      condition: product.quality,
      price: product.price,
      id: req.params.id,
      quantity: quantity,
      mainPhoto: product.mainPhoto,
      delivery: delivery,
    };
    //(cart);
    const user1 = await Users.findByIdAndUpdate(id.id, { buyNowCart: cart });
    const user2 = await Users.findById(id.id);
    //(user2);
    return res
      .status(200)
      .json({ success: true, message: "product updated", user2 });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get the buynow products
router.put("/user/buynow/get/:token", async (req, res) => {
  try {
    const id = JWTToken.decode(req.params.token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    if (user.buyNowCart.name === undefined) {
      return res
        .status(404)
        .json({ success: false, message: "product in the cart not found" });
    }
    return res.status(200).json({ success: true, product: user.buyNowCart });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to make the buy now cart content undefined
router.put("/user/buynow/remove/:token", async (req, res) => {
  try {
    const id = JWTToken.decode(req.params.token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const cart = {
      name: undefined,
      price: undefined,
      id: undefined,
      quantity: undefined,
    };
    const user1 = await Users.findByIdAndUpdate(id.id, { buyNowCart: cart });
    return res.status(200).json({
      success: true,
      message: "The product was removed from the cart",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to add the products to the wishlist
router.post("/user/wishlist/add/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    //(user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const product1 = {
      name: product.name,
      price: product.price,
      id: req.params.id,
      condition: product.quality,
      mainPhoto: product.mainPhoto,
    };
    user.wishlist.push(product1);
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Product Added to the wishlist" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to check if the product is in the wishlist of the user
router.post("/user/wishlist/check/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    for (let i = 0; i < user.wishlist.length; i++) {
      if (user.wishlist[i].id.toString() === req.params.id.toString()) {
        return res.status(200).json({
          success: true,
          success1: true,
          message: "product in wishlist",
        });
      }
    }
    return res.status(404).json({
      success: true,
      success1: false,
      message: "product Not in wishlist",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get the products from the wishlist
router.put("/user/wishlist/get/:token", async (req, res) => {
  try {
    const id = JWTToken.decode(req.params.token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    return res.status(200).json({ success: true, product: user.wishlist });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to remove the product from the wishlist
router.delete("/user/wishlist/delete/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const newWishlist = user.wishlist.filter((product) => {
      if (product.id.toString() !== req.params.id.toString()) {
        return product;
      }
    });
    user.wishlist = newWishlist;
    await user.save();
    const user1 = await Users.findById(id.id);
    return res
      .status(200)
      .json({ success: true, message: "the product was removed", user1 });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to add the orders in the list of orders
router.post("/user/order/add/:id", async (req, res) => {
  try {
    const { orderID, token, quantity } = req.body;
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const seller = await Seller.findById(product.user);
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Internal server error" });
    }
    const newProductForSeller = {
      userId: id.id,
      quantity: quantity,
      productID: req.params.id,
      orderID : orderID , 
      accepted : false , 
      rejected : false
    };
    seller.inRequest.push(newProductForSeller);
    await seller.save();
    const newOrder = {
      id: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      PaymentID: orderID,
      status: "InProcess",
      placedAt: Date.now(),
      mainPhoto: product.mainPhoto,
      condition: product.quality,
      delivery : product.delivery,
      accepted : false , 
      rejected : false
    };
    user.orders.push(newOrder);
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "order placed successfully" });
  } catch (error) {
    //(error)
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get all the orders placed by someone
router.put("/user/order/get/:token", async (req, res) => {
  try {
    const id = JWTToken.decode(req.params.token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    return res.status(200).json({ success: true, product: user.orders });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to add products in cart
router.post("/user/cart/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    //(user.cart);
    return res.status(200).json({ success: true, products: user.cart });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to add product to cart
router.post("/user/cart/add/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    for (let i = 0; i < user.cart.length; i++) {
      if (user.cart[i].id.toString() === req.params.id.toString()) {
        return res
          .status(201)
          .json({ success: false, message: "product already in the cart" });
      }
    }
    const product = await Products.findById(req.params.id);
    let delivery = 0;
    if (product.price <= 1000) {
      delivery = 40;
    }
    for (let i = 0; i < user.cart.length; i++) {
      if (user.cart[i].seller.toString() === product.user.toString()) {
        delivery = 0;
      }
    }
    const newProduct = {
      name: product.name,
      price: product.price,
      id: req.params.id.toString(),
      quantity: 1,
      mainPhoto: product.mainPhoto,
      condition: product.quality,
      seller: product.user,
      delivery: delivery,
    };
    user.cart.push(newProduct);
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "product added to cart" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get the total price of the products
router.post("/user/cart/price/:token", async (req, res) => {
  try {
    const id = JWTToken.decode(req.params.token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    let price = 0;
    for (let i = 0; i < user.cart.length; i++) {
      price += user.cart[i].price;
    }
    return res
      .status(200)
      .json({ success: true, message: "price is calculated", price: price });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to update quantity of the buynow
router.post("/user/buynow/update/:id", async (req, res) => {
  try {
    const { quantity, token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    user.buyNowCart.quantity = quantity;
    await user.save();
    return res
      .status(200)
      .json({ success: true, nessage: "product updated successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to update the add to cart quantity
router.post("/user/cart/update/:id", async (req, res) => {
  try {
    const { quantity, token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const newArr = [];
    for (let i = 0; i < user.cart.length; i++) {
      if (user.cart[i]._id.toString() === req.params.id.toString()) {
        newArr.push({
          name: user.cart[i].name,
          mainPhoto: user.cart[i].mainPhoto,
          price: user.cart[i].price,
          id: user.cart[i].id,
          quantity: quantity,
          _id: user.cart[i]._id,
          delivery: user.cart[i].delivery,
          seller: user.cart[i].seller,
          condition: user.cart[i].condition,
        });
      } else {
        newArr.push(user.cart[i]);
      }
    }
    user.cart = newArr;
    await user.save();
    return res.status(200).json({ success: true, message: "product updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to give the sum of items in the cart
router.post("/user/cartItems/price/:token", async (req, res) => {
  try {
    const id = JWTToken.decode(req.params.token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    let amount = 0;
    let delivery = 0;
    for (let i = 0; i < user.cart.length; i++) {
      amount += user.cart[i].price * user.cart[i].quantity;
      delivery += user.cart[i].delivery;
    }
    return res
      .status(200)
      .json({ success: true, price: amount, delivery: delivery });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to remove a product from the cart
router.post("/user/cart/remove/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const newArr = [];
    for (let i = 0; i < user.cart.length; i++) {
      if (user.cart[i]._id.toString() === req.params.id.toString()) {
      } else {
        newArr.push(user.cart[i]);
      }
    }
    user.cart = newArr;
    await user.save();
    return res.status(200).json({ success: true, message: "product deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to add multiple orders in the user account
router.post("/user/order/add", async (req, res) => {
  try {
    const { data, token, orderID } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const idArr = [];
    for (let i = 0; i < data.length; i++) {
      // seller.inRequest.push({
      //   userId: id.id,
      //   quantity: quantity,
      //   productID: req.params.id,
      // })
      idArr.push({
        id: data[i].id,
        quantity: data[i].quantity,
      });
      user.orders.push({
        id: data[i].id,
        name: data[i].name,
        price: data[i].price,
        quantity: data[i].quantity,
        PaymentID: orderID,
        status: "inProgress",
        placedAt: Date.now(),
        delivery: data[i].delivery,
        mainPhoto: data[i].mainPhoto,
        condition: data[i].condition,
      });
    }
    idArr.forEach(async (event) => {
      const products = await Products.findById(event.id);
      const seller = await Seller.findById(products.user);
      seller.inRequest.push({
        orderID: orderID,
        userId: id.id,
        quantity: event.quantity,
        productID: event.id,
      });
      await seller.save();
    });
    await user.save();
    return res.status(200).json({ success: true, message: "product added" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get a specific order of a user
router.post("/user/order/get/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    for (let i = 0; i < user.orders.length; i++) {
      if (user.orders[i].id.toString() === req.params.id.toString()) {
        return res.status(200).json({ success: true, product: user.orders[i] });
      }
    }
    //(user);
    return res
      .status(404)
      .json({ success: false, message: "product not found" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to add the address of a user
router.post("/user/address/create", async (req, res) => {
  try {
    const { token, HouseNo, Street, Landmark, city, pincode, state, tag } =
      req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const newAddress = {
      HouseNo,
      Street,
      Landmark,
      pincode,
      state,
      city,
      tag,
    };
    if (tag === "Home") {
      for (let i = 0; i < user.address.length; i++) {
        if (user.address[i].tag === "Home") {
          return res
            .status(200)
            .json({ success: false, messaage: "Home tag already found" });
        }
      }
      const newDict = {
        HouseNo,
        Street,
        Landmark,
        pincode,
        state,
        city,
      };
      user.homeAddress = newDict;
    }
    user.address.push(newAddress);
    await user.save();
    return res.status(200).json({ success: true, message: "address updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to get the address of the user
router.post("/user/address/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    return res.status(200).json({ success: true, address: user.address });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to set the temp address
router.post("/user/address/temp/create/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    let tempAddress = {};
    for (let i = 0; i < user.address.length; i++) {
      if (user.address[i]._id.toString() === req.params.id.toString()) {
        tempAddress = {
          HouseNo: user.address[i].HouseNo,
          Street: user.address[i].Street,
          Landmark: user.address[i].Landmark,
          pincode: user.address[i].pincode,
          state: user.address[i].state,
          city: user.address[i].city,
        };
      }
    }
    //(tempAddress);
    user.tempAddress = tempAddress;
    await user.save();
    return res
      .status(200)
      .json({ success: true, messaage: "product address updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, messaage: "internal server error" });
  }
});

router.post("/user/address/temp/get", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    return res.status(200).json({ success: true, address: user.tempAddress });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, messaage: "internal server error" });
  }
});

//route to check if the home tag is taken or not
router.post("/user/address/check/home", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, success1: false, messaage: "user not found" });
    }
    for (let i = 0; i < user.address.length; i++) {
      if (user.address[i].tag === "Home") {
        return res
          .status(200)
          .json({ success: true, messaage: "Home tag used" });
      }
    }
    return res
      .status(200)
      .json({ success: false, success1: true, messaage: "Home tag not used" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, messaage: "internal server error" });
  }
});

//route to check if Work tag is used
router.post("/user/address/check/work", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, success1: false, messaage: "user not found" });
    }
    for (let i = 0; i < user.address.length; i++) {
      if (user.address[i].tag === "Work") {
        return res
          .status(200)
          .json({ success: true, messaage: "Work Tag used" });
      }
    }
    return res
      .status(200)
      .json({ success: false, success1: true, messaage: "Work Tag not used" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, messaage: "internal server error" });
  }
});

//route to get the homeAddress route
router.post("/user/address/get/home", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    return res.status(200).json({ success: true, address: user.homeAddress });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get the user from the id
router.post("/user/find/:id", async (req, res) => {
  try {
    const user = await Users.findById(req.params.id);
    //(user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    return res.status(200).json({ success: true, user: user });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to find the order using the id
router.post("/user/order/find/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    for (let i = 0; i < user.orders.length; i++) {
      if (user.orders[i]._id.toString() === req.params.id.toString()) {
        return res.status(200).json({ success: true, orders: user.orders[i] });
      }
    }
    return res.status(404).json({ success: false, message: "order not found" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, messaage: "internal server error" });
  }
});

//router to change the password for the logged in use
router.post("/user/change/password/", async (req, res) => {
  try {
    const { token, oldPass, newPass, cNewPass } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    const checker = await bcrypt.compare(oldPass, user.password);
    if (!checker) {
      return res
        .status(401)
        .json({ success: false, messaage: "Password incorrect" });
    }
    if (newPass !== cNewPass) {
      return res
        .status(400)
        .json({ success: false, messaage: "new password not matching" });
    }
    const newCryptedPass = await bcrypt.hash(newPass, 10);
    user.password = newCryptedPass;
    await user.save();
    return res.status(200).json({ success: true, messaage: "user updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, messaage: "internal server error" });
  }
});

//router to find the price of the cart in of the use
router.post("/user/cart/price/get/all", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    let price = 0;
    let delivery = 0;
    for (let i = 0; i < user.cart.length; i++) {
      price += parseInt(user.cart[i].price) * parseInt(user.cart[i].quantity);
      delivery += parseInt(user.cart[i].delivery);
    }
    const totalPrice = price + delivery;
    return res.status(200).json({
      success: true,
      cartPrice: price,
      delivery: delivery,
      totalPrice: totalPrice,
    });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, messaage: "internal server error" });
  }
});

//router to get the price of the buyNow cart
router.post("/user/buynow/price/calculate", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    let price =
      parseInt(user.buyNowCart.price) * parseInt(user.buyNowCart.quantity);
    let delivery = parseInt(user.buyNowCart.delivery);
    let totalPrice = price + delivery;
    return res.status(200).json({
      success: true,
      price: price,
      delivery: delivery,
      totalPrice: totalPrice,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to check for the stock of the product in the buy now cart
router.post("/user/check/stock/buynowcart", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    const product = await Products.findById(user.buyNowCart.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, messaage: "product not found" });
    }
    if (product.Stock >= user.buyNowCart.quantity) {
      return res
        .status(200)
        .json({ success: true, success1: true, messaage: "done" });
    } else {
      return res
        .status(200)
        .json({ success: true, success1: false, messaage: "no" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get the count of the items in the cart
router.post("/user/cart/count", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWTToken.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, messaage: "user not found" });
    }
    return res.status(200).json({ success: true, count: user.cart.length });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, messaage: "internal server error" });
  }
});

module.exports = router;
