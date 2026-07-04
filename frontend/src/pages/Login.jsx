import React, { useState } from "react";
import { axiosInstance } from "../utils/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Logo / Brand */}
        <div style={styles.brand}>
          <span style={styles.brandIcon}>📁</span>
          <span style={styles.brandName}>FileShare</span>
        </div>

        <h2 style={styles.heading}>Welcome back</h2>
        <p style={styles.subText}>Sign in to your account</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#e53935")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#e53935")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = "#c62828")}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = "#e53935")}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <a href="/register" style={styles.link}>Create one</a>
        </p>
      </div>
    </div>
  );
};

const styles = {
  root: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: "1rem",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2.5rem 2rem",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "1.5rem",
  },
  brandIcon: { fontSize: "1.8rem" },
  brandName: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#e53935",
  },
  heading: {
    textAlign: "center",
    color: "#1a1a2e",
    fontSize: "1.5rem",
    fontWeight: "700",
    margin: "0 0 4px 0",
  },
  subText: {
    textAlign: "center",
    color: "#777",
    fontSize: "0.9rem",
    marginBottom: "1.5rem",
  },
  errorBox: {
    backgroundColor: "#fdecea",
    color: "#c62828",
    border: "1px solid #f5c6c6",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "0.88rem",
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    color: "#333",
    fontWeight: "600",
    fontSize: "0.88rem",
  },
  input: {
    padding: "11px 13px",
    border: "1.5px solid #ddd",
    borderRadius: "7px",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#e53935",
    color: "#fff",
    fontWeight: "700",
    padding: "12px",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.2s",
    marginTop: "0.5rem",
  },
  footerText: {
    textAlign: "center",
    color: "#666",
    fontSize: "0.88rem",
    marginTop: "1.2rem",
  },
  link: {
    color: "#e53935",
    textDecoration: "none",
    fontWeight: "600",
  },
};

export default Login;
