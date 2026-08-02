import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, FileText, Download, Bot, Maximize2, Sparkles, Mic } from 'lucide-react';
import { Message } from '../../types';
import { WaveformPlayer } from './WaveformPlayer';
import { FormattedMessage } from './FormattedMessage';
import { MediaLightboxModal } from './MediaLightboxModal';
import { DiscrepancyIndicator, isDiscrepancyMessage } from './DiscrepancyIndicator';

interface MessageListProps {
  messages: Message[];
  darkTheme: boolean;
  contactName: string;
  enableBlueTicks?: boolean;
  chatId?: string;
  onTranscribeVoiceNote?: (msgId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  darkTheme,
  contactName,
  enableBlueTicks = true,
  chatId,
  onTranscribeVoiceNote,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevChatIdRef = useRef<string | undefined>(chatId);

  const [selectedMedia, setSelectedMedia] = useState<{
    mediaUrl: string;
    caption?: string;
    senderName?: string;
    timestamp?: string;
  } | null>(null);

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
        const senderDisplayName = isUser ? 'אתה' : isAi ? 'Noa AI (נועה)' : contactName;
        const hasDiscrepancy = isDiscrepancyMessage(msg);

        return (
          <div
            key={msg.id || index}
            className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
          >
            {/* Speech Bubble Box */}
            <div
              className={`max-w-[85%] sm:max-w-[65%] rounded-lg px-3 py-2 shadow-xs relative text-sm ${
                hasDiscrepancy
                  ? darkTheme
                    ? 'border-2 border-red-500 shadow-md shadow-red-500/20 ring-2 ring-red-500/20 bg-[#2b171a] text-[#e9edef]'
                    : 'border-2 border-red-500 shadow-md shadow-red-500/20 ring-2 ring-red-500/20 bg-red-50/90 text-[#111b21]'
                  : isUser
                  ? darkTheme ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                  : darkTheme ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none' : 'bg-white text-[#111b21] rounded-tl-none'
              }`}
            >
              {/* Discrepancy & Audit Alert Indicator */}
              {hasDiscrepancy && (
                <DiscrepancyIndicator
                  darkTheme={darkTheme}
                  isReviewed={msg.isReviewed}
                  messageText={msg.text}
                />
              )}

              {/* Sender Label for AI */}
              {isAi && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#00a884] mb-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Noa AI (נועה)</span>
                </div>
              )}

              {/* Media Content Rendering */}
              {msg.type === 'image' && msg.mediaUrl && (
                <div
                  className="mb-2 rounded-lg overflow-hidden max-h-60 bg-black/20 relative group cursor-pointer"
                  onClick={() =>
                    setSelectedMedia({
                      mediaUrl: msg.mediaUrl!,
                      caption: msg.text,
                      senderName: senderDisplayName,
                      timestamp: msg.timestamp,
                    })
                  }
                >
                  <img
                    src={msg.mediaUrl}
                    alt="תמונה מצורפת"
                    onLoad={() => scrollToBottom('smooth')}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
                    <Maximize2 className="w-5 h-5 drop-shadow-md" />
                    <span>לחץ לתצוגה מלאה</span>
                  </div>
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
                  <button className="p-1.5 rounded-full hover:bg-black/20 text-[#00a884] cursor-pointer">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}

              {msg.type === 'voice_note' || msg.isVoiceNote ? (
                <div className="flex flex-col gap-1.5 min-w-[220px]">
                  <WaveformPlayer duration={msg.audioDuration} isOutgoing={isUser} />

                  {/* Voice Note Transcription Display Box */}
                  {msg.isTranscribing ? (
                    <div
                      className={`mt-1.5 px-3 py-2 rounded-lg text-xs flex items-center gap-2 border animate-pulse ${
                        isUser
                          ? darkTheme
                            ? 'bg-[#004a3c] border-[#005c4b] text-[#34d399]'
                            : 'bg-[#c6f6d5] border-[#a3e635] text-[#15803d]'
                          : darkTheme
                          ? 'bg-[#182229] border-[#222d34] text-[#00a884]'
                          : 'bg-slate-100 border-slate-200 text-[#00a884]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                      <span className="font-medium text-[11px]">מתמלל הודעה קולית ב-AI (Gemini)...</span>
                    </div>
                  ) : msg.transcription ? (
                    <div
                      className={`mt-1.5 px-3 py-2 rounded-lg text-xs space-y-1.5 border shadow-2xs ${
                        isUser
                          ? darkTheme
                            ? 'bg-[#004236]/90 border-[#00604f] text-[#e9edef]'
                            : 'bg-[#cbf7c8]/90 border-[#a8e8a5] text-[#111b21]'
                          : darkTheme
                          ? 'bg-[#182229] border-[#2a3942] text-[#e9edef]'
                          : 'bg-[#f0f2f5] border-[#e2e8f0] text-[#111b21]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#00a884] border-b border-[#00a884]/20 pb-1">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#00a884]" />
                          <span>תמלול הודעה קולית (Gemini AI)</span>
                        </span>
                        <span className="text-[9px] bg-[#00a884]/15 text-[#00a884] px-1.5 py-0.5 rounded-full font-mono">
                          AI Transcribed
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed dir-rtl whitespace-pre-wrap font-sans text-right pt-0.5">
                        "{msg.transcription}"
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => onTranscribeVoiceNote?.(msg.id)}
                      className={`mt-1 self-start px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isUser
                          ? 'bg-[#004a3c] hover:bg-[#005c4b] border-[#00604f] text-[#e9edef]'
                          : 'bg-[#182229] hover:bg-[#202c33] border-[#2a3942] text-[#00a884]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>תמלל הודעה זו ב-AI</span>
                    </button>
                  )}
                </div>
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

      {/* Media Lightbox Modal */}
      <MediaLightboxModal
        isOpen={!!selectedMedia}
        mediaUrl={selectedMedia?.mediaUrl || null}
        caption={selectedMedia?.caption}
        senderName={selectedMedia?.senderName}
        timestamp={selectedMedia?.timestamp}
        onClose={() => setSelectedMedia(null)}
      />
    </div>
  );
};

