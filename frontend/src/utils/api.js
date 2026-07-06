import axios from "axios";

export const API_BASE = "https://fileshare-api-12hv.onrender.com/api";
export const SERVER_BASE = "https://fileshare-api-12hv.onrender.com";

export const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const axiosInstance = axios.create({
  baseURL: API_BASE,
});
