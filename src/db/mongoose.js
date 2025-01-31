const mongoose = require("mongoose");//mongoose library
//connection string
const mongoURI = "mongodb://127.0.0.1:27017/weatherApppp";

mongoose
  .connect(mongoURI, {  //to reduce connection error in connection string
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;
