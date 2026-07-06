const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for general file uploads
const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "fileshare/files",
    resource_type: "auto", // handles pdf, image, video, etc.
    public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, "_")}`,
    use_filename: true,
    unique_filename: false,
  }),
});

// Storage for avatar uploads
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "fileshare/avatars",
    resource_type: "image",
    public_id: `avatar-${req.user.id}-${Date.now()}`,
    transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
  }),
});

module.exports = { cloudinary, fileStorage, avatarStorage };
