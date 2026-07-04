import React, { useEffect, useState, useRef } from "react";
import { axiosInstance, authHeader, SERVER_BASE } from "../utils/api";

const SERVER = SERVER_BASE;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("info"); // "info" | "password"
  const [formData, setFormData] = useState({ name: "", email: "", bio: "", phone: "" });
  const [pwData, setPwData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const fileRef = useRef();

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("/auth/me", { headers: authHeader() });
      setUser(res.data);
      setFormData({
        name:  res.data.name  || "",
        email: res.data.email || "",
        bio:   res.data.bio   || "",
        phone: res.data.phone || "",
      });
    } catch {
      showMsg("error", "Failed to load profile");
    }
  };

  useEffect(() => { fetchUser(); }, []);

  // ── Avatar pick ──────────────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showMsg("error", "Image must be under 5 MB");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const form = new FormData();
    form.append("avatar", avatarFile);
    setSaving(true);
    try {
      const res = await axiosInstance.post("/auth/me/avatar", form, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
      setAvatarFile(null);
      showMsg("success", "Profile picture updated!");
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Avatar upload failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Profile info save ────────────────────────────────────────────────────────
  const handleInfoSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axiosInstance.put("/auth/me", formData, {
        headers: authHeader(),
      });
      setUser(res.data);
      showMsg("success", "Profile updated successfully!");
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ──────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword)
      return showMsg("error", "New passwords do not match");
    if (pwData.newPassword.length < 6)
      return showMsg("error", "Password must be at least 6 characters");

    setPwSaving(true);
    try {
      await axiosInstance.put("/auth/me/password", {
        currentPassword: pwData.currentPassword,
        newPassword: pwData.newPassword,
      }, { headers: authHeader() });
      setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMsg("success", "Password changed successfully!");
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Password change failed");
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const avatarSrc = avatarPreview
    ? avatarPreview
    : user?.avatar
    ? `${SERVER}/${user.avatar.replace(/\\/g, "/")}`
    : null;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (!user) {
    return (
      <div style={s.page}>
        <div style={s.center}><div style={s.spinner} /></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── Left panel: avatar + basic info ── */}
        <div style={s.leftPanel}>
          {/* Avatar */}
          <div style={s.avatarWrap}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" style={s.avatarImg} />
            ) : (
              <div style={s.avatarInitials}>{initials}</div>
            )}
            <button style={s.avatarEditBtn} onClick={() => fileRef.current.click()} title="Change photo">
              ✏️
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />

          {/* Show upload button only after picking */}
          {avatarFile && (
            <button
              style={s.uploadAvatarBtn}
              onClick={handleAvatarUpload}
              disabled={saving}
            >
              {saving ? "Uploading..." : "Save Photo"}
            </button>
          )}

          <h2 style={s.userName}>{user.name}</h2>
          <p style={s.userEmail}>{user.email}</p>
          <span style={{ ...s.roleBadge, ...(user.role === "admin" ? s.roleBadgeAdmin : {}) }}>
            {user.role === "admin" ? "👑 Admin" : "👤 User"}
          </span>

          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>

        {/* ── Right panel: tabs ── */}
        <div style={s.rightPanel}>
          {/* Toast */}
          {msg.text && (
            <div style={{ ...s.toast, ...(msg.type === "error" ? s.toastError : s.toastSuccess) }}>
              {msg.text}
            </div>
          )}

          {/* Tabs */}
          <div style={s.tabs}>
            <button
              style={{ ...s.tabBtn, ...(tab === "info" ? s.tabActive : {}) }}
              onClick={() => setTab("info")}
            >
              Profile Info
            </button>
            <button
              style={{ ...s.tabBtn, ...(tab === "password" ? s.tabActive : {}) }}
              onClick={() => setTab("password")}
            >
              Change Password
            </button>
          </div>

          {/* ── Tab: Profile Info ── */}
          {tab === "info" && (
            <form onSubmit={handleInfoSave} style={s.form}>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Full Name</label>
                  <input
                    style={s.input}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#e53935")}
                    onBlur={(e)  => (e.target.style.borderColor = "#ddd")}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Email Address</label>
                  <input
                    style={s.input}
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#e53935")}
                    onBlur={(e)  => (e.target.style.borderColor = "#ddd")}
                  />
                </div>
              </div>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Phone Number</label>
                  <input
                    style={s.input}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    onFocus={(e) => (e.target.style.borderColor = "#e53935")}
                    onBlur={(e)  => (e.target.style.borderColor = "#ddd")}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Member Since</label>
                  <input
                    style={{ ...s.input, backgroundColor: "#f5f5f5", color: "#999" }}
                    value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    readOnly
                  />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Bio</label>
                <textarea
                  style={s.textarea}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="A short description about yourself..."
                  rows={3}
                  onFocus={(e) => (e.target.style.borderColor = "#e53935")}
                  onBlur={(e)  => (e.target.style.borderColor = "#ddd")}
                />
              </div>
              <button type="submit" style={s.saveBtn} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {/* ── Tab: Change Password ── */}
          {tab === "password" && (
            <form onSubmit={handlePasswordChange} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Current Password</label>
                <input
                  style={s.input}
                  type="password"
                  value={pwData.currentPassword}
                  onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                  onFocus={(e) => (e.target.style.borderColor = "#e53935")}
                  onBlur={(e)  => (e.target.style.borderColor = "#ddd")}
                />
              </div>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>New Password</label>
                  <input
                    style={s.input}
                    type="password"
                    value={pwData.newPassword}
                    onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                    placeholder="Min. 6 characters"
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#e53935")}
                    onBlur={(e)  => (e.target.style.borderColor = "#ddd")}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Confirm New Password</label>
                  <input
                    style={s.input}
                    type="password"
                    value={pwData.confirmPassword}
                    onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#e53935")}
                    onBlur={(e)  => (e.target.style.borderColor = "#ddd")}
                  />
                </div>
              </div>
              <button type="submit" style={s.saveBtn} disabled={pwSaving}>
                {pwSaving ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: "2rem 1rem",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  container: {
    display: "flex",
    gap: "24px",
    maxWidth: "960px",
    width: "100%",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "40vh", width: "100%" },
  spinner: {
    width: "36px", height: "36px",
    border: "4px solid #eee", borderTop: "4px solid #e53935",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },

  // ── Left panel ──
  leftPanel: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "2rem 1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    minWidth: "220px",
    flex: "0 0 220px",
  },
  avatarWrap: {
    position: "relative",
    width: "110px",
    height: "110px",
    marginBottom: "4px",
  },
  avatarImg: {
    width: "110px", height: "110px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #e53935",
  },
  avatarInitials: {
    width: "110px", height: "110px",
    borderRadius: "50%",
    backgroundColor: "#e53935",
    color: "#fff",
    fontSize: "2.2rem",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #e53935",
  },
  avatarEditBtn: {
    position: "absolute",
    bottom: "4px", right: "4px",
    backgroundColor: "#fff",
    border: "1.5px solid #ddd",
    borderRadius: "50%",
    width: "28px", height: "28px",
    cursor: "pointer",
    fontSize: "0.75rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  },
  uploadAvatarBtn: {
    backgroundColor: "#e53935",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "7px 16px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "0.85rem",
    width: "100%",
  },
  userName: { fontSize: "1.1rem", fontWeight: "700", color: "#1a1a2e", margin: 0, textAlign: "center" },
  userEmail: { fontSize: "0.82rem", color: "#999", margin: 0, textAlign: "center", wordBreak: "break-all" },
  roleBadge: {
    backgroundColor: "#e3f2fd",
    color: "#1565c0",
    borderRadius: "20px",
    padding: "3px 12px",
    fontSize: "0.78rem",
    fontWeight: "700",
  },
  roleBadgeAdmin: { backgroundColor: "#fff3e0", color: "#e65100" },
  logoutBtn: {
    marginTop: "8px",
    width: "100%",
    backgroundColor: "#fdecea",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    borderRadius: "7px",
    padding: "9px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "0.88rem",
  },

  // ── Right panel ──
  rightPanel: {
    flex: 1,
    minWidth: "280px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.8rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  toast: {
    borderRadius: "7px",
    padding: "10px 14px",
    marginBottom: "1rem",
    fontSize: "0.88rem",
    fontWeight: "600",
  },
  toastSuccess: { backgroundColor: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7" },
  toastError:   { backgroundColor: "#fdecea", color: "#c62828", border: "1px solid #ffcdd2" },

  tabs: { display: "flex", gap: "8px", marginBottom: "1.5rem", borderBottom: "2px solid #f0f0f0", paddingBottom: "0" },
  tabBtn: {
    background: "none",
    border: "none",
    padding: "8px 16px",
    fontWeight: "600",
    fontSize: "0.9rem",
    color: "#999",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    transition: "color 0.15s, border-color 0.15s",
  },
  tabActive: { color: "#e53935", borderBottom: "2px solid #e53935" },

  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  row:  { display: "flex", gap: "1rem", flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: "5px", flex: 1, minWidth: "180px" },
  label: { fontSize: "0.82rem", fontWeight: "700", color: "#555" },
  input: {
    padding: "10px 12px",
    border: "1.5px solid #ddd",
    borderRadius: "7px",
    fontSize: "0.92rem",
    outline: "none",
    transition: "border-color 0.2s",
    backgroundColor: "#fafafa",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "10px 12px",
    border: "1.5px solid #ddd",
    borderRadius: "7px",
    fontSize: "0.92rem",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
    backgroundColor: "#fafafa",
    width: "100%",
    boxSizing: "border-box",
  },
  saveBtn: {
    backgroundColor: "#e53935",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    padding: "11px",
    fontWeight: "700",
    fontSize: "0.95rem",
    cursor: "pointer",
    marginTop: "4px",
    alignSelf: "flex-start",
    minWidth: "140px",
  },
};

export default Profile;
