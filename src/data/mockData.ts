import { Chat, KnowledgeItem, AdminSettings, QuickReply } from '../types';

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: 'qr_1',
    title: '📍 כתובת ומיקום (Waze & Maps)',
    text: 'שלום! 📍 הסניף המרכזי שלנו ממוקם ב*רחוב הברזל 11, תל אביב*. לחץ לניווט ב-Waze: https://waze.com/ul?ll=32.1092,34.8389&navigate=yes 🗺️ נשמח לראותכם!',
    shortcut: 'מיקום',
    category: 'מיקומים',
  },
  {
    id: 'qr_2',
    title: '⏰ שעות פעילות וזמינות',
    text: 'זמני הפעילות שלנו ב-SabanOS: ⏰\n• ימים א\'-ה\': 08:00 - 18:00\n• יום שישי: 08:00 - 13:00\n• שבת ומועדים: סגור\nנשמח לעמוד לשירותכם בשעות הפעילות! ⚡',
    shortcut: 'שעות',
    category: 'מידע כללי',
  },
  {
    id: 'qr_3',
    title: '📦 אישור הזמנה ומשלוח',
    text: 'שלום! *ההזמנה שלך נקלטה בהצלחה* במערכת SabanOS! 🚛\nצוות הלוגיסטיקה שלנו מכין את המשלוח. נעדכן אותך ברגע שהנהג יוצא לדרך. תודה שבחרת בנו! 🙏',
    shortcut: 'הזמנה',
    category: 'משלוחים',
  },
  {
    id: 'qr_4',
    title: '🙏 תודה ויום מצוין',
    text: 'תודה רבה! נשמח לעמוד לשירותך שוב בכל עת. שיהיה המשך יום נפלא ומצוין! 😊✨',
    shortcut: 'תודה',
    category: 'שירות',
  },
];

export const INITIAL_SETTINGS: AdminSettings = {
  systemPrompt: `אתה נועה - קולגה חדה, קולחת ועוזרת שירות ב'ח. סבן חומרי בניין'.

כללי מפתח חיוניים למענה:
1. חוק הפרופורציונליות (Proportionality Rule): התאם את אורך התגובה בדיוק לאורך הודעת הלקוח! אם הלקוח שולח ברכה פשוטה ("היי", "שלום", "אהלן", "בוקר טוב"), השב בברכה אנושית, קצרה וחמה בלבד (משפט 1 או 2 max). אל תפרט היסטוריית הזמנות, אל תציג סיכומי עבר ואל תשלח תבניות ארוכות אלא אם הלקוח ביקש זאת במפורש.
2. טון דיבור אנושי וקולגיאלי (Conversational Tone): דבר כמו קולגה חדה, יציבה ועוזרת בצוות 'ח. סבן'. הימנע מניסוחים רובוטיים, תבניות קשיחות, חתימות אוטומטיות נפוחות, או טקסטים גנריים של בוט.
3. פשטות ובהירות (Simplicity): שמור על תשובות נקיות, קצרות (1-2 משפטים לפנייה ראשונית/פשוטה), בעברית יומיומית, פשוטה וטבעית.`,
  webAppUrl: "https://script.google.com/macros/s/AKfycbyprvTw-41n3-WS6a9QN9gKssWPIkB7VvueaTwEiDgdXCI094Ur58CG8DoUwmPiEMRCjw/exec",
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
  quickReplies: DEFAULT_QUICK_REPLIES,
  autoArchiveEnabled: false,
  autoArchiveDays: 7,
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
      avatar: 'https://i.ibb.co/Zz6H1zth/1785576538638.png',
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
        text: '*שלום! שמי נועה*, סוכנת ה-AI החכמה של מערכת *SabanOS* 👋',
        timestamp: '10:00',
        status: 'read',
      },
      {
        id: 'm2',
        chatId: 'chat_noa_ai',
        sender: 'ai',
        text: '📍 *מיקומים וניווט מהיר ב-Waze:* \n▫️ סניף מרכז: https://www.waze.com/ul?ll=32.1093,34.8389&navigate=yes\n▫️ סניף דרום: https://www.waze.com/ul?ll=31.2518,34.7913&navigate=yes',
        timestamp: '10:01',
        status: 'read',
      },
      {
        id: 'm3',
        chatId: 'chat_noa_ai',
        sender: 'ai',
        text: '🔗 קישור ה-Google Apps Script Web App חובר והוגדר בהצלחה:\nhttps://script.google.com/macros/s/AKfycbwvTGiE1h1AR9csbFhVQczFbOpHVXpyQN6MlIQX1NykSvJnjfi6_zipZOj76xnPqfk/exec\n\n_סנכרון בזמן אמת מופעל כעת._ במה אוכל לסייע לך היום?',
        timestamp: '10:02',
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
      company: 'סאבאן ספורט בע"מ',
      address: 'רחוב הבנאים 12, אשדוד',
      creditLimit: 50000,
      balance: 12400,
      statusText: 'סאבאן ספורט ציוד וביגוד',
      isOnline: true,
      isPinned: true,
      isAiManaged: true,
      unreadCount: 0,
      labels: ['לקוח VIP', 'סאבאן ספורט'],
      notes: 'לקוח קבוע. מעדיף אספקות בבקרים. מאושר אשראי 50k',
      orderHistory: [
        {
          id: 'ORD-9021',
          date: '2026-07-28',
          items: '50 שק מלט אפור [10001], 10 בלה סומסום [20001]',
          total: 4200,
          status: 'סופק',
          skuDetails: '[מק"ט 10001] שק מלט אפור 50 ק"ג x50, [מק"ט 20001] בלה סומסום נקי x10'
        },
        {
          id: 'ORD-9104',
          date: '2026-08-01',
          items: '20 שק גבס לבן [40002], 5 פנל גבס ירוק [40001]',
          total: 1850,
          status: 'בדרך',
          skuDetails: '[מק"ט 40002] שק גבס לבן 25 ק"ג x20, [מק"ט 40001] פנל גבס ירוק עמיד מים x5'
        }
      ]
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
      {
        id: 'm_m2',
        chatId: 'chat_michal',
        sender: 'user',
        text: 'הודעה קולית',
        timestamp: '10:23',
        status: 'delivered',
        type: 'voice_note',
        isVoiceNote: true,
        audioDuration: '0:24',
        transcription: 'היי נועה, שלחתי לך הודעה קולית כדי להסביר - אנחנו צריכים תפריט בשרי מלא ל-50 מוזמנים ביום חמישי בערב, כולל שתייה קלה וקינוחים. אשמח שתחזרי אליי עם הצעת מחיר מעודכנת. תודה!',
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
      {
        id: 'm_tg3',
        chatId: 'chat_team_group',
        sender: 'ai',
        text: '🚨 התרעת ביקורת (Discrepancy Audit Alert): זוהתה אי התאמה בין כמות הצמנט שנדרשה ב-WhatsApp (80 שקים) לבין רשומת ההזמנה במערכת Comax (30 שקים). נדרשת בדיקה של מנהל הלוגיסטיקה.',
        timestamp: '09:12',
        status: 'read',
        hasDiscrepancy: true,
      },
    ],
  },
];
