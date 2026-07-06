import axios from "axios";

// Production backend URL — update this if your Render URL changes
const PROD_API    = "https://fileshare-api-12hv.onrender.com/api";
const PROD_SERVER = "https://fileshare-api-12hv.onrender.com";
// v2 — forced rebuild

// Use env var if set (Vercel dashboard), else use hardcoded production URL,
// else fall back to localhost for local dev
export const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "production" ? PROD_API : "http://localhost:5000/api");

export const SERVER_BASE =
  process.env.REACT_APP_SERVER_BASE ||
  (process.env.NODE_ENV === "production" ? PROD_SERVER : "http://localhost:5000");

// Auth header helper
export const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Axios instance
export const axiosInstance = axios.create({
  baseURL: API_BASE,
});
