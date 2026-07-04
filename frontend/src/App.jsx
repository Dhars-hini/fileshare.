import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import { axiosInstance, authHeader } from "./utils/api";

// Redirects to /login if not authenticated
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

// Redirects to / if not admin
const AdminRoute = ({ children, isAdmin }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setUserChecked(true); return; }

    axiosInstance
      .get("/auth/me", { headers: authHeader() })
      .then((res) => {
        setIsAdmin(res.data.role === "admin");
      })
      .catch(() => {
        // token invalid — clear it
        localStorage.removeItem("token");
      })
      .finally(() => setUserChecked(true));
  }, []);

  if (!userChecked) return null; // avoid flash before role is known

  return (
    <>
      <Navbar isAdmin={isAdmin} />
      <Routes>
        {/* Public */}
        <Route path="/home"     element={<Home />} />
        <Route path="/login"    element={<Login onLogin={() => window.location.reload()} />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/upload"  element={<PrivateRoute><Upload /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <AdminRoute isAdmin={isAdmin}>
              <Admin />
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
