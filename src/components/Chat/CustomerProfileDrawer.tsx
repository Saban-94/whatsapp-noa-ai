import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Building2,
  Users,
  Bot,
  Zap,
  RefreshCw,
  Clock,
  Truck,
  Plus,
  Trash2,
} from 'lucide-react';
import { CustomerProfile, SheetRecord } from '../../types';

interface CustomerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  customerName?: string;
  initialProfile?: CustomerProfile | null;
  onProfileUpdated?: (updatedProfile: CustomerProfile) => void;
  onModeChanged?: (mode: 'auto' | 'manual') => void;
}

export const CustomerProfileDrawer: React.FC<CustomerProfileDrawerProps> = ({
  isOpen,
  onClose,
  phone,
  customerName = 'לקוח',
  initialProfile,
  onProfileUpdated,
  onModeChanged,
}) => {
  // Form State
  const [name, setName] = useState<string>(customerName);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [siteAddresses, setSiteAddresses] = useState<string[]>([]);
  const [newAddressInput, setNewAddressInput] = useState<string>('');
  const [siteManager, setSiteManager] = useState<string>('');
  const [customerGroup, setCustomerGroup] = useState<string>('קבלני שלד');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [tags, setTags] = useState<string[]>(['קבלן רשום', 'אשראי מאושר']);
  const [tagInput, setTagInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI Feedback State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Sheet Verification State
  const [sheetRecords, setSheetRecords] = useState<SheetRecord[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(false);
  const [sheetSearchDone, setSheetSearchDone] = useState<boolean>(false);

  // Load existing profile when opening drawer
  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || customerName);
      setAccountNumber(initialProfile.accountNumber || '');
      setEmail(initialProfile.email || '');
      setSiteAddresses(initialProfile.siteAddresses || []);
      setSiteManager(initialProfile.siteManager || '');
      setCustomerGroup(initialProfile.customerGroup || 'קבלני שלד');
      setMode(initialProfile.mode || 'auto');
      setTags(initialProfile.tags || ['קבלן רשום']);
      setNotes(initialProfile.notes || '');
    } else {
      setName(customerName);
      setAccountNumber(`CUST-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [initialProfile, phone, customerName]);

  // Handle Mode Toggle change (Auto-Noa vs Manual Admin)
  const handleToggleMode = async (newMode: 'auto' | 'manual') => {
    setMode(newMode);
    if (onModeChanged) onModeChanged(newMode);

    try {
      await fetch('/api/chat/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, mode: newMode }),
      });
    } catch (err) {
      console.warn('Failed to persist mode toggle:', err);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const payload: CustomerProfile = {
      phone,
      name,
      accountNumber,
      email,
      siteAddresses,
      siteManager,
      customerGroup,
      mode,
      tags,
      notes,
      lastUpdated: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/customer/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', msg: 'פרופיל הלקוח עודכן ונשמר במערכת SabanOS!' });
        if (onProfileUpdated) onProfileUpdated(data.profile || payload);
      } else {
        throw new Error(data.error || 'נכשלה שמירת פרופיל הלקוח');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', msg: `שגיאה בשמירה: ${err?.message || 'שגיאה בשרת'}` });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Real-Time Sheet Order Verification Lookup
  const handleFetchSheetHistory = async () => {
    setIsLoadingSheet(true);
    setSheetSearchDone(true);
    try {
      const res = await fetch('/api/noa/sheet-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (res.ok && data.sheetRecords) {
        setSheetRecords(data.sheetRecords);
      }
    } catch (err) {
      console.warn('Sheet lookup error:', err);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Address list helpers
  const handleAddAddress = () => {
    if (!newAddressInput.trim()) return;
    setSiteAddresses([...siteAddresses, newAddressInput.trim()]);
    setNewAddressInput('');
  };

  const handleRemoveAddress = (index: number) => {
    setSiteAddresses(siteAddresses.filter((_, i) => i !== index));
  };

  // Tag list helpers
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity dir-rtl">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-[#111b21] text-[#e9edef] h-full shadow-2xl flex flex-col border-r border-[#222d34] z-10 overflow-hidden animate-in slide-in-from-left duration-200">
        
        {/* DRAWER HEADER */}
        <div className="px-5 py-4 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884] font-bold text-base">
              {name ? name.charAt(0) : 'ל'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#e9edef]">{name}</h2>
              <p className="text-xs text-[#8696a0] dir-ltr font-mono">{phone}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#374248] text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
            title="סגור חלונית פרופיל"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE TOGGLE BANNER */}
        <div className="px-5 py-3 bg-[#182229] border-b border-[#222d34] flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-[#8696a0] flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            מצב תגובה בצ'אט זה:
          </span>

          <div className="flex items-center bg-[#111b21] p-1 rounded-xl border border-[#2a3942]">
            <button
              type="button"
              onClick={() => handleToggleMode('auto')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                mode === 'auto'
                  ? 'bg-[#00a884] text-[#111b21] shadow'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>🤖 Auto-Noa</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleMode('manual')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                mode === 'manual'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>👤 Manual Admin</span>
            </button>
          </div>
        </div>

        {/* DRAWER BODY - SCROLLABLE FORM & REAL-TIME SHEET VERIFICATION */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* SECTION 1: CUSTOMER METADATA ENRICHMENT FORM */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            {/* Customer Name & Account Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#00a884]" />
                  שם הלקוח / עסק:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="שם מלא"
                  required
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#00a884]" />
                  מזהה לקוח ח.סבן:
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="מזהה הנהלת חשבונות (למשל CUST-902)"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884] font-mono"
                />
              </div>
            </div>

            {/* Email & Site Manager */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#00a884]" />
                  דוא"ל לשילוח חשבוניות:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884] dir-ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#00a884]" />
                  מנהל אתר / קבלן אחראי:
                </label>
                <input
                  type="text"
                  value={siteManager}
                  onChange={(e) => setSiteManager(e.target.value)}
                  placeholder="איש קשר בשטח"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                />
              </div>
            </div>

            {/* Customer Group Mapping */}
            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#00a884]" />
                שיוך לקבוצת לקוחות ח.סבן:
              </label>
              <select
                value={customerGroup}
                onChange={(e) => setCustomerGroup(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              >
                <option value="קבלני שלד">קבלני שלד וגמר (VIP)</option>
                <option value="שיפוצניקים ולקוחות פרטיים">שיפוצניקים ולקוחות פרטיים</option>
                <option value="חברות תשתית ופיתוח">חברות תשתית ופיתוח</option>
                <option value="מזמינים מזדמנים">מזמינים מזדמנים</option>
                <option value="מערכת אוטומציה פנימית">מערכת אוטומציה פנימית</option>
              </select>
            </div>

            {/* Site Delivery Addresses List */}
            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#00a884]" />
                כתובות אספקה מאושרות (אתרים):
              </label>
              
              <div className="space-y-1.5 mb-2">
                {siteAddresses.length === 0 ? (
                  <p className="text-[11px] text-[#8696a0] italic bg-[#202c33] p-2 rounded-lg">
                    טרם הוזנו כתובות אספקה. הוסף כתובת למטה.
                  </p>
                ) : (
                  siteAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#202c33] px-3 py-1.5 rounded-lg border border-[#2a3942] text-xs"
                    >
                      <span className="text-[#e9edef] font-medium">{addr}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        title="הסר כתובת"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAddressInput}
                  onChange={(e) => setNewAddressInput(e.target.value)}
                  placeholder="הוסף כתובת אתר חדשה (למשל: הנדיב 14 הרצליה)..."
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAddress();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="px-3 py-1.5 bg-[#00a884] text-[#111b21] font-bold text-xs rounded-lg hover:bg-[#00a884]/90 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף
                </button>
              </div>
            </div>

            {/* Tags & Categories */}
            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#00a884]" />
                תגיות וסיווג לקוח:
              </label>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-400 cursor-pointer text-xs font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="הוסף תגית (למשל: מנוף קומה 3)..."
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-[#2a3942] font-semibold text-xs rounded-lg transition-all cursor-pointer"
                >
                  הוסף תגית
                </button>
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#00a884]" />
                הערות פנימיות למנהל המערכת:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="רשום הערות פנימיות לצוות הלוגיסטיקה והנהלת החשבונות..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
              />
            </div>

            {/* Save Feedback */}
            {feedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                  feedback.type === 'success'
                    ? 'bg-[#00a884]/20 border-[#00a884]/50 text-[#00a884]'
                    : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.msg}</span>
              </div>
            )}

            {/* Submit Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 bg-[#00a884] hover:bg-[#00a884]/90 disabled:opacity-50 text-[#111b21] font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>שומר פרופיל ב-SabanOS...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>שמור פרופיל לקוח מעודכן</span>
                </>
              )}
            </button>
          </form>

          {/* SECTION 2: REAL-TIME GOOGLE SHEETS ORDER VERIFICATION */}
          <div className="bg-[#182229] p-4 rounded-xl border border-[#2a3942] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#e9edef] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#00a884]" />
                אימות היסטוריית הזמנות בלייב מול גוגל שיטס
              </h3>
              <span className="text-[10px] text-[#00a884] bg-[#00a884]/20 px-2 py-0.5 rounded-full font-mono">
                הזמנות_סידור
              </span>
            </div>

            <p className="text-[11px] text-[#8696a0] leading-relaxed">
              שלוף ובדוק היסטוריית הזמנות מאומתת מגיליון <code className="text-emerald-400 font-mono">הזמנות_סידור</code> לפי מספר טלפון {phone}.
            </p>

            <button
              type="button"
              onClick={handleFetchSheetHistory}
              disabled={isLoadingSheet}
              className="w-full py-2 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border border-[#00a884]/40 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoadingSheet ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>שולף נתונים מגוגל שיטס...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#00a884]" />
                  <span>תשלוף היסטוריית הזמנות בשיטס 📊</span>
                </>
              )}
            </button>

            {/* Sheet lookup results */}
            {sheetSearchDone && (
              <div className="space-y-2 pt-2 border-t border-[#2a3942]">
                {sheetRecords.length === 0 ? (
                  <p className="text-[11px] text-amber-400 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40">
                    לא נמצאו הזמנות קודמות עבור מספר זה בגיליון הסידור.
                  </p>
                ) : (
                  sheetRecords.map((rec, i) => (
                    <div
                      key={i}
                      className="bg-[#111b21] p-3 rounded-lg border border-[#2a3942] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[#8696a0] text-[11px]">
                        <span className="font-bold text-[#00a884] font-mono">{rec.orderId}</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#8696a0]" />
                          {rec.date}
                        </span>
                      </div>

                      <p className="text-[#e9edef] font-semibold text-xs">{rec.items}</p>

                      <div className="text-[11px] text-[#8696a0] flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {rec.address}
                        </span>
                        {rec.driverName && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Truck className="w-3 h-3" />
                            {rec.driverName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#2a3942]/60 text-[10px]">
                        <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                          {rec.status}
                        </span>
                        {rec.totalAmount && (
                          <span className="font-bold text-[#e9edef] font-mono">{rec.totalAmount}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
