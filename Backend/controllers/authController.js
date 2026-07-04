const User = require("../models/User");
const File = require("../models/File");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// ─── REGISTER ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ msg: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });

    res.json({ msg: "Registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ─── GET MY PROFILE ───────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// ─── UPDATE PROFILE (name, email, bio, phone) ────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const { name, email, bio, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, bio, phone },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ msg: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Update failed" });
  }
};

// ─── UPLOAD AVATAR ────────────────────────────────────────────────────────────
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No image uploaded" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Delete old avatar file if it exists
    if (user.avatar) {
      const oldPath = path.join(__dirname, "..", user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarPath = "uploads/avatars/" + req.file.filename;
    user.avatar = avatarPath;
    await user.save();

    const updated = await User.findById(req.user.id).select("-password");
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Avatar upload failed" });
  }
};

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ msg: "Both fields are required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Current password is incorrect" });

    if (newPassword.length < 6)
      return res.status(400).json({ msg: "New password must be at least 6 characters" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Password change failed" });
  }
};

// ─── ADMIN: GET ALL USERS ────────────────────────────────────────────────────
exports.adminGetUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    // Attach accurate file count and total size — only files that exist on disk
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const files = await File.find({ user: u._id });
        const existingFiles = files.filter((f) => {
          const abs = path.join(__dirname, "..", f.path);
          return fs.existsSync(abs);
        });
        const totalSize = existingFiles.reduce((sum, f) => sum + (f.size || 0), 0);
        return {
          ...u.toObject(),
          fileCount: existingFiles.length,
          totalSize,
        };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
};

// ─── ADMIN: DELETE USER ───────────────────────────────────────────────────────
exports.adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id)
      return res.status(400).json({ msg: "Cannot delete your own account" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Delete all their files from disk
    const files = await File.find({ user: id });
    for (const file of files) {
      const filePath = path.join(__dirname, "..", file.path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await File.deleteMany({ user: id });

    // Delete avatar
    if (user.avatar) {
      const avatarPath = path.join(__dirname, "..", user.avatar);
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }

    await user.deleteOne();
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete failed" });
  }
};

// ─── ADMIN: TOGGLE ROLE ───────────────────────────────────────────────────────
exports.adminToggleRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id)
      return res.status(400).json({ msg: "Cannot change your own role" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.role = user.role === "admin" ? "user" : "admin";
    await user.save();

    res.json({ msg: `Role updated to ${user.role}`, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Role update failed" });
  }
};

// ─── ADMIN: GET SITE STATS ────────────────────────────────────────────────────
exports.adminGetStats = async (req, res) => {
  try {
    const totalUsers  = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Only count files that physically exist on disk
    const allFiles = await File.find().select("size path");
    const existingFiles = allFiles.filter((f) => {
      const abs = path.join(__dirname, "..", f.path);
      return fs.existsSync(abs);
    });

    const totalFiles   = existingFiles.length;
    const totalStorage = existingFiles.reduce((sum, f) => sum + (f.size || 0), 0);

    res.json({ totalUsers, totalAdmins, totalFiles, totalStorage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Stats fetch failed" });
  }
};

// ─── ADMIN: GET USER'S FILES ──────────────────────────────────────────────────
exports.adminGetUserFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const files = await File.find({ user: id }).sort({ createdAt: -1 });

    // Return only files that exist on disk, with a flag for missing ones
    const result = files.map((f) => {
      const abs = path.join(__dirname, "..", f.path);
      return {
        ...f.toObject(),
        exists: fs.existsSync(abs),
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch user files" });
  }
};

// ─── ADMIN: DELETE A FILE ─────────────────────────────────────────────────────
exports.adminDeleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findById(id);
    if (!file) return res.status(404).json({ msg: "File not found" });

    const abs = path.join(__dirname, "..", file.path);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);

    await file.deleteOne();
    res.json({ msg: "File deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Delete failed" });
  }
};

// ─── ADMIN: RENAME A FILE ─────────────────────────────────────────────────────
exports.adminRenameFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalName } = req.body;

    if (!originalName || !originalName.trim())
      return res.status(400).json({ msg: "Name is required" });

    const file = await File.findByIdAndUpdate(
      id,
      { originalName: originalName.trim() },
      { new: true }
    );

    if (!file) return res.status(404).json({ msg: "File not found" });

    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Rename failed" });
  }
};
