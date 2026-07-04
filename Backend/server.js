const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
const app = express();

// Allow requests from local dev AND the deployed Vercel frontend
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL, // set this in Render env vars to your Vercel URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Static file access (files + avatars)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));

app.get("/", (req, res) => {
  res.send("FileShare API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
