const File = require("../models/File");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const getUserId = (req) => req.user?.id;

// ================= UPLOAD =================
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
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: file.path,
        user: userId
      });

      await newFile.save();
      uploaded.push(newFile);
    }

    res.status(201).json({
      message: "Files uploaded successfully",
      files: uploaded
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// ================= GET =================
exports.getFiles = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const files = await File.find({ user: userId }).sort({ createdAt: -1 });
    res.json(files);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch files" });
  }
};

// ================= DELETE =================
exports.deleteFile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const file = await File.findOne({ _id: req.params.id, user: userId });

    if (!file) return res.status(404).json({ message: "File not found" });

    try {
      fs.unlinkSync(file.path);
    } catch {
      console.log("File missing in storage");
    }

    await file.deleteOne();
    res.json({ message: "File deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ================= SHARE LINK =================
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
      link: `${BASE_URL}/api/files/shared/${shareId}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Share failed" });
  }
};

// ================= ACCESS SHARED FILE =================
exports.accessSharedFile = async (req, res) => {
  try {
    const file = await File.findOne({ shareId: req.params.shareId });
    if (!file) return res.status(404).json({ message: "Invalid link" });

    const filePath = path.join(__dirname, "..", file.path);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.originalName}"`
    );

    res.sendFile(filePath);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to access file" });
  }
};

// ================= ZIP =================
exports.downloadZip = async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds)
      return res.status(400).json({ message: "fileIds required" });

    const archiver = require("archiver");
    const zip = archiver("zip");

    res.attachment("files.zip");
    zip.pipe(res);

    for (const id of fileIds) {
      const file = await File.findById(id);
      if (file) zip.file(file.path, { name: file.originalName });
    }

    zip.finalize();

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Zip failed" });
  }
};
