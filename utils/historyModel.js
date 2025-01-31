const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  city: { type: String, required: true },
  temperature: { type: String, required: true },
  weatherCondition: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const History = mongoose.model("History", historySchema);

module.exports = History;





