const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

const {
  register,
  login,
  getMe,
  updateMe,
  uploadAvatar,
  changePassword,
  adminGetUsers,
  adminDeleteUser,
  adminToggleRole,
  adminGetStats,
  adminGetUserFiles,
  adminDeleteFile,
  adminRenameFile,
} = require("../controllers/authController");

// ─── Multer config for avatars — uses Cloudinary ─────────────────────────────
const { avatarStorage } = require("../config/cloudinary");

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok =
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only image files are allowed"));
  },
});

// ─── Public routes ────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);

// ─── Protected: own profile ───────────────────────────────────────────────────
router.get("/me",              auth, getMe);
router.put("/me",              auth, updateMe);
router.post("/me/avatar",      auth, avatarUpload.single("avatar"), uploadAvatar);
router.put("/me/password",     auth, changePassword);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get("/admin/stats",                    auth, admin, adminGetStats);
router.get("/admin/users",                    auth, admin, adminGetUsers);
router.delete("/admin/users/:id",             auth, admin, adminDeleteUser);
router.patch("/admin/users/:id/role",         auth, admin, adminToggleRole);

// Admin file management
router.get("/admin/users/:id/files",          auth, admin, adminGetUserFiles);
router.delete("/admin/files/:id",             auth, admin, adminDeleteFile);
router.patch("/admin/files/:id/rename",       auth, admin, adminRenameFile);

module.exports = router;
