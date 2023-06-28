const mongoose = require("mongoose");

// Define a schema
module.exports.questionSchema = new mongoose.Schema({
  title: String,
  answer: Array,
});
