const express = require("express");
const multer = require("multer");
const path = require("path");
const auth = require("../middlewares/authMiddleware");

const {
  uploadFiles,
  getFiles,
  deleteFile,
  shareFile,
  accessSharedFile,
  downloadZip
} = require("../controllers/fileController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// Protected
router.post("/upload", auth, upload.array("files"), uploadFiles);
router.get("/", auth, getFiles);
router.delete("/:id", auth, deleteFile);
router.post("/share/:id", auth, shareFile);
router.post("/zip", auth, downloadZip);

// Public
router.get("/shared/:shareId", accessSharedFile);

module.exports = router;
