import React, { useEffect, useRef } from 'react';
import { Check, CheckCheck, FileText, Download, Bot } from 'lucide-react';
import { Message } from '../../types';
import { WaveformPlayer } from './WaveformPlayer';
import { FormattedMessage } from './FormattedMessage';

interface MessageListProps {
  messages: Message[];
  darkTheme: boolean;
  contactName: string;
  enableBlueTicks?: boolean;
  chatId?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  darkTheme,
  contactName,
  enableBlueTicks = true,
  chatId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevChatIdRef = useRef<string | undefined>(chatId);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const isChatChanged = prevChatIdRef.current !== chatId;
    prevChatIdRef.current = chatId;

    // Use instant scroll for chat switches to avoid smooth scrolling delay from old position,
    // and smooth scroll for new messages in the active chat.
    const scrollBehavior = isChatChanged ? 'auto' : 'smooth';

    // 1. Immediate scroll
    scrollToBottom(scrollBehavior);

    // 2. Delayed scroll after DOM layout & text formatting paint
    const timer = setTimeout(() => {
      scrollToBottom(scrollBehavior);
    }, 60);

    return () => clearTimeout(timer);
  }, [messages, chatId, contactName]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto p-4 md:px-12 space-y-3 relative ${
        darkTheme ? 'whatsapp-chat-bg-dark' : 'whatsapp-chat-bg-light'
      }`}
    >
      {/* Encryption Notice Badge */}
      <div className="flex justify-center my-2">
        <div className={`text-[11px] px-4 py-1.5 rounded-lg text-center shadow-xs max-w-sm border ${
          darkTheme 
            ? 'bg-[#182229] text-[#ffd279] border-[#202c33]' 
            : 'bg-[#ffeebd] text-[#54656f] border-[#f5e5ba]'
        }`}>
          🔒 הודעות אלו מוצפנות מקצה לקצה. מסונכרנות בזמן אמת מול SabanOS.
        </div>
      </div>

      {messages.map((msg, index) => {
        const isUser = msg.sender === 'user';
        const isAi = msg.sender === 'ai';

        return (
          <div
            key={msg.id || index}
            className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
          >
            {/* Speech Bubble Box */}
            <div
              className={`max-w-[85%] sm:max-w-[65%] rounded-lg px-3 py-2 shadow-xs relative text-sm ${
                isUser
                  ? darkTheme ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                  : darkTheme ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none' : 'bg-white text-[#111b21] rounded-tl-none'
              }`}
            >
              {/* Sender Label for AI */}
              {isAi && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#00a884] mb-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Noa AI (נועה)</span>
                </div>
              )}

              {/* Media Content Rendering */}
              {msg.type === 'image' && msg.mediaUrl && (
                <div className="mb-2 rounded-lg overflow-hidden max-h-60 bg-black/20">
                  <img
                    src={msg.mediaUrl}
                    alt="תמונה מצורפת"
                    onLoad={() => scrollToBottom('smooth')}
                    className="w-full h-full object-cover hover:scale-102 transition-transform cursor-pointer"
                  />
                </div>
              )}

              {msg.type === 'document' && (
                <div className={`flex items-center gap-3 p-2 rounded-lg mb-2 border ${
                  isUser ? 'bg-[#004a3c] border-[#005c4b]' : 'bg-[#182229] border-[#222d34]'
                }`}>
                  <FileText className="w-8 h-8 text-[#00a884] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{msg.fileName || 'מסמך_SabanOS.pdf'}</p>
                    <p className="text-[10px] text-[#8696a0]">{msg.fileSize || '1.2 MB · PDF'}</p>
                  </div>
                  <button className="p-1.5 rounded-full hover:bg-black/20 text-[#00a884]">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}

              {msg.type === 'voice_note' || msg.isVoiceNote ? (
                <WaveformPlayer duration={msg.audioDuration} isOutgoing={isUser} />
              ) : (
                <FormattedMessage text={msg.text} />
              )}

              {/* Timestamp & Read Receipts */}
              <div className="flex items-center justify-end gap-1 text-[10px] text-[#8696a0] mt-1 float-left mr-2 -mb-0.5 select-none">
                <span>{msg.timestamp}</span>
                {isUser && (
                  msg.status === 'read' ? (
                    <CheckCheck className={`w-3.5 h-3.5 ${enableBlueTicks ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
};
