import React from "react";
import { Loader2, MessageSquare } from "lucide-react";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#F3F4F9]/90 backdrop-blur-md z-50 min-h-screen text-slate-800">
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-14 h-14 rounded-[20px] bg-[#EDEFFC] text-[#544CE6] flex items-center justify-center shadow-xs animate-pulse">
          <MessageSquare size={28} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs tracking-wide">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#544CE6]" />
        <span>Loading...</span>
      </div>
    </div>
  );
};

export default Loading;
