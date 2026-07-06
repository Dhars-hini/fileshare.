const express = require("express");
const multer  = require("multer");
const auth    = require("../middlewares/authMiddleware");
const { fileStorage } = require("../config/cloudinary");

const {
  uploadFiles,
  getFiles,
  deleteFile,
  shareFile,
  accessSharedFile,
  downloadZip,
} = require("../controllers/fileController");

const router = express.Router();

// Multer using Cloudinary storage — 50 MB per file, 20 files max
const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Protected
router.post("/upload", auth, upload.array("files", 20), uploadFiles);
router.get("/",        auth, getFiles);
router.delete("/:id",  auth, deleteFile);
router.post("/share/:id", auth, shareFile);
router.post("/zip",    auth, downloadZip);

// Public shared link
router.get("/shared/:shareId", accessSharedFile);

module.exports = router;
