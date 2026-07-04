const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
const app = express();

// CORS — allow Vercel frontend + localhost
app.use(
  cors({
    origin: true, // reflect the request origin — works for all origins
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
