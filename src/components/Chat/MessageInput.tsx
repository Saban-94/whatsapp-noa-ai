import React, { useState, useRef } from 'react';
import { Smile, Paperclip, Send, Mic, Image as ImageIcon, FileText, X, Square } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string, type?: 'text' | 'image' | 'document' | 'voice_note', mediaUrl?: string) => void;
  darkTheme: boolean;
  isAiManaged?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  darkTheme,
  isAiManaged,
}) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const commonEmojis = ['😊', '👍', '❤️', '🙏', '🚀', '📦', '🍽️', '🍕', '🥗', '☕', '✅', '🔥', '⚡', '📝', '📍', '📱'];

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text, 'text');
    setText('');
    setShowEmojis(false);
    setShowAttachments(false);
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

  return (
    <div className={`relative px-4 py-2.5 flex items-center gap-2 select-none z-10 ${
      darkTheme ? 'bg-[#202c33] border-t border-[#222d34]' : 'bg-[#f0f2f5] border-t border-[#e9edef]'
    }`}>
      {/* Emoji Picker Popup */}
      {showEmojis && (
        <div className="absolute bottom-16 right-4 bg-[#233138] border border-[#2a3942] rounded-xl p-3 shadow-2xl z-50 w-72">
          <div className="flex items-center justify-between border-b border-[#2a3942] pb-2 mb-2">
            <span className="text-xs font-semibold text-[#8696a0]">אימוג'ים נפוצים</span>
            <button onClick={() => setShowEmojis(false)} className="text-[#8696a0] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2 text-xl">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setText((prev) => prev + emoji);
                }}
                className="hover:bg-[#182229] p-1.5 rounded-md transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachments Menu Popup */}
      {showAttachments && (
        <div className="absolute bottom-16 right-12 bg-[#233138] border border-[#2a3942] rounded-xl p-2 shadow-2xl z-50 flex flex-col gap-1 w-48 text-sm">
          <button
            onClick={handleSendSampleImage}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-lg text-[#d1d7db] text-right"
          >
            <ImageIcon className="w-4 h-4 text-[#bf59cf]" />
            <span>תמונה / גלריה</span>
          </button>
          <button
            onClick={handleSendSamplePdf}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-lg text-[#d1d7db] text-right"
          >
            <FileText className="w-4 h-4 text-[#5f66cd]" />
            <span>מסמך / PDF</span>
          </button>
          <button
            onClick={startVoiceRecording}
            className="flex items-center gap-3 px-3 py-2 hover:bg-[#182229] rounded-lg text-[#d1d7db] text-right"
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
              className="text-xs text-[#8696a0] hover:text-white px-2 py-1"
            >
              ביטול
            </button>
            <button
              onClick={stopAndSendVoiceNote}
              className="p-2 bg-[#00a884] text-[#111b21] rounded-full hover:bg-[#008f70]"
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
                setShowEmojis(!showEmojis);
                setShowAttachments(false);
              }}
              className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors"
              title="אימוג'י"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setShowAttachments(!showAttachments);
                setShowEmojis(false);
              }}
              className="p-2 rounded-full hover:bg-[#374248]/50 transition-colors"
              title="קובץ מצורף"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {/* Textarea Input Box */}
          <div className="flex-1 min-w-0">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="הקלד/י הודעה..."
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
              className="p-2.5 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] rounded-full transition-transform active:scale-95 shrink-0"
              title="שלח הודעה"
            >
              <Send className="w-5 h-5 transform rotate-180" />
            </button>
          ) : (
            <button
              onClick={startVoiceRecording}
              className="p-2.5 text-[#8696a0] hover:bg-[#374248]/50 rounded-full transition-colors shrink-0"
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
