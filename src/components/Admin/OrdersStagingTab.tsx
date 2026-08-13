import React, { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle,
  Truck,
  PackageCheck,
  Search,
  RefreshCw,
  Plus,
  Send,
  AlertCircle,
  Clock,
  Phone,
  User,
  Zap,
  MapPin,
  ShieldCheck,
  Calendar,
  Share2,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  XCircle,
  Filter,
  Sparkles,
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Table,
  LayoutGrid,
  Download,
  BarChart2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StagedOrder, StagedOrderStatus, NormalizedOrderItem } from '../../types';
import { playNotificationSound } from '../../utils/notificationService';
import { exportOrdersToCSV } from '../../utils/csvExporter';
import { OrdersAnalyticsDashboard } from './OrdersAnalyticsDashboard';

interface OrdersStagingTabProps {
  stagedOrders?: StagedOrder[];
  onAddOrder?: (newOrder: StagedOrder) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: StagedOrderStatus) => void;
  onSimulateListenerEvent?: (phone: string, name: string, message: string) => Promise<void>;
}

export const DRIVER_PRESETS = [
  'עלי - משאית מנוף 1',
  'חכמת - משאית מנוף 2',
  'אבי ברגמן - משאית מנוף 12',
  'יוסי כהן - מערבל 4',
  'סלמאן - משאית הייאב',
  'נהג סבן מנוף',
  'נהג חיצוני / קבלן משנה',
  'טרם שובץ (להקצאה)',
];

export const STATUS_LIFECYCLE: { key: StagedOrderStatus; label: string; color: string; bg: string; border: string; icon: any }[] = [
  { key: 'נקלט ב-SabanOS', label: 'נקלט במערכת', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Clock },
  { key: 'בטיפול לוגיסטי', label: 'בטיפול / שובץ', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: RefreshCw },
  { key: 'יצא לדרך', label: 'יצא להובלה', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Truck },
  { key: 'סופק', label: 'סופק', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle },
  { key: 'לא סופק', label: 'לא סופק (לדוח בוקר)', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: AlertTriangle },
];

export const INITIAL_MOCK_STAGED_ORDERS: StagedOrder[] = [
  {
    id: 'ord_6214582',
    orderNumber: '6214582',
    ingestionDate: '2026-07-30 05:37:47',
    customerName: 'וגשל דאו(519205)',
    customerPhone: '052-5192050',
    warehouse: '🏭 4(החרש)',
    address: 'בורוכוב 28, תל אביב',
    rawItemsText: `1. 📦 מק"ט: 10015 | בטון מהיר מוכן 25 ק"ג | כמות: 16
2. 📦 מק"ט: 11500 | חול שק | כמות: 140
3. 📦 מק"ט: 11501 | חול שק גדול | כמות: 1
4. 📦 מק"ט: 14603 | פלסטומר AD603 אפור 25 ק"ג | כמות: 12
5. 📦 מק"ט: 818070 | הובלה ללא פריקה תל אביב מרכז | כמות: 1
6. 📦 מק"ט: 60002 | שק גדול פקדון | כמות: 1
7. 📦 מק"ט: 60060 | משטח סבן פקדון | כמות: 3`,
    rawMessage: "בטון מהיר, חול שק, פלסטומר AD603, הובלה ללא פריקה תל אביב",
    noaResponse: "נועה AI: הזמנת הובלה ללא פריקה – פטור מלא מפקדונות בלות ומשטחים",
    baleDeposit: 'ℹ️ פטור (הובלה ללא פריקה)',
    palletDeposit: 'ℹ️ פטור (הובלה ללא פריקה)',
    status: 'מאושר',
    result: 'תקין',
    totalPrice: 0,
    verificationDate: '2026-07-30',
    deliveryTime: '08:00',
    noaInsights: 'נועה AI: הזמנת הובלה ללא פריקה – פטור מלא מפקדונות בלות ומשטחים',
    routeVerification: 'תקין (24.1 ק"מ (29 דקות))',
    syncStatus: 'סונכרן לסידור עבודה 🟢',
    driverName: 'עלי - משאית מנוף 1',
    sentToWhatsapp: true,
    createdAt: '05:37:47',
    items: [
      { sku: '10015', name: 'בטון מהיר מוכן 25 ק"ג', quantity: 16, unit: 'שק' },
      { sku: '11500', name: 'חול שק', quantity: 140, unit: 'שק' },
      { sku: '11501', name: 'חול שק גדול', quantity: 1, unit: 'שק' },
      { sku: '14603', name: 'פלסטומר AD603 אפור 25 ק"ג', quantity: 12, unit: 'שק' },
      { sku: '818070', name: 'הובלה ללא פריקה תל אביב מרכז', quantity: 1, unit: 'הובלה' },
      { sku: '60002', name: 'שק גדול פקדון', quantity: 1, unit: 'יח' },
      { sku: '60060', name: 'משטח סבן פקדון', quantity: 3, unit: 'יח' },
    ],
  },
];

export const OrdersStagingTab: React.FC<OrdersStagingTabProps> = ({
  stagedOrders,
  onUpdateOrderStatus,
  onSimulateListenerEvent,
}) => {
  const [orders, setOrders] = useState<StagedOrder[]>(
    stagedOrders && stagedOrders.length > 0 ? stagedOrders : INITIAL_MOCK_STAGED_ORDERS
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [driverFilter, setDriverFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simPhone, setSimPhone] = useState('054-1234567');
  const [simName, setSimName] = useState('ישראל ישראלי - קבלן');
  const [simMessage, setSimMessage] = useState('3 בלות סומסום, בלת חול, מנוף לקומה 2');
  const [isSendingSim, setIsSendingSim] = useState(false);

  // Address editing state
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddressText, setEditingAddressText] = useState('');

  // Morning Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  // View Mode: 'sheet' (Google Sheets table) or 'cards' (visual cards)
  const [viewMode, setViewMode] = useState<'sheet' | 'cards'>('sheet');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [submittingOrders, setSubmittingOrders] = useState<Record<string, boolean>>({});

  // Sync external stagedOrders or fetch live from Google Sheets
  React.useEffect(() => {
    if (stagedOrders && stagedOrders.length > 0) {
      setOrders(stagedOrders);
    } else {
      fetch('/api/orders/staged')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.orders) && data.orders.length > 0) {
            setOrders(data.orders);
          }
        })
        .catch(() => {});
    }
  }, [stagedOrders]);

  // Update order driver
  const handleDriverChange = async (orderId: string, newDriver: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, driverName: newDriver } : o))
    );

    try {
      await fetch('/api/dispatch/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, driverName: newDriver }),
      });
      setToastMsg(`🚚 נהג עודכן בהצלחה ל-[${newDriver}]`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      console.warn('Driver update failed on server:', e);
    }
  };

  // Update order status
  const handleStatusChange = async (orderId: string, newStatus: StagedOrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    }

    try {
      await fetch('/api/dispatch/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      playNotificationSound('auto');
      setToastMsg(`✅ סטטוס הזמנה עודכן ל-[${newStatus}]`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      console.warn('Status update failed on server:', e);
    }
  };

  // Save edited address
  const handleSaveAddress = async (orderId: string) => {
    if (!editingAddressText.trim()) {
      setEditingAddressId(null);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, address: editingAddressText } : o))
    );
    try {
      await fetch('/api/dispatch/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, address: editingAddressText }),
      });
      setToastMsg(`📍 כתובת אספקה עודכנה בהצלחה`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {}
    setEditingAddressId(null);
  };

  // One-click dispatch approve to GAS
  const handleApproveDispatch = async (order: StagedOrder) => {
    setSubmittingOrders((prev) => ({ ...prev, [order.id]: true }));
    try {
      const formattedItemsStr = order.items
        .map((i) => `${i.quantity} ${i.unit} ${i.name}`)
        .join(', ');

      const payload = {
        action: 'APPROVE_DISPATCH',
        orderId: order.orderNumber,
        customerName: order.customerName,
        phone: order.customerPhone,
        address: order.address || 'לא צוינה כתובת',
        items: formattedItemsStr || order.rawMessage,
        driverName: order.driverName || 'עלי - משאית מנוף 1',
        status: 'APPROVED',
        timestamp: new Date().toISOString(),
      };

      const res = await fetch('/api/dispatch/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success || res.ok) {
        handleStatusChange(order.id, 'APPROVED' as any);
        playNotificationSound('auto');
        setToastMsg(`✅ הזמנה ${order.orderNumber} אושרה להובלה, שודרה ל-GAS ונעלה בלוח הובלות!`);
        setTimeout(() => setToastMsg(null), 5000);
      } else {
        throw new Error(data.error || 'Approval failed');
      }
    } catch (err: any) {
      console.error('Dispatch approval error:', err);
      setToastMsg(`⚠️ שגיאה באישור הובלה: ${err?.message || 'נא לנסות שוב'}`);
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setSubmittingOrders((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  // Run C:\ap94 simulation
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    setIsSendingSim(true);
    try {
      if (onSimulateListenerEvent) {
        await onSimulateListenerEvent(simPhone, simName, simMessage);
      } else {
        const res = await fetch('/api/listener/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: simPhone,
            senderName: simName,
            incomingMessage: simMessage,
          }),
        });
        const data = await res.json();
        if (data.stagedOrder) {
          setOrders((prev) => [data.stagedOrder, ...prev]);
        }
      }
      setToastMsg('⚡ אירוע הופעל בהצלחה מ-C:\\ap94 והוזרק ללוח!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      setToastMsg('⚠️ כישלון בהרצת סימולציה');
    } finally {
      setIsSendingSim(false);
    }
  };

  // Filtered orders logic
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.address && o.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.driverName && o.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.includes(searchTerm));

    const matchesDriver =
      driverFilter === 'ALL' ||
      (o.driverName && o.driverName.includes(driverFilter)) ||
      (driverFilter === 'UNASSIGNED' && (!o.driverName || o.driverName.includes('טרם שובץ')));

    const matchesStatus =
      statusFilter === 'ALL' ||
      o.status === statusFilter ||
      (statusFilter === 'UNFULFILLED' && (o.status === 'לא סופק' || o.status === 'בטיפול לוגיסטי' || o.status === 'נקלט ב-SabanOS'));

    return matchesSearch && matchesDriver && matchesStatus;
  });

  // Analytics Counters
  const totalCount = orders.length;
  const unfulfilledOrders = orders.filter((o) => o.status === 'לא סופק' || o.status === 'בטיפול לוגיסטי' || o.status === 'נקלט ב-SabanOS');
  const unfulfilledCount = unfulfilledOrders.length;
  const inTransitCount = orders.filter((o) => o.status === 'יצא לדרך' || o.status === 'APPROVED').length;
  const deliveredCount = orders.filter((o) => o.status === 'סופק' || o.status === 'הושלם').length;
  const totalEstimatedValue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // Tomorrow's Date string formatted
  const tomorrowObj = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowFormatted = tomorrowObj.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  // Generate WhatsApp Morning Report text
  const generateWhatsAppMorningReport = () => {
    const titleHeader = `🌅 *דוח בוקר סידור הובלות - ח. סבן בע"מ* 🚛\n📅 *לתאריך:* ${tomorrowFormatted}\n----------------------------------\n📋 *סך הכל הזמנות לביצוע (לא סופק):* ${unfulfilledCount} הזמנות\n\n`;

    // Group unfulfilled orders by driver
    const driverGroups: Record<string, StagedOrder[]> = {};
    unfulfilledOrders.forEach((ord) => {
      const drv = ord.driverName || 'טרם שובץ (להקצאה)';
      if (!driverGroups[drv]) driverGroups[drv] = [];
      driverGroups[drv].push(ord);
    });

    let bodyText = '';
    Object.entries(driverGroups).forEach(([driver, driverOrders]) => {
      bodyText += `🚚 *נהג: ${driver}* (${driverOrders.length} הזמנות):\n`;
      driverOrders.forEach((o, idx) => {
        const itemsStr = o.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(', ');
        bodyText += `  ${idx + 1}. *#${o.orderNumber}* | ${o.customerName}\n`;
        bodyText += `     📍 *כתובת:* ${o.address || 'ללא כתובת'}\n`;
        bodyText += `     📞 *טלפון:* ${o.customerPhone}\n`;
        bodyText += `     📦 *ציוד:* ${itemsStr || o.rawMessage}\n`;
        bodyText += `     ⏳ *סטטוס:* ${o.status}\n\n`;
      });
    });

    const footerText = `----------------------------------\n💬 *הערות לסידור:* נא לוודא תיאום טלפוני מול הלקוחות חצי שעה לפני הגעה!\n🚚 *סבן חומרי בניין לוגיסטיקה - SabanOS*`;

    return titleHeader + bodyText + footerText;
  };

  const reportText = generateWhatsAppMorningReport();

  // Copy Morning Report to Clipboard
  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    setReportCopied(true);
    setToastMsg('📋 דוח הבוקר הועתק ללוח בהצלחה!');
    setTimeout(() => {
      setReportCopied(false);
      setToastMsg(null);
    }, 4000);
  };

  // Share directly on WhatsApp Web / App
  const handleOpenWhatsAppShare = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Broadcast Morning Report via Server
  const handleBroadcastReport = async () => {
    setIsSendingReport(true);
    try {
      const res = await fetch('/api/dispatch/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        playNotificationSound('auto');
        setToastMsg('🚀 דוח הבוקר שודר בהצלחה לקבוצת העדכונים מהסידור ולראמי!');
        setTimeout(() => setToastMsg(null), 5000);
      } else {
        throw new Error(data.error || 'Broadcast failed');
      }
    } catch (e: any) {
      setToastMsg(`⚠️ שגיאה בשליחת הדוח: ${e?.message || 'נסה שוב'}`);
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setIsSendingReport(false);
    }
  };

  return (
    <div className="space-y-6 text-right dir-rtl font-sans pb-12">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a]/95 border border-[#00a884] text-[#00a884] px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl text-xs font-bold animate-fadeIn">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-[#8696a0] hover:text-white mr-2 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Hero Header & Executive KPI Summary */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-[#334155] rounded-3xl p-6 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#00a884]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#334155]/60">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2.5 bg-gradient-to-tr from-[#00a884] to-emerald-400 rounded-xl text-slate-950 shadow-lg shadow-[#00a884]/20">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                  לוח סידור — לוג הזמנות מערכת SabanOS
                  <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    טאב: לוג_הזמנות_מערכת
                  </span>
                </h2>
                <p className="text-xs text-[#94a3b8]">
                  ניהול ציר זמן הזמנות בלייב, שיוך נהגים (עלי, חכמת ועוד), והפקת דוח בוקר מעוצב לוואטסאפ
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>🌅 חולל דוח בוקר (מחר)</span>
              {unfulfilledCount > 0 && (
                <span className="bg-slate-950/30 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px]">
                  {unfulfilledCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2.5 bg-[#00a884] hover:bg-[#008f70] text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>שיתוף דוח בוואטסאפ</span>
            </button>

            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{showSimulator ? 'סגור סימולטור' : 'סימולציית C:\\ap94'}</span>
            </button>
          </div>
        </div>

        {/* Realtime KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-5">
          <div className="bg-[#0f172a]/80 p-3.5 rounded-2xl border border-[#334155] flex flex-col justify-between space-y-1">
            <span className="text-[11px] text-[#94a3b8] font-medium flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
              סך הזמנות בסידור
            </span>
            <span className="text-xl font-black text-white font-mono">{totalCount}</span>
          </div>

          <div className="bg-rose-950/20 p-3.5 rounded-2xl border border-rose-500/40 flex flex-col justify-between space-y-1 relative overflow-hidden group">
            <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-rose-500/10 rounded-full blur-xl" />
            <span className="text-[11px] text-rose-300 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              לא סופק (לדוח בוקר)
            </span>
            <span className="text-2xl font-black text-rose-400 font-mono">{unfulfilledCount}</span>
          </div>

          <div className="bg-[#0f172a]/80 p-3.5 rounded-2xl border border-[#334155] flex flex-col justify-between space-y-1">
            <span className="text-[11px] text-[#94a3b8] font-medium flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-purple-400" />
              בדרך / מאושר להובלה
            </span>
            <span className="text-xl font-black text-purple-300 font-mono">{inTransitCount}</span>
          </div>

          <div className="bg-[#0f172a]/80 p-3.5 rounded-2xl border border-[#334155] flex flex-col justify-between space-y-1">
            <span className="text-[11px] text-[#94a3b8] font-medium flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              סופק בהצלחה
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">{deliveredCount}</span>
          </div>

          <div className="bg-[#0f172a]/80 p-3.5 rounded-2xl border border-[#334155] flex flex-col justify-between space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#94a3b8] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              שווי הזמנות משוער
            </span>
            <span className="text-xl font-black text-amber-300 font-mono">
              ₪{totalEstimatedValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Local Listener C:\ap94 Simulation Widget Toggleable */}
        {showSimulator && (
          <form onSubmit={handleRunSimulation} className="mt-5 bg-[#0f172a] p-4 rounded-2xl border border-amber-500/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#334155] pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                סימולציית אירוע נכנס משרת Node.js המקומי (`C:\ap94` Listener)
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                POST /api/listener/event
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#94a3b8] mb-1">1. טלפון שולח (phone)</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white dir-ltr font-mono focus:border-[#00a884] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#94a3b8] mb-1">2. שם הלקוח / אתר (senderName)</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00a884] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#94a3b8] mb-1">3. הודעת טקסט חופשית (incomingMessage)</label>
                <input
                  type="text"
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="למשל: 3 בלות סומסום, בלת חול, מנוף לקומה 2"
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00a884] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSendingSim}
                className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingSim ? 'animate-spin' : ''}`} />
                <span>שדר אירוע מ-C:\ap94 ופענח הזמנה בלייב</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Toolbar: Search & Filters & View Switcher */}
      <div className="bg-[#1e293b]/90 p-4 rounded-2xl border border-[#334155] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94a3b8] absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש לפי מספר הזמנה, שם לקוח, כתובת, נהג, או מקט פריט..."
            className="w-full pr-9 pl-3 py-2 bg-[#0f172a] border border-[#334155] rounded-xl text-xs text-white focus:outline-none focus:border-[#00a884] placeholder-[#64748b]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0f172a] p-1 rounded-xl border border-[#334155] shrink-0">
            <button
              onClick={() => setViewMode('sheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'sheet'
                  ? 'bg-[#00a884] text-slate-950 shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>תצוגת גליון (16 עמודות)</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#00a884] text-slate-950 shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>תצוגת כרטיסיות</span>
            </button>
          </div>

          {/* Driver Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-[#334155] shrink-0">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0f172a] text-white">כל הנהגים</option>
              <option value="עלי" className="bg-[#0f172a] text-amber-300">🚚 עלי (מנוף 1)</option>
              <option value="חכמת" className="bg-[#0f172a] text-amber-300">🚚 חכמת (מנוף 2)</option>
              <option value="אבי" className="bg-[#0f172a] text-white">🚚 אבי ברגמן</option>
              <option value="יוסי" className="bg-[#0f172a] text-white">🚚 יוסי כהן</option>
              <option value="UNASSIGNED" className="bg-[#0f172a] text-rose-300">⚠️ טרם שובץ</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#0f172a] px-3 py-1.5 rounded-xl border border-[#334155] shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#0f172a] text-white">כל הסטטוסים</option>
              <option value="UNFULFILLED" className="bg-[#0f172a] text-rose-300">🚨 לא סופק / בטיפול</option>
              <option value="נקלט ב-SabanOS" className="bg-[#0f172a] text-amber-300">נקלט ב-SabanOS</option>
              <option value="בטיפול לוגיסטי" className="bg-[#0f172a] text-blue-300">בטיפול לוגיסטי</option>
              <option value="יצא לדרך" className="bg-[#0f172a] text-purple-300">יצא לדרך</option>
              <option value="סופק" className="bg-[#0f172a] text-emerald-300">סופק</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={() => exportOrdersToCSV(filteredOrders, 'SabanOS_Orders_Report')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all active:scale-95 shrink-0"
            title="הורד דוח מסכם CSV של ההזמנות המוצגות כעת"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>יצוא ל-CSV</span>
          </button>

          {/* Analytics Dashboard Toggle Button */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
              showAnalytics
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                : 'bg-[#0f172a] text-indigo-300 border-[#334155] hover:bg-slate-800'
            }`}
            title="הצג/הסתר דשבורד ויזואלי של פילוג סטטוסים וביצועי הובלה"
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showAnalytics ? 'הסתר אנליטיקה' : 'דשבורד Recharts'}</span>
          </button>
        </div>
      </div>

      {/* Live Recharts Analytics Dashboard Collapsible Panel */}
      {showAnalytics && (
        <OrdersAnalyticsDashboard orders={filteredOrders} />
      )}

      {/* Main View: Sheet Table OR Cards */}
      {viewMode === 'sheet' ? (
        /* Full Google Sheets View with Exact 16 Headers */
        <div className="bg-[#0f172a] rounded-3xl border border-[#334155] overflow-hidden shadow-2xl">
          <div className="p-4 bg-[#1e293b]/80 border-b border-[#334155] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-[#00a884]" />
              <h3 className="text-sm font-extrabold text-white">
                גליון Google Sheets סנכרון בלייב: <span className="text-amber-400 font-mono">לוג_הזמנות_מערכת</span>
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                ID: 1i2J9ByIAerL48eIRYnT9SJLJcUryR0mlkD8uiWjjZPc
              </span>
            </div>
            <a
              href="https://docs.google.com/spreadsheets/d/1i2J9ByIAerL48eIRYnT9SJLJcUryR0mlkD8uiWjjZPc/edit"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>פתח גליון בגוגל שיטס</span>
            </a>
          </div>

          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-right text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-[#1e293b] text-[#94a3b8] font-bold border-b border-[#334155] whitespace-nowrap">
                  <th className="p-3 border-l border-[#334155]/60">תאריך קליטה</th>
                  <th className="p-3 border-l border-[#334155]/60">מספר הזמנה</th>
                  <th className="p-3 border-l border-[#334155]/60">שם לקוח</th>
                  <th className="p-3 border-l border-[#334155]/60">מחסן</th>
                  <th className="p-3 border-l border-[#334155]/60">כתובת אספקה</th>
                  <th className="p-3 border-l border-[#334155]/60 min-w-[280px]">פריטים</th>
                  <th className="p-3 border-l border-[#334155]/60">פקדון בלות</th>
                  <th className="p-3 border-l border-[#334155]/60">פקדון משטחים</th>
                  <th className="p-3 border-l border-[#334155]/60">סטטוס</th>
                  <th className="p-3 border-l border-[#334155]/60">תוצאה</th>
                  <th className="p-3 border-l border-[#334155]/60">סכום</th>
                  <th className="p-3 border-l border-[#334155]/60">תאריך אימות</th>
                  <th className="p-3 border-l border-[#334155]/60">שעת אספקה</th>
                  <th className="p-3 border-l border-[#334155]/60 min-w-[240px]">מסקנות נועה AI</th>
                  <th className="p-3 border-l border-[#334155]/60">אימות מסלול הובלה</th>
                  <th className="p-3">סטטוס סנכרון</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-8 text-center text-[#94a3b8]">
                      אין הזמנות להצגה בגליון
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const itemsFormatted = ord.rawItemsText || (
                      ord.items && ord.items.length > 0
                        ? ord.items.map((i, idx) => `${idx + 1}. 📦 מק"ט: ${i.sku} | ${i.name} | כמות: ${i.quantity}`).join('\n')
                        : ord.rawMessage
                    );

                    return (
                      <tr key={ord.id} className="hover:bg-[#1e293b]/60 transition-colors">
                        <td className="p-3 font-mono text-[#94a3b8] whitespace-nowrap border-l border-[#334155]/40">
                          {ord.ingestionDate || ord.createdAt}
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap border-l border-[#334155]/40">
                          {ord.orderNumber}
                        </td>
                        <td className="p-3 font-bold text-white whitespace-nowrap border-l border-[#334155]/40">
                          {ord.customerName}
                        </td>
                        <td className="p-3 text-slate-200 whitespace-nowrap border-l border-[#334155]/40">
                          {ord.warehouse || '🏭 4(החרש)'}
                        </td>
                        <td className="p-3 text-slate-300 border-l border-[#334155]/40 min-w-[160px]">
                          {ord.address || 'לא צויין'}
                        </td>
                        <td className="p-3 text-slate-200 whitespace-pre-wrap font-mono text-[11px] border-l border-[#334155]/40">
                          {itemsFormatted}
                        </td>
                        <td className="p-3 text-amber-300 font-medium whitespace-nowrap border-l border-[#334155]/40">
                          {ord.baleDeposit || 'ℹ️ פטור (הובלה ללא פריקה)'}
                        </td>
                        <td className="p-3 text-amber-300 font-medium whitespace-nowrap border-l border-[#334155]/40">
                          {ord.palletDeposit || 'ℹ️ פטור (הובלה ללא פריקה)'}
                        </td>
                        <td className="p-3 whitespace-nowrap border-l border-[#334155]/40">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {ord.status || 'מאושר'}
                          </span>
                        </td>
                        <td className="p-3 text-emerald-400 font-bold whitespace-nowrap border-l border-[#334155]/40">
                          {ord.result || 'תקין'}
                        </td>
                        <td className="p-3 font-mono text-slate-300 whitespace-nowrap border-l border-[#334155]/40">
                          {ord.totalPrice ? `₪${ord.totalPrice}` : ''}
                        </td>
                        <td className="p-3 font-mono text-[#94a3b8] whitespace-nowrap border-l border-[#334155]/40">
                          {ord.verificationDate || '2026-07-30'}
                        </td>
                        <td className="p-3 font-mono text-amber-300 font-bold whitespace-nowrap border-l border-[#334155]/40">
                          {ord.deliveryTime || '08:00'}
                        </td>
                        <td className="p-3 text-slate-200 text-[11px] border-l border-[#334155]/40">
                          {ord.noaInsights || ord.noaResponse || 'נועה AI: נקלט בהצלחה'}
                        </td>
                        <td className="p-3 text-emerald-300 text-[11px] font-mono whitespace-nowrap border-l border-[#334155]/40">
                          {ord.routeVerification || 'תקין (24.1 ק"מ (29 דקות))'}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-bold whitespace-nowrap">
                          {ord.syncStatus || 'סונכרן לסידור עבודה 🟢'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Order Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-5">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full bg-[#1e293b]/50 p-12 rounded-3xl border border-[#334155] text-center space-y-3">
              <PackageCheck className="w-12 h-12 text-[#64748b] mx-auto" />
              <p className="text-sm font-bold text-[#94a3b8]">לא נמצאו הזמנות תואמות בסידור</p>
              <p className="text-xs text-[#64748b]">נסה לנקות את מילות החיפוש או הסינון כדי לראות את כל ההזמנות</p>
            </div>
          ) : (
            filteredOrders.map((order, orderIdx) => {
              const isSubmitting = Boolean(submittingOrders[order.id]);
              const isUnfulfilled = order.status === 'לא סופק';
              const isDelivered = order.status === 'סופק' || order.status === 'הושלם';

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: orderIdx * 0.03 }}
                  key={`${order.id}-${orderIdx}`}
                  className={`bg-slate-900/90 border rounded-3xl p-5 space-y-4 shadow-xl transition-all duration-300 relative overflow-hidden backdrop-blur-md group hover:shadow-2xl ${
                    isUnfulfilled
                      ? 'border-rose-500/50 hover:border-rose-400 bg-gradient-to-b from-rose-950/10 via-slate-900 to-slate-900'
                      : isDelivered
                      ? 'border-emerald-500/40 hover:border-emerald-400/80'
                      : 'border-[#334155] hover:border-[#00a884]/60'
                  }`}
                >
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#334155]/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-400 text-sm bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold text-[#94a3b8] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                        {order.warehouse || '🏭 4(החרש)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#94a3b8] font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#64748b]" />
                        {order.ingestionDate || order.createdAt}
                      </span>

                      {/* Quick One-Click Approval Badge */}
                      {order.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          מאושר ב-GAS
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveDispatch(order)}
                          disabled={isSubmitting}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 text-[11px] shadow transition-all cursor-pointer disabled:opacity-50"
                          title="אישור הובלה בלחיצה אחת ושידור ל-GAS"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Truck className="w-3 h-3" />
                          )}
                          <span>אישור ל-GAS</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer Details & Supply Address Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0f172a] p-3.5 rounded-2xl border border-[#334155]/60">
                    {/* Customer Info */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#64748b] font-bold block uppercase tracking-wider">לקוח יעד</span>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-blue-400 shrink-0" />
                        <a href={`tel:${order.customerPhone}`} className="hover:underline">
                          {order.customerPhone}
                        </a>
                      </div>
                    </div>

                    {/* Supply Address (כתובת אספקה) */}
                    <div className="space-y-1 border-t sm:border-t-0 sm:border-r border-[#334155]/60 pt-2 sm:pt-0 sm:pr-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          כתובת אספקה
                        </span>
                        {editingAddressId !== order.id && (
                          <button
                            onClick={() => {
                              setEditingAddressId(order.id);
                              setEditingAddressText(order.address || '');
                            }}
                            className="text-[10px] text-[#94a3b8] hover:text-white flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>ערוך</span>
                          </button>
                        )}
                      </div>

                      {editingAddressId === order.id ? (
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            value={editingAddressText}
                            onChange={(e) => setEditingAddressText(e.target.value)}
                            className="w-full bg-[#1e293b] border border-amber-500/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveAddress(order.id)}
                            className="px-2 py-1 bg-amber-500 text-slate-950 font-bold text-[10px] rounded cursor-pointer"
                          >
                            שמור
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-200 font-medium leading-tight">
                          {order.address || 'לא צוינה כתובת (לחץ לעריכה)'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Deposits & Route Info Row */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[#94a3b8] block text-[10px]">פקדון בלות:</span>
                      <span className="text-amber-300 font-medium">{order.baleDeposit || 'ℹ️ פטור (הובלה ללא פריקה)'}</span>
                    </div>
                    <div>
                      <span className="text-[#94a3b8] block text-[10px]">פקדון משטחים:</span>
                      <span className="text-amber-300 font-medium">{order.palletDeposit || 'ℹ️ פטור (הובלה ללא פריקה)'}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-emerald-400 font-mono text-[10px]">
                        🛣️ {order.routeVerification || 'תקין (24.1 ק"מ (29 דקות))'}
                      </span>
                      <span className="text-emerald-300 font-bold text-[10px]">
                        {order.syncStatus || 'סונכרן לסידור עבודה 🟢'}
                      </span>
                    </div>
                  </div>

                  {/* Driver Assignment Dropdown */}
                  <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-2xl border border-[#334155]/80">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      שיוך נהג להובלה:
                    </span>

                    <div className="relative">
                      <select
                        value={order.driverName || 'טרם שובץ (להקצאה)'}
                        onChange={(e) => handleDriverChange(order.id, e.target.value)}
                        className="bg-slate-950 border border-emerald-500/50 text-emerald-300 font-extrabold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-400 cursor-pointer shadow-inner"
                      >
                        {DRIVER_PRESETS.map((driver) => (
                          <option key={driver} value={driver} className="bg-slate-900 text-white font-sans">
                            {driver.includes('עלי') ? '🚚 ' + driver : driver.includes('חכמת') ? '🚚 ' + driver : driver}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Items Breakdown */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#64748b] font-bold block uppercase tracking-wider">
                      פריטים מתוך גליון לוג_הזמנות_מערכת
                    </span>
                    <div className="bg-[#0f172a] p-3 rounded-xl border border-[#334155]/60 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                      {order.rawItemsText || (
                        order.items && order.items.length > 0
                          ? order.items.map((i, idx) => `${idx + 1}. 📦 מק"ט: ${i.sku} | ${i.name} | כמות: ${i.quantity}`).join('\n')
                          : order.rawMessage
                      )}
                    </div>
                  </div>

                  {/* Interactive Status Timeline Bar */}
                  <div className="pt-2 border-t border-[#334155]/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#94a3b8] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#00a884]" />
                        סטטוס הזמנה:
                      </span>
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isUnfulfilled
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : isDelivered
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {STATUS_LIFECYCLE.map((step) => {
                        const isActive = order.status === step.key;
                        const StepIcon = step.icon;

                        return (
                          <button
                            key={step.key}
                            onClick={() => handleStatusChange(order.id, step.key)}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center ${
                              isActive
                                ? `${step.bg} ${step.border} ${step.color} shadow-lg scale-[1.02] ring-1 ring-[#00a884]/40 font-black`
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                            }`}
                          >
                            <StepIcon className={`w-3.5 h-3.5 ${isActive ? 'animate-bounce' : ''}`} />
                            <span className="text-[9px] leading-tight font-sans truncate w-full">{step.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Morning Report & WhatsApp Sharing Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-[#334155] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    🌅 מחולל דוח בוקר לסידור (מחר) להזמנות שלא סופקו
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    תאריך: {tomorrowFormatted} | נמצאו {unfulfilledCount} הזמנות בסטטוס "לא סופק / בטיפול"
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#94a3b8] hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formatted Report Preview Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                תצוגה מקדימה - הודעת וואטסאפ מעוצבת ומסודרת:
              </span>
              <textarea
                value={reportText}
                readOnly
                rows={12}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl p-4 text-xs font-mono text-emerald-200 focus:outline-none leading-relaxed select-all"
              />
            </div>

            {/* Action Tools */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handleCopyReport}
                className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {reportCopied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                <span>{reportCopied ? 'הועתק בהצלחה!' : '📋 העתק הודעת וואטסאפ ללוח'}</span>
              </button>

              <button
                onClick={handleOpenWhatsAppShare}
                className="w-full sm:w-auto px-5 py-3 bg-[#00a884] hover:bg-[#008f70] text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>📲 פתח שיתוף ישיר בוואטסאפ</span>
              </button>

              <button
                onClick={handleBroadcastReport}
                disabled={isSendingReport}
                className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSendingReport ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>🚀 שדר בלייב לקבוצת ה-WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
