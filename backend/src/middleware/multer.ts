import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import path from "path";
import fs from "fs";

const cloudName = process.env.Cloud_Name || process.env.CLOUDINARY_NAME;
const apiKey = process.env.Api_Key || process.env.CLOUDINARY_API_KEY;

const isCloudinaryConfigured = Boolean(
  cloudName &&
  cloudName !== "your Cloud_Name" &&
  cloudName.trim() !== "" &&
  apiKey &&
  apiKey !== "your Api_Key" &&
  apiKey.trim() !== ""
);

let storage: multer.StorageEngine;

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "chat-images",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto" },
      ],
    } as any,
  });
} else {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  });
}

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export default upload;
