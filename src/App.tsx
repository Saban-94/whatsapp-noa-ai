import React, { useState, useEffect, useTransition } from 'react';
import {
  loadStoredChats,
  saveStoredChats,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredKnowledgeBase,
  saveStoredKnowledgeBase,
  loadStoredLogs,
  saveStoredLogs,
  resetAllData,
} from './utils/storage';
import { Chat, KnowledgeItem, AdminSettings, WebhookLog, ChatFilter, Message, StagedOrder, ContactTag } from './types';
import { INITIAL_MOCK_STAGED_ORDERS } from './components/Admin/OrdersStagingTab';
import { SidebarHeader } from './components/Sidebar/SidebarHeader';
import { SearchBar } from './components/Sidebar/SearchBar';
import { ChatList } from './components/Sidebar/ChatList';
import { NewChatModal } from './components/Sidebar/NewChatModal';
import { ChatHeader } from './components/Chat/ChatHeader';
import { MessageList } from './components/Chat/MessageList';
import { MessageInput } from './components/Chat/MessageInput';
import { ContactInfoModal } from './components/Chat/ContactInfoModal';
import { AdminModal } from './components/Admin/AdminModal';
import { SplashGateway } from './components/SplashGateway';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PWAMobileInstaller } from './components/PWAMobileInstaller';
import { MobileBottomNav } from './components/MobileBottomNav';
import { WhatsAppMirror } from './pages/WhatsAppMirror';
import { InboundOrdersDashboard } from './components/Admin/InboundOrdersDashboard';
import { playWhatsAppIncomingSound, playWhatsAppOutgoingSound } from './utils/audio';
import { sendNotification, playNotificationSound } from './utils/notificationService';

export default function App() {
  const [chats, setChats] = useState<Chat[]>(loadStoredChats);
  const [settings, setSettings] = useState<AdminSettings>(loadStoredSettings);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>(loadStoredKnowledgeBase);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(loadStoredLogs);
  const [stagedOrders, setStagedOrders] = useState<StagedOrder[]>(INITIAL_MOCK_STAGED_ORDERS);

  const [activeChatId, setActiveChatId] = useState<string>(chats[0]?.id || 'chat_noa_ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [activeMainTab, setActiveMainTab] = useState<'chat' | 'whatsapp-mirror' | 'inbound-dashboard'>('chat');
  const [mobileTab, setMobileTab] = useState<'chats' | 'orders' | 'logistics' | 'admin'>('chats');
  const [pendingInquiriesCount, setPendingInquiriesCount] = useState<number>(0);
  
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isGatewayOpen, setIsGatewayOpen] = useState(true);
  const [isPWAInstallerOpen, setIsPWAInstallerOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Poll server for live C:\ap94 listener events, staged orders & logs
  useEffect(() => {
    // Initial fetch for all staged orders from Google Sheet
    fetch('/api/orders/staged')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.orders) && data.orders.length > 0) {
          setStagedOrders(data.orders);
        }
      })
      .catch(() => {});

    const interval = setInterval(async () => {
      try {
        const stagedRes = await fetch('/api/orders/staged');
        if (stagedRes.ok) {
          const stagedData = await stagedRes.json();
          if (stagedData.orders && Array.isArray(stagedData.orders) && stagedData.orders.length > 0) {
            setStagedOrders(stagedData.orders);
          }
        }
        const eventsRes = await fetch('/api/listener/events');
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          if (eventsData.stagedOrders && Array.isArray(eventsData.stagedOrders) && eventsData.stagedOrders.length > 0) {
            setStagedOrders((prev) => {
              const combined = [...eventsData.stagedOrders, ...prev];
              const uniqueMap = new Map();
              combined.forEach((item) => uniqueMap.set(item.id, item));
              return Array.from(uniqueMap.values());
            });
          }
        }
        const inqRes = await fetch('/api/inquiries');
        if (inqRes.ok) {
          const inqData = await inqRes.json();
          if (inqData.pendingCount !== undefined) {
            setPendingInquiriesCount(inqData.pendingCount);
          }
        }
        const settingsRes = await fetch('/api/admin/settings');
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.logs && Array.isArray(sData.logs) && sData.logs.length > 0) {
            setWebhookLogs(sData.logs);
          }
        }
      } catch (e) {
        // Silently handle offline/background sync
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateListenerEvent = async (phone: string, senderName: string, messageText: string) => {
    try {
      const res = await fetch('/api/listener/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          senderName,
          isGroup: false,
          incomingMessage: messageText,
          sentToWhatsapp: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        let targetChat = chats.find((c) => c.contact.phone === phone || c.contact.name.includes(senderName));
        const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

        if (!targetChat) {
          const newChatId = `chat_${Date.now()}`;
          targetChat = {
            id: newChatId,
            updatedAt: new Date().toISOString(),
            contact: {
              id: `c_${Date.now()}`,
              name: senderName,
              phone,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              isOnline: true,
              isAiManaged: true,
              unreadCount: 0,
            },
            messages: [],
          };
        }

        const userMsg: Message = {
          id: `msg_in_${Date.now()}`,
          chatId: targetChat.id,
          sender: 'user',
          text: messageText,
          timestamp: timeStr,
          status: 'read',
        };

        const aiMsg: Message = {
          id: `msg_ai_${Date.now()}`,
          chatId: targetChat.id,
          sender: 'ai',
          text: data.noaResponse || 'הודעתך התקבלה והועברה לצוות',
          timestamp: timeStr,
          status: 'read',
        };

        setChats((prev) => {
          const exists = prev.some((c) => c.id === targetChat!.id);
          if (exists) {
            return prev.map((c) =>
              c.id === targetChat!.id
                ? { ...c, updatedAt: new Date().toISOString(), messages: [...c.messages, userMsg, aiMsg] }
                : c
            );
          } else {
            return [{ ...targetChat!, messages: [userMsg, aiMsg] }, ...prev];
          }
        });

        if (data.stagedOrder) {
          setStagedOrders((prev) => [data.stagedOrder, ...prev]);
        }

        playWhatsAppIncomingSound();
        sendNotification(`אירוע משרת מקומי C:\\ap94 (${senderName})`, {
          body: data.noaResponse || 'תגובת Noa AI נקלטה',
        });
      }
    } catch (err) {
      console.warn('Simulation error:', err);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: StagedOrder['status']) => {
    setStagedOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Sync state to LocalStorage
  useEffect(() => {
    saveStoredChats(chats);
  }, [chats]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredKnowledgeBase(knowledgeBase);
  }, [knowledgeBase]);

  useEffect(() => {
    saveStoredLogs(webhookLogs);
  }, [webhookLogs]);

  // Global Keyboard Listener for Hidden Admin Dashboard (Ctrl+Shift+A or Cmd+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'ש')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Auto-Archive Inactive Chats Logic
  const runAutoArchive = (currentChats: Chat[], days: number = 7) => {
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    let modified = false;

    const updated = currentChats.map((chat) => {
      // Pinned chats are excluded from auto-archive
      if (chat.contact.isPinned) return chat;

      // Calculate last active timestamp
      let lastTimeMs = new Date(chat.updatedAt).getTime();
      if (isNaN(lastTimeMs) && chat.messages.length > 0) {
        const lastMsg = chat.messages[chat.messages.length - 1];
        if (lastMsg.dateStr) {
          lastTimeMs = new Date(lastMsg.dateStr).getTime();
        }
      }

      // If last message/activity is older than cutoffMs and not already archived
      if (!isNaN(lastTimeMs) && lastTimeMs < cutoffMs) {
        if (!chat.contact.isArchived) {
          modified = true;
          return {
            ...chat,
            contact: {
              ...chat.contact,
              isArchived: true,
            },
          };
        }
      }

      return chat;
    });

    return { updated, modified };
  };

  // Run Auto-Archive on setting change or mount if enabled
  useEffect(() => {
    if (settings.autoArchiveEnabled) {
      const days = settings.autoArchiveDays || 7;
      const { updated, modified } = runAutoArchive(chats, days);
      if (modified) {
        setChats(updated);
      }
    }
  }, [settings.autoArchiveEnabled, settings.autoArchiveDays]);

  const handleManualAutoArchive = () => {
    const days = settings.autoArchiveDays || 7;
    const { updated, modified } = runAutoArchive(chats, days);
    if (modified) {
      setChats(updated);
    }
  };

  // Filtering chats based on search and tab chips
  const filteredChats = chats.filter((chat) => {
    const nameMatch = chat.contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = chat.contact.phone.includes(searchQuery);
    const textMatch = chat.messages.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!(nameMatch || phoneMatch || textMatch)) return false;

    if (activeFilter === 'archived') {
      return chat.contact.isArchived === true;
    }

    // Exclude archived chats from all active chat filters
    if (chat.contact.isArchived) return false;

    if (activeFilter === 'unread') return chat.contact.unreadCount > 0;
    if (activeFilter === 'favorites') return chat.contact.isPinned;
    if (activeFilter === 'groups') return chat.contact.phone.includes('קבוצה');

    return true;
  });

  // Select Chat handler
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileShowChat(true);
    
    // Clear unread count
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, contact: { ...c.contact, unreadCount: 0 } } : c
      )
    );
  };

  // Toggle AI for current contact
  const handleToggleAiForContact = () => {
    if (!activeChat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, contact: { ...c.contact, isAiManaged: !c.contact.isAiManaged } }
          : c
      )
    );
  };

  // Toggle Pin for current contact
  const handleTogglePinContact = () => {
    if (!activeChat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, contact: { ...c.contact, isPinned: !c.contact.isPinned } }
          : c
      )
    );
  };

  // Toggle Archive for contact
  const handleToggleArchiveContact = (targetChatId?: string) => {
    const idToToggle = targetChatId || activeChat?.id;
    if (!idToToggle) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === idToToggle
          ? { ...c, contact: { ...c.contact, isArchived: !c.contact.isArchived } }
          : c
      )
    );
  };

  // Update Blue Ticks Override for current contact
  const handleUpdateContactBlueTicks = (override: 'global' | 'enabled' | 'disabled') => {
    if (!activeChat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? { ...c, contact: { ...c.contact, blueTicksOverride: override } }
          : c
      )
    );
  };

  // Update Contact Color-Coded CRM Tags
  const handleUpdateContactTags = (tags: ContactTag[]) => {
    if (!activeChat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              contact: {
                ...c.contact,
                tags,
                labels: tags.map((t) => t.name),
              },
            }
          : c
      )
    );
  };

  // Create new chat with CRM context & initial order history association
  const handleCreateChat = (
    name: string,
    phone: string,
    isAiManaged: boolean,
    extraDetails?: {
      company?: string;
      address?: string;
      notes?: string;
      initialOrderSummary?: string;
      tags?: ContactTag[];
    }
  ) => {
    const newChatId = `chat_${Date.now()}`;
    
    // Construct initial order history record if specified
    const orderHistory = extraDetails?.initialOrderSummary
      ? [
          {
            id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            items: extraDetails.initialOrderSummary,
            total: 0,
            status: 'בטיפול' as const,
          },
        ]
      : [];

    const initialTags = extraDetails?.tags || [
      { id: 'tag_new', name: 'New Lead', color: 'emerald' },
    ];

    const newChat: Chat = {
      id: newChatId,
      updatedAt: new Date().toISOString(),
      contact: {
        id: `c_${Date.now()}`,
        name,
        phone,
        company: extraDetails?.company,
        address: extraDetails?.address,
        notes: extraDetails?.notes,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        isOnline: true,
        isAiManaged,
        unreadCount: 0,
        orderHistory,
        tags: initialTags,
        labels: initialTags.map((t) => t.name),
      },
      messages: [
        {
          id: `m_init_${Date.now()}`,
          chatId: newChatId,
          sender: 'ai',
          text: `שלום ${name}! שמי נועה AI מסאבאן. תיק הלקוח שלך עודכן במערכת SabanOS${
            extraDetails?.company ? ` (${extraDetails.company})` : ''
          }. במה אוכל לעזור לך היום? 📦`,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
        },
      ],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setMobileShowChat(true);
  };

  // Business hours evaluator helper
  const isWithinBusinessHours = (s: AdminSettings): boolean => {
    if (!s.businessHoursEnabled) return true;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const activeDays = s.businessDays ?? [0, 1, 2, 3, 4];
    if (!activeDays.includes(currentDay)) return false;

    const start = s.businessHoursStart || '08:00';
    const end = s.businessHoursEnd || '18:00';
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [sH, sM] = start.split(':').map(Number);
    const startMinutes = (sH || 0) * 60 + (sM || 0);

    const [eH, eM] = end.split(':').map(Number);
    const endMinutes = (eH || 0) * 60 + (eM || 0);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  };

  // Helper function to transcribe voice notes using AI API
  const transcribeVoiceNote = async (
    contactName: string,
    contextPrompt?: string,
    audioBase64?: string
  ): Promise<string> => {
    try {
      const res = await fetch('/api/transcribe-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName,
          contextPrompt,
          audioBase64,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.transcription || 'תמלול הודעה קולית בוצע בהצלחה.';
    } catch (err) {
      console.warn('Voice transcription fetch issue, using smart fallback:', err);
      return 'שלום! רציתי לברר לגבי סטטוס ההזמנה והמשלוח במערכת SabanOS, תודה!';
    }
  };

  // Manual voice note transcription trigger
  const handleTranscribeVoiceNote = async (msgId: string) => {
    if (!activeChat) return;

    // Indicate loading state
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, isTranscribing: true } : m
              ),
            }
          : c
      )
    );

    const targetMsg = activeChat.messages.find((m) => m.id === msgId);
    const transcriptionText = await transcribeVoiceNote(
      activeChat.contact.name,
      targetMsg?.text || 'הודעה קולית לגבי שירות SabanOS'
    );

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId
                  ? { ...m, transcription: transcriptionText, isTranscribing: false }
                  : m
              ),
            }
          : c
      )
    );
  };

  // Simulate an incoming voice note and transcribe it BEFORE adding to message list
  const handleSimulateIncomingVoiceNote = async () => {
    if (!activeChat) return;

    setIsTyping(true);

    // 1. Transcribe voice note using AI API BEFORE adding message to list
    const transcription = await transcribeVoiceNote(
      activeChat.contact.name,
      'הודעה קולית נכנסת מהלקוח לגבי תיאום משלוח/הזמנה ב-SabanOS'
    );

    setIsTyping(false);

    const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const incomingVoiceNote: Message = {
      id: `msg_voice_in_${Date.now()}`,
      chatId: activeChat.id,
      sender: 'user', // incoming contact message
      text: 'הודעה קולית',
      timestamp: timeStr,
      status: 'delivered',
      type: 'voice_note',
      isVoiceNote: true,
      audioDuration: '0:18',
      transcription, // AI Transcription generated BEFORE adding message to list
    };

    playWhatsAppIncomingSound();

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: [...c.messages, incomingVoiceNote],
            }
          : c
      )
    );

    // Trigger AI response if contact is managed and auto-reply enabled
    if (activeChat.contact.isAiManaged && settings.autoReplyEnabled) {
      setIsTyping(true);
      setTimeout(async () => {
        try {
          const res = await fetch('/api/chat/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: activeChat.id,
              contactName: activeChat.contact.name,
              userMessage: `[הודעה קולית מתומללת מהלקוח]: ${transcription}`,
              conversationHistory: activeChat.messages,
              systemPrompt: settings.systemPrompt,
              knowledgeBase: knowledgeBase,
              customerProfile: activeChat.contact,
              orderHistory: activeChat.contact.orderHistory || [],
            }),
          });
          const data = await res.json();
          const replyText = data.text || 'שמעתי את ההודעה הקולית שלך! אשמח לעזור בנושא.';

          setIsTyping(false);

          const aiMsg: Message = {
            id: `msg_ai_${Date.now()}`,
            chatId: activeChat.id,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          };

          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChat.id
                ? {
                    ...c,
                    messages: c.messages
                      .map((m) => (m.id === incomingVoiceNote.id ? { ...m, status: 'read' } : m))
                      .concat(aiMsg),
                  }
                : c
            )
          );

          playWhatsAppIncomingSound();
        } catch (err) {
          console.warn('Error fetching AI response to voice note:', err);
          setIsTyping(false);

          const fallbackMsg: Message = {
            id: `msg_ai_${Date.now()}`,
            chatId: activeChat.id,
            sender: 'ai',
            text: 'שמעתי את ההודעה הקולית שלך! הודעתך נקלטה במערכת SabanOS ונשמח לסייע. 😊',
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          };

          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChat.id
                ? {
                    ...c,
                    messages: c.messages
                      .map((m) => (m.id === incomingVoiceNote.id ? { ...m, status: 'read' } : m))
                      .concat(fallbackMsg),
                  }
                : c
            )
          );
          playWhatsAppIncomingSound();
        }
      }, settings.typingDelayMs || 1200);
    }
  };

  // Send Message & trigger AI simulation or Webhook
  const handleSendMessage = async (
    text: string,
    type: 'text' | 'image' | 'document' | 'voice_note' = 'text',
    mediaUrl?: string
  ) => {
    if (!activeChat) return;

    const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // If sending a voice note, transcribe it via AI first
    let voiceTranscription: string | undefined = undefined;
    if (type === 'voice_note') {
      voiceTranscription = await transcribeVoiceNote(
        'אתה',
        text || 'הודעה קולית יוצאת'
      );
    }

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      chatId: activeChat.id,
      sender: 'user',
      text,
      timestamp: timeStr,
      status: 'delivered',
      type,
      mediaUrl,
      isVoiceNote: type === 'voice_note',
      audioDuration: type === 'voice_note' ? '0:12' : undefined,
      transcription: voiceTranscription,
    };

    // Play outgoing sound
    playWhatsAppOutgoingSound();

    // Append user message immediately
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              updatedAt: new Date().toISOString(),
              messages: [...c.messages, userMsg],
            }
          : c
      )
    );

    // If contact is AI managed & auto-reply is enabled in settings
    if (activeChat.contact.isAiManaged && settings.autoReplyEnabled) {
      const inBusinessHours = isWithinBusinessHours(settings);

      if (!inBusinessHours) {
        // Outside business hours behavior
        if (settings.outsideHoursMode === 'silent') {
          return;
        }

        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);

          const outOfOfficeMsg: Message = {
            id: `msg_ai_${Date.now()}`,
            chatId: activeChat.id,
            sender: 'ai',
            text: settings.outsideHoursMessage || 'שלום! פנית אלינו מחוץ לשעות הפעילות (08:00 - 18:00). הודעתך נקלטה במערכת SabanOS ונשוב אליך בהקדם בשעות הפעילות! ⏰',
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          };

          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChat.id
                ? {
                    ...c,
                    messages: c.messages.map((m) => (m.id === userMsg.id ? { ...m, status: 'read' } : m)).concat(outOfOfficeMsg),
                  }
                : c
            )
          );

          playWhatsAppIncomingSound();
        }, settings.typingDelayMs || 1200);

        return;
      }

      setIsTyping(true);

      try {
        // Send request to server endpoint /api/chat/respond
        const res = await fetch('/api/chat/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChat.id,
            contactName: activeChat.contact.name,
            userMessage: text,
            conversationHistory: activeChat.messages,
            systemPrompt: settings.systemPrompt,
            knowledgeBase: knowledgeBase,
            customerProfile: activeChat.contact,
            orderHistory: activeChat.contact.orderHistory || [],
          }),
        });

        const data = await res.json();
        const replyText = data.text || 'קיבלתי את הודעתך, אשמח לעזור!';

        setTimeout(() => {
          setIsTyping(false);

          const aiMsg: Message = {
            id: `msg_ai_${Date.now()}`,
            chatId: activeChat.id,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          };

          // Update messages and set user msg status to read
          setChats((prev) =>
            prev.map((c) =>
              c.id === activeChat.id
                ? {
                    ...c,
                    messages: c.messages.map((m) => (m.id === userMsg.id ? { ...m, status: 'read' } : m)).concat(aiMsg),
                  }
                : c
            )
          );

          // Play incoming sound effect
          playWhatsAppIncomingSound();
        }, settings.typingDelayMs || 1200);

      } catch (err) {
        console.warn('Error fetching AI response:', err);
        setIsTyping(false);

        const fallbackMsg: Message = {
          id: `msg_ai_${Date.now()}`,
          chatId: activeChat.id,
          sender: 'ai',
          text: 'שלום! הודעתך נקלטה במערכת SabanOS. נשמח לסייע לך בכל שאלה לגבי משלוחים, הזמנות ומידע נוסף! 😊',
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
        };

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChat.id
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === userMsg.id ? { ...m, status: 'read' } : m)).concat(fallbackMsg),
                }
              : c
          )
        );
        playWhatsAppIncomingSound();
      }
    }
  };

  // Human Operator Manual Intervention / Override Message
  const handleSendHumanOverrideMessage = (chatId: string, text: string) => {
    const timeStr = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const overrideMsg: Message = {
      id: `msg_override_${Date.now()}`,
      chatId,
      sender: 'agent',
      text: `[תגובת נציג מנהל]: ${text}`,
      timestamp: timeStr,
      status: 'read',
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, overrideMsg],
            }
          : c
      )
    );

    playWhatsAppOutgoingSound();
  };

  // Webhook Test Call
  const handleTestWebhook = async () => {
    const res = await fetch('/api/webhook/google-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: settings.webAppUrl,
        payload: {
          action: 'test_ping',
          source: 'SabanOS_Admin_Panel',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const data = await res.json();
    if (data.log) {
      setWebhookLogs((prev) => [...prev, data.log]);
    }
    if (!res.ok) throw new Error(data.error || 'Server error');
  };

  // Reset All Data
  const handleResetData = () => {
    if (confirm('האם אתה בטוח שברצונך לאפס את כל הנתונים והשיחות?')) {
      resetAllData();
      window.location.reload();
    }
  };

  const totalUnreadCount = chats.reduce((acc, c) => acc + (c.contact.unreadCount || 0), 0);

  const handleMobileTabChange = (tab: 'chats' | 'orders' | 'logistics' | 'admin') => {
    setMobileTab(tab);
    if (tab === 'chats') {
      setActiveFilter('all');
      setMobileShowChat(false);
    } else if (tab === 'orders') {
      setActiveFilter('unread');
      setMobileShowChat(false);
    } else if (tab === 'logistics') {
      setActiveFilter('groups');
      setMobileShowChat(false);
    } else if (tab === 'admin') {
      setIsAdminOpen(true);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#090e11] font-['Heebo','Rubik',sans-serif] text-[#e9edef] overflow-hidden select-none relative">
      
      {/* PWA Install Banner & Web Notification Toast */}
      <div className="w-full shrink-0">
        <PWAInstallPrompt darkTheme={settings.darkTheme} />
      </div>

      {/* Outer App Frame Container (Simulates WhatsApp Web Green Header Stripe on Big Screens) */}
      <div className="w-full flex-1 lg:p-4 max-w-[1600px] flex overflow-hidden min-h-0 pb-14 md:pb-0">
        <div className="w-full h-full bg-[#111b21] rounded-none lg:rounded-xl shadow-2xl border border-[#222d34] flex overflow-hidden relative">

          {/* SIDEBAR (Contacts & Chats) */}
          <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col border-l border-[#222d34] bg-[#111b21] shrink-0 ${
            mobileShowChat || activeMainTab !== 'chat' ? 'hidden md:flex' : 'flex'
          }`}>
            <SidebarHeader
              onOpenAdmin={() => setIsAdminOpen(true)}
              onOpenNewChat={() => setIsNewChatOpen(true)}
              onOpenGateway={() => setIsGatewayOpen(true)}
              onOpenWhatsAppMirror={() => setActiveMainTab((prev) => (prev === 'whatsapp-mirror' ? 'chat' : 'whatsapp-mirror'))}
              isMirrorActive={activeMainTab === 'whatsapp-mirror'}
              onOpenInboundDashboard={() => setActiveMainTab((prev) => (prev === 'inbound-dashboard' ? 'chat' : 'inbound-dashboard'))}
              isInboundDashboardActive={activeMainTab === 'inbound-dashboard'}
              onOpenPWAInstaller={() => setIsPWAInstallerOpen(true)}
              pendingInquiriesCount={pendingInquiriesCount}
              darkTheme={settings.darkTheme}
            />
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              darkTheme={settings.darkTheme}
            />
            <ChatList
              chats={filteredChats}
              activeChatId={activeChatId}
              onSelectChat={(id) => {
                setActiveMainTab('chat');
                handleSelectChat(id);
              }}
              darkTheme={settings.darkTheme}
              enableBlueTicks={settings.enableBlueTicks}
              activeFilter={activeFilter}
            />
          </div>

          {/* MAIN VIEW AREA: WHATSAPP MIRROR, INBOUND DASHBOARD, OR STANDARD CHAT */}
          {activeMainTab === 'whatsapp-mirror' ? (
            <div className="flex-1 flex flex-col min-w-0 bg-[#0b141a] relative h-full">
              <WhatsAppMirror darkTheme={settings.darkTheme} />
            </div>
          ) : activeMainTab === 'inbound-dashboard' ? (
            <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative h-full overflow-y-auto">
              <InboundOrdersDashboard darkTheme={settings.darkTheme} />
            </div>
          ) : activeChat ? (
            <div className={`flex-1 flex flex-col min-w-0 bg-[#0b141a] relative ${
              !mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}>
              <ChatHeader
                contact={activeChat.contact}
                isTyping={isTyping}
                onBackMobile={() => setMobileShowChat(false)}
                onOpenContactInfo={() => setIsContactInfoOpen(!isContactInfoOpen)}
                onToggleAi={handleToggleAiForContact}
                darkTheme={settings.darkTheme}
              />
              
              <div className="flex-1 flex min-h-0 relative">
                <div className="flex-1 flex flex-col min-w-0 h-full">
                  <MessageList
                    messages={activeChat.messages}
                    darkTheme={settings.darkTheme}
                    contactName={activeChat.contact.name}
                    enableBlueTicks={
                      activeChat.contact.blueTicksOverride === 'enabled'
                        ? true
                        : activeChat.contact.blueTicksOverride === 'disabled'
                        ? false
                        : (settings.enableBlueTicks ?? true)
                    }
                    chatId={activeChat.id}
                    onTranscribeVoiceNote={handleTranscribeVoiceNote}
                  />
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    onSimulateIncomingVoiceNote={handleSimulateIncomingVoiceNote}
                    darkTheme={settings.darkTheme}
                    isAiManaged={activeChat.contact.isAiManaged}
                    quickReplies={settings.quickReplies}
                  />
                </div>

                {/* Contact Detail Modal Drawer */}
                <ContactInfoModal
                  contact={activeChat.contact}
                  isOpen={isContactInfoOpen}
                  onClose={() => setIsContactInfoOpen(false)}
                  onToggleAi={handleToggleAiForContact}
                  onTogglePin={handleTogglePinContact}
                  onToggleArchive={handleToggleArchiveContact}
                  onUpdateContactBlueTicks={handleUpdateContactBlueTicks}
                  onUpdateContactTags={handleUpdateContactTags}
                  globalBlueTicks={settings.enableBlueTicks}
                  darkTheme={settings.darkTheme}
                />
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-[#8696a0] whatsapp-chat-bg-dark border-b-8 border-[#00a884]">
              <div className="w-16 h-16 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884] mb-4">
                <span className="text-2xl font-bold">WA</span>
              </div>
              <h2 className="text-xl font-bold text-[#e9edef] mb-2">WhatsApp Web - SabanOS</h2>
              <p className="text-sm max-w-md">
                שלח והקבל הודעות בזמן אמת בסנכרון מול Noa AI וה-Google Apps Script Web App.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* NEW CHAT MODAL */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreateChat={handleCreateChat}
      />

      {/* HIDDEN ADMIN DASHBOARD MODAL */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        chats={chats}
        settings={settings}
        onUpdateSettings={setSettings}
        knowledgeBase={knowledgeBase}
        onUpdateKnowledgeBase={setKnowledgeBase}
        webhookLogs={webhookLogs}
        stagedOrders={stagedOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onSimulateListenerEvent={handleSimulateListenerEvent}
        onSendHumanOverrideMessage={handleSendHumanOverrideMessage}
        onTestWebhook={handleTestWebhook}
        onResetData={handleResetData}
        onRunAutoArchive={handleManualAutoArchive}
      />

      {/* ENTRANCE GATEWAY DOOR SPLIT MODAL */}
      <SplashGateway
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
        darkTheme={settings.darkTheme}
      />

      {/* MOBILE PWA INSTALLER & SOUND MODAL */}
      <PWAMobileInstaller
        isOpen={isPWAInstallerOpen}
        onClose={() => setIsPWAInstallerOpen(false)}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <MobileBottomNav
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        unreadCountTotal={totalUnreadCount}
        darkTheme={settings.darkTheme}
      />

    </div>
  );
}
