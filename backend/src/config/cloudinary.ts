import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.Cloud_Name || process.env.CLOUDINARY_NAME,
  api_key: process.env.Api_Key || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.Api_Secret || process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
