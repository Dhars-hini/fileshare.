import React, { useEffect, useState, useCallback } from "react";
import { axiosInstance, authHeader, SERVER_BASE } from "../utils/api";

const FILE_SERVER = SERVER_BASE;

// Returns an emoji icon based on file extension
const fileIcon = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "🎬";
  if (["mp3", "wav", "ogg"].includes(ext)) return "🎵";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["ppt", "pptx"].includes(ext)) return "📑";
  if (["zip", "rar", "7z", "tar"].includes(ext)) return "🗜️";
  if (["txt", "md"].includes(ext)) return "📃";
  return "📁";
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const token = localStorage.getItem("token");

  const fetchFiles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("/files", {
        headers: { ...authHeader() },
      });
      setFiles(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      alert(err.response?.data?.message || "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file permanently?")) return;
    setDeletingId(id);
    try {
      await axiosInstance.delete(`/files/${id}`, {
        headers: { ...authHeader() },
      });
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const shareFile = async (id) => {
    try {
      const res = await axiosInstance.post(
        `/files/share/${id}`,
        {},
        { headers: { ...authHeader() } }
      );
      const link = res.data.link;
      navigator.clipboard.writeText(link).catch(() => {});
      setShareMsg(`Link copied: ${link}`);
      setTimeout(() => setShareMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.message || "Share failed");
    }
  };

  // Build a correct download URL from the path stored in DB
  // DB stores e.g. "uploads\filename.pdf" — we need http://localhost:5000/uploads/filename.pdf
  const buildDownloadUrl = (filePath = "") => {
    const normalized = filePath.replace(/\\/g, "/");
    // strip leading slash if any
    const clean = normalized.startsWith("/") ? normalized.slice(1) : normalized;
    return `${FILE_SERVER}/${clean}`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header row */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Files</h1>
            <p style={styles.subtitle}>
              {loading ? "Loading..." : `${files.length} file${files.length !== 1 ? "s" : ""} stored`}
            </p>
          </div>
          <a href="/upload" style={styles.uploadBtn}>+ Upload Files</a>
        </div>

        {/* Share toast */}
        {shareMsg && <div style={styles.toast}>{shareMsg}</div>}

        {/* Content */}
        {loading ? (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={{ color: "#888", marginTop: "12px" }}>Fetching your files...</p>
          </div>
        ) : files.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "4rem" }}>📂</div>
            <h3 style={{ color: "#555", margin: "12px 0 6px" }}>No files yet</h3>
            <p style={{ color: "#999", fontSize: "0.9rem" }}>Upload something to get started</p>
            <a href="/upload" style={{ ...styles.uploadBtn, marginTop: "16px", display: "inline-block" }}>
              Upload your first file
            </a>
          </div>
        ) : (
          <div style={styles.fileGrid}>
            {files.map((file) => (
              <div key={file._id} style={styles.fileCard}>
                {/* Icon + name */}
                <div style={styles.fileTop}>
                  <span style={styles.fileIcon}>{fileIcon(file.originalName)}</span>
                  <div style={styles.fileMeta}>
                    <p style={styles.fileName} title={file.originalName}>
                      {file.originalName}
                    </p>
                    <p style={styles.fileSub}>
                      {formatSize(file.size)} &nbsp;·&nbsp; {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={styles.fileActions}>
                  <a
                    href={buildDownloadUrl(file.path)}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.btnDownload}
                    download={file.originalName}
                  >
                    ⬇ Download
                  </a>
                  <button
                    onClick={() => shareFile(file._id)}
                    style={styles.btnShare}
                  >
                    🔗 Share
                  </button>
                  <button
                    onClick={() => deleteFile(file._id)}
                    disabled={deletingId === file._id}
                    style={{
                      ...styles.btnDelete,
                      opacity: deletingId === file._id ? 0.6 : 1,
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: "2rem 1rem",
  },
  container: {
    maxWidth: "960px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#1a1a2e",
    margin: 0,
  },
  subtitle: {
    color: "#888",
    fontSize: "0.88rem",
    margin: "4px 0 0",
  },
  uploadBtn: {
    backgroundColor: "#e53935",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "700",
    textDecoration: "none",
    fontSize: "0.9rem",
    transition: "background 0.2s",
    whiteSpace: "nowrap",
  },
  toast: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #a5d6a7",
    borderRadius: "8px",
    padding: "10px 16px",
    marginBottom: "1rem",
    fontSize: "0.88rem",
    wordBreak: "break-all",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "4rem 0",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid #eee",
    borderTop: "4px solid #e53935",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyState: {
    textAlign: "center",
    padding: "5rem 0",
  },
  fileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  fileCard: {
    backgroundColor: "#fff",
    borderRadius: "10px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    border: "1px solid #eee",
    transition: "box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  fileTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  fileIcon: {
    fontSize: "2rem",
    lineHeight: 1,
    flexShrink: 0,
  },
  fileMeta: {
    overflow: "hidden",
    flex: 1,
  },
  fileName: {
    margin: 0,
    fontWeight: "700",
    color: "#1a1a2e",
    fontSize: "0.92rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  fileSub: {
    margin: "4px 0 0",
    color: "#999",
    fontSize: "0.78rem",
  },
  fileActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  btnDownload: {
    flex: 1,
    textAlign: "center",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #c8e6c9",
    padding: "7px 10px",
    borderRadius: "6px",
    fontSize: "0.82rem",
    fontWeight: "600",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  btnShare: {
    flex: 1,
    backgroundColor: "#e3f2fd",
    color: "#1565c0",
    border: "1px solid #bbdefb",
    padding: "7px 10px",
    borderRadius: "6px",
    fontSize: "0.82rem",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  btnDelete: {
    backgroundColor: "#fdecea",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    padding: "7px 10px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
};

export default Dashboard;
