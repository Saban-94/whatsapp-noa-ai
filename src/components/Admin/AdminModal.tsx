import React, { useState } from 'react';
import {
  X,
  Shield,
  Activity,
  MessageSquare,
  BookOpen,
  Radio,
  Volume2,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Play,
  Bot,
  User,
  Send,
  Save,
  Globe,
  Database,
  Clock,
  Calendar,
  Moon,
  CheckCheck,
  ShoppingCart,
  Sparkles,
  Link,
  Navigation,
  Zap,
  Copy,
  MessageSquareQuote,
  Download,
  Archive,
} from 'lucide-react';
import { Chat, KnowledgeItem, AdminSettings, WebhookLog, QuickReply, StagedOrder } from '../../types';
import { HEBREW_WHATSAPP_TEMPLATES } from '../../data/whatsappTemplates';
import { DEFAULT_QUICK_REPLIES } from '../../data/mockData';
import { FormattedMessage } from '../Chat/FormattedMessage';
import { playWhatsAppIncomingSound } from '../../utils/audio';
import { LogisticDictionaryTab } from './LogisticDictionaryTab';
import { OrdersStagingTab } from './OrdersStagingTab';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  settings: AdminSettings;
  onUpdateSettings: (newSettings: AdminSettings) => void;
  knowledgeBase: KnowledgeItem[];
  onUpdateKnowledgeBase: (newKb: KnowledgeItem[]) => void;
  webhookLogs: WebhookLog[];
  stagedOrders?: StagedOrder[];
  onUpdateOrderStatus?: (orderId: string, newStatus: StagedOrder['status']) => void;
  onSimulateListenerEvent?: (phone: string, name: string, message: string) => Promise<void>;
  onSendHumanOverrideMessage: (chatId: string, text: string) => void;
  onTestWebhook: () => Promise<void>;
  onResetData: () => void;
  onRunAutoArchive?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  chats,
  settings,
  onUpdateSettings,
  knowledgeBase,
  onUpdateKnowledgeBase,
  webhookLogs,
  stagedOrders = [],
  onUpdateOrderStatus,
  onSimulateListenerEvent,
  onSendHumanOverrideMessage,
  onTestWebhook,
  onResetData,
  onRunAutoArchive,
}) => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'crm' | 'prompt' | 'quick_replies' | 'hours' | 'webhook' | 'settings' | 'logistic_dict' | 'orders_staging'>('orders_staging');

  const [selectedCrmChatId, setSelectedCrmChatId] = useState<string>(chats[0]?.id || '');
  const [overrideText, setOverrideText] = useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // System Prompt local state
  const [localPrompt, setLocalPrompt] = useState(settings.systemPrompt);
  const [localWebAppUrl, setLocalWebAppUrl] = useState(settings.webAppUrl);

  // KB local form state
  const [newCategory, setNewCategory] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Quick Reply form state
  const [newQrTitle, setNewQrTitle] = useState('');
  const [newQrShortcut, setNewQrShortcut] = useState('');
  const [newQrCategory, setNewQrCategory] = useState('');
  const [newQrText, setNewQrText] = useState('');
  const [copiedQrId, setCopiedQrId] = useState<string | null>(null);

  const handleAddQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQrTitle.trim() || !newQrText.trim()) return;

    const newQr: QuickReply = {
      id: `qr_${Date.now()}`,
      title: newQrTitle.trim(),
      shortcut: newQrShortcut.replace(/^\//, '').trim() || undefined,
      category: newQrCategory.trim() || 'כללי',
      text: newQrText.trim(),
    };

    const currentList = settings.quickReplies || DEFAULT_QUICK_REPLIES;
    const updated = [...currentList, newQr];
    onUpdateSettings({ ...settings, quickReplies: updated });

    setNewQrTitle('');
    setNewQrShortcut('');
    setNewQrCategory('');
    setNewQrText('');
  };

  const handleDeleteQuickReply = (id: string) => {
    const currentList = settings.quickReplies || DEFAULT_QUICK_REPLIES;
    const updated = currentList.filter((q) => q.id !== id);
    onUpdateSettings({ ...settings, quickReplies: updated });
  };

  const handleResetQuickRepliesToDefault = () => {
    if (window.confirm('האם להחזיר את כל התגובות המהירות לתגובות ברירת המחדל?')) {
      onUpdateSettings({ ...settings, quickReplies: DEFAULT_QUICK_REPLIES });
    }
  };

  const handleCopyQrText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQrId(id);
    setTimeout(() => setCopiedQrId(null), 2000);
  };

  const checkIsCurrentlyBusinessHours = () => {
    if (!settings.businessHoursEnabled) return true;
    const now = new Date();
    const currentDay = now.getDay();
    const activeDays = settings.businessDays ?? [0, 1, 2, 3, 4];
    if (!activeDays.includes(currentDay)) return false;

    const start = settings.businessHoursStart || '08:00';
    const end = settings.businessHoursEnd || '18:00';
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [sH, sM] = start.split(':').map(Number);
    const startMinutes = sH * 60 + sM;

    const [eH, eM] = end.split(':').map(Number);
    const endMinutes = eH * 60 + eM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  };

  const isCurrentlyBusinessHours = checkIsCurrentlyBusinessHours();

  if (!isOpen) return null;

  const totalMessages = chats.reduce((acc, c) => acc + c.messages.length, 0);

  const handleSavePromptAndUrl = () => {
    onUpdateSettings({
      ...settings,
      systemPrompt: localPrompt,
      webAppUrl: localWebAppUrl,
    });
    alert('ההגדרות נשמרו בהצלחה!');
  };

  const handleAddKbItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem: KnowledgeItem = {
      id: `kb_${Date.now()}`,
      category: newCategory || 'כללי',
      title: newTitle,
      content: newContent,
      isEnabled: true,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onUpdateKnowledgeBase([...knowledgeBase, newItem]);
    setNewCategory('');
    setNewTitle('');
    setNewContent('');
  };

  const handleDeleteKbItem = (id: string) => {
    onUpdateKnowledgeBase(knowledgeBase.filter((k) => k.id !== id));
  };

  const handleToggleKbItem = (id: string) => {
    onUpdateKnowledgeBase(
      knowledgeBase.map((k) => (k.id === id ? { ...k, isEnabled: !k.isEnabled } : k))
    );
  };

  const handleSendOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideText.trim() || !selectedCrmChatId) return;
    onSendHumanOverrideMessage(selectedCrmChatId, overrideText);
    setOverrideText('');
  };

  const handleRunTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);
    try {
      await onTestWebhook();
      setTestResult('חיבור תקין (HTTP 200 OK)');
    } catch (err: any) {
      setTestResult(`שגיאת חיבור: ${err?.message || 'נכשל'}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const selectedCrmChat = chats.find((c) => c.id === selectedCrmChatId) || chats[0];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 text-[#e9edef] dir-rtl">
      <div className="bg-[#111b21] w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl border border-[#2a3942] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="h-16 px-6 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00a884]/20 rounded-xl text-[#00a884]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                SabanOS - לוח בקרה אדמיניסטרטיבי (Admin Panel)
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono">
                  Noa AI v3.6
                </span>
              </h2>
              <p className="text-xs text-[#8696a0]">
                ניהול שיחות בזמן אמת, עורך פרומפטים, מאגר ידע וסנכרון Webhook Google Script
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#374248] text-[#8696a0] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 bg-[#182229] border-b border-[#2a3942] overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('kpi')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'kpi'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Activity className="w-4 h-4" />
            מדדים וסקירה (KPIs)
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'crm'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            ניהול שיחות ו-CRM live
          </button>

          <button
            onClick={() => setActiveTab('prompt')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'prompt'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            עורך פרומפט ומאגר ידע
          </button>

          <button
            onClick={() => setActiveTab('quick_replies')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'quick_replies'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            תגובות מהירות (Quick Replies)
          </button>

          <button
            onClick={() => setActiveTab('hours')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'hours'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Clock className="w-4 h-4" />
            שעות פעילות ואישורי קריאה
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'webhook'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Radio className="w-4 h-4" />
            סנכרון Google Apps Script
          </button>

          <button
            onClick={() => setActiveTab('orders_staging')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'orders_staging'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-[#00a884]" />
            הזמנות סידור (Staging Table)
          </button>

          <button
            onClick={() => setActiveTab('logistic_dict')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'logistic_dict'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            מילון לוגיסטי (נרמול מוצרים ומק"טים)
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            הגדרות שמע ומערכת
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB: Orders Staging Table (הזמנות_סידור) */}
          {activeTab === 'orders_staging' && (
            <OrdersStagingTab
              stagedOrders={stagedOrders}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onSimulateListenerEvent={onSimulateListenerEvent}
            />
          )}

          {/* TAB: Logistic Dictionary & Product Normalizer */}
          {activeTab === 'logistic_dict' && <LogisticDictionaryTab />}
          
          {/* TAB 1: KPIs & Overview */}
          {activeTab === 'kpi' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#202c33] p-4 rounded-xl border border-[#2a3942] flex items-center gap-4">
                  <div className="p-3 bg-[#00a884]/20 rounded-lg text-[#00a884]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8696a0]">סך הכל שיחות פעילות</p>
                    <p className="text-2xl font-bold text-white">{chats.length}</p>
                  </div>
                </div>

                <div className="bg-[#202c33] p-4 rounded-xl border border-[#2a3942] flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8696a0]">סך הכל הודעות במערכת</p>
                    <p className="text-2xl font-bold text-white">{totalMessages}</p>
                  </div>
                </div>

                <div className="bg-[#202c33] p-4 rounded-xl border border-[#2a3942] flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8696a0]">מודל בינה מלאכותית פעיל</p>
                    <p className="text-base font-bold text-white truncate">{settings.activeModel}</p>
                  </div>
                </div>

                <div className="bg-[#202c33] p-4 rounded-xl border border-[#2a3942] flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8696a0]">סטטוס ה-Webhook</p>
                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      מחובר ומסונכרן
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook Endpoint Info Box */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-[#00a884]">
                  <Globe className="w-4 h-4" />
                  כתובת ה-Web App הראשית של SabanOS
                </h3>
                <p className="text-xs text-[#8696a0]">
                  כתובת ה-Google Apps Script Web App הפעילה לסנכרון תפריטים, הזמנות והודעות נכנסות:
                </p>
                <div className="flex items-center gap-2 bg-[#111b21] p-3 rounded-lg border border-[#2a3942] font-mono text-xs text-emerald-300 break-all dir-ltr">
                  <span>{settings.webAppUrl}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CRM & Human Override */}
          {activeTab === 'crm' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[580px]">
              {/* Left Column: Chat List Selection */}
              <div className="bg-[#202c33] rounded-xl border border-[#2a3942] overflow-hidden flex flex-col">
                <div className="p-3 bg-[#182229] border-b border-[#2a3942] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#8696a0]">רשימת תיקי לקוח ({chats.length})</h3>
                  <span className="text-[10px] text-[#00a884] bg-[#00a884]/10 px-2 py-0.5 rounded-full font-mono">
                    WhatsApp Listener Active
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#2a3942]">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedCrmChatId(chat.id)}
                      className={`p-3 cursor-pointer transition-colors flex items-center gap-3 ${
                        selectedCrmChatId === chat.id ? 'bg-[#2a3942]' : 'hover:bg-[#182229]'
                      }`}
                    >
                      <img
                        src={chat.contact.avatar}
                        alt={chat.contact.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white truncate">{chat.contact.name}</p>
                          {chat.contact.company && (
                            <span className="text-[9px] text-[#8696a0] truncate ml-1">{chat.contact.company}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8696a0] truncate">
                          {chat.messages[chat.messages.length - 1]?.text || 'אין הודעות'}
                        </p>
                      </div>
                      {chat.contact.isAiManaged && (
                        <span className="text-[9px] bg-[#00a884]/20 text-[#00a884] px-1.5 py-0.5 rounded-md font-medium shrink-0">
                          AI
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: CRM Details & Transcript */}
              {selectedCrmChat && (
                <div className="md:col-span-2 bg-[#202c33] rounded-xl border border-[#2a3942] flex flex-col overflow-hidden">
                  <div className="p-3 bg-[#182229] border-b border-[#2a3942] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#00a884]" />
                      <span className="text-xs font-bold text-white">{selectedCrmChat.contact.name}</span>
                      <span className="text-[11px] text-[#8696a0]">({selectedCrmChat.contact.phone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/webhook/whatsapp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                contactName: selectedCrmChat.contact.name,
                                phone: selectedCrmChat.contact.phone,
                                message: 'היי, מזמין 10 שקי מלט אפור ו-2 בלות סומסום למחר',
                              }),
                            });
                            const data = await res.json();
                            alert(`הודעה נקלטה בשרת המקומי!\nתגובת Noa AI:\n${data.aiReplyText || 'עובד'}`);
                          } catch (e: any) {
                            alert('שגיאה בסנכרון מול השרת: ' + e?.message);
                          }
                        }}
                        className="text-[11px] bg-[#00a884]/20 hover:bg-[#00a884]/30 text-[#00a884] px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin-slow" />
                        סימולציית האזנה מוואטסאפ (Local Webhook)
                      </button>
                    </div>
                  </div>

                  {/* CRM Summary Bar */}
                  <div className="bg-[#111b21] p-3 border-b border-[#2a3942] text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-[#8696a0] block">חברה / אתר:</span>
                      <span className="font-semibold text-white truncate block">{selectedCrmChat.contact.company || 'לקוח פרטי'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8696a0] block">כתובת:</span>
                      <span className="font-semibold text-white truncate block">{selectedCrmChat.contact.address || 'לא צוינה'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8696a0] block">אשראי / חוב:</span>
                      <span className="font-semibold text-[#00a884] block">
                        {selectedCrmChat.contact.creditLimit ? `₪${selectedCrmChat.contact.creditLimit.toLocaleString()}` : 'מאושר'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8696a0] block">הערות מנהל:</span>
                      <span className="font-semibold text-[#8696a0] truncate block">{selectedCrmChat.contact.notes || 'אין הערות'}</span>
                    </div>
                  </div>

                  {/* Past Order History Section */}
                  {selectedCrmChat.contact.orderHistory && selectedCrmChat.contact.orderHistory.length > 0 && (
                    <div className="bg-[#182229] p-2.5 border-b border-[#2a3942]">
                      <p className="text-[11px] font-bold text-amber-400 mb-1.5 flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        היסטוריית הזמנות ומידע משויך שנשלח ל-Noa AI:
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {selectedCrmChat.contact.orderHistory.map((order) => (
                          <div key={order.id} className="bg-[#111b21] border border-[#2a3942] rounded-lg p-2 text-[11px] shrink-0 min-w-[200px]">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-white">{order.id}</span>
                              <span className="text-[9px] bg-[#00a884]/20 text-[#00a884] px-1.5 rounded">{order.status}</span>
                            </div>
                            <p className="text-[#8696a0] text-[10px]">{order.date}</p>
                            <p className="text-white font-medium mt-1 truncate">{order.items}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-[#111b21]">
                    {selectedCrmChat.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-lg text-xs max-w-[80%] ${
                          m.sender === 'user'
                            ? 'bg-[#202c33] text-white self-start'
                            : 'bg-[#005c4b] text-white self-end mr-auto'
                        }`}
                      >
                        <p className="font-semibold text-[10px] text-[#8696a0] mb-0.5">
                          {m.sender === 'user' ? selectedCrmChat.contact.name : 'נועה AI / מנגנון SabanOS'}
                        </p>
                        <p>{m.text}</p>
                        <p className="text-[9px] text-[#8696a0] text-left mt-1">{m.timestamp}</p>
                      </div>
                    ))}
                  </div>

                  {/* Operator Manual Override Box */}
                  <form onSubmit={handleSendOverride} className="p-3 bg-[#182229] border-t border-[#2a3942] flex items-center gap-2">
                    <input
                      type="text"
                      value={overrideText}
                      onChange={(e) => setOverrideText(e.target.value)}
                      placeholder="הקלד תגובה ידנית לעקיפת ה-AI (התערבות מנהל)..."
                      className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00a884]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] font-bold text-xs rounded-lg flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 transform rotate-180" />
                      שלח כנציג
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: System Prompt & KB Editor */}
          {activeTab === 'prompt' && (
            <div className="space-y-6">
              {/* Prompt Editor */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-3">
                <h3 className="text-sm font-bold flex items-center justify-between text-[#00a884]">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    הוראות מערכת ראשיות עבור Noa AI (System Prompt)
                  </span>
                  <button
                    onClick={handleSavePromptAndUrl}
                    className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] font-bold text-xs rounded-lg flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    שמור פרומפט
                  </button>
                </h3>
                <textarea
                  rows={5}
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg p-3 text-xs text-[#e9edef] font-mono focus:outline-none focus:border-[#00a884]"
                />
              </div>

              {/* Knowledge Base Table */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-[#00a884]">
                  <Database className="w-4 h-4" />
                  מאגר מידע ועובדות עסקיות (SabanOS KB)
                </h3>

                {/* Add KB Form */}
                <form onSubmit={handleAddKbItem} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#111b21] p-3 rounded-xl border border-[#2a3942]">
                  <input
                    type="text"
                    placeholder="קטגוריה (למשל: תפריט)"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-[#202c33] border border-[#2a3942] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00a884]"
                  />
                  <input
                    type="text"
                    required
                    placeholder="כותרת (למשל: מחיר עסקיות)*"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-[#202c33] border border-[#2a3942] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00a884]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="תוכן העובדה/המחיר*"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="flex-1 bg-[#202c33] border border-[#2a3942] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00a884]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-[#00a884] text-[#111b21] font-bold text-xs rounded-lg hover:bg-[#008f70] shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* KB List */}
                <div className="divide-y divide-[#2a3942] bg-[#111b21] rounded-xl border border-[#2a3942] overflow-hidden">
                  {knowledgeBase.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-[#00a884]/20 text-[#00a884] text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {item.category}
                          </span>
                          <span className="text-xs font-bold text-white">{item.title}</span>
                        </div>
                        <p className="text-xs text-[#8696a0]">{item.content}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleKbItem(item.id)}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                            item.isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {item.isEnabled ? 'פעיל' : 'מושהה'}
                        </button>
                        <button
                          onClick={() => handleDeleteKbItem(item.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hebrew WhatsApp Content Templates & Parser Showcase */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
                <div className="flex items-center justify-between border-b border-[#2a3942] pb-3">
                  <div className="flex items-center gap-2 text-[#00a884]">
                    <Sparkles className="w-5 h-5" />
                    <div>
                      <h3 className="text-sm font-bold text-white">ערכת תבניות WhatsApp ומנוע עיבוד תוכן בעברית</h3>
                      <p className="text-xs text-[#8696a0]">
                        תצוגה מקדימה לניתוח וסריקה של לינקים ל-Waze/Maps, אימוג'ים וטיפוגרפיית WhatsApp מקצועית
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-2.5 py-1 rounded-full font-bold border border-[#00a884]/30">
                    3 תבניות מוכנות
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {HEBREW_WHATSAPP_TEMPLATES.map((tpl) => (
                    <div key={tpl.id} className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{tpl.icon}</span>
                          <h4 className="text-xs font-bold text-white">{tpl.title}</h4>
                        </div>
                        <p className="text-[11px] text-[#8696a0] leading-relaxed">{tpl.description}</p>
                      </div>

                      {/* Rendered WhatsApp Preview Box */}
                      <div className="bg-[#005c4b]/30 p-3 rounded-lg border border-[#00a884]/30 text-xs text-[#e9edef] max-h-52 overflow-y-auto">
                        <FormattedMessage text={tpl.content} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Quick Replies */}
          {activeTab === 'quick_replies' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 border border-amber-500/30">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      ניהול תגובות מהירות (Quick Replies)
                      <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {(settings.quickReplies || DEFAULT_QUICK_REPLIES).length} תגובות מוגדרות
                      </span>
                    </h3>
                    <p className="text-xs text-[#8696a0] mt-1">
                      הגדר תשובות מוכנות מראש לשימוש מיידי בצ'אט בלחיצת כפתור או באמצעות הקלדת <code className="text-amber-300 font-mono">/</code> בתיבת הטקסט.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleResetQuickRepliesToDefault}
                  className="px-3.5 py-2 bg-[#182229] hover:bg-[#2a3942] text-[#e9edef] rounded-xl text-xs font-semibold border border-[#2a3942] transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="אפס לתגובות ברירת המחדל"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>אפס לתגובות ברירת מחדל</span>
                </button>
              </div>

              {/* Add New Quick Reply Form */}
              <form onSubmit={handleAddQuickReply} className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
                <h3 className="text-sm font-bold text-[#00a884] flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  הוספת תגובה מהירה חדשה
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[#8696a0] mb-1 font-medium">כותרת התגובה *</label>
                    <input
                      type="text"
                      value={newQrTitle}
                      onChange={(e) => setNewQrTitle(e.target.value)}
                      placeholder="לדוגמה: 📍 כתובת וניווט"
                      className="w-full px-3 py-2 bg-[#111b21] border border-[#2a3942] rounded-lg text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8696a0] mb-1 font-medium">קיצור דרך (Shortcut)</label>
                    <div className="relative">
                      <span className="absolute right-3 top-2 text-[#8696a0] font-mono text-xs">/</span>
                      <input
                        type="text"
                        value={newQrShortcut}
                        onChange={(e) => setNewQrShortcut(e.target.value)}
                        placeholder="מיקום"
                        className="w-full pr-7 pl-3 py-2 bg-[#111b21] border border-[#2a3942] rounded-lg text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884] font-mono dir-rtl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#8696a0] mb-1 font-medium">קטגוריה</label>
                    <input
                      type="text"
                      value={newQrCategory}
                      onChange={(e) => setNewQrCategory(e.target.value)}
                      placeholder="מיקומים / שירות / משלוחים"
                      className="w-full px-3 py-2 bg-[#111b21] border border-[#2a3942] rounded-lg text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#8696a0] mb-1 font-medium">תוכן ההודעה המלאה *</label>
                  <textarea
                    value={newQrText}
                    onChange={(e) => setNewQrText(e.target.value)}
                    placeholder="הקלד את ההודעה שתשלח... ניתן לשלב *הדגשה*, _נטוי_, ולינקים כגון https://waze.com/..."
                    rows={3}
                    className="w-full p-3 bg-[#111b21] border border-[#2a3942] rounded-lg text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-y"
                    required
                  />
                  <span className="text-[10px] text-[#8696a0] block mt-1">
                    טיפ: תומך בפורמט WhatsApp מלא - *טקסט מודגש*, _נטוי_, וקישורים לחיצים ל-Waze או Google Maps.
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>שמור תגובה מהירה</span>
                  </button>
                </div>
              </form>

              {/* Saved Quick Replies List */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
                <h3 className="text-sm font-bold text-[#e9edef] flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-amber-400" />
                  רשימת התגובות המהירות במערכת
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(settings.quickReplies || DEFAULT_QUICK_REPLIES).map((qr) => (
                    <div
                      key={qr.id}
                      className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] flex flex-col justify-between space-y-3 relative group hover:border-[#00a884]/60 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{qr.title}</span>
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              {qr.category && (
                                <span className="text-[10px] bg-[#2a3942] text-[#8696a0] px-2 py-0.5 rounded-full">
                                  {qr.category}
                                </span>
                              )}
                              {qr.shortcut && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                                  /{qr.shortcut}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopyQrText(qr.id, qr.text)}
                              className="p-1.5 rounded bg-[#182229] text-[#8696a0] hover:text-[#00a884] transition-colors cursor-pointer"
                              title="העתק טקסט"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuickReply(qr.id)}
                              className="p-1.5 rounded bg-[#182229] text-[#8696a0] hover:text-red-400 transition-colors cursor-pointer"
                              title="מחק תגובה מהירה"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Rendered WhatsApp Preview */}
                        <div className="bg-[#005c4b]/30 p-3 rounded-lg border border-[#00a884]/30 text-xs text-[#e9edef] max-h-40 overflow-y-auto">
                          <FormattedMessage text={qr.text} />
                        </div>
                      </div>

                      {copiedQrId === qr.id && (
                        <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 dir-rtl">
                          <CheckCircle className="w-3 h-3" />
                          <span>הטקסט הועתק ללוח!</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Business Hours & Blue Tick Read Receipts */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              {/* Blue Tick Read Receipts Toggle Card */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#53bdeb]/20 rounded-xl text-[#53bdeb]">
                      <CheckCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">אישורי קריאה (וי כחול / Blue Ticks)</h3>
                      <p className="text-xs text-[#8696a0]">
                        הצג או בטל סימון וי כחול כפול עבור הודעות שנשלחו ונקראו בצ'אט.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableBlueTicks ?? true}
                      onChange={(e) => onUpdateSettings({ ...settings, enableBlueTicks: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#111b21] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#111b21] rounded-lg border border-[#2a3942] text-xs">
                  <span className="text-[#8696a0]">תצוגה מקדימה של הודעה שנקראה בצ'אט:</span>
                  <div className="flex items-center gap-2 bg-[#005c4b] px-3 py-1.5 rounded-lg text-white">
                    <span>שלום! ההזמנה שלך אושרה מול המערכת.</span>
                    <span className="text-[10px] text-[#8696a0]">10:30</span>
                    <CheckCheck className={`w-4 h-4 ${(settings.enableBlueTicks ?? true) ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} />
                  </div>
                </div>
              </div>

              {/* Business Hours Settings Card */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-5">
                <div className="flex items-center justify-between border-b border-[#2a3942] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        שעות פעילות למענה Noa AI (Business Hours)
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          isCurrentlyBusinessHours
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isCurrentlyBusinessHours ? '🟢 כרגע בתוך שעות הפעילות' : '🔴 כרגע מחוץ לשעות הפעילות'}
                        </span>
                      </h3>
                      <p className="text-xs text-[#8696a0]">
                        הגדר באילו שעות וימים Noa AI רשאית להשיב אוטומטית ללקוחות במערכת.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.businessHoursEnabled ?? false}
                      onChange={(e) => onUpdateSettings({ ...settings, businessHoursEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#111b21] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                  </label>
                </div>

                {/* Time Range Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#111b21] p-3.5 rounded-xl border border-[#2a3942] space-y-1.5">
                    <label className="text-xs font-bold text-[#8696a0] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00a884]" />
                      שעת התחלת מענה (Start Time)
                    </label>
                    <input
                      type="time"
                      value={settings.businessHoursStart || '08:00'}
                      onChange={(e) => onUpdateSettings({ ...settings, businessHoursStart: e.target.value })}
                      className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00a884]"
                    />
                  </div>

                  <div className="bg-[#111b21] p-3.5 rounded-xl border border-[#2a3942] space-y-1.5">
                    <label className="text-xs font-bold text-[#8696a0] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00a884]" />
                      שעת סיום מענה (End Time)
                    </label>
                    <input
                      type="time"
                      value={settings.businessHoursEnd || '18:00'}
                      onChange={(e) => onUpdateSettings({ ...settings, businessHoursEnd: e.target.value })}
                      className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00a884]"
                    />
                  </div>
                </div>

                {/* Active Days Selector */}
                <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-2.5">
                  <label className="text-xs font-bold text-[#8696a0] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#00a884]" />
                    ימי מענה פעילים בשבוע:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 0, label: "יום א'" },
                      { id: 1, label: "יום ב'" },
                      { id: 2, label: "יום ג'" },
                      { id: 3, label: "יום ד'" },
                      { id: 4, label: "יום ה'" },
                      { id: 5, label: "יום ו'" },
                      { id: 6, label: "שבת" },
                    ].map((day) => {
                      const currentDays = settings.businessDays ?? [0, 1, 2, 3, 4];
                      const isSelected = currentDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            const updatedDays = isSelected
                              ? currentDays.filter((d) => d !== day.id)
                              : [...currentDays, day.id];
                            onUpdateSettings({ ...settings, businessDays: updatedDays });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-[#00a884] text-[#111b21] shadow-xs'
                              : 'bg-[#202c33] text-[#8696a0] hover:text-white border border-[#2a3942]'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Outside Hours Mode Options */}
                <div className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-3">
                  <label className="text-xs font-bold text-[#8696a0] flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-purple-400" />
                    התנהגות Noa AI מחוץ לשעות הפעילות:
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-[#202c33] rounded-lg border border-[#2a3942] cursor-pointer hover:border-[#00a884]/50">
                      <input
                        type="radio"
                        name="outsideHoursMode"
                        checked={(settings.outsideHoursMode ?? 'out_of_office_msg') === 'out_of_office_msg'}
                        onChange={() => onUpdateSettings({ ...settings, outsideHoursMode: 'out_of_office_msg' })}
                        className="accent-[#00a884] w-4 h-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">שלח הודעת "מחוץ לשעות הפעילות" אוטומטית</p>
                        <p className="text-[11px] text-[#8696a0]">מענה מנומס מיידי עם שעות הפעילות שנקבעו</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-[#202c33] rounded-lg border border-[#2a3942] cursor-pointer hover:border-[#00a884]/50">
                      <input
                        type="radio"
                        name="outsideHoursMode"
                        checked={settings.outsideHoursMode === 'silent'}
                        onChange={() => onUpdateSettings({ ...settings, outsideHoursMode: 'silent' })}
                        className="accent-[#00a884] w-4 h-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">מצב שקט (ללא מענה אוטומטי מחוץ לשעות)</p>
                        <p className="text-[11px] text-[#8696a0]">Noa AI לא תשיב להודעות נכנסות מחוץ לשעות הפעילות</p>
                      </div>
                    </label>
                  </div>

                  {(settings.outsideHoursMode ?? 'out_of_office_msg') === 'out_of_office_msg' && (
                    <div className="mt-3 space-y-1.5">
                      <label className="text-[11px] font-semibold text-[#8696a0]">טקסט הודעת מחוץ לשעות הפעילות:</label>
                      <textarea
                        rows={3}
                        value={settings.outsideHoursMessage ?? 'שלום! פנית אלינו מחוץ לשעות הפעילות (08:00 - 18:00). הודעתך נקלטה במערכת SabanOS ונשוב אליך בהקדם בשעות הפעילות! ⏰'}
                        onChange={(e) => onUpdateSettings({ ...settings, outsideHoursMessage: e.target.value })}
                        className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00a884]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Google Apps Script Webhook Monitor */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
                <h3 className="text-sm font-bold text-[#00a884] flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  הגדרת כתובת ה-Web App של Google Apps Script
                </h3>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localWebAppUrl}
                    onChange={(e) => setLocalWebAppUrl(e.target.value)}
                    className="flex-1 bg-[#111b21] border border-[#2a3942] rounded-lg p-2.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-[#00a884] dir-ltr"
                  />
                  <button
                    onClick={handleRunTestWebhook}
                    disabled={isTestingWebhook}
                    className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin' : ''}`} />
                    בדוק חיבור כעת
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 bg-[#111b21] rounded-lg border border-[#2a3942] text-xs font-semibold text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    תוצאת בדיקה: {testResult}
                  </div>
                )}
              </div>

              {/* Code.js Master Google Apps Script Code Viewer & Download */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      קוד המקור השלם של Google Apps Script (Code.js)
                    </h3>
                    <p className="text-xs text-[#8696a0]">
                      קובץ הקוד המלא והמוכן להדבקה ב-Google Apps Script (Gemini Studio Backend)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        fetch('/Code.js')
                          .then((res) => res.text())
                          .then((text) => {
                            navigator.clipboard.writeText(text);
                            alert('קוד Code.js הועתק ללוח בהצלחה!');
                          })
                          .catch(() => alert('שגיאה בהעתקת הקוד'));
                      }}
                      className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      העתק את Code.js
                    </button>
                    <a
                      href="/Code.js"
                      download="Code.js"
                      className="px-3 py-1.5 bg-[#182229] hover:bg-[#2a3942] text-[#e9edef] font-bold text-xs rounded-lg flex items-center gap-1.5 border border-[#2a3942] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00a884]" />
                      הורד קובץ
                    </a>
                  </div>
                </div>

                <div className="bg-[#111b21] p-3 rounded-xl border border-[#2a3942] text-xs font-mono text-emerald-300 max-h-60 overflow-y-auto whitespace-pre font-mono dir-ltr">
                  {`/**
 * SabanOS - Google Apps Script Master Backend (Code.js)
 * Includes doPost(e), generateNoaResponse(), sendWhatsAppMessage(),
 * setupDatabaseAndDashboard(), updateCustomerRecord(), logConversation()
 */`}
                </div>
              </div>

              {/* Webhook Logs Viewer */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-3">
                <h3 className="text-sm font-bold text-[#8696a0]">
                  יומן שידורים וקריאות Webhook בזמן אמת ({webhookLogs.length})
                </h3>

                <div className="bg-[#111b21] p-3 rounded-xl border border-[#2a3942] font-mono text-xs max-h-72 overflow-y-auto space-y-2">
                  {webhookLogs.length === 0 ? (
                    <p className="text-[#8696a0] text-center py-4">אין קריאות Webhook רשומות כרגע</p>
                  ) : (
                    webhookLogs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-[#182229] rounded-lg border border-[#2a3942] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-bold">{log.timestamp}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            HTTP {log.responseCode}
                          </span>
                        </div>
                        <p className="text-[#8696a0] text-[10px] truncate dir-ltr">{log.url}</p>
                        <p className="text-[#d1d7db] text-[11px] truncate">
                          Payload: {JSON.stringify(log.payload)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Settings & Audio */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Auto-Archiving Inactive Chats Settings Card */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#00a884]/20 rounded-xl text-[#00a884]">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        ארכוב אוטומטי של שיחות לא פעילות (Auto-Archive Inactive Chats)
                        <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-2 py-0.5 rounded-full font-bold">
                          {chats.filter((c) => c.contact.isArchived).length} שיחות בארכיון
                        </span>
                      </h3>
                      <p className="text-xs text-[#8696a0]">
                        מעביר אוטומטית לארכיון שיחות שלא הייתה בהן הודעה חדשה למשך מספר ימים מוגדר.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoArchiveEnabled ?? false}
                      onChange={(e) => onUpdateSettings({ ...settings, autoArchiveEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#111b21] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#2a3942]">
                  <div className="bg-[#111b21] p-3.5 rounded-xl border border-[#2a3942] space-y-1.5">
                    <label className="text-xs font-bold text-[#8696a0] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00a884]" />
                      מספר ימי חוסר פעילות לארכוב (ברירת מחדל: 7 ימים)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={settings.autoArchiveDays ?? 7}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          autoArchiveDays: Math.max(1, parseInt(e.target.value) || 7),
                        })
                      }
                      className="w-full bg-[#202c33] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00a884]"
                    />
                  </div>

                  <div className="bg-[#111b21] p-3.5 rounded-xl border border-[#2a3942] flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-xs font-bold text-[#8696a0] block mb-1">הפעלה ידנית מידית</span>
                      <p className="text-[11px] text-[#8696a0]">
                        סרוק שיחות לא פעילות לאחרונה והעבר אותן לארכיון לפי הגדרת הימים שנקבעה.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onRunAutoArchive) {
                          onRunAutoArchive();
                          alert('בדיקת ארכוב אוטומטי הופעלה בהצלחה!');
                        }
                      }}
                      className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Archive className="w-4 h-4" />
                      <span>הפעל ארכוב אוטומטי כעת</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
                <h3 className="text-sm font-bold text-[#00a884] flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  התראות שמע וצלילים
                </h3>

                <div className="flex items-center justify-between p-3 bg-[#111b21] rounded-lg border border-[#2a3942]">
                  <div>
                    <p className="text-xs font-semibold">צליל התראות וואטסאפ בהודעות נכנסות</p>
                    <p className="text-[11px] text-[#8696a0]">משמיע צליל צפצוף (Ding) ריאליסטי בתגובה מ-Noa AI</p>
                  </div>
                  <button
                    onClick={playWhatsAppIncomingSound}
                    className="px-4 py-2 bg-[#00a884] text-[#111b21] font-bold text-xs rounded-lg hover:bg-[#008f70] flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    נגן צליל וואטסאפ
                  </button>
                </div>
              </div>

              {/* Data Reset */}
              <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-3">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  איפוס נתונים
                </h3>
                <p className="text-xs text-[#8696a0]">
                  איפוס הזיכרון המקומי והחזרת השיחות, ההגדרות ומאגר הידע למצב ברירת המחדל הראשוני.
                </p>
                <button
                  onClick={onResetData}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs font-bold transition-colors"
                >
                  אפס את כל הנתונים במערכת
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
