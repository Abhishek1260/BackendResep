const mongoose = require("mongoose");

const sellerSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "the seller name is required"],
  },
  email: {
    type: String,
    required: [true, "the seller email is required"],
  },
  password: {
    type: String,
    required: [true, "the seller password is required"],
  },
  ResepVerified: {
    type: Boolean,
    default: false,
  },
  all: [
    {
      listed: {
        type: Boolean,
        default: true,
      },
      resepCut: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: [true, "the product name is required"],
      },
      mainPhoto: {
        type: String,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      delivery: {
        type: Number,
        required: [true, "the delivery charges are required"],
      },
      subCategory: {
        type: String,
      },
      description: {
        type: String,
        required: [true, "the product description is required"],
      },
      price: {
        type: Number,
        required: [true, "the product price is required"],
      },
      stock: {
        type: Number,
        default: 0,
      },
      category: {
        type: String,
        required: [true, "the product category is required"],
      },
      condition: {
        type: String,
        required: [true, "the product condition is required"],
      },
      Productid: {
        type: mongoose.Schema.ObjectId,
        required: [true, "the product ID is required"],
        ref: "Products",
      },
      percentageConditon: {
        type: Number,
        required: true,
      },
      warranty: {
        type: String,
        required: true,
      },
      DateOfPurchase: {
        type: String,
        required: true,
      },
      color: {
        type: String,
      },
      batteryHealth: {
        type: String,
      },
      scratches: {
        type: String,
        required: true,
      },
      images: [
        {
          public_ID: {
            type: String,
            required: true,
          },
          URL: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
  inRequest: [
    {
      orderID: {
        type: String,
        required: true,
      },
      userId: {
        type: mongoose.Schema.ObjectId,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      productID: {
        type: mongoose.Schema.ObjectId,
        required: true,
      },
      accepted: {
        type: Boolean,
        default: false,
      },
      rejected: {
        type: Boolean,
        default: false,
      },
    },
  ],
  products: [
    {
      listed: {
        type: Boolean,
        default: true,
      },
      delivery: {
        type: Number,
        required: [true, "the delivery charges are required"],
      },
      name: {
        type: String,
        required: [true, "the product name is required"],
      },
      resepCut: {
        type: Number,
        required: true,
      },
      mainPhoto: {
        type: String,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      subCategory: {
        type: String,
      },
      description: {
        type: String,
        required: [true, "the product description is required"],
      },
      price: {
        type: Number,
        required: [true, "the product price is required"],
      },
      stock: {
        type: Number,
        default: 0,
      },
      category: {
        type: String,
        required: [true, "the product category is required"],
      },
      condition: {
        type: String,
        required: [true, "the product condition is required"],
      },
      Productid: {
        type: mongoose.Schema.ObjectId,
        required: [true, "the product ID is required"],
        ref: "Products",
      },
      percentageConditon: {
        type: Number,
        required: true,
      },
      warranty: {
        type: String,
        required: true,
      },
      DateOfPurchase: {
        type: String,
        required: true,
      },
      color: {
        type: String,
      },
      batteryHealth: {
        type: String,
      },
      scratches: {
        type: String,
        required: true,
      },
      images: [
        {
          public_ID: {
            type: String,
            required: true,
          },
          URL: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Sellers", sellerSchema);
