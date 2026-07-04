import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import FileUpload from "../components/FileUpload";

const API_BASE = "http://localhost:5000/api";

const Files = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // Stable fetchFiles function
  const fetchFiles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">Please login to view your files.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">My Files</h1>

        {/* Upload component */}
        <FileUpload token={token} onUpload={fetchFiles} />

        {loading ? (
          <p className="mt-4">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="mt-4 text-gray-500">No files uploaded yet.</p>
        ) : (
          <div className="space-y-3 mt-4">
            {files.map((file) => (
              <div
                key={file._id}
                className="flex justify-between items-center border p-3 rounded"
              >
                <div>
                  <p className="font-medium">{file.originalName}</p>
                  <p className="text-sm text-gray-500">
                    {Math.round(file.size / 1024)} KB
                  </p>
                </div>

                <a
                  href={`http://localhost:5000/${file.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Files;
