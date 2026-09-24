import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";

import ChatSidebar from "../components/ChatSidebar";
import ChatHeader from "../components/ChatHeader";
import ChatMessages from "../components/ChatMessages";
import MessageInput from "../components/MessageInput";
import Loading from "../components/Loading";

import { chat_service, useAppData, User } from "../context/AppContext";
import { SocketData } from "../context/SocketContext";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  isEdited?: boolean;
  createdAt: string;
}

const ChatPage = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    fetchUsers,
    setChats,
  } = useAppData();

  const { onlineUsers, socket } = SocketData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeOut, setTypingTimeOut] = useState<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();

  // On narrow screens with no chat selected, default sidebar to open
  useEffect(() => {
    if (!selectedUser && window.innerWidth < 640) {
      setSidebarOpen(true);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!isAuth && !loading) {
      navigate("/login");
    } else if (isAuth) {
      fetchChats();
      fetchUsers();
    }
  }, [isAuth, navigate, loading]);

  const handleLogout = () => logoutUser();

  async function fetchChat() {
    const token = Cookies.get("token");
    if (!selectedUser || !token) return;

    try {
      const { data } = await axios.get(
        `${chat_service}/api/v1/message/${selectedUser}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages(data.messages);
      setUser(data.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
    }
  }

  const moveChatToTop = (
    chatId: string,
    newMessage: any,
    updatedUnseenCount = true
  ) => {
    setChats((prev) => {
      if (!prev) {
        fetchChats();
        return null;
      }

      const updatedChats = [...prev];
      const chatIndex = updatedChats.findIndex(
        (chat) => chat.chat._id === chatId
      );

      if (chatIndex !== -1) {
        const [moveChat] = updatedChats.splice(chatIndex, 1);

        const updatedChat = {
          ...moveChat,
          chat: {
            ...moveChat.chat,
            latestMessage: {
              text: newMessage.text,
              sender: newMessage.sender,
            },
            updatedAt: new Date().toString(),

            unseenCount:
              updatedUnseenCount && newMessage.sender !== loggedInUser?._id
                ? (moveChat.chat.unseenCount || 0) + 1
                : moveChat.chat.unseenCount || 0,
          },
        };

        updatedChats.unshift(updatedChat);
        return updatedChats;
      } else {
        fetchChats();
        return prev;
      }
    });
  };

  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return null;

      return prev.map((chat) => {
        if (chat.chat._id === chatId) {
          return {
            ...chat,
            chat: {
              ...chat.chat,
              unseenCount: 0,
            },
          };
        }
        return chat;
      });
    });
  };

  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        {
          userId: loggedInUser?._id,
          otherUserId: u._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedUser(data.chatId);
      setShowAllUsers(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }

  const handleMessageSend = async (e: any, imageFile?: File | null) => {
    e.preventDefault();

    if (!message.trim() && !imageFile) return;
    if (!selectedUser) return;

    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
      setTypingTimeOut(null);
    }

    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?._id,
      receiverId: user?._id,
    });

    const token = Cookies.get("token");

    try {
      const formData = new FormData();
      formData.append("chatId", selectedUser);

      if (message.trim()) {
        formData.append("text", message);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id
        );

        if (!messageExists) {
          return [...currentMessages, data.message];
        }
        return currentMessages;
      });

      setMessage("");

      const displayText = imageFile ? "📷 Photo" : message;

      moveChatToTop(
        selectedUser,
        {
          text: displayText,
          sender: data.sender,
        },
        false
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  };

  // CRUD: Update / Edit a message
  const handleUpdateMessage = async (messageId: string, newText: string) => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const { data } = await axios.put(
        `${chat_service}/api/v1/message/${messageId}`,
        { text: newText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prev) =>
        prev
          ? prev.map((m) => (m._id === messageId ? { ...m, text: newText, isEdited: true } : m))
          : null
      );
      toast.success("Message edited");
      await fetchChats();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to edit message");
    }
  };

  // CRUD: Delete a message
  const handleDeleteMessage = async (messageId: string) => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      await axios.delete(`${chat_service}/api/v1/message/${messageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages((prev) =>
        prev ? prev.filter((m) => m._id !== messageId) : null
      );
      toast.success("Message deleted");
      await fetchChats();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete message");
    }
  };

  // CRUD: Delete entire conversation
  const handleDeleteChat = async () => {
    if (!selectedUser) return;
    const token = Cookies.get("token");
    if (!token) return;

    try {
      await axios.delete(`${chat_service}/api/v1/chat/${selectedUser}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages(null);
      setSelectedUser(null);
      setUser(null);
      await fetchChats();
      toast.success("Chat deleted successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete chat");
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedUser || !socket) return;

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
        receiverId: user?._id,
      });
    }

    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
    }

    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
        receiverId: user?._id,
      });
    }, 2000);

    setTypingTimeOut(timeout);
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (selectedUser === msg.chatId) {
        setMessages((prev) => {
          const currentMessages = prev || [];
          const messageExists = currentMessages.some((m) => m._id === msg._id);
          if (!messageExists) {
            return [...currentMessages, msg];
          }
          return currentMessages;
        });

        moveChatToTop(msg.chatId, msg, false);
      } else {
        moveChatToTop(msg.chatId, msg, true);
      }
    };

    const handleMessagesSeen = (data: any) => {
      if (selectedUser === data.chatId) {
        setMessages((prev) => {
          if (!prev) return null;
          return prev.map((msg) => {
            if (
              msg.sender === loggedInUser?._id &&
              data.messageIds &&
              data.messageIds.includes(msg._id)
            ) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            } else if (msg.sender === loggedInUser?._id && !data.messageIds) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            }
            return msg;
          });
        });
      }
    };

    const handleUserTyping = (data: any) => {
      if (
        String(data.chatId) === String(selectedUser) &&
        String(data.userId) !== String(loggedInUser?._id)
      ) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: any) => {
      if (
        String(data.chatId) === String(selectedUser) &&
        String(data.userId) !== String(loggedInUser?._id)
      ) {
        setIsTyping(false);
      }
    };

    // Socket real-time message updated
    const handleMessageUpdated = (updatedMsg: Message) => {
      if (selectedUser === updatedMsg.chatId) {
        setMessages((prev) =>
          prev
            ? prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
            : null
        );
      }
      fetchChats();
    };

    // Socket real-time message deleted
    const handleMessageDeleted = (data: { messageId: string; chatId: string }) => {
      if (selectedUser === data.chatId) {
        setMessages((prev) =>
          prev ? prev.filter((m) => m._id !== data.messageId) : null
        );
      }
      fetchChats();
    };

    // Socket real-time chat deleted
    const handleChatDeleted = (data: { chatId: string }) => {
      if (selectedUser === data.chatId) {
        setSelectedUser(null);
        setMessages(null);
        setUser(null);
        toast("Conversation was deleted", { icon: "ℹ️" });
      }
      fetchChats();
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("chatDeleted", handleChatDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("chatDeleted", handleChatDeleted);
    };
  }, [socket, selectedUser, setChats, loggedInUser?._id]);

  useEffect(() => {
    if (selectedUser && socket) {
      fetchChat();
      setIsTyping(false);

      resetUnseenCount(selectedUser);

      socket.emit("joinChat", selectedUser);

      return () => {
        socket.emit("leaveChat", selectedUser);
        setMessages(null);
      };
    }
  }, [selectedUser, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeOut) {
        clearTimeout(typingTimeOut);
      }
    };
  }, [typingTimeOut]);

  if (loading) return <Loading />;
  if (!isAuth && !loading) return <Navigate to="/login" replace />;

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#F3F4F9] p-0 sm:p-3 md:p-4 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[1560px] h-full sm:h-[calc(100vh-2rem)] bg-white sm:rounded-[28px] sm:border sm:border-slate-200/80 shadow-xl shadow-slate-200/50 flex overflow-hidden">
        {/* Left Sidebar */}
        <ChatSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          showAllUsers={showAllUsers}
          setShowAllUsers={setShowAllUsers}
          users={users}
          loggedInUser={loggedInUser}
          chats={chats}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          handleLogout={handleLogout}
          createChat={createChat}
          onlineUsers={onlineUsers}
        />

        {/* Right Main Chat Panel */}
        <div className="flex-1 min-w-0 h-full flex flex-col bg-white overflow-hidden">
          <ChatHeader
            user={user}
            setSidebarOpen={setSidebarOpen}
            isTyping={isTyping}
            onlineUsers={onlineUsers}
            onDeleteChat={handleDeleteChat}
          />

          <ChatMessages
            selectedUser={selectedUser}
            messages={messages}
            loggedInUser={loggedInUser}
            user={user}
            isTyping={isTyping}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
          />

          <MessageInput
            selectedUser={selectedUser}
            message={message}
            setMessage={handleTyping}
            handleMessageSend={handleMessageSend}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
