const mongoose = require("mongoose");

module.exports = () => {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
  });

  mongoose.connection.on("disconnected", () => {
    console.log("Disconnected from MongoDB");
  });

  mongoose.connection.on("err", (err) => {
    console.log(`MongoDB connection error: \n${err.stack}`);
  });
};


