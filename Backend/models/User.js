const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar:        { type: String, default: "" },  // Cloudinary URL
    avatarCloudId: { type: String, default: "" },  // Cloudinary public_id
    bio:      { type: String, default: "" },
    phone:    { type: String, default: "" },
    role:     { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
