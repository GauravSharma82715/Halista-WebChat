import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LogOut,
  MessageSquare,
  Pin,
  Plus,
  Search,
  Users,
  UserCircle,
  X,
  Circle,
} from "lucide-react";
import { User } from "../context/AppContext";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  chats: any[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
  createChat: (user: User) => void;
  onlineUsers: string[];
}

// Deterministic squircle avatar color based on user string
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

const formatShortTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return "now";
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  } catch {
    return "";
  }
};

const ChatSidebar = ({
  sidebarOpen,
  setShowAllUsers,
  setSidebarOpen,
  showAllUsers,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
  createChat,
  onlineUsers,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const checkIsOnline = (targetId: string | undefined): boolean => {
    if (!targetId || !onlineUsers || !Array.isArray(onlineUsers)) return false;
    const cleanTargetId = String(targetId).trim();
    return onlineUsers.some((id) => String(id).trim() === cleanTargetId);
  };

  // Find all contacts currently online (excluding self)
  const onlineContacts = (users || []).filter(
    (u) =>
      String(u._id).trim() !== String(loggedInUser?._id).trim() &&
      checkIsOnline(u._id)
  );

  return (
    <aside
      className={`fixed z-30 sm:static top-0 left-0 h-full max-h-screen w-80 sm:w-84 md:w-88 bg-white border-r border-slate-100 transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } sm:translate-x-0 transition-transform duration-300 flex flex-col p-4 select-none shrink-0 overflow-hidden`}
    >
      {/* Halista Chat Brand Header */}
      <div className="flex items-center justify-between mb-3 px-1 pt-0.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-[13px] bg-gradient-to-tr from-[#544CE6] via-[#635BFF] to-[#8C82FC] flex items-center justify-center text-white shadow-md shadow-[#544CE6]/25">
              <MessageSquare className="w-5 h-5 fill-white/20" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
              <span>Halista</span>
              <span className="text-[#544CE6]">Chat</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
              Workspace
            </p>
          </div>
        </div>

        <div className="sm:hidden flex items-center">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-2.5 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={showAllUsers ? "Search contacts..." : "Search conversations..."}
            className="w-full pl-10 pr-4 py-2 bg-[#F3F4F9] rounded-2xl text-slate-800 placeholder-slate-400 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[#544CE6]/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs: Messages vs All Contacts */}
      <div className="flex bg-[#F3F4F9] p-1 rounded-2xl mb-2.5 shrink-0 text-xs font-bold">
        <button
          type="button"
          onClick={() => setShowAllUsers(false)}
          className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            !showAllUsers
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chats</span>
          {chats && chats.length > 0 && (
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-full">
              {chats.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowAllUsers(true)}
          className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            showAllUsers
              ? "bg-white text-[#544CE6] shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Contacts</span>
          {onlineContacts.length > 0 && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineContacts.length} online
            </span>
          )}
        </button>
      </div>

      {/* "Active Now" Horizontal Online Tray */}
      {onlineContacts.length > 0 && (
        <div className="mb-2.5 pb-2.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online Now ({onlineContacts.length})
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scroll">
            {onlineContacts.map((u) => {
              const initials = u.name.slice(0, 2).toUpperCase();
              const avatarColor = getAvatarColorClass(u.name || u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => createChat(u)}
                  className="flex flex-col items-center shrink-0 group cursor-pointer"
                  title={`Chat with ${u.name} (Online)`}
                >
                  <div className="relative">
                    {u.profilePic ? (
                      <img
                        src={u.profilePic}
                        alt={u.name}
                        className="w-10 h-10 rounded-[14px] object-cover ring-2 ring-emerald-500 ring-offset-1 border border-slate-100"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-emerald-500 ring-offset-1 ${avatarColor}`}
                      >
                        {initials}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 max-w-[50px] truncate mt-1 group-hover:text-[#544CE6]">
                    {u.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 custom-scroll pr-1">
        {showAllUsers ? (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>All Registered Users</span>
              <span className="text-[10px] text-slate-400 font-medium">Click to chat</span>
            </div>

            {users
              ?.filter(
                (u) =>
                  String(u._id).trim() !== String(loggedInUser?._id).trim() &&
                  u.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((u) => {
                const isOnline = checkIsOnline(u._id);
                const initials = u.name.slice(0, 2).toUpperCase();
                const avatarColor = getAvatarColorClass(u.name || u._id);

                return (
                  <button
                    key={u._id}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-[#F3F4FB] transition-all flex items-center gap-3 group cursor-pointer"
                    onClick={() => createChat(u)}
                  >
                    <div className="relative shrink-0">
                      {u.profilePic ? (
                        <img
                          src={u.profilePic}
                          alt={u.name}
                          className="w-11 h-11 rounded-[16px] object-cover shadow-xs border border-slate-100"
                        />
                      ) : (
                        <div
                          className={`w-11 h-11 rounded-[16px] flex items-center justify-center font-bold text-sm shadow-xs ${avatarColor}`}
                        >
                          {initials}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isOnline ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate group-hover:text-[#544CE6] transition-colors">
                        {u.name}
                      </div>
                      <div className="text-xs mt-0.5 font-medium flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                          }`}
                        />
                        <span className={isOnline ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        ) : chats && chats.length > 0 ? (
          <div className="space-y-1">
            {chats.map((chat) => {
              const latestMessage = chat.chat.latestMessage;
              const isSelected = selectedUser === chat.chat._id;
              const unseenCount = chat.chat.unseenCount || 0;
              const isOnline = checkIsOnline(chat.user?._id);
              const initials = chat.user?.name ? chat.user.name.slice(0, 2).toUpperCase() : "U";
              const avatarColor = getAvatarColorClass(chat.user?.name || chat.user?._id || "");
              const shortTime = formatShortTime(chat.chat.updatedAt || chat.chat.createdAt);

              return (
                <button
                  key={chat.chat._id}
                  onClick={() => {
                    setSelectedUser(chat.chat._id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-[#EDEFFC]"
                      : "hover:bg-[#F6F7FD]"
                  }`}
                >
                  <div className="relative shrink-0">
                    {chat.user?.profilePic ? (
                      <img
                        src={chat.user.profilePic}
                        alt={chat.user.name}
                        className="w-11 h-11 rounded-[16px] object-cover shadow-xs border border-slate-100"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-[16px] flex items-center justify-center font-bold text-sm shadow-xs ${avatarColor}`}
                      >
                        {initials}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isOnline ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {chat.user?.name}
                      </span>
                      {shortTime && (
                        <span className="text-[11px] text-slate-400 font-semibold ml-1 shrink-0">
                          {shortTime}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs truncate font-medium ${
                          isSelected || unseenCount > 0
                            ? "text-[#544CE6] font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        {latestMessage ? latestMessage.text : "No messages yet"}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {unseenCount > 0 && (
                          <span className="bg-[#FF5C39] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                            {unseenCount > 99 ? "99+" : unseenCount}
                          </span>
                        )}
                        {isSelected && (
                          <Pin className="w-3 h-3 text-[#544CE6] fill-[#544CE6] rotate-45" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-[#EDEFFC] flex items-center justify-center text-[#544CE6] mb-2.5">
              <Users className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">No active conversations</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[180px]">
              Switch to the Contacts tab above to see online users and start chatting!
            </p>
            <button
              onClick={() => setShowAllUsers(true)}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#544CE6] text-white text-xs font-bold hover:bg-[#433BCE] transition-all cursor-pointer shadow-xs"
            >
              Browse Contacts
            </button>
          </div>
        )}
      </div>

      {/* Footer User Bar */}
      <div className="pt-2.5 mt-auto shrink-0 border-t border-slate-100 flex items-center justify-between px-1">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors text-sm font-semibold truncate"
        >
          {loggedInUser?.profilePic ? (
            <img
              src={loggedInUser.profilePic}
              alt="Profile"
              className="w-8 h-8 rounded-[12px] object-cover shadow-xs border border-slate-100"
            />
          ) : (
            <div className="w-8 h-8 rounded-[12px] bg-[#EDEFFC] text-[#544CE6] flex items-center justify-center font-bold text-xs">
              {loggedInUser?.name ? (
                loggedInUser.name.slice(0, 2).toUpperCase()
              ) : (
                <UserCircle className="w-5 h-5" />
              )}
            </div>
          )}
          <span className="truncate max-w-[120px]">
            {loggedInUser?.name || "Profile"}
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
