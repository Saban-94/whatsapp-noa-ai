import { Chat, KnowledgeItem, AdminSettings } from '../types';

export const INITIAL_SETTINGS: AdminSettings = {
  systemPrompt: `אתה נועה AI (Noa AI) - העוזרת החכמה והמנהלת האישית של מערכת SabanOS.
תפקידך להעניק שירות לקוחות מעולה, לסנכרן הזמנות, להשיב על תפריטים ומחירונים, ולטפל בלקוחות בצורה אדיבה ומקצועית בעברית.

כללים חשובים:
1. השב תמיד בשפה קולחת, אדיבה ומכבדת.
2. השתמש באימוג'ים מתאימים כדי להפוך את השיחה לנעימה.
3. במידה ולקוח שואל על תפריט או מחירון, היעזר במאגר הידע של SabanOS.
4. אישור הזמנות מתבצע אוטומטית ומסתנכרן מול ה-Webhook המרכזי.`,
  webAppUrl: "https://script.google.com/macros/s/AKfycbwvTGiE1h1AR9csbFhVQczFbOpHVXpyQN6MlIQX1NykSvJnjfi6_zipZOj76xnPqfk/exec",
  webhookSyncEnabled: true,
  activeModel: "gemini-3.6-flash",
  autoReplyEnabled: true,
  typingDelayMs: 1500,
  notificationSoundEnabled: true,
  darkTheme: true,
  operatorName: "מנהל מערכת SabanOS",
  enableBlueTicks: true,
  businessHoursEnabled: false,
  businessHoursStart: "08:00",
  businessHoursEnd: "18:00",
  businessDays: [0, 1, 2, 3, 4], // ראשון - חמישי
  outsideHoursMode: "out_of_office_msg",
  outsideHoursMessage: "שלום! פנית אלינו מחוץ לשעות הפעילות (08:00 - 18:00). הודעתך נקלטה במערכת SabanOS ונשוב אליך בהקדם בשעות הפעילות! ⏰",
};

export const INITIAL_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'kb_1',
    category: 'שעות פעילות',
    title: 'זמני פתיחה וסגירה',
    content: 'ימים א\'-ה\': 09:00 - 23:00, ימי שישי וערבי חג: 09:00 - 15:00. בשבת: סגור.',
    isEnabled: true,
    updatedAt: '2026-08-01',
  },
  {
    id: 'kb_2',
    category: 'תפריט ומחירון',
    title: 'ארוחות עסקיות SabanOS',
    content: 'עסקית צהריים (12:00-16:00): מנה עיקרית + תוספת + שתייה ב-59 ₪. מנות מומלצות: סטייק פרגית במרינדה, המבורגר פרימיום, סלט שוק רענן.',
    isEnabled: true,
    updatedAt: '2026-08-01',
  },
  {
    id: 'kb_3',
    category: 'אירועים וקייטרינג',
    title: 'אירועים חברה וקבוצות',
    content: 'חדר פרטי עד 60 איש. חבילות אירועים החל מ-120 ₪ למשתתף כולל מנות ראשונות, עיקריות חופשיות וקינוחים. כולל מקרן ומערכת הגברה.',
    isEnabled: true,
    updatedAt: '2026-08-01',
  },
  {
    id: 'kb_4',
    category: 'משלוחים',
    title: 'מדיניות משלוחים וזמנים',
    content: 'משלוחים לכל האזור תוך 35-45 דקות. מינימום הזמנה 70 ₪. דמי משלוח 15 ₪ (חינם בהזמנה מעל 200 ₪). מעקב בזמן אמת ב-SabanOS.',
    isEnabled: true,
    updatedAt: '2026-08-01',
  },
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat_noa_ai',
    updatedAt: new Date().toISOString(),
    contact: {
      id: 'c_noa',
      name: 'נועה AI ⚡ (SabanOS)',
      phone: '050-9988776',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      statusText: 'עוזרת ה-AI החכמה של SabanOS | מחוברת בסנכרון חי',
      isOnline: true,
      isPinned: true,
      isAiManaged: true,
      unreadCount: 0,
      labels: ['AI Bot', 'SabanOS', 'VIP'],
      notes: 'סוכנת AI פעילה. מסנכרנת מול Google Apps Script Web App',
    },
    messages: [
      {
        id: 'm1',
        chatId: 'chat_noa_ai',
        sender: 'ai',
        text: 'שלום! שמי נועה, סוכנת ה-AI החכמה של מערכת SabanOS. 👋',
        timestamp: '10:00',
        status: 'read',
      },
      {
        id: 'm2',
        chatId: 'chat_noa_ai',
        sender: 'ai',
        text: 'קישור ה-Google Apps Script Web App חובר והוגדר בהצלחה במערכת:\nhttps://script.google.com/macros/s/AKfycbwvTGiE1h1AR9csbFhVQczFbOpHVXpyQN6MlIQX1NykSvJnjfi6_zipZOj76xnPqfk/exec\n\nסנכרון בזמן אמת מופעל כעת. במה אוכל לסייע לך היום?',
        timestamp: '10:01',
        status: 'read',
      },
    ],
  },
  {
    id: 'chat_david',
    updatedAt: new Date().toISOString(),
    contact: {
      id: 'c_david',
      name: 'דוד סבג (סאבאן ספורט)',
      phone: '052-4433221',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      statusText: 'סאבאן ספורט ציוד וביגוד',
      isOnline: true,
      isPinned: true,
      isAiManaged: true,
      unreadCount: 0,
      labels: ['לקוח VIP', 'סאבאן ספורט'],
    },
    messages: [
      {
        id: 'm_d1',
        chatId: 'chat_david',
        sender: 'user',
        text: 'היי נועה, מה קורה עם משלוח נעלי הספורט מ-SabanOS?',
        timestamp: '10:15',
        status: 'read',
      },
      {
        id: 'm_d2',
        chatId: 'chat_david',
        sender: 'ai',
        text: 'שלום דוד! המשלוח שלך מסאבאן ספורט יצא לדרך כעת עם השליח. מספר המעקב ב-SabanOS עודכן במערכת. 👟📦',
        timestamp: '10:16',
        status: 'read',
      },
    ],
  },
  {
    id: 'chat_michal',
    updatedAt: new Date().toISOString(),
    contact: {
      id: 'c_michal',
      name: 'מיכל מנהלת אירועים',
      phone: '054-7766554',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      statusText: 'אירועי חברה וקייטרינג',
      isOnline: false,
      lastSeen: 'היום ב-09:45',
      isPinned: false,
      isAiManaged: true,
      unreadCount: 1,
      labels: ['אירועים', 'חדש'],
    },
    messages: [
      {
        id: 'm_m1',
        chatId: 'chat_michal',
        sender: 'user',
        text: 'היי נועה, רציתי לברר לגבי תפריט קייטרינג לאירוע חברה של 50 איש ליום חמישי הקרוב.',
        timestamp: '10:22',
        status: 'delivered',
      },
    ],
  },
  {
    id: 'chat_team_group',
    updatedAt: new Date().toISOString(),
    contact: {
      id: 'c_team',
      name: 'קבוצת צוות SabanOS 🚀',
      phone: 'קבוצה · 8 משתתפים',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      statusText: 'קבוצה פנימית לסנכרון משימות ובינה מלאכותית',
      isOnline: true,
      isPinned: false,
      isAiManaged: false,
      unreadCount: 0,
      labels: ['צוות', 'קבוצה'],
    },
    messages: [
      {
        id: 'm_tg1',
        chatId: 'chat_team_group',
        sender: 'agent',
        text: 'צוות יקר, הסנכרון של ה-Webhook מול Google Apps Script הושלם בהצלחה!',
        timestamp: '09:00',
        status: 'read',
      },
      {
        id: 'm_tg2',
        chatId: 'chat_team_group',
        sender: 'user',
        text: 'מעולה, אפשר לראות את כל הלוגים בלוח הבקרה הנסתר של המנהל (Ctrl+Shift+A).',
        timestamp: '09:05',
        status: 'read',
      },
    ],
  },
];
