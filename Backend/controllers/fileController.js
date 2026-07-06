const File = require("../models/File");
const { cloudinary } = require("../config/cloudinary");
const crypto = require("crypto");
const path = require("path");

const getUserId = (req) => req.user?.id;

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
exports.uploadFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    const userId = getUserId(req);
    if (!userId)
      return res.status(401).json({ message: "User not authorized" });

    const uploaded = [];

    for (const file of req.files) {
      const newFile = new File({
        filename:      file.filename || file.originalname,
        originalName:  file.originalname,
        size:          file.size,
        path:          file.path || "",
        cloudinaryUrl: file.path,        // multer-storage-cloudinary stores URL in file.path
        cloudinaryId:  file.filename,    // and public_id in file.filename
        resourceType:  file.resource_type || "raw",
        user:          userId,
      });

      await newFile.save();
      uploaded.push(newFile);
    }

    res.status(201).json({ message: "Files uploaded successfully", files: uploaded });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// ─── GET USER FILES ───────────────────────────────────────────────────────────
exports.getFiles = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const files = await File.find({ user: userId }).sort({ createdAt: -1 });

    // Only return files that have a valid URL (cloudinary or legacy local)
    const validFiles = files.filter(
      (f) => f.cloudinaryUrl || f.path
    );

    res.json(validFiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch files" });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deleteFile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const file = await File.findOne({ _id: req.params.id, user: userId });
    if (!file) return res.status(404).json({ message: "File not found" });

    // Delete from Cloudinary if it has a cloudinaryId
    if (file.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(file.cloudinaryId, {
          resource_type: file.resourceType || "raw",
        });
      } catch (e) {
        console.warn("Cloudinary delete failed:", e.message);
      }
    }

    await file.deleteOne();
    res.json({ message: "File deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ─── SHARE LINK ───────────────────────────────────────────────────────────────
exports.shareFile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const file = await File.findOne({ _id: req.params.id, user: userId });
    if (!file) return res.status(404).json({ message: "File not found" });

    const shareId = crypto.randomBytes(12).toString("hex");
    file.shareId = shareId;
    await file.save();

    const BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";
    res.json({
      message: "Share link created",
      link: `${BASE_URL}/api/files/shared/${shareId}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Share failed" });
  }
};

// ─── ACCESS SHARED FILE ───────────────────────────────────────────────────────
exports.accessSharedFile = async (req, res) => {
  try {
    const file = await File.findOne({ shareId: req.params.shareId });
    if (!file) return res.status(404).json({ message: "Invalid link" });

    // Redirect to Cloudinary URL directly
    const url = file.cloudinaryUrl || file.path;
    if (!url) return res.status(404).json({ message: "File not available" });

    res.redirect(url);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to access file" });
  }
};

// ─── ZIP DOWNLOAD ─────────────────────────────────────────────────────────────
exports.downloadZip = async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds) return res.status(400).json({ message: "fileIds required" });

    const archiver = require("archiver");
    const https = require("https");
    const zip = archiver("zip");

    res.attachment("files.zip");
    zip.pipe(res);

    for (const id of fileIds) {
      const file = await File.findById(id);
      if (!file) continue;

      const url = file.cloudinaryUrl || file.path;
      if (!url) continue;

      // Stream from Cloudinary URL into zip
      await new Promise((resolve, reject) => {
        https.get(url, (stream) => {
          zip.append(stream, { name: file.originalName });
          stream.on("end", resolve);
          stream.on("error", reject);
        });
      });
    }

    zip.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Zip failed" });
  }
};
