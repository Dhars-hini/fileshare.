import axios from "axios";

// In production (Vercel), set REACT_APP_API_BASE in Vercel env vars
// In development, falls back to localhost:5000
export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

export const SERVER_BASE =
  process.env.REACT_APP_SERVER_BASE || "http://localhost:5000";

// Auth header helper
export const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Axios instance with base URL
export const axiosInstance = axios.create({
  baseURL: API_BASE,
});
