import React from 'react';
import { MessageSquare, PackageCheck, BookOpen, ShieldAlert, PlusCircle, Bell } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'chats' | 'orders' | 'logistics' | 'admin';
  onTabChange: (tab: 'chats' | 'orders' | 'logistics' | 'admin') => void;
  onOpenNewChat: () => void;
  onOpenAdmin: () => void;
  unreadCountTotal?: number;
  darkTheme?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewChat,
  onOpenAdmin,
  unreadCountTotal = 0,
  darkTheme = true,
}) => {
  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around px-2 py-1 select-none backdrop-blur-md pb-[max(8px,env(safe-area-inset-bottom))] ${
        darkTheme
          ? 'bg-[#111b21]/95 border-[#222d34] text-[#8696a0]'
          : 'bg-white/95 border-gray-200 text-gray-500'
      }`}
    >
      {/* 1. Chats Tab */}
      <button
        onClick={() => onTabChange('chats')}
        className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors relative ${
          activeTab === 'chats'
            ? 'text-[#00a884] font-semibold'
            : darkTheme
            ? 'hover:text-[#e9edef]'
            : 'hover:text-gray-900'
        }`}
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {unreadCountTotal > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-[#00a884] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
              {unreadCountTotal}
            </span>
          )}
        </div>
        <span className="text-[11px] mt-1">שיחות</span>
      </button>

      {/* 2. New Chat Quick Action Button */}
      <button
        onClick={onOpenNewChat}
        className="flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 text-[#00a884] hover:text-[#059669] transition-transform active:scale-95"
        title="צ'אט חדש"
      >
        <PlusCircle className="w-6 h-6 text-[#00a884] drop-shadow-md" />
        <span className="text-[11px] mt-0.5 font-medium">חדש</span>
      </button>

      {/* 3. Orders / CRM Tab */}
      <button
        onClick={() => onTabChange('orders')}
        className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'orders'
            ? 'text-[#00a884] font-semibold'
            : darkTheme
            ? 'hover:text-[#e9edef]'
            : 'hover:text-gray-900'
        }`}
      >
        <PackageCheck className="w-5 h-5" />
        <span className="text-[11px] mt-1">הזמנות</span>
      </button>

      {/* 4. Logistics / KB Tab */}
      <button
        onClick={() => onTabChange('logistics')}
        className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'logistics'
            ? 'text-[#00a884] font-semibold'
            : darkTheme
            ? 'hover:text-[#e9edef]'
            : 'hover:text-gray-900'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-[11px] mt-1">לוגיסטיקה</span>
      </button>

      {/* 5. Admin Panel Tab */}
      <button
        onClick={() => {
          onTabChange('admin');
          onOpenAdmin();
        }}
        className={`flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'admin'
            ? 'text-[#00a884] font-semibold'
            : darkTheme
            ? 'hover:text-[#e9edef]'
            : 'hover:text-gray-900'
        }`}
      >
        <ShieldAlert className="w-5 h-5 text-emerald-400" />
        <span className="text-[11px] mt-1">ניהול</span>
      </button>
    </nav>
  );
};
