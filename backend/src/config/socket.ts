import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Map of userId -> Set of active socket IDs
const userSocketMap = new Map<string, Set<string>>();

export const getReceiverSocketId = (receiverId: string): string | undefined => {
  const sockets = userSocketMap.get(String(receiverId));
  if (sockets && sockets.size > 0) {
    return Array.from(sockets)[0];
  }
  return undefined;
};

io.on("connection", (socket: Socket) => {
  const rawUserId = socket.handshake.query.userId as string | undefined;
  const userId =
    rawUserId && rawUserId !== "undefined" && rawUserId !== "null"
      ? String(rawUserId).trim()
      : undefined;

  if (userId) {
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId)!.add(socket.id);
    socket.join(userId);
    console.log(
      `🟢 User connected: ${userId} (socket ${socket.id}, total active sockets for user: ${
        userSocketMap.get(userId)!.size
      })`
    );
  }

  // Broadcast updated online users to everyone, and immediately to the connecting socket
  const onlineUserIds = Array.from(userSocketMap.keys());
  socket.emit("getOnlineUser", onlineUserIds);
  io.emit("getOnlineUser", onlineUserIds);
  console.log(`📡 Online users broadcasted:`, onlineUserIds);

  // Join a specific chat room
  socket.on("joinChat", (chatId: string) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined room ${chatId}`);
  });

  // Leave a specific chat room
  socket.on("leaveChat", (chatId: string) => {
    socket.leave(chatId);
    console.log(`Socket ${socket.id} left room ${chatId}`);
  });

  // Typing indicators
  socket.on(
    "typing",
    (data: { chatId: string; userId: string; receiverId?: string }) => {
      socket.to(data.chatId).emit("userTyping", {
        chatId: data.chatId,
        userId: data.userId,
      });
      if (data.receiverId) {
        io.to(String(data.receiverId)).emit("userTyping", {
          chatId: data.chatId,
          userId: data.userId,
        });
      }
    }
  );

  socket.on(
    "stopTyping",
    (data: { chatId: string; userId: string; receiverId?: string }) => {
      socket.to(data.chatId).emit("userStoppedTyping", {
        chatId: data.chatId,
        userId: data.userId,
      });
      if (data.receiverId) {
        io.to(String(data.receiverId)).emit("userStoppedTyping", {
          chatId: data.chatId,
          userId: data.userId,
        });
      }
    }
  );

  socket.on("disconnect", () => {
    if (userId && userSocketMap.has(userId)) {
      const userSockets = userSocketMap.get(userId)!;
      userSockets.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id} for user ${userId}`);

      if (userSockets.size === 0) {
        userSocketMap.delete(userId);
        console.log(`🔴 User completely offline: ${userId}`);
      } else {
        console.log(
          `User ${userId} still has ${userSockets.size} active socket(s)`
        );
      }
    }

    const currentOnline = Array.from(userSocketMap.keys());
    io.emit("getOnlineUser", currentOnline);
    console.log(`📡 Online users updated on disconnect:`, currentOnline);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket error:", error);
  });
});

export { app, server, io };
