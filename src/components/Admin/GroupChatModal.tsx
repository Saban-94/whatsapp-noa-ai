import React, { useState } from 'react';
import {
  Users,
  Send,
  AtSign,
  MessageSquare,
  CheckCircle,
  Clock,
  Zap,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { playNotificationSound } from '../../utils/notificationService';

export interface GroupMessageItem {
  id: string;
  groupId: string;
  phone: string;
  senderName: string;
  parsedClientName?: string;
  isGroup: boolean;
  incomingMessage: string;
  noaResponse?: string;
  mentionedJids?: string[];
  sentToWhatsapp: boolean;
  timestamp: string;
}

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateGroupEvent?: (
    phone: string,
    senderName: string,
    parsedClientName: string,
    message: string,
    groupId: string
  ) => Promise<void>;
  onSendGroupReply?: (
    groupId: string,
    messageText: string,
    tagClient: boolean,
    phone: string,
    senderName: string
  ) => Promise<void>;
}

export const INITIAL_MOCK_GROUP_MESSAGES: GroupMessageItem[] = [
  {
    id: 'grp_msg_101',
    groupId: '120363426260862614@g.us',
    phone: '050-8860896',
    senderName: 'חיים עמרם',
    parsedClientName: 'חיים עמרם - אתר הרצליה',
    isGroup: true,
    incomingMessage: 'שלום נועה, 20 לוחות גבס לבן, 10 ניצבים 5 ס"מ ו-5 מסלולים לקומה 3',
    noaResponse: `שלום חיים עמרם! 👋\n*ההזמנה נקלטה מקבוצת הוואטסאפ:* 👥\n\n• [מק"ט 40001] לוח גבס לבן 12.5 מ"מ — 20 יחידה\n• [מק"ט 40010] ניצב 5 ס"מ גבס — 10 יחידה\n• [מק"ט 40012] מסלול 5 ס"מ גבס — 5 יחידה\n\nתויגת בשיחה ונשלח לסידור הובלות!`,
    mentionedJids: ['972508860896@c.us'],
    sentToWhatsapp: true,
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'grp_msg_102',
    groupId: '12036304555@g.us',
    phone: '054-8899776',
    senderName: 'קבלן ראשי - פרוייקט צפון',
    parsedClientName: 'דוד לוי - מנהל עבודה',
    isGroup: true,
    incomingMessage: 'מה הסטטוס של הבלוקים והמנוף לקומה 2?',
    noaResponse: 'המשאית יצאה לדרך, צפויה להגיע תוך 25 דקות! 🚛',
    mentionedJids: ['972548899776@c.us'],
    sentToWhatsapp: true,
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
  },
];

export const GroupChatModal: React.FC<GroupChatModalProps> = ({
  isOpen,
  onClose,
  onSimulateGroupEvent,
  onSendGroupReply,
}) => {
  const [messages, setMessages] = useState<GroupMessageItem[]>(INITIAL_MOCK_GROUP_MESSAGES);
  const [replyText, setReplyText] = useState('');
  const [tagClient, setTagClient] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState('052-6688768');
  const [selectedClientName, setSelectedClientName] = useState('חיים עמרם');
  const [selectedGroupId, setSelectedGroupId] = useState('12036304555@g.us');
  const [isSending, setIsSending] = useState(false);

  // Simulation state
  const [simPhone, setSimPhone] = useState('052-6688768');
  const [simSender, setSimSender] = useState('קבוצת פרויקט הרצליה');
  const [simClientName, setSimClientName] = useState('חיים עמרם');
  const [simMessage, setSimMessage] = useState('20 לוחות גבס, 10 ניצבים, 5 מסלולים לקומה 3');
  const [simGroupId, setSimGroupId] = useState('12036304555@g.us');
  const [isSimulating, setIsSimulating] = useState(false);

  const [toastAlert, setToastAlert] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendGroupReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSending(true);
    try {
      const formattedMention = tagClient ? ` @+972${selectedPhone.replace(/\D/g, '').replace(/^972/, '').replace(/^0/, '')}` : '';
      const fullMsgText = `${replyText}${formattedMention}`;

      if (onSendGroupReply) {
        await onSendGroupReply(selectedGroupId, fullMsgText, tagClient, selectedPhone, selectedClientName);
      } else {
        // Fallback local API post
        await fetch('/api/chat/send-group-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: selectedGroupId,
            phone: selectedPhone,
            senderName: selectedClientName,
            messageText: fullMsgText,
            tagClient,
          }),
        });
      }

      const newOutboundItem: GroupMessageItem = {
        id: `out_grp_${Date.now()}`,
        groupId: selectedGroupId,
        phone: selectedPhone,
        senderName: 'נועה AI (SabanOS Agent)',
        parsedClientName: selectedClientName,
        isGroup: true,
        incomingMessage: `[הודעה נשלחה לקבוצה דרך JONI] ${fullMsgText}`,
        noaResponse: fullMsgText,
        mentionedJids: tagClient ? [`${selectedPhone.replace(/\D/g, '')}@c.us`] : [],
        sentToWhatsapp: true,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [newOutboundItem, ...prev]);
      setReplyText('');
      playNotificationSound('auto');
      setToastAlert(`✅ הודעה נשלחה בהצלחה לקבוצה (${selectedGroupId}) ותוייג ${selectedClientName}!`);
      setTimeout(() => setToastAlert(null), 4000);
    } catch (err: any) {
      setToastAlert(`⚠️ שגיאה בשליחת הודעה לקבוצה: ${err?.message || 'נסה שוב'}`);
      setTimeout(() => setToastAlert(null), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const handleRunGroupSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;

    setIsSimulating(true);
    try {
      if (onSimulateGroupEvent) {
        await onSimulateGroupEvent(simPhone, simSender, simClientName, simMessage, simGroupId);
      } else {
        await fetch('/api/listener/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: simPhone,
            senderName: simSender,
            parsedClientName: simClientName,
            isGroup: true,
            groupId: simGroupId,
            incomingMessage: simMessage,
            sentToWhatsapp: true,
          }),
        });
      }

      const newSimItem: GroupMessageItem = {
        id: `sim_grp_${Date.now()}`,
        groupId: simGroupId,
        phone: simPhone,
        senderName: simSender,
        parsedClientName: simClientName,
        isGroup: true,
        incomingMessage: simMessage,
        noaResponse: `שלום ${simClientName}! ההזמנה נקלטה והועברה לסידור הובלות.`,
        mentionedJids: [`${simPhone.replace(/\D/g, '')}@c.us`],
        sentToWhatsapp: true,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [newSimItem, ...prev]);
      playNotificationSound('auto');
      setToastAlert('⚡ הודעת קבוצה נכנסת מ-C:\\ap94 סונתזה בהצלחה!');
      setTimeout(() => setToastAlert(null), 3000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 dir-rtl font-sans">
      <div className="bg-[#111b21] border border-[#2a3942] w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#202c33] px-6 py-4 border-b border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                סנכרון קבוצות וואטסאפ (WhatsApp Group & Outbound JONI Tagging)
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  @g.us Active Stream
                </span>
              </h2>
              <p className="text-xs text-[#8696a0]">
                שידור ושיקוף הודעות מקבוצות וואטסאפ בלייב מ-`C:\ap94`, תיוג אוטומטי של לקוחות משנה ושליחה מרוכזת דרך JONI API.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#8696a0] hover:text-white rounded-lg hover:bg-[#2a3942] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Toast Notification Alert */}
          {toastAlert && (
            <div className="bg-purple-900/90 border border-purple-500 text-purple-100 p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-300" />
                <span>{toastAlert}</span>
              </div>
              <button onClick={() => setToastAlert(null)} className="text-purple-300 hover:text-white">
                אישור
              </button>
            </div>
          )}

          {/* Group Simulator Card */}
          <form onSubmit={handleRunGroupSimulation} className="bg-[#202c33] p-4 rounded-xl border border-[#2a3942] space-y-3">
            <div className="flex items-center justify-between border-b border-[#2a3942] pb-2">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                אירוע סימולציית הודעה נכנסת מקבוצת וואטסאפ (`C:\ap94` Group Listener)
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                POST /api/listener/event (isGroup: true)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">Group ID (groupId)</label>
                <input
                  type="text"
                  value={simGroupId}
                  onChange={(e) => setSimGroupId(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white font-mono dir-ltr"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">שם הקבוצה (senderName)</label>
                <input
                  type="text"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">לקוח משנה (parsedClientName)</label>
                <input
                  type="text"
                  value={simClientName}
                  onChange={(e) => setSimClientName(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">טלפון לקוח (phone)</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white font-mono dir-ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#8696a0] mb-1">תוכן ההודעה בקבוצה</label>
              <input
                type="text"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder="למשל: 20 לוחות גבס, 10 ניצבים, 5 מסלולים לקומה 3"
                className="w-full bg-[#111b21] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSimulating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>סימולציית הודעת קבוצה מ-C:\ap94</span>
              </button>
            </div>
          </form>

          {/* Outbound Group Reply Card */}
          <form onSubmit={handleSendGroupReply} className="bg-[#202c33] p-4 rounded-xl border border-[#2a3942] space-y-3">
            <div className="flex items-center justify-between border-b border-[#2a3942] pb-2">
              <span className="text-xs font-bold text-[#00a884] flex items-center gap-1.5">
                <Send className="w-4 h-4" />
                מענה ידני מרוכז לקבוצה דרך JONI API עם תיוג
              </span>
              <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-2 py-0.5 rounded font-mono">
                POST /api/chat/send-group-message
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">בחירת Group ID</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white font-mono dir-ltr"
                >
                  <option value="12036304555@g.us">12036304555@g.us (קבוצת אתר הרצליה)</option>
                  <option value="12036309999@g.us">12036309999@g.us (פרויקט צפון)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">שם הלקוח לתיוג</label>
                <input
                  type="text"
                  value={selectedClientName}
                  onChange={(e) => setSelectedClientName(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">טלפון הלקוח (@mention)</label>
                <input
                  type="text"
                  value={selectedPhone}
                  onChange={(e) => setSelectedPhone(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white font-mono dir-ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#8696a0] mb-1">השב לקבוצה (תשובת ספק / עדכון סידור)</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="הקלד תשובה לקבוצה, למשל: שלום, ההזמנה אושרה בסידור ותסופק בשעה 10:00!"
                rows={2}
                className="w-full bg-[#111b21] border border-[#2a3942] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#00a884]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-300 font-bold bg-[#111b21] px-3 py-1.5 rounded-lg border border-[#2a3942]">
                <input
                  type="checkbox"
                  checked={tagClient}
                  onChange={(e) => setTagClient(e.target.checked)}
                  className="rounded text-[#00a884] focus:ring-0"
                />
                <AtSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>תייג את הלקוח (@+972{selectedPhone.replace(/\D/g, '').replace(/^0/, '')})</span>
              </label>

              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-5 py-2 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer shadow disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${isSending ? 'animate-bounce' : ''}`} />
                <span>{isSending ? 'משדר ל-JONI...' : 'שלח לקבוצה דרך JONI'}</span>
              </button>
            </div>
          </form>

          {/* Group Live Stream List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#2a3942] pb-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              הודעות קבוצה פעילות (Live Group Stream)
            </h3>

            <div className="space-y-3">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#202c33] p-4 rounded-xl border border-[#2a3942] space-y-2 hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a3942]/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        👥 Group Order
                      </span>
                      <span className="text-xs font-bold text-white">{item.senderName}</span>
                      {item.parsedClientName && (
                        <span className="text-[11px] bg-[#111b21] px-2 py-0.5 rounded text-amber-300 border border-[#2a3942]">
                          לקוח: {item.parsedClientName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#8696a0] font-mono">
                      <span>{item.groupId}</span>
                      <span className="text-[#2a3942]">|</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-xs text-white bg-[#111b21] p-3 rounded-lg border border-[#2a3942]">
                    <span className="text-purple-400 font-bold ml-1">הודעה נכנסת:</span>
                    {item.incomingMessage}
                  </div>

                  {item.noaResponse && (
                    <div className="text-xs text-emerald-300 bg-[#00a884]/10 p-3 rounded-lg border border-[#00a884]/20 whitespace-pre-wrap">
                      <div className="font-bold text-[#00a884] mb-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        מענה Noa AI / JONI Outbound:
                      </div>
                      {item.noaResponse}
                    </div>
                  )}

                  {item.mentionedJids && item.mentionedJids.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-purple-300 pt-1">
                      <AtSign className="w-3 h-3" />
                      <span>מתויגים בקבוצה: {item.mentionedJids.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#202c33] px-6 py-3 border-t border-[#2a3942] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2a3942] hover:bg-[#3b4a54] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            סגור חלון
          </button>
        </div>
      </div>
    </div>
  );
};
