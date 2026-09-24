import React from "react";
import { Menu, Trash2 } from "lucide-react";
import { User } from "../context/AppContext";

interface ChatHeaderProps {
  user: User | null;
  setSidebarOpen: (open: boolean) => void;
  isTyping: boolean;
  onlineUsers: string[];
  onDeleteChat?: () => void;
}

const getAvatarColorClass = (str: string) => {
  const colors = [
    "bg-[#202024] text-white",
    "bg-[#D97645] text-white",
    "bg-[#32778A] text-white",
    "bg-[#BF873D] text-white",
    "bg-[#C65050] text-white",
    "bg-[#544CE6] text-white",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ChatHeader = ({
  user,
  setSidebarOpen,
  isTyping,
  onlineUsers,
  onDeleteChat,
}: ChatHeaderProps) => {
  const isOnlineUser = user
    ? onlineUsers.some((id) => String(id).trim() === String(user._id).trim())
    : false;
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "";
  const avatarColor = getAvatarColorClass(user?.name || user?._id || "");

  return (
    <div className="shrink-0 h-18 px-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-white select-none">
      {/* Mobile Drawer Button */}
      <div className="sm:hidden mr-2">
        <button
          className="p-2 bg-[#EDEFFC] text-[#544CE6] rounded-xl hover:bg-[#E2E5FA] transition-all cursor-pointer"
          onClick={() => setSidebarOpen(true)}
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Main Header Info with Profile Avatar */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {user ? (
          <>
            <div className="relative shrink-0">
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt={user.name}
                  className="w-11 h-11 rounded-[16px] object-cover shadow-xs border border-slate-100"
                />
              ) : (
                <div
                  className={`w-11 h-11 rounded-[16px] flex items-center justify-center font-bold text-sm shadow-xs ${avatarColor}`}
                >
                  {initials}
                </div>
              )}
              {isOnlineUser && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              )}
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate leading-snug">
                {user.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isTyping ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#544CE6]">
                    <span className="w-1.5 h-1.5 bg-[#544CE6] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#544CE6] rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#544CE6] rounded-full animate-bounce [animation-delay:0.3s]" />
                    <span>typing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnlineUser ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <p className="text-xs text-slate-400 font-medium">
                      {isOnlineUser ? "online" : "offline"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-400 tracking-tight">
              Select conversation
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Pick a contact to start chatting
            </p>
          </div>
        )}
      </div>

      {/* Right Action: Delete Conversation */}
      {user && onDeleteChat && (
        <div className="flex items-center text-slate-400">
          <button
            onClick={() => {
              if (confirm(`Delete entire conversation with ${user.name}? This will clear all messages.`)) {
                onDeleteChat();
              }
            }}
            className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
