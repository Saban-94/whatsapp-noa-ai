import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCheck,
  Eye,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock,
  Plus,
  Send,
  Sparkles,
  Filter,
  Search,
  Truck,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  Monitor,
  Check,
  ExternalLink,
} from 'lucide-react';
import { StagedOrder } from '../../types';

export interface DeviceViewLog {
  id: string;
  viewedAt: string;
  deviceOwner: string;
  deviceModel: string; // e.g. 'iPhone 15 Pro', 'Samsung Galaxy S24 Ultra'
  osType: 'iOS' | 'Android' | 'Windows' | 'macOS' | string;
  browser: string; // e.g. 'Safari Mobile 17.4', 'Chrome Mobile 122.0'
  ip: string;
  isMobile: boolean;
  orderNumber?: string;
  customerName?: string;
  updateTitle?: string;
}

export interface ChatUpdateCard {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  driverName: string;
  status: string;
  updateType: 'NEW_ORDER' | 'STATUS_CHANGE' | 'DRIVER_ASSIGNED' | 'ADDRESS_UPDATE';
  title: string;
  formattedMessageText: string;
  timestamp: string;
  createdAt: string;
  isUnread: boolean;
  viewCount: number;
  lastViewedBy?: string;
  viewLogs: DeviceViewLog[];
}

interface DispatchChatUpdatesTabProps {
  stagedOrders?: StagedOrder[];
  onUpdateOrderStatus?: (orderId: string, newStatus: StagedOrder['status']) => void;
}

export const DispatchChatUpdatesTab: React.FC<DispatchChatUpdatesTabProps> = ({
  stagedOrders = [],
  onUpdateOrderStatus,
}) => {
  const [updates, setUpdates] = useState<ChatUpdateCard[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'new' | 'status'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin Security Controls
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(true); // default true for admin user
  const [selectedLogCard, setSelectedLogCard] = useState<ChatUpdateCard | null>(null);
  const [adminDeviceFilter, setAdminDeviceFilter] = useState<'all' | 'iphone' | 'samsung' | 'desktop'>('all');

  // Manual New Event Modal State
  const [isAddEventOpen, setIsAddEventOpen] = useState<boolean>(false);
  const [newOrderNum, setNewOrderNum] = useState<string>('6214850');
  const [newCustName, setNewCustName] = useState<string>('קבלן הוד השרון בע"מ');
  const [newCustPhone, setNewCustPhone] = useState<string>('050-9988776');
  const [newAddress, setNewAddress] = useState<string>('סמטת הדרים 12, הוד השרון');
  const [newDriver, setNewDriver] = useState<string>('עלי - משאית 01 (מנוף)');
  const [newStatus, setNewStatus] = useState<string>('יצא לדרך');
  const [newMsgText, setNewMsgText] = useState<string>(
    '*הודעת עדכון סידור עבודה - SabanOS*\n📦 *הזמנה #6214850*\n👤 *לקוח:* קבלן הוד השרון\n📍 *כתובת אספקה:* סמטת הדרים 12, הוד השרון\n🚚 *נהג:* עלי - משאית 01 (מנוף)\n⚡ *סטטוס:* יצא לדרך 🚚\n⏰ *משוער הגעה:* 10:15'
  );
  const [isPosting, setIsPosting] = useState<boolean>(false);

  // Fetch updates from API
  const fetchUpdates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dispatch/chat-updates');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.updates)) {
          setUpdates(data.updates);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch dispatch chat updates:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 8000);
    return () => clearInterval(interval);
  }, []);

  // Send Read Receipt & Device Info when user views an update or clicks "Mark as Read"
  const handleMarkAsRead = async (updateId?: string) => {
    try {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const deviceOwner = screenWidth < 768 ? 'נייד מובייל (נהג/מנהל)' : 'מחשב משרדי - אדמין';

      const res = await fetch('/api/dispatch/read-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateId,
          userAgent,
          deviceOwner,
          screenWidth,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          fetchUpdates();
        }
      }
    } catch (err) {
      console.warn('Read receipt send error:', err);
    }
  };

  // Submit New Order Update Card
  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      const res = await fetch('/api/dispatch/chat-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: newOrderNum,
          customerName: newCustName,
          customerPhone: newCustPhone,
          address: newAddress,
          driverName: newDriver,
          status: newStatus,
          updateType: 'STATUS_CHANGE',
          customText: newMsgText,
        }),
      });

      if (res.ok) {
        setIsAddEventOpen(false);
        fetchUpdates();
      }
    } catch (err) {
      console.error('Error posting update:', err);
    } finally {
      setIsPosting(false);
    }
  };

  // Quick Status Change on Card
  const handleQuickStatusChange = async (card: ChatUpdateCard, status: string) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(card.orderNumber, status as any);
    }

    try {
      await fetch('/api/dispatch/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: card.orderNumber,
          status,
          driverName: card.driverName,
        }),
      });
      fetchUpdates();
    } catch (e) {
      console.warn('Status change sync error:', e);
    }
  };

  // Filter cards
  const filteredUpdates = updates.filter((u) => {
    if (filterType === 'unread' && !u.isUnread) return false;
    if (filterType === 'new' && u.updateType !== 'NEW_ORDER') return false;
    if (filterType === 'status' && u.updateType !== 'STATUS_CHANGE') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = u.orderNumber.toLowerCase().includes(q);
      const matchCust = u.customerName.toLowerCase().includes(q);
      const matchAddr = u.address.toLowerCase().includes(q);
      const matchDriver = u.driverName.toLowerCase().includes(q);
      return matchNum || matchCust || matchAddr || matchDriver;
    }
    return true;
  });

  // Admin Logs flattened list
  const allAdminLogs: DeviceViewLog[] = [];
  updates.forEach((u) => {
    if (Array.isArray(u.viewLogs)) {
      u.viewLogs.forEach((vl) => {
        allAdminLogs.push({
          ...vl,
          orderNumber: u.orderNumber,
          customerName: u.customerName,
          updateTitle: u.title,
        });
      });
    }
  });

  const filteredAdminLogs = allAdminLogs.filter((log) => {
    if (adminDeviceFilter === 'iphone' && !/iphone/i.test(log.deviceModel)) return false;
    if (adminDeviceFilter === 'samsung' && !/samsung/i.test(log.deviceModel)) return false;
    if (adminDeviceFilter === 'desktop' && log.isMobile) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#0b141a] text-[#e9edef] dir-rtl font-sans p-4 space-y-4 overflow-y-auto">
      
      {/* Top Header & Alert Banner */}
      <div className="bg-[#111b21] p-4 rounded-2xl border border-[#222d34] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="relative p-3 bg-[#00a884]/20 rounded-2xl text-[#00a884] border border-[#00a884]/30">
            <MessageSquare className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow animate-pulse">
                {unreadCount} חדש
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">
                לשונית עדכונים מהסידור (WhatsApp Live Feed)
              </h2>
              {unreadCount > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  התראות חדשות לא נקראו ({unreadCount})
                </span>
              )}
            </div>
            <p className="text-xs text-[#8696a0] mt-0.5">
              כרטיסי הזמנה מתוך צ'אט כמו WhatsApp בלייב, ניטור קריאה לפי סמארטפונים (iPhone / סמסונג), ספירת צפיות ולוגי מנהל.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleMarkAsRead()}
            className="px-3.5 py-2 bg-[#202c33] hover:bg-[#2a3942] text-xs font-bold text-[#00a884] border border-[#222d34] rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            title="סמן את כל ההודעות כנקראו בווצאפ (Double Blue Ticks)"
          >
            <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
            <span>סמן הכל כנקרא (✓✓)</span>
          </button>

          <button
            onClick={() => setIsAddEventOpen(true)}
            className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>שדר עדכון / הזמנה חדשה</span>
          </button>

          <button
            onClick={fetchUpdates}
            className="p-2.5 bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white rounded-xl border border-[#222d34] cursor-pointer"
            title="רענן עדכונים"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-[#111b21] p-3 rounded-2xl border border-[#222d34] flex flex-col md:flex-row items-center justify-between gap-3 shadow">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8696a0] absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש לפי מספר הזמנה, שם לקוח, כתובת או נהג..."
            className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-[#8696a0] focus:border-[#00a884] outline-none"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#00a884] text-slate-950 font-black'
                : 'bg-[#202c33] text-[#8696a0] hover:text-white border border-[#2a3942]'
            }`}
          >
            הכל ({updates.length})
          </button>

          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === 'unread'
                ? 'bg-rose-500 text-white font-black'
                : 'bg-[#202c33] text-[#8696a0] hover:text-white border border-[#2a3942]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
            לא נקרא ({unreadCount})
          </button>

          <button
            onClick={() => setFilterType('new')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'new'
                ? 'bg-[#00a884] text-slate-950 font-black'
                : 'bg-[#202c33] text-[#8696a0] hover:text-white border border-[#2a3942]'
            }`}
          >
            הזמנות חדשות
          </button>

          <button
            onClick={() => setFilterType('status')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'status'
                ? 'bg-[#00a884] text-slate-950 font-black'
                : 'bg-[#202c33] text-[#8696a0] hover:text-white border border-[#2a3942]'
            }`}
          >
            עדכוני סטטוס
          </button>
        </div>
      </div>

      {/* Main Grid: Live Feed (Left) & Admin Mobile Audit Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Live WhatsApp Order Cards Feed (8 Cols on Desktop) */}
        <div className="lg:col-span-8 space-y-3">
          {filteredUpdates.length === 0 ? (
            <div className="bg-[#111b21] p-12 rounded-2xl border border-[#222d34] text-center text-[#8696a0] space-y-3">
              <MessageSquare className="w-12 h-12 mx-auto text-[#00a884]/40" />
              <p className="text-sm font-bold text-white">אין עדכוני סידור להצגה התואמים את המסנן</p>
              <p className="text-xs">לחץ על "שדר עדכון / הזמנה חדשה" כדי ליצור אירוע צ'אט חדש בלייב.</p>
            </div>
          ) : (
            filteredUpdates.map((card) => {
              const isUnread = card.isUnread;

              return (
                <div
                  key={card.id}
                  onClick={() => handleMarkAsRead(card.id)}
                  className={`bg-[#111b21] rounded-2xl p-4 border transition-all duration-300 relative shadow-xl ${
                    isUnread
                      ? 'border-[#00a884] shadow-[0_0_20px_rgba(0,168,132,0.25)] ring-1 ring-[#00a884]/50'
                      : 'border-[#222d34] hover:border-[#374248]'
                  }`}
                >
                  {/* Glowing Pulse Ribbon for Unread Updates */}
                  {isUnread && (
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full shadow flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3 text-slate-900" />
                      התראה חדשה לא נקראה!
                    </div>
                  )}

                  {/* WhatsApp Card Header Bar */}
                  <div className="flex items-center justify-between border-b border-[#222d34] pb-2.5 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884]">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {card.title}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              card.status === 'יצא לדרך'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : card.status === 'סופק'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            }`}
                          >
                            {card.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8696a0] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#00a884]" />
                          <span>נשלח בשידור חי • {card.timestamp}</span>
                        </p>
                      </div>
                    </div>

                    {/* WhatsApp Double Blue Ticks / View Counter */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-[#8696a0] bg-[#202c33] px-2.5 py-1 rounded-xl border border-[#2a3942]">
                        <Eye className="w-3.5 h-3.5 text-[#00a884]" />
                        <span className="font-extrabold text-white">{card.viewCount || 0}</span>
                        <span>צפיות</span>
                      </div>

                      <div title={isUnread ? 'לא נקרא (כפול אפור)' : 'נקרא בווצאפ (כפול כחול)'}>
                        <CheckCheck
                          className={`w-5 h-5 ${
                            isUnread ? 'text-[#8696a0]' : 'text-[#53bdeb] drop-shadow-[0_0_8px_rgba(83,189,235,0.6)]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Chat Speech Bubble Container */}
                  <div className="bg-[#1f2c34] p-3.5 rounded-2xl border border-[#2a3942] relative mb-3">
                    <p className="text-xs text-[#e9edef] whitespace-pre-wrap leading-relaxed font-sans">
                      {card.formattedMessageText}
                    </p>
                  </div>

                  {/* Quick Status Action Controls & Mobile Device Info */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-[#222d34]">
                    
                    {/* Device Last View Tracker Tag */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0]">
                      <Smartphone className="w-3.5 h-3.5 text-[#00a884]" />
                      <span>נצפה לאחרונה:</span>
                      <span className="text-white font-bold truncate max-w-[200px]">
                        {card.lastViewedBy || 'טרם נצפה במכשיר נייד'}
                      </span>
                    </div>

                    {/* Quick Status Change Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(card, 'יצא לדרך');
                        }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/40 flex items-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3 h-3" />
                        <span>יצא לדרך 🚚</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(card, 'סופק');
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-500/40 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>סופק ✅</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogCard(card);
                        }}
                        className="px-2.5 py-1 bg-[#202c33] hover:bg-[#2a3942] text-xs font-bold text-[#00a884] rounded-lg border border-[#2a3942] flex items-center gap-1 cursor-pointer"
                        title="צפה בלוג מכשירים מפורט (Admin)"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>לוג מכשירים ({card.viewLogs?.length || 0})</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Admin Mobile Audit Inspector Panel (4 Cols on Desktop - Admin Only) */}
        <div className="lg:col-span-4 bg-[#111b21] rounded-2xl border border-[#222d34] p-4 flex flex-col h-full shadow-xl">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#222d34] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00a884]" />
              <h3 className="text-xs font-black text-white">
                לוגי מנהל - זיהוי מכשירים וצפיות במובייל
              </h3>
            </div>
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
              למנהל בלבד 🔒
            </span>
          </div>

          <p className="text-[11px] text-[#8696a0] mb-3">
            ניטור בזמן אמת של צפיות בהודעות סידור, זיהוי דגמי אייפון/סמסונג, דפדפנים וזמן קריאה.
          </p>

          {/* Device Filter Buttons */}
          <div className="grid grid-cols-4 gap-1 mb-3 bg-[#202c33] p-1 rounded-xl border border-[#2a3942]">
            <button
              onClick={() => setAdminDeviceFilter('all')}
              className={`py-1 text-[10px] font-bold rounded-lg text-center cursor-pointer ${
                adminDeviceFilter === 'all'
                  ? 'bg-[#00a884] text-slate-950 font-black'
                  : 'text-[#8696a0] hover:text-white'
              }`}
            >
              הכל ({allAdminLogs.length})
            </button>
            <button
              onClick={() => setAdminDeviceFilter('iphone')}
              className={`py-1 text-[10px] font-bold rounded-lg text-center cursor-pointer ${
                adminDeviceFilter === 'iphone'
                  ? 'bg-[#00a884] text-slate-950 font-black'
                  : 'text-[#8696a0] hover:text-white'
              }`}
            >
              iPhone 
            </button>
            <button
              onClick={() => setAdminDeviceFilter('samsung')}
              className={`py-1 text-[10px] font-bold rounded-lg text-center cursor-pointer ${
                adminDeviceFilter === 'samsung'
                  ? 'bg-[#00a884] text-slate-950 font-black'
                  : 'text-[#8696a0] hover:text-white'
              }`}
            >
              Samsung 📱
            </button>
            <button
              onClick={() => setAdminDeviceFilter('desktop')}
              className={`py-1 text-[10px] font-bold rounded-lg text-center cursor-pointer ${
                adminDeviceFilter === 'desktop'
                  ? 'bg-[#00a884] text-slate-950 font-black'
                  : 'text-[#8696a0] hover:text-white'
              }`}
            >
              Desktop 💻
            </button>
          </div>

          {/* Logs List Container */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {filteredAdminLogs.length === 0 ? (
              <div className="p-8 text-center text-[#8696a0] text-xs">
                אין לוגי צפייה במכשירים המתאימים לסנן
              </div>
            ) : (
              filteredAdminLogs.map((log) => {
                const isIphone = /iphone/i.test(log.deviceModel);
                const isSamsung = /samsung/i.test(log.deviceModel);

                return (
                  <div
                    key={log.id}
                    className="bg-[#182229] p-2.5 rounded-xl border border-[#2a3942] space-y-1 hover:border-[#00a884]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {isIphone ? (
                          <span className="text-sky-400 font-extrabold"> iPhone</span>
                        ) : isSamsung ? (
                          <span className="text-emerald-400 font-extrabold">📱 Samsung</span>
                        ) : (
                          <Monitor className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{log.deviceOwner}</span>
                      </div>
                      <span className="text-[10px] text-[#8696a0] font-mono">{log.viewedAt}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8696a0]">
                      <span className="truncate max-w-[150px]">{log.deviceModel}</span>
                      <span className="text-emerald-400 font-mono">{log.browser}</span>
                    </div>

                    {log.orderNumber && (
                      <div className="text-[10px] text-[#00a884] font-bold pt-0.5 border-t border-[#2a3942] flex items-center justify-between">
                        <span>הזמנה #{log.orderNumber}</span>
                        <span className="text-white font-normal truncate max-w-[120px]">{log.customerName}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Add New Order Update Card Event */}
      {isAddEventOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-[#e9edef] dir-rtl">
          <div className="bg-[#111b21] w-full max-w-lg rounded-2xl border border-[#2a3942] p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#222d34] pb-3">
              <div className="flex items-center gap-2 text-[#00a884]">
                <Plus className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">
                  שדור עדכון / כרטיס הזמנה חדש לסידור
                </h3>
              </div>
              <button
                onClick={() => setIsAddEventOpen(false)}
                className="text-[#8696a0] hover:text-white text-xs font-bold"
              >
                סגור ✕
              </button>
            </div>

            <form onSubmit={handleCreateUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#8696a0] mb-1">1. מספר הזמנה</label>
                  <input
                    type="text"
                    value={newOrderNum}
                    onChange={(e) => setNewOrderNum(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#00a884] outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8696a0] mb-1">2. שם הלקוח</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#00a884] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#8696a0] mb-1">3. כתובת אספקה</label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#00a884] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8696a0] mb-1">4. שיוך נהג</label>
                  <input
                    type="text"
                    value={newDriver}
                    onChange={(e) => setNewDriver(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#00a884] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">5. סטטוס הובלה</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#00a884] outline-none cursor-pointer"
                >
                  <option value="מאושר">מאושר (נקלט ב-SabanOS)</option>
                  <option value="יצא לדרך">יצא לדרך 🚚</option>
                  <option value="סופק">סופק ✅</option>
                  <option value="חורג">חורג ⚠️</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#8696a0] mb-1">6. טקסט הודעת WhatsApp מפורט</label>
                <textarea
                  rows={4}
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl p-2.5 text-xs text-white focus:border-[#00a884] outline-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#222d34]">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-4 py-2 bg-[#202c33] text-xs text-[#8696a0] hover:text-white rounded-xl"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="px-5 py-2 bg-[#00a884] hover:bg-[#008f70] text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>שדר כרטיס עדכון</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Device Audit Logs for specific Order Card */}
      {selectedLogCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-[#e9edef] dir-rtl">
          <div className="bg-[#111b21] w-full max-w-2xl rounded-2xl border border-[#2a3942] p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#222d34] pb-3">
              <div className="flex items-center gap-2 text-[#00a884]">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">
                  לוגי צפייה במובייל למנהל בלבד - הזמנה #{selectedLogCard.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogCard(null)}
                className="text-[#8696a0] hover:text-white text-xs font-bold cursor-pointer"
              >
                סגור ✕
              </button>
            </div>

            <div className="bg-[#1f2c34] p-3 rounded-xl border border-[#2a3942] text-xs space-y-1">
              <p className="font-bold text-white">{selectedLogCard.title}</p>
              <p className="text-[#8696a0]">לקוח: {selectedLogCard.customerName} • כתובת: {selectedLogCard.address}</p>
              <p className="text-[#00a884] font-extrabold">סה"כ צפיות מאומתות במכשירים: {selectedLogCard.viewCount}</p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {selectedLogCard.viewLogs?.length === 0 ? (
                <p className="text-center text-xs text-[#8696a0] p-6">טרם נרשמו צפיות במכשיר נייד עבור עדכון זה</p>
              ) : (
                selectedLogCard.viewLogs.map((log) => (
                  <div key={log.id} className="bg-[#202c33] p-3 rounded-xl border border-[#2a3942] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-white flex items-center gap-2">
                        <span>{log.deviceOwner}</span>
                        <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-2 py-0.5 rounded-full font-mono">
                          {log.deviceModel}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8696a0] mt-0.5">
                        דפדפן: {log.browser} • IP: {log.ip}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{log.viewedAt}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#222d34]">
              <button
                onClick={() => setSelectedLogCard(null)}
                className="px-4 py-1.5 bg-[#00a884] text-slate-950 font-bold text-xs rounded-xl"
              >
                אישור
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
