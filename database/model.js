const mongoose = require("mongoose");
const questionSchema = require("./schema").questionSchema;

module.exports.questions = mongoose.model("questions", questionSchema);
