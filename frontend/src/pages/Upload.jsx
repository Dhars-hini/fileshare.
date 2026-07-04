import React, { useState, useEffect, useCallback } from "react";
import { axiosInstance, authHeader, SERVER_BASE } from "../utils/api";

const FILE_SERVER = SERVER_BASE;

const fileIcon = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "🎬";
  if (["mp3", "wav", "ogg"].includes(ext)) return "🎵";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["zip", "rar", "7z", "tar"].includes(ext)) return "🗜️";
  return "📁";
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const buildDownloadUrl = (filePath = "") => {
  const normalized = filePath.replace(/\\/g, "/");
  const clean = normalized.startsWith("/") ? normalized.slice(1) : normalized;
  return `${FILE_SERVER}/${clean}`;
};

const Upload = () => {
  const token = localStorage.getItem("token");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

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
      alert(err.response?.data?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileChange = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setSelectedFiles(dropped);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return alert("Please select files to upload.");
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));

    setUploading(true);
    setProgress(0);

    try {
      await axiosInstance.post("/files/upload", formData, {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setProgress(pct);
        },
      });
      setSelectedFiles([]);
      setProgress(100);
      setSuccessMsg(`${selectedFiles.length} file(s) uploaded successfully!`);
      setTimeout(() => setSuccessMsg(""), 3500);
      fetchFiles();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const deleteFile = async (id) => {
    if (!window.confirm("Delete this file permanently?")) return;
    try {
      await axiosInstance.delete(`/files/${id}`, {
        headers: { ...authHeader() },
      });
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete file");
    }
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <p style={{ color: "#e53935", textAlign: "center", marginTop: "4rem" }}>
          Please login to upload files.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Upload Files</h1>
        <p style={styles.subtitle}>Drag & drop or click to select files</p>

        {/* Drop Zone */}
        <div
          style={{
            ...styles.dropZone,
            ...(dragOver ? styles.dropZoneActive : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("fileInput").click()}
        >
          <div style={{ fontSize: "3rem" }}>☁️</div>
          <p style={styles.dropText}>
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected`
              : "Click or drag files here"}
          </p>
          {selectedFiles.length > 0 && (
            <ul style={styles.selectedList}>
              {selectedFiles.map((f, i) => (
                <li key={i} style={styles.selectedItem}>
                  {fileIcon(f.name)} {f.name} ({formatSize(f.size)})
                </li>
              ))}
            </ul>
          )}
          <input
            id="fileInput"
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Progress bar */}
        {uploading && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          </div>
        )}

        {/* Success message */}
        {successMsg && <div style={styles.successBox}>{successMsg}</div>}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFiles.length}
          style={{
            ...styles.uploadBtn,
            opacity: uploading || !selectedFiles.length ? 0.6 : 1,
            cursor: uploading || !selectedFiles.length ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? `Uploading... ${progress}%` : "Upload Now"}
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLabel}>
            Uploaded Files ({files.length})
          </span>
        </div>

        {/* File list */}
        {loading ? (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={{ color: "#888", marginTop: "10px" }}>Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", padding: "2rem 0" }}>
            No files uploaded yet.
          </p>
        ) : (
          <div style={styles.fileList}>
            {files.map((file) => (
              <div key={file._id} style={styles.fileRow}>
                <span style={styles.rowIcon}>{fileIcon(file.originalName)}</span>
                <div style={styles.rowMeta}>
                  <p style={styles.rowName} title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p style={styles.rowSub}>{formatSize(file.size)}</p>
                </div>
                <div style={styles.rowActions}>
                  <a
                    href={buildDownloadUrl(file.path)}
                    target="_blank"
                    rel="noreferrer"
                    download={file.originalName}
                    style={styles.btnDownload}
                  >
                    ⬇
                  </a>
                  <button
                    onClick={() => deleteFile(file._id)}
                    style={styles.btnDelete}
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
    maxWidth: "700px",
    margin: "0 auto",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#1a1a2e",
    margin: "0 0 4px",
  },
  subtitle: {
    color: "#888",
    fontSize: "0.9rem",
    marginBottom: "1.5rem",
  },
  dropZone: {
    border: "2px dashed #d0d0d0",
    borderRadius: "12px",
    backgroundColor: "#fff",
    padding: "2.5rem 1.5rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    marginBottom: "1rem",
  },
  dropZoneActive: {
    borderColor: "#e53935",
    backgroundColor: "#fff8f8",
  },
  dropText: {
    color: "#555",
    fontSize: "1rem",
    fontWeight: "600",
    margin: "8px 0 0",
  },
  selectedList: {
    listStyle: "none",
    padding: "8px 0 0",
    margin: 0,
    textAlign: "left",
    display: "inline-block",
  },
  selectedItem: {
    fontSize: "0.85rem",
    color: "#444",
    padding: "2px 0",
  },
  progressWrap: {
    height: "8px",
    backgroundColor: "#eee",
    borderRadius: "4px",
    marginBottom: "12px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#e53935",
    borderRadius: "4px",
    transition: "width 0.2s",
  },
  successBox: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #a5d6a7",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "0.88rem",
    marginBottom: "12px",
  },
  uploadBtn: {
    width: "100%",
    padding: "13px",
    backgroundColor: "#e53935",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "1rem",
    marginBottom: "2rem",
    transition: "opacity 0.2s",
  },
  divider: {
    borderTop: "1px solid #e0e0e0",
    marginBottom: "1.2rem",
    textAlign: "center",
    position: "relative",
  },
  dividerLabel: {
    position: "relative",
    top: "-11px",
    backgroundColor: "#f0f2f5",
    padding: "0 12px",
    color: "#888",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem 0",
  },
  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid #eee",
    borderTop: "3px solid #e53935",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  fileRow: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid #eee",
  },
  rowIcon: {
    fontSize: "1.6rem",
    flexShrink: 0,
  },
  rowMeta: {
    flex: 1,
    overflow: "hidden",
  },
  rowName: {
    margin: 0,
    fontWeight: "600",
    color: "#1a1a2e",
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rowSub: {
    margin: "2px 0 0",
    color: "#aaa",
    fontSize: "0.78rem",
  },
  rowActions: {
    display: "flex",
    gap: "8px",
  },
  btnDownload: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #c8e6c9",
    padding: "7px 12px",
    borderRadius: "6px",
    fontSize: "0.9rem",
    textDecoration: "none",
  },
  btnDelete: {
    backgroundColor: "#fdecea",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    padding: "7px 12px",
    borderRadius: "6px",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
};

export default Upload;
