import React, { useState, useEffect, useRef } from 'react';
import { InboundInquiry } from '../../types';
import { OrdersStagingTab } from './OrdersStagingTab';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Plus,
  AlertTriangle,
  Send,
  Volume2,
  VolumeX,
  Truck,
  ListFilter,
} from 'lucide-react';

interface InboundOrdersDashboardProps {
  darkTheme?: boolean;
}

export const InboundOrdersDashboard: React.FC<InboundOrdersDashboardProps> = ({
  darkTheme = true,
}) => {
  const [subView, setSubView] = useState<'inquiries' | 'staging'>('staging');
  const [inquiries, setInquiries] = useState<InboundInquiry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'handled'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll server for inquiries
  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries');
      if (res.ok) {
        const data = await res.json();
        if (data.inquiries && Array.isArray(data.inquiries)) {
          setInquiries(data.inquiries);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch inquiries:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(fetchInquiries, 4000);
    return () => clearInterval(interval);
  }, []);

  // Check count of pending ("חדש") inquiries
  const pendingInquiries = inquiries.filter((i) => i.status === 'חדש');
  const pendingCount = pendingInquiries.length;

  // Web Audio Alarm Synthesizer for new inquiries
  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio alarm chime failed:', e);
    }
  };

  // Trigger continuous audio notification when pendingCount > 0 and not muted
  useEffect(() => {
    if (pendingCount > 0 && !isMuted) {
      playChime();
      alarmIntervalRef.current = setInterval(() => {
        playChime();
      }, 5000);
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    };
  }, [pendingCount, isMuted]);

  // Toggle Inquiry Status ("חדש" <-> "טופל")
  const handleToggleStatus = async (id: string, currentStatus: 'חדש' | 'טופל') => {
    const newStatus = currentStatus === 'חדש' ? 'טופל' : 'חדש';

    // Optimistic update
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
    );

    try {
      const res = await fetch('/api/inquiries/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchInquiries();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
      fetchInquiries();
    }
  };

  // Filtered inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    if (filter === 'pending' && inq.status !== 'חדש') return false;
    if (filter === 'handled' && inq.status !== 'טופל') return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = inq.customerName.toLowerCase().includes(query);
      const matchPhone = inq.customerPhone.includes(query);
      const matchMsg = inq.incomingMessage.toLowerCase().includes(query);
      return matchName || matchPhone || matchMsg;
    }

    return true;
  });

  return (
    <div
      className={`min-h-screen p-4 md:p-6 dir-rtl ${
        darkTheme ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-md">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h1 className="text-xl md:text-2xl font-bold tracking-wide">
                  דף מקבל פניות וניהול נודניק (Nudge Engine)
                </h1>
                {pendingCount > 0 && (
                  <span className="px-3 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full animate-pulse shadow-lg shadow-rose-500/30">
                    {pendingCount} מציקות בטיפול
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                קליטת הזמנות מקבוצת הוואטסאפ (120363390702096083) והפצת נודניקים אוטומטית כל 5 דקות
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Real-time Local Server Listener Status Badge */}
            <div className="flex items-center space-x-2 space-x-reverse px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>האזנה בזמן אמת מהשרת המקומי</span>
            </div>

            {/* Audio Alert Status Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isMuted
                  ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-lg shadow-amber-500/10'
              }`}
              title={isMuted ? 'התראת קול כבויה' : 'התראת קול פעילה'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span>קול מושתק</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>התראת קול פעילה</span>
                </>
              )}
            </button>

            {/* Refresh button */}
            <button
              onClick={fetchInquiries}
              className="p-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600 transition-all"
              title="רענן פניות"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Sub-Tab Switcher Navigation */}
        <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 shadow-lg">
          <button
            onClick={() => setSubView('staging')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subView === 'staging'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>🚚 לוח סידור - לוג הזמנות מערכת (SabanOS)</span>
          </button>

          <button
            onClick={() => setSubView('inquiries')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subView === 'inquiries'
                ? 'bg-[#00a884] text-slate-950 shadow-md scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>📋 פניות נכנסות בוואטסאפ ונודניק ({pendingCount})</span>
          </button>
        </div>

        {subView === 'staging' ? (
          <OrdersStagingTab />
        ) : (
          <>
            {/* Nudge Targets Info Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">קבוצת הזמנות נכנסת (חילוץ Regex)</div>
              <div className="text-xs font-semibold text-slate-200 dir-ltr text-right">
                120363390702096083@g.us
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">קבוצה להתראות נודניק (כל 5 דק')</div>
              <div className="text-xs font-semibold text-slate-200 dir-ltr text-right">
                120363428842730390@g.us
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">התראת נודניק פרטית (ראמי)</div>
              <div className="text-xs font-semibold text-slate-200 dir-ltr text-right">
                972508860896@c.us
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
          {/* Tabs */}
          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
            <button
              onClick={() => setFilter('pending')}
              className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === 'pending'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>חדש - ממתין לטיפול ({inquiries.filter((i) => i.status === 'חדש').length})</span>
            </button>

            <button
              onClick={() => setFilter('handled')}
              className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === 'handled'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>טופל ({inquiries.filter((i) => i.status === 'טופל').length})</span>
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>הכל ({inquiries.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש לפי שם, טלפון או תוכן..."
              className="w-full pr-9 pl-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Inquiries Cards Grid */}
        {filteredInquiries.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">אין פניות להצגה בקטגוריה זו</h3>
            <p className="text-xs text-slate-400 mt-1">
              כל הפניות הנכנסות מקבוצת ההזמנות יופיעו כאן בזמן אמת.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInquiries.map((inq, idx) => {
              const isPending = inq.status === 'חדש';

              return (
                <div
                  key={`${inq.id || 'inq'}-${idx}`}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-lg ${
                    isPending
                      ? 'bg-slate-800/90 border-rose-500/50 shadow-rose-950/20'
                      : 'bg-slate-800/40 border-slate-700/60 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Customer Info & Status Badge */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <User className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-base text-slate-100">
                            {inq.customerName || 'לקוח ללא שם'}
                          </span>
                        </div>

                        {inq.customerPhone && (
                          <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-mono dir-ltr">{inq.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Status Tag */}
                      <div>
                        {isPending ? (
                          <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold rounded-full flex items-center space-x-1.5 space-x-reverse animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>חדש (ממתין לטיפול)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold rounded-full flex items-center space-x-1.5 space-x-reverse">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>טופל</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60">
                      <div className="text-xs text-slate-400 mb-1 flex items-center space-x-1 space-x-reverse">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>תוכן הפנייה שנחלצה:</span>
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {inq.incomingMessage}
                      </p>
                    </div>

                    {/* Metadata & Nudge Count */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {new Date(inq.timestamp).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {isPending && (inq.nudgeCount || 0) > 0 && (
                        <div className="text-rose-400 font-semibold flex items-center space-x-1 space-x-reverse">
                          <Bell className="w-3.5 h-3.5 animate-bounce" />
                          <span>נשלחו {inq.nudgeCount} נודניקים</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fast Action Toggle Button: "חדש" <-> "טופל" */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleToggleStatus(inq.id, inq.status)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 space-x-reverse transition-all shadow-md ${
                        isPending
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>סימון כ-"טופל" (הפסקת נודניק מיידית)</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>החזר לסטטוס "חדש"</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};
