const mongoose = require("mongoose");

const VendorSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  last_name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  creation: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Vendor", VendorSchema);
