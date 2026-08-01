import React from 'react';
import { Phone, Video, Search, MoreVertical, ArrowRight, Bot, ShieldAlert } from 'lucide-react';
import { Contact } from '../../types';

interface ChatHeaderProps {
  contact: Contact;
  isTyping: boolean;
  onBackMobile: () => void;
  onOpenContactInfo: () => void;
  onToggleAi: () => void;
  darkTheme: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  contact,
  isTyping,
  onBackMobile,
  onOpenContactInfo,
  onToggleAi,
  darkTheme,
}) => {
  return (
    <div className={`h-[60px] px-4 flex items-center justify-between border-b select-none z-10 ${
      darkTheme ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#e9edef]'
    }`}>
      {/* Right side in RTL: Back button + Contact Info */}
      <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={onOpenContactInfo}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBackMobile();
          }}
          className="sm:hidden p-1 rounded-full text-[#aebac1] hover:bg-[#374248]/50"
          title="חזרה לרשימת שיחות"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          {contact.isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] border-2 border-[#202c33] rounded-full" />
          )}
        </div>

        <div className="min-w-0">
          <h2 className={`text-sm font-semibold truncate flex items-center gap-1.5 ${
            darkTheme ? 'text-[#e9edef]' : 'text-[#111b21]'
          }`}>
            <span>{contact.name}</span>
            {contact.isAiManaged && (
              <span className="bg-[#00a884]/20 text-[#00a884] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Bot className="w-3 h-3" />
                Noa AI
              </span>
            )}
          </h2>
          <p className="text-xs text-[#8696a0] truncate mt-0.5">
            {isTyping ? (
              <span className="inline-flex items-center gap-1.5 text-[#00a884] font-semibold text-[11px] bg-[#00a884]/15 border border-[#00a884]/30 px-2 py-0.5 rounded-full animate-pulse">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a884] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00a884]"></span>
                </span>
                <span>מקליד/ה</span>
                <span className="flex items-center gap-0.5 text-[#00a884] font-bold">
                  <span className="w-1 h-1 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 bg-[#00a884] rounded-full animate-bounce"></span>
                </span>
              </span>
            ) : contact.isOnline ? (
              <span className="text-[#00a884]">מקוון</span>
            ) : (
              contact.lastSeen || 'לא מחובר'
            )}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 text-[#aebac1]">
        {/* Toggle AI control button */}
        <button
          onClick={onToggleAi}
          className={`p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-medium ${
            contact.isAiManaged
              ? 'bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30'
              : 'bg-[#ffa000]/20 text-[#ffa000] hover:bg-[#ffa000]/30'
          }`}
          title={contact.isAiManaged ? "העבר לטיפול אנושי (עקיפה ידנית)" : "הפעל מענה בינה מלאכותית Noa AI"}
        >
          <Bot className="w-4 h-4" />
          <span className="hidden md:inline">{contact.isAiManaged ? 'AI פעיל' : 'מענה אנושי'}</span>
        </button>

        <button
          className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors hidden sm:block"
          title="שיחת וידאו"
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors hidden sm:block"
          title="שיחת קול"
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenContactInfo}
          className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors"
          title="פרטי איש קשר"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
