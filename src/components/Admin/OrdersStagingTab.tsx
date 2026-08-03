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
} from 'lucide-react';
import { StagedOrder, NormalizedOrderItem } from '../../types';

interface OrdersStagingTabProps {
  stagedOrders: StagedOrder[];
  onAddOrder?: (newOrder: StagedOrder) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: StagedOrder['status']) => void;
  onSimulateListenerEvent?: (phone: string, name: string, message: string) => Promise<void>;
}

export const INITIAL_MOCK_STAGED_ORDERS: StagedOrder[] = [
  {
    id: 'ord_1001',
    orderNumber: 'ORD-90821',
    customerPhone: '052-4455667',
    customerName: 'משה כהן - אתר הרצליה',
    rawMessage: 'שלום נועה, צריך בדחיפות 3 בלות סומסום, בלת חול, מנוף לקומה 2',
    noaResponse: `שלום משה כהן - אתר הרצליה! 👋\n*ההזמנה שלך נקלטה ופוענחה בהצלחה במערכת SabanOS:* 🚛\n\n• [מק"ט 20001] בלה סומסום נקי — 3 בלה (₪330)\n• [מק"ט 20002] בלה חול מחצבה (טיט) — 1 בלה (₪105)\n• [מק"ט GENERIC-99] מנוף לקומה 2 — 1 יחידה\n\n*סה"כ משוער:* ₪435\n\nצוות הלוגיסטיקה מכין את המשלוח ויוצר עמך קשר לתיאום סופי!`,
    items: [
      { sku: '20001', name: 'בלה סומסום נקי', quantity: 3, unit: 'בלה', unitPrice: 110, totalPrice: 330 },
      { sku: '20002', name: 'בלה חול מחצבה (טיט)', quantity: 1, unit: 'בלה', unitPrice: 105, totalPrice: 105 },
      { sku: 'GENERIC-99', name: 'מנוף לקומה 2', quantity: 1, unit: 'יחידה', unitPrice: 0, totalPrice: 0 },
    ],
    totalPrice: 435,
    status: 'בטיפול לוגיסטי',
    sentToWhatsapp: true,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'ord_1002',
    orderNumber: 'ORD-90822',
    customerPhone: '054-9988112',
    customerName: 'אבי בניה בע"מ',
    rawMessage: '10 שקי מלט אפור ו-2 משטחי בלוק בטון 20',
    noaResponse: `שלום אבי בניה בע"מ! 👋\n*ההזמנה שלך נקלטה ופוענחה בהצלחה במערכת SabanOS:* 🚛\n\n• [מק"ט 10002] שק מלט אפור 25 ק"ג — 10 שק (₪220)\n• [מק"ט 30001] משטח בלוק בטון 20 (96 יח') — 2 משטח (₪960)\n\n*סה"כ משוער:* ₪1180\n\nצוות הלוגיסטיקה מכין את המשלוח!`,
    items: [
      { sku: '10002', name: 'שק מלט אפור 25 ק"ג', quantity: 10, unit: 'שק', unitPrice: 22, totalPrice: 220 },
      { sku: '30001', name: 'משטח בלוק בטון 20 (96 יח\')', quantity: 2, unit: 'משטח', unitPrice: 480, totalPrice: 960 },
    ],
    totalPrice: 1180,
    status: 'נקלט ב-SabanOS',
    sentToWhatsapp: true,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
  },
];

export const OrdersStagingTab: React.FC<OrdersStagingTabProps> = ({
  stagedOrders,
  onUpdateOrderStatus,
  onSimulateListenerEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [simPhone, setSimPhone] = useState('054-1234567');
  const [simName, setSimName] = useState('ישראל ישראלי - קבלן');
  const [simMessage, setSimMessage] = useState('3 בלות סומסום, בלת חול, מנוף לקומה 2');
  const [isSendingSim, setIsSendingSim] = useState(false);

  const displayOrders = (stagedOrders && stagedOrders.length > 0) ? stagedOrders : INITIAL_MOCK_STAGED_ORDERS;

  const filteredOrders = displayOrders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.includes(searchTerm))
  );

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    setIsSendingSim(true);
    try {
      if (onSimulateListenerEvent) {
        await onSimulateListenerEvent(simPhone, simName, simMessage);
      }
    } finally {
      setIsSendingSim(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <div className="bg-[#202c33] p-5 rounded-xl border border-[#2a3942] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#00a884] flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              טבלת הזמנות סידור בלייב (`הזמנות_סידור`)
              <span className="text-[10px] bg-[#00a884]/20 text-[#00a884] px-2 py-0.5 rounded-full font-bold">
                {displayOrders.length} הזמנות נקלטו
              </span>
            </h3>
            <p className="text-xs text-[#8696a0]">
              סינכרון אוטומטי של הודעות וואטסאפ נכנסות משרת ה-Node.js המקומי (`C:\ap94`), פענוח מקט"ים מול המילון הלוגיסטי ושידור חוזר ל-JONI.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8696a0] absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש לפי שם, טלפון, מקט..."
              className="w-full pl-3 pr-8 py-1.5 bg-[#111b21] border border-[#2a3942] rounded-lg text-xs text-white focus:outline-none focus:border-[#00a884]"
            />
          </div>
        </div>

        {/* Local Listener C:\ap94 Simulation Widget */}
        <form onSubmit={handleRunSimulation} className="bg-[#111b21] p-4 rounded-xl border border-[#2a3942] space-y-3">
          <div className="flex items-center justify-between border-b border-[#2a3942] pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              סימולציית אירוע נכנס משרת Node.js המקומי (`C:\ap94` Listener Event)
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
              POST /api/listener/event
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[#8696a0] mb-1">טלפון שולח (phone)</label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white dir-ltr font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8696a0] mb-1">שם הלקוח / אתר (senderName)</label>
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8696a0] mb-1">הודעת טקסט חופשית (incomingMessage)</label>
              <input
                type="text"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder="למשל: 3 בלות סומסום, בלת חול, מנוף לקומה 2"
                className="w-full bg-[#202c33] border border-[#2a3942] rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSendingSim}
              className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-[#111b21] font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSendingSim ? 'animate-spin' : ''}`} />
              <span>שדר אירוע מ-C:\ap94 ופענח הזמנה בלייב</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Orders Table */}
      <div className="bg-[#202c33] rounded-xl border border-[#2a3942] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#182229] text-[11px] font-bold text-[#8696a0] border-b border-[#2a3942]">
                <th className="p-3"># הזמנה</th>
                <th className="p-3">לקוח / טלפון</th>
                <th className="p-3">פריטים מאומתים במילון הלוגיסטי</th>
                <th className="p-3">סה"כ משוער</th>
                <th className="p-3">סטטוס סנכרון (JONI)</th>
                <th className="p-3">זמן נקלט</th>
                <th className="p-3 text-center">שינוי סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3942] text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#8696a0]">
                    לא נמצאו הזמנות תואמות בסידור
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#111b21]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#00a884]">{order.orderNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="text-[10px] text-[#8696a0] font-mono">{order.customerPhone}</div>
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-[#111b21] px-2 py-1 rounded border border-[#2a3942]">
                            <span className="text-white font-medium">
                              <span className="text-amber-400 font-bold ml-1">[{item.sku}]</span>
                              {item.name}
                            </span>
                            <span className="text-[#8696a0] font-bold mr-2">
                              {item.quantity} {item.unit} {item.totalPrice ? `(₪${item.totalPrice})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      ₪{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                        <CheckCircle className="w-3 h-3" />
                        sentToWhatsapp: true
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-[#8696a0] font-mono">{order.createdAt}</td>
                    <td className="p-3 text-center">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus && onUpdateOrderStatus(order.id, e.target.value as any)}
                        className="bg-[#111b21] border border-[#2a3942] text-[11px] text-white rounded px-2 py-1 focus:outline-none focus:border-[#00a884]"
                      >
                        <option value="נקלט ב-SabanOS">נקלט ב-SabanOS</option>
                        <option value="בטיפול לוגיסטי">בטיפול לוגיסטי</option>
                        <option value="יצא לדרך">יצא לדרך</option>
                        <option value="הושלם">הושלם</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
