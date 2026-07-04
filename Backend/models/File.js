const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  size: Number,
  path: String,
  shareId: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);
