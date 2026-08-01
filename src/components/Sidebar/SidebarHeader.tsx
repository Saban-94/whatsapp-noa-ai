import React, { useState } from 'react';
import { MessageSquarePlus, MoreVertical, CircleDashed, Shield, UserPlus, DoorOpen } from 'lucide-react';

interface SidebarHeaderProps {
  onOpenAdmin: () => void;
  onOpenNewChat: () => void;
  onOpenGateway?: () => void;
  darkTheme: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onOpenAdmin,
  onOpenNewChat,
  onOpenGateway,
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
    <div className={`h-[60px] px-4 flex items-center justify-between select-none ${
      darkTheme ? 'bg-[#202c33] border-b border-[#222d34]' : 'bg-[#f0f2f5] border-b border-[#e9edef]'
    }`}>
      {/* Right Side in RTL: User Avatar & SabanOS Badge */}
      <div className="flex items-center gap-3">
        <div 
          onClick={handleAvatarClick}
          className="relative cursor-pointer group"
          title="SabanOS User Profile (לחץ 3 פעמים לפתיחת פאנל ניהול)"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
            alt="SabanOS Operator"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00a884]/40 group-hover:scale-105 transition-transform"
          />
          <div className="absolute -bottom-1 -right-1 bg-[#00a884] text-[9px] font-bold text-white px-1 rounded-full uppercase">
            AI
          </div>
        </div>
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-[#e9edef] leading-tight">SabanOS מנהל</h2>
          <span className="text-[11px] text-[#8696a0] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
            מחובר ל-Noa AI
          </span>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1.5 text-[#aebac1]">
        {/* Gateway Splash Door Button */}
        {onOpenGateway && (
          <button
            onClick={onOpenGateway}
            className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors text-amber-400 hover:text-amber-300 relative group"
            title="שער כניסה ואפקט דלתות (Gateway)"
          >
            <DoorOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* Hidden Admin Shortcut Button */}
        <button
          onClick={onOpenAdmin}
          className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors relative text-[#00a884]"
          title="פאנל ניהול נסתר (Ctrl+Shift+A)"
        >
          <Shield className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
        </button>

        {/* Status button */}
        <button
          onClick={onOpenAdmin}
          className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors"
          title="סטטוס מערכת"
        >
          <CircleDashed className="w-5 h-5" />
        </button>

        {/* New Chat button */}
        <button
          onClick={onOpenNewChat}
          className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors"
          title="צ'אט חדש / איש קשר"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>

        {/* More Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors"
            title="אפשרויות נוספות"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div 
              className="absolute left-0 top-10 w-52 bg-[#233138] rounded-md shadow-xl py-2 z-50 border border-[#2a3942] text-sm text-[#d1d7db]"
              onClick={() => setShowMenu(false)}
            >
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
