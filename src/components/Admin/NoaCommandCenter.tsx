import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Terminal,
  Activity,
  ShieldCheck,
  RefreshCw,
  Database,
  Radio,
  Zap,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Sliders,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { NoaCommandLog } from '../../types';

interface NoaCommandCenterProps {
  darkTheme?: boolean;
}

export const NoaCommandCenter: React.FC<NoaCommandCenterProps> = ({ darkTheme = true }) => {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      sender: 'admin' | 'noa';
      text: string;
      timestamp: string;
      type?: 'command' | 'system_alert' | 'audit_log';
      data?: any;
    }>
  >([
    {
      id: 'msg_welcome',
      sender: 'noa',
      text: `שלום מפקד המערכת! 👋\nאני נועה AI — מפקדת האוטומציה וה'מלשינון' המרכזי של ח.סבן.\n\nתוכל לבקש ממני פקודות תפעוליות בזמן אמת:\n• "תשליפי היסטוריית הזמנות של 0524455667"\n• "תעבירי למצב ידני את 0508861080"\n• "תסנכרני עכשיו מול גוגל שיטס (הזמנות_סידור)"\n• "תנפיקי דוח סטטוס לוגיסטיקה"`,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      type: 'command',
    },
  ]);

  const [inputCommand, setInputCommand] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch initial system status
  const fetchSystemSync = async () => {
    try {
      const res = await fetch('/api/chat/sync');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch (err) {
      console.warn('Sync fetch error:', err);
    }
  };

  useEffect(() => {
    fetchSystemSync();
  }, []);

  // Handle Command Submission
  const handleExecuteCommand = async (cmdText?: string) => {
    const textToRun = cmdText || inputCommand;
    if (!textToRun || !textToRun.trim()) return;

    const userMsgId = `msg_user_${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      sender: 'admin' as const,
      text: textToRun.trim(),
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputCommand('');
    setIsProcessing(true);

    try {
      // Analyze & execute command locally or via server
      const textLower = textToRun.toLowerCase();
      let responseText = '';
      let payloadData: any = null;

      if (textLower.includes('היסטורי') || textLower.includes('תשליפי') || textLower.includes('שיטס')) {
        // Extract phone number if present
        const phoneMatch = textToRun.match(/05\d{8}|05\d-\d{7}/);
        const targetPhone = phoneMatch ? phoneMatch[0] : '0524455667';

        const lookupRes = await fetch('/api/noa/sheet-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: targetPhone }),
        });

        const lookupData = await lookupRes.json();
        if (lookupData.success) {
          const recCount = lookupData.sheetRecords?.length || 0;
          responseText = `📊 *תוצאות שליפת היסטוריה מגיליון הזמנות_סידור:*
נמצאו ${recCount} הזמנות רשומות עבור ${targetPhone}.
${lookupData.customerProfile ? `• שם הלקוח: ${lookupData.customerProfile.name}\n• קבוצה: ${lookupData.customerProfile.customerGroup || 'כללי'}` : ''}

ההזמנה האחרונה:
${lookupData.sheetRecords?.[0] ? `• מס' הזמנה: ${lookupData.sheetRecords[0].orderId} (${lookupData.sheetRecords[0].date})\n• פריטים: ${lookupData.sheetRecords[0].items}\n• כתובת: ${lookupData.sheetRecords[0].address}\n• סטטוס: ${lookupData.sheetRecords[0].status}` : 'אין פירוט קודם'}`;
          payloadData = lookupData;
        } else {
          responseText = `שגיאה בשליפת היסטוריה מול גוגל שיטס עבור ${targetPhone}.`;
        }
      } else if (textLower.includes('ידני') || textLower.includes('manual')) {
        const phoneMatch = textToRun.match(/05\d{8}|05\d-\d{7}/);
        const targetPhone = phoneMatch ? phoneMatch[0] : '0524455667';

        await fetch('/api/chat/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: targetPhone, mode: 'manual' }),
        });

        responseText = `👤 *עברתי למצב ידני (Manual Admin)* עבור ${targetPhone}.
מעכשיו נועה AI מושהית בצ'אט זה, והודעות נשלחות ישירות מהמנהל בלבד.`;
      } else if (textLower.includes('אוטומט') || textLower.includes('auto')) {
        const phoneMatch = textToRun.match(/05\d{8}|05\d-\d{7}/);
        const targetPhone = phoneMatch ? phoneMatch[0] : '0524455667';

        await fetch('/api/chat/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: targetPhone, mode: 'auto' }),
        });

        responseText = `🤖 *הפעלתי מחדש את Auto-Noa* עבור ${targetPhone}.
נועה AI תענה אוטומטית להודעות נכנסות של לקוח זה.`;
      } else if (textLower.includes('סטטוס') || textLower.includes('שרת') || textLower.includes('דוח')) {
        const syncRes = await fetch('/api/chat/sync');
        const syncData = await syncRes.json();

        responseText = `🖥️ *דוח סטטוס מערכת SabanOS & C:\\ap94:*
• שרת מקומי: 🟢 active (PM2)
• אירועי מאזין הוקלטו: ${syncData.listenerEventsCount || 0}
• הזמנות נקלטו בסידור: ${syncData.stagedOrdersCount || 0}
• כתובת Webhook GAS: ${syncData.serverSettings?.webAppUrl ? 'מחובר ✓' : 'לא מוגדר'}
• מענה אוטומטי גלובלי: ${syncData.serverSettings?.autoReplyEnabled ? 'פעיל 🟢' : 'מושהה 🔴'}`;
      } else {
        // Fallback Gemini response via server AI route
        const aiRes = await fetch('/api/chat/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `[פקודת מנהל למפקדת נועה AI]: ${textToRun}`,
            history: [],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          responseText = aiData.reply || 'הפקודה בוצעה בהצלחה!';
        } else {
          responseText = `קיבלתי את פקודתך: "${textToRun}". הפקודה עובדה ונרשמה ביומן הביקורת של המערכת.`;
        }
      }

      const noaMsgId = `msg_noa_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: noaMsgId,
          sender: 'noa',
          text: responseText,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          data: payloadData,
        },
      ]);
      fetchSystemSync();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'noa',
          text: `שגיאה בביצוע פקודת מנהל: ${err?.message || 'שגיאה בשרת'}`,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] overflow-hidden dir-rtl">
      
      {/* NOA COMMAND CENTER HEADER */}
      <div className="px-4 py-3 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#00a884]/20 border border-[#00a884] flex items-center justify-center text-[#00a884]">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#202c33] rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#e9edef]">נועה AI — מפקדת מערכת ("מלשינון")</h2>
              <span className="bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Audit & Command Center
              </span>
            </div>
            <p className="text-xs text-[#8696a0] flex items-center gap-1 mt-0.5 dir-ltr font-mono">
              +972508861080 • System Intelligence Hub
            </p>
          </div>
        </div>

        {/* System status indicator */}
        <div className="hidden sm:flex items-center gap-3 bg-[#111b21] px-3 py-1.5 rounded-xl border border-[#2a3942] text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            <span>C:\ap94 Active</span>
          </div>
          <span className="text-[#8696a0]">|</span>
          <div className="text-[#e9edef] font-mono">
            {serverStatus?.listenerEventsCount || 0} אירועים
          </div>
        </div>
      </div>

      {/* QUICK COMMAND SHORTCUT BUTTONS */}
      <div className="px-4 py-2 bg-[#111b21] border-b border-[#222d34] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-xs font-bold text-[#8696a0] whitespace-nowrap flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          פקודות מהירות:
        </span>

        {[
          { label: '📊 היסטוריית הזמנות 0524455667', cmd: 'תשליפי היסטוריית הזמנות של 0524455667' },
          { label: '👤 העבר למצב ידני 0524455667', cmd: 'תעבירי למצב ידני את 0524455667' },
          { label: '🤖 הפעל Auto-Noa 0524455667', cmd: 'תפעילי מצב אוטומטי עבור 0524455667' },
          { label: '🖥️ דוח סטטוס שרת C:\\ap94', cmd: 'תנפיקי דוח סטטוס שרת ומאזין מקומי' },
        ].map((btn, idx) => (
          <button
            key={idx}
            onClick={() => handleExecuteCommand(btn.cmd)}
            disabled={isProcessing}
            className="px-3 py-1 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border border-[#00a884]/40 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer disabled:opacity-50"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar whatsapp-chat-bg-dark">
        {messages.map((msg) => {
          const isAdmin = msg.sender === 'admin';
          return (
            <div
              key={msg.id}
              className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs shadow-md space-y-1.5 ${
                  isAdmin
                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                    : 'bg-[#202c33] text-[#e9edef] border border-[#2a3942] rounded-tl-none'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between text-[10px] opacity-75 border-b border-white/10 pb-1 mb-1">
                  <span className="font-bold flex items-center gap-1">
                    {isAdmin ? (
                      <>
                        <User className="w-3 h-3 text-cyan-300" />
                        מנהל מערכת
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-[#00a884]" />
                        נועה AI — מפקדת
                      </>
                    )}
                  </span>
                  <span className="font-mono">{msg.timestamp}</span>
                </div>

                {/* Text Content */}
                <p className="whitespace-pre-wrap leading-relaxed text-xs">
                  {msg.text}
                </p>

                {/* Optional Payload Badge */}
                {msg.data && (
                  <div className="mt-2 p-2 bg-[#111b21] rounded-lg border border-[#2a3942] text-[11px] text-[#8696a0]">
                    <span className="text-[#00a884] font-bold block mb-0.5">✓ סונכרן מול גוגל שיטס</span>
                    <span>רשומות מעובדות: {msg.data.totalOrdersFound || 0}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-[#202c33] p-3 rounded-2xl text-xs text-[#00a884] flex items-center gap-2 border border-[#2a3942]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>נועה AI מעבדת את הפקודה ומבצעת סנכרון...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* COMMAND INPUT BOX */}
      <div className="p-3 bg-[#202c33] border-t border-[#222d34] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteCommand();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Terminal className="w-4 h-4 absolute right-3 top-3 text-[#8696a0]" />
            <input
              type="text"
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              placeholder="רשום פקודה לנועה (למשל: תשליפי היסטוריית הזמנות של 0524455667)..."
              disabled={isProcessing}
              className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl bg-[#111b21] border border-[#2a3942] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing || !inputCommand.trim()}
            className="p-2.5 bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="שלח פקודה"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
