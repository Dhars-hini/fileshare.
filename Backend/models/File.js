const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    filename:       { type: String },
    originalName:   { type: String, required: true },
    size:           { type: Number, default: 0 },
    // Legacy local path (kept for backward compat, ignored in new uploads)
    path:           { type: String, default: "" },
    // Cloudinary fields (used for all new uploads)
    cloudinaryUrl:  { type: String, default: "" },
    cloudinaryId:   { type: String, default: "" },
    resourceType:   { type: String, default: "raw" },
    shareId:        { type: String },
    user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
