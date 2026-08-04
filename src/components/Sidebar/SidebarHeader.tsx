import React, { useState } from 'react';
import { MessageSquarePlus, MoreVertical, CircleDashed, Shield, UserPlus, DoorOpen, Radio } from 'lucide-react';

interface SidebarHeaderProps {
  onOpenAdmin: () => void;
  onOpenNewChat: () => void;
  onOpenGateway?: () => void;
  onOpenWhatsAppMirror?: () => void;
  isMirrorActive?: boolean;
  darkTheme: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onOpenAdmin,
  onOpenNewChat,
  onOpenGateway,
  onOpenWhatsAppMirror,
  isMirrorActive = false,
  darkTheme,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleAvatarClick = () => {
    const nextCount = clickCount + 1;
    if (nextCount >= 3) {
      onOpenAdmin();
      setClickCount(0);
    } else {
      setClickCount(nextCount);
      setTimeout(() => setClickCount(0), 1500);
    }
  };

  return (
    <div className={`h-[60px] px-3 flex items-center justify-between select-none ${
      darkTheme ? 'bg-[#202c33] border-b border-[#222d34]' : 'bg-[#f0f2f5] border-b border-[#e9edef]'
    }`}>
      {/* Right Side in RTL: User Avatar & SabanOS Badge */}
      <div className="flex items-center gap-2">
        <div 
          onClick={handleAvatarClick}
          className="relative cursor-pointer group shrink-0"
          title="SabanOS User Profile (לחץ 3 פעמים לפתיחת פאנל ניהול)"
        >
          <img
            src="https://i.ibb.co/k2GwyBfh/Gemini-Generated-Image-q7vwpcq7vwpcq7vw.png"
            alt="SabanOS Operator"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#00a884]/40 group-hover:scale-105 transition-transform"
          />
          <div className="absolute -bottom-1 -right-1 bg-[#00a884] text-[9px] font-bold text-white px-1 rounded-full uppercase">
            AI
          </div>
        </div>

        {/* WhatsApp Mirror Main Tab Button */}
        {onOpenWhatsAppMirror && (
          <button
            onClick={onOpenWhatsAppMirror}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isMirrorActive
                ? 'bg-[#00a884]/25 text-[#00a884] border-[#00a884] shadow-sm'
                : 'bg-[#111b21]/80 hover:bg-[#182229] text-[#e9edef] border-[#2a3942]'
            }`}
            title="פתיחת לשונית שיקוף וואטסאפ נועה בזמן אמת"
          >
            <Radio className="w-3.5 h-3.5 text-[#00a884] animate-pulse" />
            <span className="hidden sm:inline">שיקוף וואטסאפ</span>
            <span className="bg-[#00a884] text-[#111b21] text-[9px] font-black px-1.5 py-0.2 rounded-full">
              🟢 Live
            </span>
          </button>
        )}
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1 text-[#aebac1]">
        {/* Gateway Splash Door Button */}
        {onOpenGateway && (
          <button
            onClick={onOpenGateway}
            className="p-1.5 rounded-full hover:bg-[#374248]/50 transition-colors text-amber-400 hover:text-amber-300 relative group"
            title="שער כניסה ואפקט דלתות (Gateway)"
          >
            <DoorOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* Hidden Admin Shortcut Button */}
        <button
          onClick={onOpenAdmin}
          className="p-1.5 rounded-full hover:bg-[#374248]/50 transition-colors relative text-[#00a884]"
          title="פאנל ניהול נסתר (Ctrl+Shift+A)"
        >
          <Shield className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        </button>

        {/* Status button */}
        <button
          onClick={onOpenAdmin}
          className="p-1.5 rounded-full hover:bg-[#374248]/50 transition-colors"
          title="סטטוס מערכת"
        >
          <CircleDashed className="w-4 h-4" />
        </button>

        {/* New Chat button */}
        <button
          onClick={onOpenNewChat}
          className="p-1.5 rounded-full hover:bg-[#374248]/50 transition-colors"
          title="צ'אט חדש / איש קשר"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>

        {/* More Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full hover:bg-[#374248]/50 transition-colors"
            title="אפשרויות נוספות"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div 
              className="absolute left-0 top-10 w-56 bg-[#233138] rounded-md shadow-xl py-2 z-50 border border-[#2a3942] text-sm text-[#d1d7db]"
              onClick={() => setShowMenu(false)}
            >
              {onOpenWhatsAppMirror && (
                <button
                  onClick={onOpenWhatsAppMirror}
                  className="w-full text-right px-4 py-2.5 hover:bg-[#182229] flex items-center justify-between text-[#00a884] font-bold"
                >
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-[#00a884]" />
                    שיקוף וואטסאפ נועה
                  </span>
                  <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-1.5 py-0.5 rounded-full font-mono">
                    🟢 Live Listener
                  </span>
                </button>
              )}
              <div className="my-1 border-t border-[#2a3942]" />
              <button
                onClick={onOpenAdmin}
                className="w-full text-right px-4 py-2.5 hover:bg-[#182229] flex items-center justify-between text-[#00a884] font-medium"
              >
                <span>פאנל ניהול (Admin)</span>
                <Shield className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenNewChat}
                className="w-full text-right px-4 py-2.5 hover:bg-[#182229] flex items-center justify-between"
              >
                <span>צ'אט חדש</span>
                <UserPlus className="w-4 h-4" />
              </button>
              {onOpenGateway && (
                <button
                  onClick={onOpenGateway}
                  className="w-full text-right px-4 py-2.5 hover:bg-[#182229] flex items-center justify-between text-amber-400 font-medium"
                >
                  <span>שער כניסה ואפקט דלתות</span>
                  <DoorOpen className="w-4 h-4" />
                </button>
              )}
              <div className="my-1 border-t border-[#2a3942]" />
              <button
                onClick={onOpenAdmin}
                className="w-full text-right px-4 py-2.5 hover:bg-[#182229] text-xs text-[#8696a0]"
              >
                סנכרון Google Apps Script
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
