import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";

import connectDb from "./config/db.js";
import { app, server } from "./config/socket.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDb();

// Ensure local uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global Middlewares
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static files for uploaded images
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.use("/api/v1", userRoutes);
app.use("/api/v1", chatRoutes);

// Health check endpoint
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    app: "HalistaChat Server",
    version: "1.0.0",
    description: "CRUD WebChat Backend with Socket.IO and Email/Password Auth",
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 HalistaChat Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🔑 Auth: Email & Password with JWT & Bcrypt`);
  console.log(`===============================================`);
});
