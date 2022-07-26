const mongoose = require("mongoose");

const ProductAnalyticsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "kindly enter the name of the product"],
  },
  description: {
    type: String,
    required: [true, "kindly enter the description of the product"],
  },
  mainPhoto: {
    type: String,
    required: [true, "main photo is required"],
  },
  price: {
    type: Number,
    required: [true, "kindly enter the price of the product"],
  },
  resepCut: {
    type: Number,
    required: true,
  },
  delivery: {
    type: Number,
    required: [true, "the delivery charges are required"],
  },
  rating: {
    type: Number,
    default: 0,
  },
  images: [
    {
      url: {
        type: String,
        required: [true, "image is required"],
      },
    },
  ],
  verified: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    required: [true, "kindly enter the category of the product"],
  },
  Stock: {
    type: Number,
    default: 1,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  productStarts: {
    type: Number,
    default: 0,
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
  brand: {
    type: String,
  },
  reviews: [
    {
      name: {
        type: String,
        required: [true, "please enter the name"],
      },
      rating: {
        type: Number,
        required: [true, "please enter wthe rating"],
      },
      message: {
        type: String,
        required: [true, "please enter the message"],
      },
      id: {
        type: mongoose.Schema.ObjectId,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "Sellers",
    required: true,
  },
  quality: {
    type: String,
    required: [true, "the quality of the product is required"],
  },
  creatingAt: {
    type: Date,
    default: Date.now,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  state: {
    type: String,
  },
  ProductID: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  listed: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("ProductAnalytics", ProductAnalyticsSchema);
