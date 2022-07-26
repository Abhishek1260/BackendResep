const express = require("express");
const Products = require("../models/productModel.js");
const ApiFeatures = require("../utils/APIFeatures");
const JWT = require("jsonwebtoken");
const router = express.Router();
const dotenv = require("dotenv");
const Users = require("../models/userModel");
const Seller = require("../models/SellerModel");
const allProducts = require("../models/AllProductsmodel");
dotenv.config({ path: "../config/config.env" });
const analytics = require("../models/ProductAnalyticsModel");
const Orders = require("../models/OrdersModel")

//route to create a new product -- admin required -- seller required
router.post("/product/create", async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "you need to be authenticated" });
    }
    const id = await JWT.decode(token, process.env.JWT_SECRET);
    const users = await Users.findById(id.id);
    if (users.role === "user") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    const seller = await Seller.findOne({ email: users.email });
    if (!seller) {
      return res
        .status(401)
        .json({ success: false, message: "seller not found" });
    }
    //(seller);
    const product = await Products.create({
      name: req.body.name,
      description: req.body.desc,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      user: seller._id,
      productStarts: req.body.productStarts,
      quality: req.body.quality,
    });
    return res
      .status(200)
      .json({ success: true, message: "product created", product });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get all Products
router.get("/product/get", async (req, res) => {
  const apiFeature = new ApiFeatures(Products.find(), req.query)
    .search()
    .filter()
    .pagination(req.query.results || 20);
  const products = await apiFeature.query;
  if (!products) {
    return res
      .status(404)
      .json({ success: false, message: "product not found" });
  }
  return res.status(200).json({ success: true, products });
});

//to get a specific product
router.put("/product/:id", async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    return res.status(200).json({ success: true, product });
  } catch (error) {
    //(error);
    return res
      .status(401)
      .json({ success: false, message: "internal server error" });
  }
});

//to update a product -- admin -- seller
router.get("/product/update/:id", async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "you need to be authenticated" });
    }
    const id = JWT.verify(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (user.role === "user") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    let product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    product = await Products.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    res
      .status(200)
      .json({ success: true, message: "product updated", product });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to delete any product -- admin -- seller
router.delete("/product/delete/:id", async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "you need to be authenticated" });
    }
    const id = JWT.verify(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (user.role === "user") {
      return res
        .status(401)
        .json({ success: false, message: "not authorized" });
    }
    let product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    product = await Products.findByIdAndDelete(req.params.id);
    return res
      .status(201)
      .json({ success: true, message: "product deleted", product });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get the trending products
router.get("/product/trending", async (req, res) => {
  try {
    let products = await Products.find();
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//to get the categorical product
router.put("/product/find/:keyword", async (req, res) => {
  try {
    const products = await Products.find({
      category: req.params.keyword.toString(),
    });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to add the review
router.post("/product/review/add/:id", async (req, res) => {
  // try {
  const { rating, message, token } = req.body;
  //(rating, message, token);
  const product = await Products.findById(req.params.id);
  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "product not found" });
  }
  const id = JWT.decode(token, process.env.JWT_SECRET);
  const user = await Users.findById(id.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "user not found" });
  }
  for (let i = 0; i < product.reviews.length; i++) {
    if (product.reviews[i].id.toString() === id.id.toString()) {
      return res.status(200).json({
        success: true,
        message: "review found for the user",
        review: product.reviews[i],
      });
    }
  }
  const review = {
    name: user.name,
    rating: rating,
    message: message,
    id: user._id,
  };
  product.reviews.push(review);
  product.numOfReviews = product.numOfReviews + 1;
  await product.save();
  const product1 = await Products.findById(req.params.id);
  let sum = 0;
  for (let i = 0; i < product1.reviews.length; i++) {
    sum += product1.reviews[i].rating;
  }
  product1.rating = sum / product1.reviews.length;
  product1.productStarts = sum / product1.reviews.length;
  await product1.save();
  return res
    .status(200)
    .json({ success: true, message: "the review is added" });
  // } catch (error) {
  //   return res.status(500).json({success : false , message : "internal server error"})
  // }
});

//to check if the user already have review if have then return the review
router.post("/product/review/get/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
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
    for (let i = 0; i < product.reviews.length; i++) {
      if (product.reviews[i].id.toString() === id.id.toString()) {
        return res.status(200).json({
          success: true,
          message: "review found for the user",
          review: product.reviews[i],
        });
      }
    }
    return res.status(404).json({ success: false, message: "no review found" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to get all the reviews
router.put("/product/review/get/:id", async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    return res.status(200).json({ success: true, review: product.reviews });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to remove the review of the user
router.post("/product/review/delete/:id", async (req, res) => {
  try {
    const { token } = req.body;
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: "user not found" });
    }
    const newArr = [];
    for (let i = 0; i < product.reviews.length; i++) {
      if (product.reviews[i].id.toString() === user._id.toString()) {
        continue;
      } else {
        newArr.push(product.reviews[i]);
      }
    }
    product.reviews = newArr;
    await product.save();
    return res.status(200).json({ success: true, message: "review removed" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to edit the review
router.post("/product/review/update/:id", async (req, res) => {
  try {
    const { token, message, rating } = req.body;
    //(token, message, rating);
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
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
    const newArr = [];
    for (let i = 0; i < product.reviews.length; i++) {
      if (product.reviews[i].id.toString() === user._id.toString()) {
        newArr.push({
          name: user.name,
          message,
          rating,
          id: user._id,
        });
      } else {
        newArr.push(product.reviews[i]);
      }
    }
    product.reviews = newArr;
    await product.save();
    return res
      .status(200)
      .json({ success: true, message: "product review updated" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//router to find the product to find the product using category
router.post("/product/find", async (req, res) => {
  try {
    const { category } = req.body;
    const products = await Products.find({ brand: category });
    return res.status(200).json({ success: true, products: products });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to change the stock quantity of the product giving the order ID
// router.post("/product/change/stock", async (req, res) => {
//   try {
//     const { token } = req.body;
//     const id = JWT.decode(token, process.env.JWT_SECRET);
//     const user = await Users.findById(id.id);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "user not found" });
//     }
//     const { order, product } = req.body;
//     const products = await Products.findById(product);
//     if (!products) {
//       return res
//         .status(404)
//         .json({ success: false, message: "product not found" });
//     }
//     let quantity = 0;
//     for (let i = 0; i < user.orders.length; i++) {
//       if (
//         user.orders[i].PaymentID.toString() === order.toString() &&
//         user.orders[i].id.toString() === products._id.toString()
//       ) {
//         quantity = parseInt(user.orders[i].quantity);
//       }
//     }
//     quantity = parseInt(products.Stock) - quantity;
//     products.Stock = quantity;
//     await products.save();
//     return res.status(200).json({ success: true, message: "product updated" });
//   } catch (error) {
//     //(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "internal server error" });
//   }
// });

//route to change the stock quantity of the product giving the order ID
// router.post("/product/change/stock", async (req, res) => {
//   try {
//     //("************************************************************************************************************************************************")
//     const { token } = req.body;
//     const id = JWT.decode(token, process.env.JWT_SECRET);
//     const user = await Users.findById(id.id);
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "user not found" });
//     } 
//     const idArr = [];
//     const { order, product } = req.body;
//     //("************************************************************************************************************************************************")

//     //(`Product is  ${product}`);
//     //("************************************************************************************************************************************************")
//     //(order)
//     //("************************************************************************************************************************************************")

//     for (let i = 0; i < product.length; i++) {
//       idArr.push(product[i].id);
//     }
//     //("************************************************************************************************************************************************")

//     //(idArr);
//     //("************************************************************************************************************************************************")

//     const products = await Products.find({ _id: idArr });
//     //("************************************************************************************************************************************************")

//     //(products);
//     //("************************************************************************************************************************************************")

//     if (products.length === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "product not found" });
//     }
//     const quantityArr = [];
//     const newArrForId = [];
//     for (let i = 0; i < products.length; i++) {
//       for (let j = 0; j < user.orders.length; j++) {
//         if (
//           user.orders[j].PaymentID.toString() === order.toString() &&
//           user.orders[j].id.toString() === products[i]._id.toString()
//         ) {
//           let quantity = 0;
//           quantity = parseInt(user.orders[j].quantity);
//           quantity = parseInt(products[i].Stock) - quantity;
//           //(quantity)
//           quantityArr.push(quantity);
//           newArrForId.push(user.orders[i].id);
//         }
//       }
//     }
//     //("************************************************************************************************************************************************")

//     const newArr = [];
//     for (let i = 0; i < newArrForId.length; i++) {
//       newArr.push({
//         id: newArrForId[i],
//         quantity: quantityArr[i],
//       });
//     }
//     //("************************************************************************************************************************************************")

//     //(newArr)
//     //("************************************************************************************************************************************************")

//     for (const product of newArr) {
//       await Products.findByIdAndUpdate(product.id, { Stock: product.quantity });
//       await allProducts.findOneAndUpdate(
//         { id: product.id },
//         { Stock: product.quantity }
//       );
//       await analytics.findOneAndUpdate(
//         { ProductID: product.id },
//         { Stock: product.quantity }
//       );
//     }
//     return res.status(200).json({ success: true, message: "product updated" });
//   } catch (error) {
//     //(error);
//     return res
//       .status(500)
//       .json({ success: false, message: "internal server error" });
//   }
// });
router.post("/product/change/stock", async (req, res) => {
  try {
    //("************************************************************************************************************************************************")
    const { token , order, product } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const orders = await Orders.find({PaymentID : order})
    //("************************************************************************************************************************************************")
    for (const orderS of orders) {
      const products = await Products.findById(orderS.id)
      const seller = await Seller.findById(products.user)
      const AllProducts = await allProducts.findOne({id : products._id})
      const analyticsProducts = await analytics.findOne({ProductID : products._id})
      analyticsProducts.Stock = parseInt(products.Stock) - parseInt(orderS.quantity)
      AllProducts.Stock = parseInt(products.Stock) - parseInt(orderS.quantity)
      products.Stock = parseInt(products.Stock) - parseInt(orderS.quantity)
      const newArr1 = []
      const newArr2 = []
      for (let i = 0 ; i < seller.all.length ; i++ ) {
        if (seller.all[i].Productid.toString() === products._id.toString()) {
          newArr1.push({
            listed : seller.all[i].listed,
            resepCut : seller.all[i].resepCut,
            name : seller.all[i].name,
            mainPhoto : seller.all[i].mainPhoto,
            verified : seller.all[i].verified,
            delivery : seller.all[i].delivery,
            subCategory : seller.all[i].subCategory,
            description : seller.all[i].description,
            price : seller.all[i].price,
            stock : parseInt(products.Stock) - parseInt(orderS.quantity),
            category : seller.all[i].category,
            condition : seller.all[i].condition,
            Productid : seller.all[i].Productid,
            percentageConditon : seller.all[i].percentageConditon,
            warranty : seller.all[i].warranty,
            DateOfPurchase : seller.all[i].DateOfPurchase,
            color : seller.all[i].color,
            batteryHealth : seller.all[i].batteryHealth,
            scratches : seller.all[i].scratches,
            images : seller.all[i].images
          })
        } else {
          newArr1.push(seller.all[i])
        }
      } 
      for (let i = 0 ; i < seller.products.length ; i++ ) {
        if (seller.products[i].Productid.toString() === products._id.toString()) {
          newArr2.push(
            {
              listed : seller.products[i].listed,
              delivery : seller.products[i].delivery,
              name : seller.products[i].name,
              resepCut : seller.products[i].resepCut,
              mainPhoto : seller.products[i].mainPhoto,
              verified : seller.products[i].verified,
              subCategory : seller.products[i].subCategory,
              description : seller.products[i].description,
              price : seller.products[i].price,
              stock : parseInt(products.Stock) - parseInt(orderS.quantity),
              category : seller.products[i].category,
              condition : seller.products[i].condition,
              Productid : seller.products[i].Productid,
              percentageConditon : seller.products[i].percentageConditon,
              warranty : seller.products[i].warranty,
              DateOfPurchase : seller.products[i].DateOfPurchase,
              color : seller.products[i].color,
              batteryHealth : seller.products[i].batteryHealth,
              scratches : seller.products[i].scratches,
              images : seller.products[i].images
            }
          )
        } else {
          newArr2.push(seller.products[i])
        }
      }
      seller.all = newArr1
      seller.products = newArr2
      await seller.save()
      await analyticsProducts.save()
      await products.save()
      await AllProducts.save()
    }
    //("************************************************************************************************************************************************")

    // //(`Product is  ${product}`);
    // //("************************************************************************************************************************************************")
    // for (let i = 0 ; i < product.length ; i++ ) {
    //   //(product[i])
    // }
    // //("************************************************************************************************************************************************")

    // for (let i = 0; i < product.length; i++) {
      // idArr.push(product[i].id);
    // }
    // //("************************************************************************************************************************************************")

    // //(idArr);
    // //("************************************************************************************************************************************************")

    // const products = await Products.find({ _id: idArr });
    // //("************************************************************************************************************************************************")

    // //(products);
    // //("************************************************************************************************************************************************")

    // if (products.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "product not found" });
    // }
    // const quantityArr = [];
    // const newArrForId = [];
    // for (let i = 0; i < products.length; i++) {
    //   for (let j = 0; j < user.orders.length; j++) {
    //     if (
    //       user.orders[j].PaymentID.toString() === order.toString() &&
    //       user.orders[j].id.toString() === products[i]._id.toString()
    //     ) {
    //       let quantity = 0;
    //       quantity = parseInt(user.orders[j].quantity);
    //       quantity = parseInt(products[i].Stock) - quantity;
          // //(quantity)
    //       quantityArr.push(quantity);
    //       newArrForId.push(user.orders[i].id);
    //     }
    //   }
    // }
    // //("************************************************************************************************************************************************")

    // const newArr = [];
    // for (let i = 0; i < newArrForId.length; i++) {
    //   newArr.push({
    //     id: newArrForId[i],
    //     quantity: quantityArr[i],
    //   });
    // }
    // //("************************************************************************************************************************************************")

    // //(newArr)
    // //("************************************************************************************************************************************************")

    // for (const product of newArr) {
    //   await Products.findByIdAndUpdate(product.id, { Stock: product.quantity });
    //   await allProducts.findOneAndUpdate(
    //     { id: product.id },
    //     { Stock: product.quantity }
    //   );
    //   await analytics.findOneAndUpdate(
    //     { ProductID: product.id },
    //     { Stock: product.quantity }
    //   );
    // }
    return res.status(200).json({ success: true, message: "product updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to change the stock quantity of the product giving the order ID
router.post("/product/change/stock/buynow", async (req, res) => {
  try {
    const { token, orderID } = req.body;
    const id = JWT.decode(token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const order = await Orders.findOne({PaymentID : orderID})
    const products = await Products.findById(order.id);
    if (!products) {
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }
    products.Stock = parseInt(products.Stock) - parseInt(order.quantity)
    const seller = await Seller.findById(products.user)
      const AllProducts = await allProducts.findOne({id : products._id})
      const analyticsProducts = await analytics.findOne({ProductID : products._id})
      analyticsProducts.Stock = parseInt(products.Stock) - parseInt(order.quantity)
      AllProducts.Stock = parseInt(products.Stock) - parseInt(order.quantity)

      const newArr1 = []
      const newArr2 = []
      for (let i = 0 ; i < seller.all.length ; i++ ) {
        if (seller.all[i].Productid.toString() === products._id.toString()) {
          newArr1.push({
            listed : seller.all[i].listed,
            resepCut : seller.all[i].resepCut,
            name : seller.all[i].name,
            mainPhoto : seller.all[i].mainPhoto,
            verified : seller.all[i].verified,
            delivery : seller.all[i].delivery,
            subCategory : seller.all[i].subCategory,
            description : seller.all[i].description,
            price : seller.all[i].price,
            stock : parseInt(products.Stock) - parseInt(order.quantity),
            category : seller.all[i].category,
            condition : seller.all[i].condition,
            Productid : seller.all[i].Productid,
            percentageConditon : seller.all[i].percentageConditon,
            warranty : seller.all[i].warranty,
            DateOfPurchase : seller.all[i].DateOfPurchase,
            color : seller.all[i].color,
            batteryHealth : seller.all[i].batteryHealth,
            scratches : seller.all[i].scratches,
            images : seller.all[i].images
          })
        } else {
          newArr1.push(seller.all[i])
        }
      } 
      for (let i = 0 ; i < seller.products.length ; i++ ) {
        if (seller.products[i].Productid.toString() === products._id.toString()) {
          newArr2.push(
            {
              listed : seller.products[i].listed,
              delivery : seller.products[i].delivery,
              name : seller.products[i].name,
              resepCut : seller.products[i].resepCut,
              mainPhoto : seller.products[i].mainPhoto,
              verified : seller.products[i].verified,
              subCategory : seller.products[i].subCategory,
              description : seller.products[i].description,
              price : seller.products[i].price,
              stock : parseInt(products.Stock) - parseInt(order.quantity),
              category : seller.products[i].category,
              condition : seller.products[i].condition,
              Productid : seller.products[i].Productid,
              percentageConditon : seller.products[i].percentageConditon,
              warranty : seller.products[i].warranty,
              DateOfPurchase : seller.products[i].DateOfPurchase,
              color : seller.products[i].color,
              batteryHealth : seller.products[i].batteryHealth,
              scratches : seller.products[i].scratches,
              images : seller.products[i].images
            }
          )
        } else {
          newArr2.push(seller.products[i])
        }
      }
      seller.all = newArr1
      seller.products = newArr2
      await seller.save()
      await analyticsProducts.save()
      await products.save()
      await AllProducts.save()
    await products.save();
    //("X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X-X")
    return res.status(200).json({ success: true, message: "product updated" });
  } catch (error) {
    //(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to check for the stock for the order place
router.post("/product/check/stock/:id", async (req, res) => {
  try {
    const products = await Products.findById(req.params.id);
    const { quantity } = req.body;
    if (!products) {
      return res
        .status(404)
        .json({ success: false, message: "product not found" });
    }
    let stock = 0;
    if (quantity > parseInt(products.Stock)) {
      stock = parseInt(products.Stock);
      return res
        .status(200)
        .json({ success: true, success1: false, stock: stock });
    }
    stock = quantity;
    //(stock);
    return res
      .status(200)
      .json({ success: true, success1: true, stock: stock });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

//route to check for any stock changes in the cart
router.post("/product/check/stock/cart/:token", async (req, res) => {
  try {
    const id = JWT.decode(req.params.token, process.env.JWT_SECRET);
    const user = await Users.findById(id.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }
    const newArr = [];
    for (let i = 0; i < user.cart.length; i++) {
      const newDict = {
        id: user.cart[i].id,
        quantity: parseInt(user.cart[i].quantity),
      };
      newArr.push(newDict);
    }
    let checker = true;
    const newArrConfirm = [];
    for (const id of newArr) {
      const product = await Products.findById(id.id);
      let stock = 0;
      if (id.quantity > product.Stock) {
        const confirmStock = {
          id: id.id,
          stock: product.Stock,
          success: false,
        };
        checker = false;
        newArrConfirm.push(confirmStock);
      } else {
        const confirmStock = {
          id: id.id,
          stock: id.quantity,
          success: true,
        };
        newArrConfirm.push(confirmStock);
      }
    }
    return res.status(200).json({ success: checker, orders: newArrConfirm });
  } catch (error) {
    return res.status(200).json({ success: true, message: "majja" });
  }
});

//route to find the best product for the different categories
router.post("/product/getProductsForSubBrands", async (req, res) => {
  try {
    const { cat, subcat } = req.body;
    const products = await Products.find({
      subCategory: subcat,
      category: cat,
    });
    return res.status(200).json({ success: true, products: products });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
});

module.exports = router;
