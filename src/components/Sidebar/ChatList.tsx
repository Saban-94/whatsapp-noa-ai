import React from 'react';
import { Pin, Check, CheckCheck, Bot } from 'lucide-react';
import { Chat } from '../../types';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  darkTheme: boolean;
  enableBlueTicks?: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  darkTheme,
  enableBlueTicks = true,
}) => {
  if (chats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8696a0]">
        <p className="text-sm">לא נמצאו שיחות תואמות לחיפוש</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
      {chats.map((chat) => {
        const isActive = chat.id === activeChatId;
        const lastMsg = chat.messages[chat.messages.length - 1];
        const contact = chat.contact;
        const isBlueTicksForChat =
          contact.blueTicksOverride === 'enabled'
            ? true
            : contact.blueTicksOverride === 'disabled'
            ? false
            : enableBlueTicks;

        return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors relative ${
              isActive
                ? darkTheme ? 'bg-[#2a3942]' : 'bg-[#f0f2f5]'
                : darkTheme ? 'hover:bg-[#202c33]' : 'hover:bg-[#f5f6f6]'
            }`}
          >
            {/* Contact Avatar */}
            <div className="relative shrink-0">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {contact.isOnline && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#111b21] rounded-full" />
              )}
              {contact.isAiManaged && (
                <span className="absolute -top-1 -left-1 bg-[#00a884] text-white p-0.5 rounded-full" title="ניהול בינה מלאכותית">
                  <Bot className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Chat Content Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`text-sm font-semibold truncate ${
                  darkTheme ? 'text-[#e9edef]' : 'text-[#111b21]'
                }`}>
                  {contact.name}
                </h3>
                <span className={`text-[11px] shrink-0 ${
                  contact.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'
                }`}>
                  {lastMsg?.timestamp || 'חדש'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-[#8696a0] truncate flex items-center gap-1">
                  {/* Read receipts icon */}
                  {lastMsg && lastMsg.sender === 'user' && (
                    lastMsg.status === 'read' ? (
                      <CheckCheck className={`w-3.5 h-3.5 ${isBlueTicksForChat ? 'text-[#53bdeb]' : 'text-[#8696a0]'} shrink-0`} />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-[#8696a0] shrink-0" />
                    )
                  )}
                  <span className="truncate">{lastMsg?.text || 'אין הודעות עדיין'}</span>
                </p>

                {/* Right side indicators: Pin & Unread Count */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {contact.isPinned && (
                    <Pin className="w-3.5 h-3.5 text-[#8696a0] transform rotate-45" />
                  )}
                  {contact.unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-[#00a884] text-[#111b21] font-bold text-[10px] rounded-full flex items-center justify-center">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
