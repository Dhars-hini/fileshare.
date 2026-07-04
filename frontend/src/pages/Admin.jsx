import React, { useEffect, useState, useCallback } from "react";
import { axiosInstance, authHeader, SERVER_BASE } from "../utils/api";

const SERVER = SERVER_BASE;

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "—";

const fileIcon = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "🖼️";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc","docx"].includes(ext)) return "📝";
  if (["xls","xlsx","csv"].includes(ext)) return "📊";
  if (["zip","rar","7z"].includes(ext)) return "🗜️";
  if (["mp4","mov","avi"].includes(ext)) return "🎬";
  if (["mp3","wav"].includes(ext)) return "🎵";
  return "📁";
};

const buildUrl = (p = "") => `${SERVER}/${p.replace(/\\/g, "/")}`;

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...s.statCard, borderTop: `4px solid ${color}` }}>
    <div style={{ fontSize: "2rem" }}>{icon}</div>
    <div style={{ ...s.statValue, color }}>{value}</div>
    <div style={s.statLabel}>{label}</div>
  </div>
);

// ── File Drawer ───────────────────────────────────────────────────────────────
const FileDrawer = ({ user, onClose, onStatsChange }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/auth/admin/users/${user._id}/files`, {
        headers: authHeader(),
      });
      setFiles(res.data);
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [user._id]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/auth/admin/files/${fileId}`, { headers: authHeader() });
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
      showMsg("success", `"${fileName}" deleted.`);
      onStatsChange();
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Delete failed");
    }
  };

  const startRename = (file) => {
    setRenamingId(file._id);
    setRenameVal(file.originalName);
  };

  const handleRename = async (fileId) => {
    if (!renameVal.trim()) return;
    try {
      const res = await axiosInstance.patch(
        `/auth/admin/files/${fileId}/rename`,
        { originalName: renameVal.trim() },
        { headers: authHeader() }
      );
      setFiles((prev) => prev.map((f) => f._id === fileId ? { ...f, originalName: res.data.originalName } : f));
      setRenamingId(null);
      showMsg("success", "File renamed.");
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Rename failed");
    }
  };

  const existingFiles = files.filter((f) => f.exists !== false);
  const missingFiles  = files.filter((f) => f.exists === false);

  return (
    <>
      {/* Backdrop */}
      <div style={s.backdrop} onClick={onClose} />

      {/* Drawer */}
      <div style={s.drawer}>
        {/* Drawer header */}
        <div style={s.drawerHeader}>
          <div>
            <h2 style={s.drawerTitle}>
              {user.avatar
                ? <img src={buildUrl(user.avatar)} alt="" style={s.drawerAvatar} />
                : <span style={s.drawerAvatarInit}>{user.name.charAt(0).toUpperCase()}</span>
              }
              {user.name}'s Files
            </h2>
            <p style={s.drawerSub}>
              {existingFiles.length} file{existingFiles.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
              {formatSize(existingFiles.reduce((a, f) => a + (f.size || 0), 0))}
            </p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Toast */}
        {msg.text && (
          <div style={{ ...s.toast, ...(msg.type === "error" ? s.toastError : s.toastSuccess) }}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <div style={s.drawerCenter}><div style={s.spinner} /></div>
        ) : files.length === 0 ? (
          <div style={s.drawerEmpty}>
            <div style={{ fontSize: "3rem" }}>📂</div>
            <p style={{ color: "#aaa", marginTop: "8px" }}>No files uploaded by this user.</p>
          </div>
        ) : (
          <div style={s.drawerList}>
            {existingFiles.map((file) => (
              <div key={file._id} style={s.fileRow}>
                <span style={s.fileRowIcon}>{fileIcon(file.originalName)}</span>

                {/* Name / rename input */}
                <div style={s.fileRowMeta}>
                  {renamingId === file._id ? (
                    <input
                      style={s.renameInput}
                      value={renameVal}
                      autoFocus
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(file._id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                    />
                  ) : (
                    <p style={s.fileRowName} title={file.originalName}>{file.originalName}</p>
                  )}
                  <p style={s.fileRowSub}>
                    {formatSize(file.size)} &nbsp;·&nbsp; {formatDate(file.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div style={s.fileRowActions}>
                  {renamingId === file._id ? (
                    <>
                      <button style={s.btnSave}    onClick={() => handleRename(file._id)}>Save</button>
                      <button style={s.btnCancel}  onClick={() => setRenamingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <a
                        href={buildUrl(file.path)}
                        target="_blank"
                        rel="noreferrer"
                        download={file.originalName}
                        style={s.btnDownload}
                        title="Download"
                      >⬇</a>
                      <button style={s.btnRename} onClick={() => startRename(file)} title="Rename">✏️</button>
                      <button style={s.btnDelete} onClick={() => handleDelete(file._id, file.originalName)} title="Delete">🗑</button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Missing files (DB record but no disk file) */}
            {missingFiles.length > 0 && (
              <div style={s.missingSection}>
                <p style={s.missingLabel}>⚠️ {missingFiles.length} orphaned record{missingFiles.length !== 1 ? "s" : ""} (file missing on disk)</p>
                {missingFiles.map((file) => (
                  <div key={file._id} style={{ ...s.fileRow, opacity: 0.5 }}>
                    <span style={s.fileRowIcon}>❌</span>
                    <div style={s.fileRowMeta}>
                      <p style={s.fileRowName}>{file.originalName}</p>
                      <p style={s.fileRowSub}>{formatSize(file.size)} · missing</p>
                    </div>
                    <div style={s.fileRowActions}>
                      <button style={s.btnDelete} onClick={() => handleDelete(file._id, file.originalName)} title="Remove record">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ── Main Admin Component ──────────────────────────────────────────────────────
const Admin = () => {
  const [stats, setStats]           = useState(null);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [msg, setMsg]               = useState({ type: "", text: "" });
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axiosInstance.get("/auth/admin/stats", { headers: authHeader() }),
        axiosInstance.get("/auth/admin/users", { headers: authHeader() }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}" and ALL their files? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await axiosInstance.delete(`/auth/admin/users/${id}`, { headers: authHeader() });
      setUsers((prev) => prev.filter((u) => u._id !== id));
      showMsg("success", `User "${name}" deleted.`);
      fetchData();
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleRole = async (id, name, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change "${name}" to ${newRole}?`)) return;
    setTogglingId(id);
    try {
      await axiosInstance.patch(`/auth/admin/users/${id}/role`, {}, { headers: authHeader() });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: newRole } : u));
      showMsg("success", `"${name}" is now ${newRole}.`);
    } catch (err) {
      showMsg("error", err.response?.data?.msg || "Role change failed");
    } finally {
      setTogglingId(null);
    }
  };

  // After a file is deleted from the drawer, refresh stats + user row counts
  const handleStatsChange = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axiosInstance.get("/auth/admin/stats", { headers: authHeader() }),
        axiosInstance.get("/auth/admin/users", { headers: authHeader() }),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch {}
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>
      {/* File drawer overlay */}
      {drawerUser && (
        <FileDrawer
          user={drawerUser}
          onClose={() => setDrawerUser(null)}
          onStatsChange={handleStatsChange}
        />
      )}

      <div style={s.container}>
        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.title}>Admin Panel</h1>
            <p style={s.subtitle}>Manage users, roles, and files</p>
          </div>
          <button style={s.refreshBtn} onClick={fetchData}>↻ Refresh</button>
        </div>

        {/* Toast */}
        {msg.text && (
          <div style={{ ...s.toast, ...(msg.type === "error" ? s.toastError : s.toastSuccess) }}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <div style={s.center}><div style={s.spinner} /><p style={{ color: "#888", marginTop: "12px" }}>Loading...</p></div>
        ) : (
          <>
            {/* Stat cards */}
            {stats && (
              <div style={s.statsGrid}>
                <StatCard icon="👥" label="Total Users"   value={stats.totalUsers}              color="#1565c0" />
                <StatCard icon="👑" label="Admins"        value={stats.totalAdmins}             color="#e65100" />
                <StatCard icon="📁" label="Actual Files"  value={stats.totalFiles}              color="#2e7d32" />
                <StatCard icon="💾" label="Storage Used"  value={formatSize(stats.totalStorage)} color="#6a1b9a" />
              </div>
            )}

            {/* Search */}
            <div style={s.searchRow}>
              <input
                style={s.searchInput}
                placeholder="🔍  Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span style={s.resultCount}>{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Table */}
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>User</th>
                    <th style={s.th}>Role</th>
                    <th style={{ ...s.th, textAlign: "center" }}>Files</th>
                    <th style={s.th}>Storage</th>
                    <th style={s.th}>Joined</th>
                    <th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "#aaa" }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u._id} style={s.tr}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                      >
                        {/* User */}
                        <td style={s.td}>
                          <div style={s.userCell}>
                            {u.avatar
                              ? <img src={buildUrl(u.avatar)} alt="" style={s.avatarImg} />
                              : <div style={s.avatarInit}>{u.name.charAt(0).toUpperCase()}</div>
                            }
                            <div>
                              <p style={s.userName}>{u.name}</p>
                              <p style={s.userEmail}>{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={s.td}>
                          <span style={{ ...s.badge, ...(u.role === "admin" ? s.badgeAdmin : s.badgeUser) }}>
                            {u.role === "admin" ? "👑 Admin" : "👤 User"}
                          </span>
                        </td>

                        {/* Files count — clickable */}
                        <td style={{ ...s.td, textAlign: "center" }}>
                          <button
                            style={s.fileCountBtn}
                            onClick={() => setDrawerUser(u)}
                            title="View files"
                          >
                            {u.fileCount ?? 0}
                          </button>
                        </td>

                        {/* Storage */}
                        <td style={s.td}>
                          <span style={{ color: "#555", fontSize: "0.85rem" }}>{formatSize(u.totalSize)}</span>
                        </td>

                        {/* Joined */}
                        <td style={s.td}>
                          <span style={{ color: "#999", fontSize: "0.8rem" }}>{formatDate(u.createdAt)}</span>
                        </td>

                        {/* Actions */}
                        <td style={s.td}>
                          <div style={s.actions}>
                            <button
                              style={s.viewBtn}
                              onClick={() => setDrawerUser(u)}
                            >
                              📂 Files
                            </button>
                            <button
                              style={{ ...s.roleBtn, ...(u.role === "admin" ? s.roleDemote : s.rolePromote), opacity: togglingId === u._id ? 0.6 : 1 }}
                              disabled={togglingId === u._id}
                              onClick={() => handleToggleRole(u._id, u.name, u.role)}
                            >
                              {u.role === "admin" ? "Demote" : "Make Admin"}
                            </button>
                            <button
                              style={{ ...s.deleteBtn, opacity: deletingId === u._id ? 0.6 : 1 }}
                              disabled={deletingId === u._id}
                              onClick={() => handleDelete(u._id, u.name)}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: "2rem 1rem",
  },
  container:  { maxWidth: "1100px", margin: "0 auto" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" },
  title:      { fontSize: "1.8rem", fontWeight: "800", color: "#1a1a2e", margin: 0 },
  subtitle:   { color: "#888", fontSize: "0.88rem", margin: "4px 0 0" },
  refreshBtn: { backgroundColor: "#fff", border: "1.5px solid #ddd", borderRadius: "7px", padding: "8px 18px", cursor: "pointer", fontWeight: "600", fontSize: "0.88rem", color: "#555" },
  toast:      { borderRadius: "8px", padding: "10px 16px", marginBottom: "1rem", fontSize: "0.88rem", fontWeight: "600" },
  toastSuccess: { backgroundColor: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7" },
  toastError:   { backgroundColor: "#fdecea", color: "#c62828", border: "1px solid #ffcdd2" },
  center:     { display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 0" },
  spinner:    { width: "36px", height: "36px", border: "4px solid #eee", borderTop: "4px solid #e53935", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  statsGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "1.5rem" },
  statCard:   { backgroundColor: "#fff", borderRadius: "10px", padding: "1.2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", textAlign: "center" },
  statValue:  { fontSize: "1.8rem", fontWeight: "800", margin: "6px 0 2px" },
  statLabel:  { fontSize: "0.8rem", color: "#888", fontWeight: "600" },

  searchRow:   { display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "220px", padding: "10px 14px", border: "1.5px solid #ddd", borderRadius: "8px", fontSize: "0.9rem", outline: "none", backgroundColor: "#fff" },
  resultCount: { color: "#aaa", fontSize: "0.85rem", whiteSpace: "nowrap" },

  tableWrap: { backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", overflowX: "auto" },
  table:     { width: "100%", borderCollapse: "collapse", minWidth: "720px" },
  thead:     { backgroundColor: "#f8f8f8" },
  th:        { padding: "12px 16px", textAlign: "left", fontSize: "0.78rem", fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #eee" },
  tr:        { borderBottom: "1px solid #f5f5f5", transition: "background 0.1s" },
  td:        { padding: "12px 16px", verticalAlign: "middle", fontSize: "0.88rem" },

  userCell:   { display: "flex", alignItems: "center", gap: "10px" },
  avatarImg:  { width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #eee", flexShrink: 0 },
  avatarInit: { width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#e53935", color: "#fff", fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  userName:   { margin: 0, fontWeight: "700", color: "#1a1a2e", fontSize: "0.88rem" },
  userEmail:  { margin: "2px 0 0", color: "#aaa", fontSize: "0.78rem" },

  badge:      { borderRadius: "20px", padding: "3px 10px", fontSize: "0.75rem", fontWeight: "700" },
  badgeAdmin: { backgroundColor: "#fff3e0", color: "#e65100" },
  badgeUser:  { backgroundColor: "#e3f2fd", color: "#1565c0" },

  fileCountBtn: { background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: "20px", padding: "3px 12px", fontWeight: "700", fontSize: "0.85rem", cursor: "pointer" },

  actions:     { display: "flex", gap: "6px", flexWrap: "wrap" },
  viewBtn:     { padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.78rem", backgroundColor: "#e8f5e9", color: "#2e7d32" },
  roleBtn:     { padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.78rem" },
  rolePromote: { backgroundColor: "#fff3e0", color: "#e65100" },
  roleDemote:  { backgroundColor: "#e3f2fd", color: "#1565c0" },
  deleteBtn:   { padding: "5px 10px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "0.78rem", backgroundColor: "#fdecea", color: "#c62828" },

  // Drawer
  backdrop:    { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 200 },
  drawer: {
    position: "fixed", top: 0, right: 0, bottom: 0,
    width: "min(500px, 100vw)",
    backgroundColor: "#fff",
    zIndex: 201,
    display: "flex", flexDirection: "column",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
    overflowY: "auto",
  },
  drawerHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1.5rem", borderBottom: "1px solid #eee", gap: "12px" },
  drawerTitle:  { display: "flex", alignItems: "center", gap: "10px", fontSize: "1.1rem", fontWeight: "800", color: "#1a1a2e", margin: 0 },
  drawerSub:    { color: "#aaa", fontSize: "0.82rem", margin: "4px 0 0 46px" },
  drawerAvatar: { width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e53935" },
  drawerAvatarInit: { width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#e53935", color: "#fff", fontWeight: "700", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  closeBtn:     { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#aaa", padding: "4px 8px", flexShrink: 0 },
  drawerCenter: { display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "3rem" },
  drawerEmpty:  { textAlign: "center", padding: "4rem 2rem" },
  drawerList:   { padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "10px" },

  missingSection: { marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #eee" },
  missingLabel:   { fontSize: "0.78rem", color: "#e65100", fontWeight: "600", marginBottom: "8px" },

  fileRow:        { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: "1px solid #f0f0f0", backgroundColor: "#fafafa" },
  fileRowIcon:    { fontSize: "1.5rem", flexShrink: 0 },
  fileRowMeta:    { flex: 1, overflow: "hidden" },
  fileRowName:    { margin: 0, fontWeight: "600", color: "#1a1a2e", fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  fileRowSub:     { margin: "2px 0 0", color: "#aaa", fontSize: "0.75rem" },
  fileRowActions: { display: "flex", gap: "6px", flexShrink: 0 },

  renameInput: { width: "100%", padding: "5px 8px", border: "1.5px solid #e53935", borderRadius: "5px", fontSize: "0.88rem", outline: "none" },
  btnDownload: { backgroundColor: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", padding: "5px 10px", borderRadius: "5px", fontSize: "0.82rem", textDecoration: "none" },
  btnRename:   { backgroundColor: "#fff3e0", color: "#e65100", border: "1px solid #ffe0b2", padding: "5px 10px", borderRadius: "5px", fontSize: "0.82rem", cursor: "pointer" },
  btnDelete:   { backgroundColor: "#fdecea", color: "#c62828", border: "1px solid #ffcdd2", padding: "5px 10px", borderRadius: "5px", fontSize: "0.82rem", cursor: "pointer" },
  btnSave:     { backgroundColor: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7", padding: "5px 10px", borderRadius: "5px", fontSize: "0.82rem", cursor: "pointer", fontWeight: "700" },
  btnCancel:   { backgroundColor: "#f5f5f5", color: "#888", border: "1px solid #ddd", padding: "5px 10px", borderRadius: "5px", fontSize: "0.82rem", cursor: "pointer" },
};

export default Admin;
