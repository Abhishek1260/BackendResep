const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  condition: {
    type: String,
    required: true,
  },
  id: {
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
  name: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  delivery: {
    type: Number,
    required: [true, "the delivery charges are required"],
  },
  quantity: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
  },
  mainPhoto: {
    type: String,
    required: true,
  },
  PaymentID: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  placedAt: {
    type: Date,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },
  address: {
    HouseNo: {
      type: String,
      required: true,
    },
    Street: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    Landmark: {
      type: String,
      required: true,
    },
  },
});

module.exports = mongoose.model("orders", orderSchema);
