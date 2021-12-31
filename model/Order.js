const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
  items: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Client",
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Vendor",
  },
  state: {
    type: String,
    default: "PENDING",
  },
  deadline: {
    type: Date,
    required: true,
  },
  creation: {
    type: Date,
    default: Date.now(),
  },
  update: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Order", OrderSchema);
