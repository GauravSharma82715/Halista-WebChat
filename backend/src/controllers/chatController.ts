import TryCatch from "../config/TryCatch.js";
import { AuthenticatedRequest } from "../middleware/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { getReceiverSocketId, io } from "../config/socket.js";
import mongoose from "mongoose";

// Create or return existing chat between two users
export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    res.status(400).json({ message: "otherUserId is required" });
    return;
  }

  if (userId === otherUserId) {
    res.status(400).json({ message: "Cannot create chat with yourself" });
    return;
  }

  const existingChat = await Chat.findOne({
    users: { $all: [userId, otherUserId], $size: 2 },
  });

  if (existingChat) {
    res.json({
      message: "Chat already exists",
      chatId: existingChat._id,
    });
    return;
  }

  const newChat = await Chat.create({
    users: [userId, otherUserId],
  });

  res.status(201).json({
    message: "New chat created",
    chatId: newChat._id,
  });
});

// Get all chats for the logged-in user
export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const chats = await Chat.find({ users: userId })
    .populate("users", "name email profilePic")
    .sort({ updatedAt: -1 });

  const chatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUser = (chat.users as any[]).find(
        (u) => u._id.toString() !== userId.toString()
      );

      const unseenCount = await Message.countDocuments({
        chatId: chat._id,
        sender: { $ne: userId },
        seen: false,
      });

      return {
        user: otherUser || { _id: "unknown", name: "Unknown User", email: "", profilePic: "" },
        chat: {
          ...chat.toObject(),
          unseenCount,
        },
      };
    })
  );

  res.json({
    chats: chatWithUserData,
  });
});

// Delete an entire chat conversation and its messages
export const deleteChat = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  const { chatId } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404).json({ message: "Chat not found" });
    return;
  }

  const isUserInChat = chat.users.some(
    (id) => id.toString() === userId.toString()
  );

  if (!isUserInChat) {
    res.status(403).json({ message: "You are not a participant of this chat" });
    return;
  }

  // Delete all messages in this chat
  await Message.deleteMany({ chatId });

  // Delete chat
  await Chat.findByIdAndDelete(chatId);

  // Notify socket room
  io.to(chatId).emit("chatDeleted", { chatId });

  res.json({
    message: "Chat and conversation history deleted successfully",
    chatId,
  });
});

// Send message
export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?._id;
  const { chatId, text } = req.body;
  const imageFile = req.file;

  if (!senderId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!chatId) {
    res.status(400).json({ message: "chatId is required" });
    return;
  }

  if (!text && !imageFile) {
    res.status(400).json({ message: "Either text or image is required" });
    return;
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404).json({ message: "Chat not found" });
    return;
  }

  const isUserInChat = chat.users.some(
    (id) => id.toString() === senderId.toString()
  );

  if (!isUserInChat) {
    res.status(403).json({ message: "You are not a participant of this chat" });
    return;
  }

  const otherUserId = chat.users.find(
    (id) => id.toString() !== senderId.toString()
  );

  // Check if receiver socket is online and inside this chat room
  const receiverSocketId = otherUserId
    ? getReceiverSocketId(otherUserId.toString())
    : undefined;
  let isReceiverInChatRoom = false;

  if (receiverSocketId) {
    const receiverSocket = io.sockets.sockets.get(receiverSocketId);
    if (receiverSocket && receiverSocket.rooms.has(chatId)) {
      isReceiverInChatRoom = true;
    }
  }

  let messageData: any = {
    chatId,
    sender: senderId,
    seen: isReceiverInChatRoom,
    seenAt: isReceiverInChatRoom ? new Date() : null,
  };

  if (imageFile) {
    const isCloudinaryUrl =
      imageFile.path &&
      (imageFile.path.startsWith("http://") || imageFile.path.startsWith("https://"));

    const imageUrl = isCloudinaryUrl
      ? imageFile.path
      : `${req.protocol}://${req.get("host")}/uploads/${imageFile.filename}`;

    messageData.image = {
      url: imageUrl,
      publicId: imageFile.filename || imageFile.originalname,
    };
    messageData.messageType = "image";
    messageData.text = text ? text.trim() : "";
  } else {
    messageData.text = text ? text.trim() : "";
    messageData.messageType = "text";
  }

  const message = await Message.create(messageData);

  const latestMessageText = imageFile ? "📷 Photo" : text;

  await Chat.findByIdAndUpdate(chatId, {
    latestMessage: {
      text: latestMessageText,
      sender: senderId,
    },
    updatedAt: new Date(),
  });

  // Emit to socket room
  io.to(chatId).emit("newMessage", message);

  // If receiver is not in the room but online, emit to their direct socket
  if (receiverSocketId && !isReceiverInChatRoom) {
    io.to(receiverSocketId).emit("newMessage", message);
  }

  const senderSocketId = getReceiverSocketId(senderId.toString());
  if (senderSocketId && isReceiverInChatRoom && otherUserId) {
    io.to(senderSocketId).emit("messagesSeen", {
      chatId,
      seenBy: otherUserId.toString(),
      messageIds: [message._id],
    });
  }

  res.status(201).json({
    message,
    sender: senderId,
  });
});

// Get messages for a chat & mark received unread messages as read
export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!chatId) {
      res.status(400).json({ message: "chatId is required" });
      return;
    }

    const chat = await Chat.findById(chatId).populate(
      "users",
      "name email profilePic"
    );

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const isUserInChat = chat.users.some(
      (u: any) => u._id.toString() === userId.toString()
    );

    if (!isUserInChat) {
      res.status(403).json({ message: "You are not a participant of this chat" });
      return;
    }

    const otherUser = (chat.users as any[]).find(
      (u) => u._id.toString() !== userId.toString()
    );

    // Find messages to mark as seen
    const messagesToMarkSeen = await Message.find({
      chatId,
      sender: { $ne: userId },
      seen: false,
    });

    if (messagesToMarkSeen.length > 0) {
      await Message.updateMany(
        {
          chatId,
          sender: { $ne: userId },
          seen: false,
        },
        {
          seen: true,
          seenAt: new Date(),
        }
      );

      // Notify the sender that their messages were seen
      if (otherUser) {
        const otherUserSocketId = getReceiverSocketId(otherUser._id.toString());
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("messagesSeen", {
            chatId,
            seenBy: userId,
            messageIds: messagesToMarkSeen.map((m) => m._id),
          });
        }
      }
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    res.json({
      messages,
      user: otherUser || { _id: "unknown", name: "Unknown User", email: "", profilePic: "" },
    });
  }
);

// Update / Edit an existing message
export const updateMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  const { messageId } = req.params;
  const { text } = req.body;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!text || text.trim() === "") {
    res.status(400).json({ message: "Updated message text is required" });
    return;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404).json({ message: "Message not found" });
    return;
  }

  if (message.sender.toString() !== userId.toString()) {
    res.status(403).json({ message: "You can only edit your own messages" });
    return;
  }

  message.text = text.trim();
  message.isEdited = true;
  await message.save();

  // If this message was the latestMessage in the chat, update the chat's latest message text
  const chat = await Chat.findById(message.chatId);
  if (chat && chat.latestMessage && chat.latestMessage.sender?.toString() === userId.toString()) {
    const latestMsg = await Message.findOne({ chatId: message.chatId }).sort({ createdAt: -1 });
    if (latestMsg && latestMsg._id.toString() === messageId) {
      chat.latestMessage.text = message.text || "";
      await chat.save();
    }
  }

  // Notify socket room
  io.to(message.chatId.toString()).emit("messageUpdated", message);

  res.json({
    message,
    success: true,
  });
});

// Delete a message
export const deleteMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  const { messageId } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404).json({ message: "Message not found" });
    return;
  }

  if (message.sender.toString() !== userId.toString()) {
    res.status(403).json({ message: "You can only delete your own messages" });
    return;
  }

  const chatId = message.chatId.toString();

  await Message.findByIdAndDelete(messageId);

  // If this was the latest message in the chat, update latestMessage with previous one
  const previousMessage = await Message.findOne({ chatId }).sort({ createdAt: -1 });
  await Chat.findByIdAndUpdate(chatId, {
    latestMessage: previousMessage
      ? {
          text: previousMessage.messageType === "image" ? "📷 Photo" : previousMessage.text || "",
          sender: previousMessage.sender,
        }
      : { text: "", sender: null },
  });

  // Notify socket room
  io.to(chatId).emit("messageDeleted", { messageId, chatId });

  res.json({
    message: "Message deleted successfully",
    messageId,
    chatId,
  });
});
