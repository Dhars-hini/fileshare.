// src/services/fileService.js
import axios from "axios";

const token = localStorage.getItem("token");
const headers = { Authorization: `Bearer ${token}` };

export const getFiles = async () => {
  const res = await axios.get(`${process.env.REACT_APP_API_BASE || "http://localhost:5000"}/api/files`, { headers });
  return res.data;
};

export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach(f => formData.append("file", f));
  const res = await axios.post(`${process.env.REACT_APP_API_BASE || "http://localhost:5000"}/api/files/upload`, formData, { headers });
  return res.data;
};

export const deleteFile = async (id) => {
  await axios.delete(`${process.env.REACT_APP_API_BASE || "http://localhost:5000"}/api/files/${id}`, { headers });
};

export const createShareLink = async (id) => {
  const res = await axios.post(`${process.env.REACT_APP_API_BASE || "http://localhost:5000"}/api/files/share/${id}`, {}, { headers });
  return res.data.shareUrl;
};
