const mongoose = require("mongoose");
require("dotenv").config({ path: "variables.env" });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log("Connected to DB");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
