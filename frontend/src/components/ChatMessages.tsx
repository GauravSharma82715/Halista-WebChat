import React, { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { Check, CheckCheck, MessageSquare, Pencil, Trash2, X, Check as CheckIcon } from "lucide-react";
import { Message } from "../pages/ChatPage";
import { User } from "../context/AppContext";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
  user?: User | null;
  isTyping?: boolean;
  onUpdateMessage?: (messageId: string, newText: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
}

// Consistent squircle avatar color helper
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

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
  user,
  isTyping = false,
  onUpdateMessage,
  onDeleteMessage,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages, isTyping]);

  const startEdit = (msg: Message) => {
    setEditingId(msg._id);
    setEditText(msg.text || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editText.trim()) return;
    if (onUpdateMessage) {
      await onUpdateMessage(messageId, editText.trim());
    }
    setEditingId(null);
    setEditText("");
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 custom-scroll">
      {!selectedUser ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 select-none">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-[#544CE6] via-[#635BFF] to-[#8C82FC] flex items-center justify-center text-white shadow-xl shadow-[#544CE6]/25 animate-float-gently">
              <MessageSquare className="w-10 h-10 fill-white/20" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Welcome to</span>
            <span className="text-[#544CE6]">Halista Chat</span>
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm font-medium leading-relaxed">
            Select a contact from the sidebar or click the{" "}
            <span className="text-[#544CE6] font-bold">+</span> button to start a conversation.
          </p>

          <div className="flex items-center gap-2.5 mt-6 flex-wrap justify-center">
            <span className="px-3 py-1 rounded-full bg-[#EDEFFC] text-[#544CE6] text-xs font-bold">
              ⚡ Real-time
            </span>
            <span className="px-3 py-1 rounded-full bg-[#EDEFFC] text-[#544CE6] text-xs font-bold">
              ✏️ Message Edit & Delete
            </span>
            <span className="px-3 py-1 rounded-full bg-[#EDEFFC] text-[#544CE6] text-xs font-bold">
              🖼️ Photo Sharing
            </span>
          </div>
        </div>
      ) : (
        <>
          {uniqueMessages.map((e, i) => {
            const isSentByMe = e.sender === loggedInUser?._id;
            const uniqueKey = `${e._id}-${i}`;
            const timeStr = moment(e.createdAt).format("HH:mm");
            const avatarColor = getAvatarColorClass(e.sender || "");
            const isEditingThis = editingId === e._id;

            return (
              <div
                key={uniqueKey}
                className={`group flex items-end gap-2.5 ${
                  isSentByMe ? "justify-end" : "justify-start"
                } animate-fade-in relative`}
              >
                {/* Left Avatar for received messages */}
                {!isSentByMe && (
                  user?.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt="Sender"
                      className="w-9 h-9 rounded-[13px] shrink-0 object-cover shadow-xs mb-1 border border-slate-100"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-[13px] shrink-0 flex items-center justify-center font-bold text-xs shadow-xs mb-1 ${avatarColor}`}
                    >
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                    </div>
                  )
                )}

                {/* Sent message action controls (Hover on message) */}
                {isSentByMe && !isEditingThis && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-2 bg-white/90 border border-slate-200/80 rounded-xl px-1.5 py-1 shadow-xs">
                    {e.text && (
                      <button
                        type="button"
                        onClick={() => startEdit(e)}
                        className="p-1 text-slate-400 hover:text-[#544CE6] transition-colors rounded-lg cursor-pointer"
                        title="Edit message"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Delete this message?")) {
                          onDeleteMessage && onDeleteMessage(e._id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-lg cursor-pointer"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[75%] sm:max-w-md ${
                    isSentByMe
                      ? "bg-[#544CE6] text-white rounded-[22px] rounded-br-[6px] px-4 py-3 shadow-xs"
                      : "bg-[#EEF1FA] text-slate-800 rounded-[22px] rounded-bl-[6px] px-4 py-3"
                  }`}
                >
                  {/* Image Attachment if any */}
                  {e.messageType === "image" && e.image && (
                    <div className="rounded-xl overflow-hidden mb-2 border border-black/5">
                      <img
                        src={e.image.url}
                        alt="Attachment"
                        className="max-w-full h-auto object-cover max-h-72 rounded-xl"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Inline Message Edit Mode */}
                  {isEditingThis ? (
                    <div className="space-y-2 py-1">
                      <input
                        type="text"
                        value={editText}
                        onChange={(ev) => setEditText(ev.target.value)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") handleSaveEdit(e._id);
                          if (ev.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white text-slate-900 text-sm font-medium focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(e._id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckIcon className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Text Message */
                    e.text && (
                      <p className="text-[15px] leading-relaxed break-words font-medium">
                        {e.text}
                      </p>
                    )
                  )}

                  {/* Bottom Timestamp & Seen Info */}
                  <div
                    className={`flex items-center justify-end gap-1.5 text-[11px] mt-1 font-medium ${
                      isSentByMe ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {e.isEdited && <span className="italic text-[10px] opacity-80">(edited)</span>}
                    <span>{timeStr}</span>
                    {isSentByMe && (
                      <span>
                        {e.seen ? (
                          <CheckCheck className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-indigo-300" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Floating Typing Indicator Bubble */}
          {isTyping && (
            <div className="flex items-end gap-2.5 justify-start animate-fade-in">
              <div className="w-9 h-9 rounded-[13px] bg-[#EEF1FA] text-[#544CE6] flex items-center justify-center font-bold text-xs mb-1">
                ...
              </div>
              <div className="bg-[#EEF1FA] text-slate-500 rounded-[20px] rounded-bl-[6px] px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#544CE6] rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-[#544CE6] rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-[#544CE6] rounded-full animate-bounce [animation-delay:0.3s]" />
                <span className="text-xs text-slate-500 font-semibold ml-1">typing</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
};

export default ChatMessages;
