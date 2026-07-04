// src/services/authService.js
import axios from "axios";

const TOKEN_KEY = "token";

const authService = {
  saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    // set default axios header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common["Authorization"];
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // optional convenience: login wrapper calling your backend
  async login({ email, password }) {
    const res = await axios.post(`${process.env.REACT_APP_API_BASE || "http://localhost:5000"}/api/auth/login`, { email, password });
    const token = res.data.token;
    this.saveToken(token);
    return res.data;
  },

  async logout() {
    this.removeToken();
  }
};

export default authService;
