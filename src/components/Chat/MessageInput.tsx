import React, { useState, useRef } from 'react';
import {
  Smile,
  Paperclip,
  Send,
  Mic,
  Image as ImageIcon,
  FileText,
  X,
  Sparkles,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Zap,
  Search,
  MessageSquareQuote,
  Check,
} from 'lucide-react';
import { HEBREW_WHATSAPP_TEMPLATES, WhatsAppTemplate } from '../../data/whatsappTemplates';
import { QuickReply } from '../../types';
import { DEFAULT_QUICK_REPLIES } from '../../data/mockData';

interface MessageInputProps {
  onSendMessage: (text: string, type?: 'text' | 'image' | 'document' | 'voice_note', mediaUrl?: string) => void;
  darkTheme: boolean;
  isAiManaged?: boolean;
  quickReplies?: QuickReply[];
}

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'חיוכים ורגשות',
    icon: '😊',
    emojis: ['😊', '😂', '😃', '😍', '🥰', '😎', '😉', '🤔', '🙌', '👏', '🥳', '🤩', '😇', '😴', '🙃', '😬', '😜', '🤓', '😭', '🤯', '🥹', '😏', '😌', '🙏', '❤️'],
  },
  {
    id: 'gestures',
    name: 'מחוות וידיים',
    icon: '👍',
    emojis: ['👍', '👎', '👌', '🤝', '🙏', '💪', '👋', '✍️', '✌️', '🤞', '👈', '👉', '👆', '👇', '🖐️', '🤙', '✊', '🤛', '🤜', '👏'],
  },
  {
    id: 'hearts',
    name: 'לבבות וסמלים',
    icon: '❤️',
    emojis: ['❤️', '💖', '💙', '💚', '💛', '💜', '🖤', '🤍', '🧡', '✨', '🌟', '⭐', '🔥', '💥', '💯', '🎯', '🎉', '🎊', '🎁', '👑'],
  },
  {
    id: 'work',
    name: 'עבודה ולוגיסטיקה',
    icon: '📦',
    emojis: ['📦', '🏗️', '🚛', '🚚', '📊', '📈', '📋', '📝', '📅', '💼', '📌', '📎', '⚙️', '🛠️', '🔑', '🏷️', '📢', '💻', '📱', '✉️'],
  },
  {
    id: 'location',
    name: 'מיקום וניווט',
    icon: '📍',
    emojis: ['📍', '🗺️', '🚗', '🏢', '🏬', '🏠', '✈️', '🧭', '⛽', '🛵', '🏁', '🛑', '🚦', '🌐', '🚩', '🅿️', '🗺'],
  },
  {
    id: 'time',
    name: 'זמן וסטטוס',
    icon: '⏰',
    emojis: ['⏰', '⏱️', '⏳', '📅', '🔔', '📢', '💡', '⚡', '✅', '❌', 'ℹ️', '⚠️', '🔄', '❓', '❗', '🛑', '🟢', '🔴'],
  },
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  darkTheme,
  isAiManaged,
  quickReplies,
}) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState('smileys');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveQuickReplies = (quickReplies && quickReplies.length > 0) ? quickReplies : DEFAULT_QUICK_REPLIES;

  // Slash command autocomplete detection
  const isSlashCommandActive = text.trim().startsWith('/') || text.includes(' /');
  const lastSlashIndex = text.lastIndexOf('/');
  const slashFilter = isSlashCommandActive && lastSlashIndex !== -1
    ? text.slice(lastSlashIndex + 1).toLowerCase()
    : '';

  const matchingQuickReplies = isSlashCommandActive
    ? effectiveQuickReplies.filter(
        (q) =>
          (q.shortcut && q.shortcut.toLowerCase().includes(slashFilter)) ||
          q.title.toLowerCase().includes(slashFilter) ||
          q.text.toLowerCase().includes(slashFilter)
      )
    : [];

  const insertAtCursor = (textToInsert: string) => {
    if (!textareaRef.current) {
      setText((prev) => prev + textToInsert);
      return;
    }
    const input = textareaRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue = text.substring(0, start) + textToInsert + text.substring(end);
    setText(newValue);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const applyFormatting = (wrapper: string) => {
    insertAtCursor(`${wrapper}טקסט${wrapper}`);
  };

  const handleSelectTemplate = (template: WhatsAppTemplate) => {
    setText(template.content);
    setShowTemplates(false);
  };

  const handleSelectQuickReply = (qr: QuickReply) => {
    if (isSlashCommandActive && lastSlashIndex !== -1) {
      const prefix = text.substring(0, lastSlashIndex);
      setText(prefix ? `${prefix.trim()} ${qr.text}` : qr.text);
    } else {
      insertAtCursor(qr.text);
    }
    setShowQuickReplies(false);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text, 'text');
    setText('');
    setShowEmojis(false);
    setShowAttachments(false);
    setShowQuickReplies(false);
    setShowTemplates(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendSampleImage = () => {
    onSendMessage(
      'תמונה מצורפת מ-SabanOS',
      'image',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80'
    );
    setShowAttachments(false);
  };

  const handleSendSamplePdf = () => {
    onSendMessage('קובץ תפריט מעודכן SabanOS.pdf', 'document');
    setShowAttachments(false);
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopAndSendVoiceNote = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    onSendMessage('הודעה קולית', 'voice_note');
    setRecordingSeconds(0);
  };

  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Filter emojis by search query if present
  const displayedEmojis = emojiSearch.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES.find((c) => c.id === activeEmojiTab)?.emojis || EMOJI_CATEGORIES[0].emojis;

  return (
    <div className={`relative px-4 py-2.5 flex items-center gap-2 select-none z-10 ${
      darkTheme ? 'bg-[#202c33] border-t border-[#222d34]' : 'bg-[#f0f2f5] border-t border-[#e9edef]'
    }`}>

      {/* Slash Command Autocomplete Overlay */}
      {isSlashCommandActive && matchingQuickReplies.length > 0 && (
        <div className="absolute bottom-16 right-16 left-16 bg-[#233138] border border-amber-500/40 rounded-2xl p-2 shadow-2xl z-50 text-sm max-h-56 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-[#2a3942]">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              תגובות מהירות (השלמה אוטומטית /)
            </span>
            <span className="text-[10px] text-[#8696a0]">
              {matchingQuickReplies.length} תוצאות
            </span>
          </div>

          <div className="space-y-1">
            {matchingQuickReplies.map((qr) => (
              <button
                key={qr.id}
                onClick={() => handleSelectQuickReply(qr)}
                className="w-full text-right p-2 rounded-xl bg-[#182229] hover:bg-[#202c33] border border-[#2a3942] hover:border-amber-500/50 transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-amber-400">{qr.title}</span>
                    {qr.shortcut && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                        /{qr.shortcut}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8696a0] truncate mt-0.5 dir-rtl">
                    {qr.text}
                  </p>
                </div>
                <Zap className="w-4 h-4 text-[#8696a0] group-hover:text-amber-400 shrink-0 mr-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Emoji Picker Overlay */}
      {showEmojis && (
        <div className="absolute bottom-16 right-4 bg-[#233138] border border-[#2a3942] rounded-2xl p-3 shadow-2xl z-50 w-80 text-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-[#2a3942] pb-2 mb-2">
            <span className="text-xs font-bold text-[#e9edef] flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-amber-400" />
              מקלדת אימוג'י WhatsApp
            </span>
            <button
              onClick={() => setShowEmojis(false)}
              className="text-[#8696a0] hover:text-white p-1 rounded-full hover:bg-[#182229]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Emoji Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-[#8696a0] absolute right-2.5 top-2.5" />
            <input
              type="text"
              value={emojiSearch}
              onChange={(e) => setEmojiSearch(e.target.value)}
              placeholder="חפש אימוג'י..."
              className="w-full pr-8 pl-3 py-1.5 bg-[#182229] border border-[#2a3942] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
            />
          </div>

          {/* Category Tabs */}
          {!emojiSearch && (
            <div className="flex items-center justify-between gap-1 border-b border-[#2a3942] pb-2 mb-2 overflow-x-auto no-scrollbar">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveEmojiTab(cat.id)}
                  className={`p-1.5 rounded-xl text-base transition-all ${
                    activeEmojiTab === cat.id
                      ? 'bg-[#00a884]/20 border border-[#00a884]/50 scale-105'
                      : 'hover:bg-[#182229] opacity-70 hover:opacity-100'
                  }`}
                  title={cat.name}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          )}

          {/* Emoji Grid Container */}
          <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto p-1 text-xl pr-1">
            {displayedEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                onClick={() => insertAtCursor(emoji)}
                className="hover:bg-[#182229] hover:scale-125 p-1.5 rounded-lg transition-all text-center active:scale-95 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Replies Popup Menu */}
      {showQuickReplies && (
        <div className="absolute bottom-16 right-4 bg-[#233138] border border-[#2a3942] rounded-2xl p-3.5 shadow-2xl z-50 w-80 text-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-[#2a3942] pb-2.5 mb-2.5">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-amber-400" />
              תגובות מהירות (Quick Replies)
            </span>
            <button onClick={() => setShowQuickReplies(false)} className="text-[#8696a0] hover:text-white p-1 rounded-full hover:bg-[#182229]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {effectiveQuickReplies.map((qr) => (
              <button
                key={qr.id}
                onClick={() => handleSelectQuickReply(qr)}
                className="w-full text-right p-2.5 rounded-xl bg-[#182229] hover:bg-[#202c33] border border-[#2a3942] transition-all hover:border-amber-500/60 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#e9edef] group-hover:text-amber-400 flex items-center gap-1.5">
                    <span>{qr.title}</span>
                  </span>
                  {qr.shortcut && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                      /{qr.shortcut}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#8696a0] line-clamp-2 leading-relaxed dir-rtl">
                  {qr.text}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-[#2a3942] flex items-center justify-between text-[10px] text-[#8696a0]">
            <span>💡 הקלד <code className="text-amber-300 font-mono">/</code> בתיבת הטקסט להשלמה מהירה</span>
          </div>
        </div>
      )}

      {/* WhatsApp Templates Popup */}
      {showTemplates && (
        <div className="absolute bottom-16 right-4 bg-[#233138] border border-[#2a3942] rounded-2xl p-3 shadow-2xl z-50 w-80 text-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-[#2a3942] pb-2 mb-2">
            <span className="text-xs font-bold text-[#00a884] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              תבניות WhatsApp בעברית מקצועית
            </span>
            <button onClick={() => setShowTemplates(false)} className="text-[#8696a0] hover:text-white p-1 rounded-full hover:bg-[#182229]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {HEBREW_WHATSAPP_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className="w-full text-right p-2.5 rounded-xl bg-[#182229] hover:bg-[#202c33] border border-[#2a3942] transition-all hover:border-[#00a884]/60 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#e9edef] group-hover:text-[#00a884] flex items-center gap-1.5">
                    <span>{tpl.icon}</span>
                    <span>{tpl.title}</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#8696a0] line-clamp-2 leading-relaxed dir-rtl">
                  {tpl.description}
                </p>
              </button>
            ))}
          </div>

          {/* Quick Formatting Toolbar */}
          <div className="mt-3 pt-2 border-t border-[#2a3942] flex items-center justify-between px-1">
            <span className="text-[10px] text-[#8696a0] font-medium">עיצוב WhatsApp:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyFormatting('*')}
                className="p-1 rounded bg-[#182229] text-[#e9edef] hover:text-[#00a884] text-xs font-bold cursor-pointer"
                title="הדגשה *טקסט*"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('_')}
                className="p-1 rounded bg-[#182229] text-[#e9edef] hover:text-[#00a884] text-xs cursor-pointer"
                title="נטוי _טקסט_"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('~')}
                className="p-1 rounded bg-[#182229] text-[#e9edef] hover:text-[#00a884] text-xs cursor-pointer"
                title="חוצה ~טקסט~"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('```')}
                className="p-1 rounded bg-[#182229] text-[#e9edef] hover:text-[#00a884] text-xs cursor-pointer"
                title="קוד ```טקסט```"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachments Popup */}
      {showAttachments && (
        <div className="absolute bottom-16 right-12 bg-[#233138] border border-[#2a3942] rounded-xl p-2 shadow-2xl z-50 flex flex-col gap-1 w-48 text-sm">
          <button
            onClick={handleSendSampleImage}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-lg text-[#d1d7db] text-right cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-[#bf59cf]" />
            <span>תמונה / גלריה</span>
          </button>
          <button
            onClick={handleSendSamplePdf}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-lg text-[#d1d7db] text-right cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#5f66cd]" />
            <span>מסמך / PDF</span>
          </button>
          <button
            onClick={startVoiceRecording}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-lg text-[#d1d7db] text-right cursor-pointer"
          >
            <Mic className="w-4 h-4 text-[#00a884]" />
            <span>הקלטה קולית</span>
          </button>
        </div>
      )}

      {/* Recording UI State */}
      {isRecording ? (
        <div className="flex-1 flex items-center justify-between bg-[#111b21] px-4 py-2 rounded-lg text-[#e9edef]">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="text-xs font-semibold text-red-400">מקליט קול...</span>
            <span className="text-xs font-mono text-[#8696a0]">
              0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cancelVoiceRecording}
              className="text-xs text-[#8696a0] hover:text-white px-2 py-1 cursor-pointer"
            >
              ביטול
            </button>
            <button
              onClick={stopAndSendVoiceNote}
              className="p-2 bg-[#00a884] text-[#111b21] rounded-full hover:bg-[#008f70] cursor-pointer"
              title="שלח הקלטה קולית"
            >
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Left Action Buttons (In RTL) */}
          <div className="flex items-center gap-1 text-[#8696a0]">
            <button
              onClick={() => {
                setShowQuickReplies(!showQuickReplies);
                setShowTemplates(false);
                setShowEmojis(false);
                setShowAttachments(false);
              }}
              className={`p-2 rounded-full transition-colors relative cursor-pointer ${
                showQuickReplies
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'hover:bg-[#374248]/50 text-[#8696a0] hover:text-amber-400'
              }`}
              title="תגובות מהירות (Quick Replies)"
            >
              <Zap className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setShowTemplates(!showTemplates);
                setShowQuickReplies(false);
                setShowEmojis(false);
                setShowAttachments(false);
              }}
              className={`p-2 rounded-full transition-colors relative cursor-pointer ${
                showTemplates
                  ? 'bg-[#00a884]/20 text-[#00a884]'
                  : 'hover:bg-[#374248]/50 text-[#8696a0] hover:text-[#00a884]'
              }`}
              title="תבניות WhatsApp בעברית מקצועית"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setShowEmojis(!showEmojis);
                setShowQuickReplies(false);
                setShowAttachments(false);
                setShowTemplates(false);
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                showEmojis
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'hover:bg-[#374248]/50 text-[#8696a0] hover:text-amber-400'
              }`}
              title="מקלדת אימוג'י"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setShowAttachments(!showAttachments);
                setShowQuickReplies(false);
                setShowEmojis(false);
                setShowTemplates(false);
              }}
              className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors cursor-pointer"
              title="קובץ מצורף"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {/* Textarea Input Box */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="הקלד/י הודעה (הקלד / לתגובה מהירה)..."
              className={`w-full px-4 py-2 text-sm rounded-lg resize-none focus:outline-none transition-colors max-h-24 ${
                darkTheme
                  ? 'bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] focus:bg-[#111b21]'
                  : 'bg-white text-[#111b21] placeholder-[#8696a0]'
              }`}
            />
          </div>

          {/* Dynamic Send / Mic Button */}
          {text.trim() ? (
            <button
              onClick={handleSend}
              className="p-2.5 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] rounded-full transition-transform active:scale-95 shrink-0 cursor-pointer"
              title="שלח הודעה"
            >
              <Send className="w-5 h-5 transform rotate-180" />
            </button>
          ) : (
            <button
              onClick={startVoiceRecording}
              className="p-2.5 text-[#8696a0] hover:bg-[#374248]/50 rounded-full transition-colors shrink-0 cursor-pointer"
              title="הקלט הקלטה קולית"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </>
      )}
    </div>
  );
};
