import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Send,
  RefreshCw,
  Search,
  Bot,
  User,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  MessageSquare,
  Sparkles,
  Zap,
  Radio,
  Sliders,
  Terminal,
  Pin,
  MoreVertical,
  CheckCheck,
  Building2,
  FileText,
  MapPin,
  Tag,
  Info,
  X,
  Bell,
} from 'lucide-react';
import { ListenerEventPayload, CustomerProfile } from '../types';
import { CustomerProfileDrawer } from '../components/Chat/CustomerProfileDrawer';
import { NoaCommandCenter } from '../components/Admin/NoaCommandCenter';
import { playWhatsAppIncomingSound, playWhatsAppOutgoingSound } from '../utils/audio';

interface WhatsAppMirrorProps {
  darkTheme?: boolean;
}

export const WhatsAppMirror: React.FC<WhatsAppMirrorProps> = ({ darkTheme = true }) => {
  // Live listener events & sync state
  const [events, setEvents] = useState<ListenerEventPayload[]>([]);
  const [profiles, setProfiles] = useState<Record<string, CustomerProfile>>({});
  const [chatModes, setChatModes] = useState<Record<string, 'auto' | 'manual'>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'direct' | 'groups' | 'manual'>('all');

  // Toast Notification state
  const [toastNotification, setToastNotification] = useState<{
    senderName: string;
    message: string;
  } | null>(null);

  // Track event IDs to trigger audio and toasts on new items
  const prevEventIdsRef = useRef<Set<string>>(new Set());

  // Selected Active Chat ID in Mirror ('noa_command' or phone number)
  const [activeChatPhone, setActiveChatPhone] = useState<string>('noa_command');

  // Drawer state
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);

  // Manual Typing Input State
  const [manualInput, setManualInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);

  // Auto Scroll Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Sync & Listener Events
  const fetchSyncData = async () => {
    try {
      setIsLoading(true);
      const [eventsRes, syncRes] = await Promise.all([
        fetch('/api/listener/events'),
        fetch('/api/chat/sync'),
      ]);

      if (eventsRes.ok) {
        const evtData = await eventsRes.json();
        if (evtData.events && Array.isArray(evtData.events)) {
          const newEventsList: ListenerEventPayload[] = evtData.events;
          
          // Preserve local optimistic messages so they don't blink or vanish
          setEvents((prev) => {
            const serverIds = new Set(newEventsList.map((e) => e.id));
            const pendingOptimistic = prev.filter(
              (pe) => pe.id && pe.id.startsWith('evt_opt_') && !serverIds.has(pe.id)
            );
            return [...newEventsList, ...pendingOptimistic];
          });

          // Check for new incoming events that weren't seen before
          let newlyArrived: ListenerEventPayload | null = null;
          newEventsList.forEach((e) => {
            if (e.id && !prevEventIdsRef.current.has(e.id)) {
              if (!prevEventIdsRef.current.has('initial_seed')) {
                // Initial load, don't play sound for all old messages
              } else {
                newlyArrived = e;
              }
              prevEventIdsRef.current.add(e.id);
            }
          });

          if (!prevEventIdsRef.current.has('initial_seed')) {
            prevEventIdsRef.current.add('initial_seed');
          } else if (newlyArrived) {
            // Trigger audio chime and toast!
            playWhatsAppIncomingSound();
            const sender = (newlyArrived as any).senderName || (newlyArrived as any).parsedClientName || 'לקוח';
            const msgText = (newlyArrived as any).incomingMessage || 'הודעה חדשה מתקבלת בוואטסאפ';
            setToastNotification({
              senderName: sender,
              message: msgText,
            });

            setTimeout(() => {
              setToastNotification(null);
            }, 5000);
          }
        }
      }

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.profiles) setProfiles(syncData.profiles);
        if (syncData.chatModes) setChatModes(syncData.chatModes);
      }
    } catch (err) {
      console.warn('Sync error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchSyncData, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Scroll to bottom when messages change or active chat changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events, activeChatPhone]);

  // Helper to extract phone / chat key safely without defaulting to placeholder '0500000000'
  const extractPhoneKey = (evt: ListenerEventPayload): string => {
    const raw =
      evt.phone ||
      (evt as any).senderPhone ||
      (evt as any).customerPhone ||
      (evt as any).from ||
      (evt as any).phone_number ||
      (evt as any).chatId ||
      '';
    const digits = raw ? raw.replace(/\D/g, '') : '';
    if (digits && digits.length >= 7) return digits;
    if (raw && raw.trim() && raw !== '0500000000') return raw.trim();
    if (evt.isGroup && evt.groupId) return evt.groupId;
    if (evt.id) return `chat_${evt.id}`;
    return 'unknown_chat';
  };

  // Group events by phone number or unique chat identifier into customer threads
  const customerChatThreads = React.useMemo(() => {
    const threadMap: Record<
      string,
      {
        phone: string;
        name: string;
        isGroup: boolean;
        groupId?: string;
        lastEvent: ListenerEventPayload;
        eventList: ListenerEventPayload[];
        mode: 'auto' | 'manual';
      }
    > = {};

    events.forEach((evt) => {
      const phoneKey = extractPhoneKey(evt);
      const rawPhone =
        evt.phone ||
        (evt as any).senderPhone ||
        (evt as any).customerPhone ||
        (evt as any).from ||
        '';
      const cleanDigits = rawPhone ? rawPhone.replace(/\D/g, '') : '';

      if (!threadMap[phoneKey]) {
        const profile = profiles[phoneKey] || (cleanDigits ? profiles[cleanDigits] : null);
        const displayName =
          profile?.name ||
          evt.senderName ||
          evt.parsedClientName ||
          (evt as any).contactName ||
          (evt as any).sender ||
          (cleanDigits ? `לקוח (${cleanDigits})` : evt.groupId ? `קבוצה ${evt.groupId}` : 'לקוח');

        threadMap[phoneKey] = {
          phone: phoneKey,
          name: displayName,
          isGroup: evt.isGroup || false,
          groupId: evt.groupId,
          lastEvent: evt,
          eventList: [evt],
          mode: chatModes[phoneKey] || (cleanDigits ? chatModes[cleanDigits] : null) || profile?.mode || 'auto',
        };
      } else {
        threadMap[phoneKey].eventList.push(evt);
        threadMap[phoneKey].lastEvent = evt; // Latest
      }
    });

    return Object.values(threadMap);
  }, [events, profiles, chatModes]);

  // Filter threads
  const filteredThreads = customerChatThreads.filter((t) => {
    const matchSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery) ||
      t.lastEvent.incomingMessage?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (activeFilter === 'groups') return t.isGroup;
    if (activeFilter === 'direct') return !t.isGroup;
    if (activeFilter === 'manual') return t.mode === 'manual' || t.lastEvent.incomingMessage?.includes('[מעקף מנהל ידני]');

    return true;
  });

  // Handle Mode Switch Toggle for active chat
  const handleToggleModeForPhone = async (phone: string, newMode: 'auto' | 'manual') => {
    setChatModes((prev) => ({ ...prev, [phone]: newMode }));
    try {
      await fetch('/api/chat/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, mode: newMode }),
      });
      fetchSyncData();
    } catch (err) {
      console.warn('Mode toggle error:', err);
    }
  };

  // Active chat details
  const activeThread = customerChatThreads.find((t) => t.phone === activeChatPhone);
  const activeProfile = profiles[activeChatPhone] || profiles[activeChatPhone.replace(/\D/g, '')] || null;
  const activeMode = chatModes[activeChatPhone] || activeProfile?.mode || 'auto';

  // Handle Manual Message Dispatch in Active Chat Thread (Optimistic UI - Never Delete on Error)
  const handleSendManual = async (e?: React.FormEvent, retryText?: string, targetEvtId?: string) => {
    if (e) e.preventDefault();
    const textToSend = (retryText || manualInput).trim();
    if (!textToSend || !activeChatPhone || activeChatPhone === 'noa_command') return;

    setIsSending(true);
    setSendFeedback(null);

    const targetName = activeThread?.name || 'לקוח';
    const optId = targetEvtId || `evt_opt_${Date.now()}`;

    // Create optimistic event entry
    const optimisticEvt: ListenerEventPayload = {
      id: optId,
      phone: activeChatPhone,
      senderName: 'מנהל מערכת (SabanOS Operator)',
      isGroup: activeThread?.isGroup || false,
      parsedClientName: targetName,
      incomingMessage: `[מעקף מנהל ידני] ${textToSend}`,
      noaResponse: textToSend,
      sentToWhatsapp: false,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    // Immediately update local state - message will NEVER disappear
    setEvents((prev) => {
      const exists = prev.some((item) => item.id === optId);
      if (exists) {
        return prev.map((item) => (item.id === optId ? optimisticEvt : item));
      }
      return [...prev, optimisticEvt];
    });

    if (!retryText) {
      setManualInput('');
    }

    try {
      const res = await fetch('/api/chat/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: activeChatPhone,
          contactName: targetName,
          senderName: 'מנהל מערכת (SabanOS Operator)',
          message: textToSend,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Mark optimistic message as successfully sent
        setEvents((prev) =>
          prev.map((item) =>
            item.id === optId ? { ...item, sentToWhatsapp: true, status: 'sent' } : item
          )
        );
        playWhatsAppOutgoingSound();
        setSendFeedback('הודעת המעקף נשלחה בוואטסאפ בהצלחה!');
        setTimeout(() => setSendFeedback(null), 3000);
      } else {
        throw new Error(data.error || 'שגיאה בשליחת הודעה לשרת');
      }
    } catch (err: any) {
      // DO NOT delete message! Mark status as failed and allow retry
      setEvents((prev) =>
        prev.map((item) =>
          item.id === optId ? { ...item, status: 'failed' } : item
        )
      );
      setSendFeedback(`שגיאה בשליחה: ${err?.message || 'ההודעה נשמרה בלוקאל - ניתן ללחוץ לניסיון חוזר'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Generate AI Response Draft via /api/chat/generate
  const handleGenerateAiDraft = async () => {
    if (!activeChatPhone || activeChatPhone === 'noa_command') return;
    setIsGeneratingAi(true);
    setSendFeedback('🤖 מייצר מענה חכם דרך Gemini / SabanOS...');

    try {
      const lastIncoming = activeThread?.lastEvent?.incomingMessage || 'שלום, במה אוכל לעזור?';
      const res = await fetch('/api/chat/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: lastIncoming,
          phone: activeChatPhone,
          senderName: activeThread?.name || 'לקוח',
          context: activeProfile
            ? `חשבון: ${activeProfile.accountNumber || ''}, הערות: ${activeProfile.notes || ''}`
            : '',
        }),
      });

      const data = await res.json();
      const aiReply = data.response || data.reply || data.text;
      if (res.ok && aiReply) {
        setManualInput(aiReply);
        setSendFeedback('✨ מענה AI נוצר בהצלחה! לחץ "שלח לוואטסאפ" לבחירה.');
      } else {
        throw new Error(data.error || 'נכשלה יצירת מענה ב-Gemini');
      }
    } catch (err: any) {
      console.warn('AI Generate error:', err);
      setSendFeedback(`שגיאה ביצירת AI: ${err?.message || 'השרת לא החזיר מענה'}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] overflow-hidden select-none dir-rtl font-sans">
      
      {/* MAIN 2-COLUMN WHATSAPP WEB MIRROR SPLIT LAYOUT */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: CHAT THREADS LIST & SEARCH */}
        <div className="w-full md:w-[380px] lg:w-[420px] bg-[#111b21] flex flex-col border-l border-[#222d34] shrink-0">
          
          {/* Left Column Header */}
          <div className="h-[60px] px-4 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884]">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-[#e9edef] leading-tight">שיקוף וואטסאפ נועה</h1>
                <span className="text-[10px] text-[#00a884] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-ping" />
                  🟢 Live Server C:\ap94
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#aebac1]">
              <button
                onClick={fetchSyncData}
                className="p-1.5 rounded-full hover:bg-[#374248]/50 text-[#00a884] transition-colors cursor-pointer"
                title="רענן נתוני סנכרון"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  autoRefresh ? 'text-[#00a884] bg-[#00a884]/10' : 'text-[#8696a0]'
                }`}
                title="סנכרון חי אוטומטי"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-2 bg-[#111b21] border-b border-[#222d34]">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute right-3 text-[#8696a0] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי שם, טלפון או תוכן..."
                className="w-full text-xs pr-9 pl-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 bg-[#111b21] border-b border-[#222d34] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'הכל', count: customerChatThreads.length + 1 },
              { id: 'direct', label: 'שיחות פרטיות', count: customerChatThreads.filter((t) => !t.isGroup).length },
              { id: 'groups', label: 'קבוצות 👥', count: customerChatThreads.filter((t) => t.isGroup).length },
              { id: 'manual', label: 'מצב ידני 👤', count: customerChatThreads.filter((t) => t.mode === 'manual').length },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-[#00a884]/20 border border-[#00a884] text-[#00a884]'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[9px] bg-[#111b21] px-1.5 py-0.2 rounded-full">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CHAT THREADS LIST */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/60 custom-scrollbar">
            
            {/* PINNED CHAT NODE 1: NOA COMMAND CENTER ("מלשינון") */}
            <div
              onClick={() => setActiveChatPhone('noa_command')}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                activeChatPhone === 'noa_command'
                  ? 'bg-[#2a3942]'
                  : 'bg-[#182229] hover:bg-[#202c33]'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-[#00a884]/20 border-2 border-[#00a884] flex items-center justify-center text-[#00a884]">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 absolute -top-1 -right-1" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-xs font-bold text-[#e9edef] flex items-center gap-1.5 truncate">
                    <span>נועה AI — מפקדת מערכת ("מלשינון")</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                    VIP System
                  </span>
                </div>

                <p className="text-[11px] text-[#00a884] truncate flex items-center gap-1 font-semibold">
                  <Terminal className="w-3 h-3" />
                  <span>מרכז שליטה, דוחות ופקודות תפעוליות</span>
                </p>

                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] bg-[#00a884]/20 text-[#00a884] px-1.5 py-0.2 rounded-full font-bold">
                    🟢 השרת מאזין בלייב
                  </span>
                  <span className="text-[9px] text-[#8696a0] font-mono">+972508861080</span>
                </div>
              </div>
            </div>

            {/* CUSTOMER STREAM CHATS LIST */}
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-[#8696a0] text-xs">
                לא נמצאו שיחות לקוח מתאימות
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeChatPhone === thread.phone;
                const lastEvt = thread.lastEvent;
                const isManual = thread.mode === 'manual';
                const timeStr = lastEvt.timestamp
                  ? new Date(lastEvt.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                  : 'עכשיו';

                return (
                  <div
                    key={thread.phone}
                    onClick={() => setActiveChatPhone(thread.phone)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                      isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                    }`}
                  >
                    {/* Customer Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                          isManual
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                            : thread.isGroup
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                            : 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/50'
                        }`}
                      >
                        {thread.isGroup ? <Users className="w-4 h-4" /> : thread.name.charAt(0)}
                      </div>
                    </div>

                    {/* Chat info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-[#e9edef] truncate">
                          {thread.name}
                        </h4>
                        <span className="text-[10px] text-[#8696a0] font-mono">{timeStr}</span>
                      </div>

                      <p className="text-[11px] text-[#8696a0] truncate leading-tight">
                        {lastEvt.incomingMessage || lastEvt.noaResponse || 'אין הודעות קודמות'}
                      </p>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-[#8696a0] dir-ltr font-mono">
                          {thread.phone}
                        </span>

                        {/* Mode Badge */}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${
                            isManual
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-[#00a884]/20 text-[#00a884] border-[#00a884]/40'
                          }`}
                        >
                          {isManual ? '👤 Manual' : '🤖 Auto-Noa'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT THREAD VIEW / NOA COMMAND CENTER */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0b141a] relative h-full overflow-hidden">
          
          {activeChatPhone === 'noa_command' ? (
            /* RENDER NOA COMMAND CENTER IN ACTIVE AREA */
            <NoaCommandCenter darkTheme={darkTheme} />
          ) : activeThread ? (
            /* RENDER CUSTOMER WHATSAPP CONVERSATION THREAD */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Active Customer Chat Header */}
              <div className="h-[60px] px-4 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer ${
                      activeMode === 'manual'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500'
                        : 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]'
                    }`}
                    onClick={() => setIsProfileDrawerOpen(true)}
                  >
                    {activeThread.isGroup ? <Users className="w-5 h-5" /> : activeThread.name.charAt(0)}
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-[#e9edef] flex items-center gap-2">
                      <span>{activeThread.name}</span>
                      {activeProfile?.accountNumber && (
                        <span className="text-[10px] bg-[#111b21] text-[#00a884] px-1.5 py-0.2 rounded font-mono border border-[#2a3942]">
                          {activeProfile.accountNumber}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-[#8696a0] dir-ltr font-mono flex items-center gap-2">
                      <span>{activeThread.phone}</span>
                      <span className="text-[#00a884]">• סונכרן ל-Local Listener</span>
                    </p>
                  </div>
                </div>

                {/* Right Controls: Mode Toggle & Profile Button */}
                <div className="flex items-center gap-3">
                  
                  {/* Mode Switch Toggle */}
                  <div className="flex items-center bg-[#111b21] p-1 rounded-xl border border-[#2a3942]">
                    <button
                      onClick={() => handleToggleModeForPhone(activeChatPhone, 'auto')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activeMode === 'auto'
                          ? 'bg-[#00a884] text-[#111b21]'
                          : 'text-[#8696a0] hover:text-[#e9edef]'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>🤖 Auto-Noa</span>
                    </button>

                    <button
                      onClick={() => handleToggleModeForPhone(activeChatPhone, 'manual')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activeMode === 'manual'
                          ? 'bg-amber-500 text-black'
                          : 'text-[#8696a0] hover:text-[#e9edef]'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>👤 Manual Admin</span>
                    </button>
                  </div>

                  {/* Open Profile Drawer Button */}
                  <button
                    onClick={() => setIsProfileDrawerOpen(true)}
                    className="px-3 py-1.5 bg-[#00a884]/20 hover:bg-[#00a884]/30 text-[#00a884] border border-[#00a884]/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="פתח פרופיל לקוח ח.סבן"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>פרופיל לקוח</span>
                  </button>
                </div>
              </div>

              {/* Message History Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar whatsapp-chat-bg-dark">
                {activeThread.eventList.map((evt, idx) => {
                  const isManualMsg = evt.incomingMessage?.includes('[מעקף מנהל ידני]');
                  const timeFormatted = evt.timestamp
                    ? new Date(evt.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                    : 'עכשיו';

                  return (
                    <div key={evt.id || idx} className="space-y-2">
                      
                      {/* Incoming Customer Message */}
                      <div className="flex justify-start">
                        <div className="max-w-[80%] bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none border border-[#2a3942] text-xs shadow-md space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-[#8696a0] border-b border-[#2a3942] pb-1">
                            <span className="font-bold text-[#00a884]">{evt.senderName || 'לקוח'}</span>
                            <span className="font-mono">{timeFormatted}</span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{evt.incomingMessage}</p>
                        </div>
                      </div>

                      {/* Noa AI or Manual Reply */}
                      {evt.noaResponse && (
                        <div className="flex justify-end">
                          <div
                            className={`max-w-[80%] p-3 rounded-2xl rounded-tr-none text-xs shadow-md space-y-1 ${
                              evt.status === 'failed'
                                ? 'bg-rose-950/90 text-rose-100 border border-rose-500/80'
                                : isManualMsg
                                ? 'bg-amber-950/80 text-amber-100 border border-amber-600/50'
                                : 'bg-[#005c4b] text-[#e9edef]'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] opacity-80 border-b border-white/10 pb-1">
                              <span className="font-bold flex items-center gap-1">
                                {evt.status === 'failed' ? (
                                  <>
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                    שליחה נכשלה (נשמר בזיכרון)
                                  </>
                                ) : isManualMsg ? (
                                  <>
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    מעקף מנהל ידני
                                  </>
                                ) : (
                                  <>
                                    <Bot className="w-3 h-3 text-[#00a884]" />
                                    מענה אוטומטי Noa AI
                                  </>
                                )}
                              </span>
                              <span className="font-mono flex items-center gap-1">
                                {evt.status === 'sending' ? (
                                  <RefreshCw className="w-3 h-3 text-amber-300 animate-spin" />
                                ) : evt.status === 'failed' ? (
                                  <button
                                    onClick={() => handleSendManual(undefined, evt.noaResponse, evt.id)}
                                    className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded font-sans font-bold text-[9px] cursor-pointer flex items-center gap-1 shadow"
                                    title="לחץ לניסיון שליחה חוזר"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    נסה שוב
                                  </button>
                                ) : (
                                  <CheckCheck className="w-3 h-3 text-cyan-300" />
                                )}
                                {timeFormatted}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{evt.noaResponse}</p>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Feedback toast */}
              {sendFeedback && (
                <div className="px-4 py-2 bg-[#00a884]/20 border-t border-[#00a884]/50 text-[#00a884] text-xs font-bold text-center">
                  {sendFeedback}
                </div>
              )}

              {/* Typing Box */}
              <div className="p-3 bg-[#202c33] border-t border-[#222d34] shrink-0">
                <form onSubmit={(e) => handleSendManual(e)} className="flex items-center gap-2">
                  
                  {/* AI Generate Prompt Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAiDraft}
                    disabled={isGeneratingAi || isSending}
                    className="p-2.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 text-xs shrink-0"
                    title="חולל טיוטת תשובה חכמה ב-Gemini / Noa AI"
                  >
                    {isGeneratingAi ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-purple-300" />
                        <span className="hidden md:inline">צור מענה AI</span>
                      </>
                    )}
                  </button>

                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={
                      activeMode === 'manual'
                        ? 'הקלד תגובה ידנית של המנהל (תעקוף את Noa AI ותשלח לוואטסאפ)...'
                        : 'הקלד הודעת מעקף ללקוח (או לחץ "צור מענה AI")...'
                    }
                    disabled={isSending}
                    className="flex-1 text-xs px-4 py-2.5 rounded-xl bg-[#111b21] border border-[#2a3942] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
                  />

                  <button
                    type="submit"
                    disabled={isSending || !manualInput.trim()}
                    className="p-2.5 bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 text-xs"
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">שלח לוואטסאפ</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>
          ) : (
            /* DEFAULT PLACEHOLDER SCREEN */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#8696a0]">
              <Bot className="w-16 h-16 text-[#00a884]/40 mb-3 animate-bounce" />
              <h3 className="text-base font-bold text-[#e9edef] mb-1">בחר שיחה מתוך הרשימה</h3>
              <p className="text-xs max-w-sm">
                בחר בצ'אט 'נועה AI מפקדת' לפקודות מערכת, או בשיחת לקוח לצפייה בשיקוף ומענה ידני.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* SLIDE-OVER CUSTOMER PROFILE DRAWER */}
      {isProfileDrawerOpen && activeChatPhone !== 'noa_command' && (
        <CustomerProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          phone={activeChatPhone}
          customerName={activeThread?.name || 'לקוח'}
          initialProfile={activeProfile}
          onProfileUpdated={(updated) => {
            setProfiles((prev) => ({ ...prev, [activeChatPhone]: updated }));
            fetchSyncData();
          }}
          onModeChanged={(newMode) => {
            handleToggleModeForPhone(activeChatPhone, newMode);
          }}
        />
      )}

      {/* REAL-TIME INCOMING MESSAGE TOAST NOTIFICATION */}
      {toastNotification && (
        <div className="fixed top-5 left-5 z-50 max-w-sm bg-[#202c33] border-2 border-[#00a884] rounded-2xl p-4 shadow-2xl text-[#e9edef] animate-bounce-short flex items-start gap-3">
          <div className="p-2 bg-[#00a884]/20 text-[#00a884] rounded-full shrink-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-xs text-[#00a884] truncate">
                📩 הודעה חדשה מ-{toastNotification.senderName}
              </span>
              <button
                onClick={() => setToastNotification(null)}
                className="text-[#8696a0] hover:text-[#e9edef] p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#e9edef]/90 line-clamp-2 leading-relaxed dir-rtl">
              "{toastNotification.message}"
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
