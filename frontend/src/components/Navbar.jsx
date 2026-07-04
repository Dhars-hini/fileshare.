import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = ({ isAdmin }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const token     = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;
  const linkStyle = (path) => ({
    ...s.link,
    ...(isActive(path) ? s.activeLink : {}),
  });

  return (
    <nav style={s.navbar}>
      {/* Brand */}
      <Link to={token ? "/" : "/home"} style={s.brand}>
        <span style={{ marginRight: "6px" }}>📁</span>FileShare
      </Link>

      {/* Nav links */}
      {token ? (
        <ul style={s.navLinks}>
          <li><Link to="/"        style={linkStyle("/")}>Dashboard</Link></li>
          <li><Link to="/upload"  style={linkStyle("/upload")}>Upload</Link></li>
          <li><Link to="/profile" style={linkStyle("/profile")}>Profile</Link></li>
          {isAdmin && (
            <li>
              <Link to="/admin" style={{ ...linkStyle("/admin"), ...s.adminLink }}>
                👑 Admin
              </Link>
            </li>
          )}
          <li>
            <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      ) : (
        <ul style={s.navLinks}>
          <li><Link to="/login"    style={linkStyle("/login")}>Login</Link></li>
          <li><Link to="/register" style={s.registerBtn}>Register</Link></li>
        </ul>
      )}
    </nav>
  );
};

const s = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    height: "58px",
    backgroundColor: "#c62828",
    color: "#fff",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  brand: {
    fontSize: "1.3rem",
    fontWeight: "800",
    color: "#fff",
    textDecoration: "none",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
  },
  navLinks: {
    display: "flex",
    gap: "4px",
    listStyle: "none",
    margin: 0,
    padding: 0,
    alignItems: "center",
    flexWrap: "wrap",
  },
  link: {
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
    padding: "7px 13px",
    borderRadius: "6px",
    cursor: "pointer",
    textDecoration: "none",
    fontSize: "0.92rem",
    transition: "background 0.15s",
  },
  activeLink: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
  },
  adminLink: {
    backgroundColor: "rgba(255,200,0,0.2)",
    color: "#ffe082",
  },
  logoutBtn: {
    backgroundColor: "#fff",
    color: "#c62828",
    border: "none",
    padding: "7px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "0.92rem",
    marginLeft: "4px",
  },
  registerBtn: {
    backgroundColor: "#fff",
    color: "#c62828",
    fontWeight: "700",
    padding: "7px 14px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.92rem",
    marginLeft: "4px",
  },
};

export default Navbar;
