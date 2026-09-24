import express from "express";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import {
  createNewChat,
  deleteChat,
  deleteMessage,
  getAllChats,
  getMessagesByChat,
  sendMessage,
  updateMessage,
} from "../controllers/chatController.js";

const router = express.Router();

// Chat conversation endpoints
router.post("/chat/new", isAuth, createNewChat);
router.get("/chat/all", isAuth, getAllChats);
router.delete("/chat/:chatId", isAuth, deleteChat);

// Message endpoints
router.post("/message", isAuth, upload.single("image"), sendMessage);
router.get("/message/:chatId", isAuth, getMessagesByChat);
router.put("/message/:messageId", isAuth, updateMessage);
router.delete("/message/:messageId", isAuth, deleteMessage);

export default router;
