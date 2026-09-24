import React, { useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";

interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (message: string) => void;
  handleMessageSend: (e: any, imageFile?: File | null) => void;
}

const MessageInput = ({
  selectedUser,
  message,
  setMessage,
  handleMessageSend,
}: MessageInputProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;

    setIsUploading(true);
    await handleMessageSend(e, imageFile);
    setImageFile(null);
    setIsUploading(false);
  };

  if (!selectedUser) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 flex flex-col gap-2 px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-white"
    >
      {/* Uploaded Image Preview */}
      {imageFile && (
        <div className="relative w-fit bg-white p-1.5 rounded-2xl border border-slate-200 animate-fade-in shadow-xs">
          <img
            src={URL.createObjectURL(imageFile)}
            alt="Upload preview"
            className="w-20 h-20 object-cover rounded-xl"
          />
          <button
            type="button"
            className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-sm transition-colors"
            onClick={() => setImageFile(null)}
            title="Remove image"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-center gap-2">
        <label
          className="cursor-pointer bg-[#EDEFFC] hover:bg-[#E2E5FA] text-[#544CE6] rounded-2xl p-3 transition-all shrink-0"
          title="Attach Image"
        >
          <Paperclip size={19} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.type.startsWith("image/")) {
                setImageFile(file);
              }
            }}
          />
        </label>

        <input
          type="text"
          className="flex-1 bg-[#F4F5FB] border border-transparent focus:border-[#544CE6]/30 focus:bg-white rounded-2xl px-4 py-3 text-slate-900 placeholder-slate-400 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-[#544CE6]/20 transition-all"
          placeholder={imageFile ? "Add a caption..." : "Write a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          type="submit"
          disabled={(!imageFile && !message.trim()) || isUploading}
          className="bg-[#544CE6] hover:bg-[#433BCE] text-white p-3 sm:px-5 sm:py-3 rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 font-bold text-sm active:scale-95"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
