/**
 * ==============================================================================
 * 🤖 24/7 Local WhatsApp Listener, Nudge Engine & Responder Server - SabanOS / Noa AI
 * הנחיות התקנה והרצה באמצעות PM2 (שרת מקומי / C:\ap94):
 * ==============================================================================
 * 1. פתח CMD / PowerShell כ-Administrator והרץ:
 *    npm install -g pm2 pm2-windows-service
 * 
 * 2. עבור לתיקיית הפרויקט המקומית:
 *    cd C:\ap94
 * 
 * 3. התקן את התלויות:
 *    npm install
 * 
 * 4. הפעל את השרת תחת PM2:
 *    pm2 start index.js --name "noa-whatsapp-server"
 * 
 * 5. שמור והגדר שירות אוטומטי בעליית המחשב (Windows Service):
 *    pm2 save
 *    pm2-service-install -n PM2
 * 
 * 6. בדיקת סטטוס ולוגים בזמן אמת:
 *    pm2 status
 *    pm2 logs noa-whatsapp-server
 * ==============================================================================
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// ==============================================================================
// 1. הגדרות סביבה, מזהי קבוצות ויעדי נודניק (Target IDs & Constants)
// ==============================================================================
const PORT = process.env.PORT || 3000;
const NOA_PHONE = process.env.NOA_PHONE || '972508861080';
const GAS_WEBHOOK_URL = process.env.GAS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbxjs19kSI1zgpLuMd64aUcfVlKXfVE3_dBShrDfRbExy2fUXkmdhVzna28P3GnIrW4o/exec';
const VERCEL_APP_URL = process.env.VERCEL_APP_URL || 'http://localhost:3000';
const HUMAN_TYPING_DELAY_MS = parseInt(process.env.HUMAN_TYPING_DELAY_MS || '2500', 10);

// מזהי היעדים הנדרשים:
const TARGET_GROUPS = {
  // קבוצת הזמנות נכנסת (ממנה מחלצים נתונים)
  ORDER_GROUP_ID: '120363390702096083@g.us', // "הזמנות לקוחות בלבד ח.סבן"
  // קבוצה לשליחת התראות ונודניקים
  NUDGE_GROUP_ID: '120363428842730390@g.us', // "עדכונים מהסידור"
  // מספר פרטי לשליחת התראות ונודניקים (ראמי)
  RAMI_PHONE_ID: '972508860896@c.us', // "ראמי"
};

// מאגר פניות נכנסות מקומי (Inbound Inquiries Store)
let inboundInquiries = [];

// מונים וסטטוס לניטור
const serverStats = {
  startTime: new Date().toISOString(),
  status: 'initializing', // 'initializing' | 'qr_ready' | 'authenticated' | 'ready' | 'disconnected'
  qrCodeRaw: null,
  processedMessagesCount: 0,
  successfulRepliesCount: 0,
  failedRepliesCount: 0,
  nudgesSentCount: 0,
  lastNudgeTime: null,
  lastMessageTime: null,
  lastError: null,
};

// ==============================================================================
// 2. אתחול לקוח WhatsApp Web (whatsapp-web.js עם LocalAuth)
// ==============================================================================
console.log('🚀 מתחיל אתחול שרת הוואטסאפ של נועה ומנגנון הנודניק האוטומטי (SabanOS) ...');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'noa-whatsapp-session',
    dataPath: './.wwebjs_auth', // שמירת סשן קבוע בדיסק למניעת התנתקויות
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  },
});

// ==============================================================================
// 3. אירועי לייף-סייקל של WhatsApp Web
// ==============================================================================

// יצירת קוד QR לסריקה ראשונית
client.on('qr', (qr) => {
  serverStats.status = 'qr_ready';
  serverStats.qrCodeRaw = qr;
  console.log('\n==================================================');
  console.log('📲 נא לסרוק את קוד ה-QR באפליקציית WhatsApp בטלפון (+972508861080):');
  console.log('==================================================\n');
  qrcode.generate(qr, { small: true });
});

// התחברות מוצלחת
client.on('authenticated', () => {
  serverStats.status = 'authenticated';
  serverStats.qrCodeRaw = null;
  console.log('✅ אימות מוצלח מול WhatsApp Web! הסשן נשמר ב-./.wwebjs_auth');
});

// הלקוח מוכן לפעילות מלאה 24/7
client.on('ready', () => {
  serverStats.status = 'ready';
  console.log('🤖 נועה AI מחוברת ומוכנה לקבלת הודעות 24/7 למספר:', NOA_PHONE);
  console.log('🔔 מנגנון הנודניק האוטומטי (Nudge Engine - 5 דקות) מופעל ופעיל!');
});

// טיפול בהתנתקות ואחזור אוטומטי (Self-Healing Restart)
client.on('disconnected', async (reason) => {
  serverStats.status = 'disconnected';
  serverStats.lastError = `Disconnected: ${reason}`;
  console.error('⚠️ הלקוח התנתק מ-WhatsApp! סיבה:', reason);
  console.log('🔄 מפעיל מנגנון חיבור מחדש אוטומטי (Self-Healing) תוך 5 שניות...');
  
  setTimeout(async () => {
    try {
      await client.initialize();
    } catch (err) {
      console.error('❌ שגיאה במהלך אתחול מחדש:', err.message);
    }
  }, 5000);
});

client.on('auth_failure', (msg) => {
  serverStats.status = 'auth_failure';
  serverStats.lastError = `Auth failure: ${msg}`;
  console.error('❌ כישלון באימות WhatsApp:', msg);
});

// ==============================================================================
// 4. פונקציית עזר: חילוץ נתונים מבוססת Regex מהודעות בקבוצת ההזמנות
// ==============================================================================
function extractOrderDetails(rawText, fallbackSenderName, fallbackPhone) {
  let customerName = '';
  let customerPhone = '';
  
  // חילוץ שם לקוח מתוך שורת 👤
  const nameMatch = rawText.match(/👤\s*:?\s*([^\n\r]+)/);
  if (nameMatch && nameMatch[1] && nameMatch[1].trim()) {
    customerName = nameMatch[1].trim();
  } else {
    customerName = fallbackSenderName || 'לקוח';
  }

  // חילוץ טלפון לקוח מתוך שורת 📱
  const phoneMatch = rawText.match(/📱\s*:?\s*([^\n\r]+)/);
  if (phoneMatch && phoneMatch[1] && phoneMatch[1].trim()) {
    customerPhone = phoneMatch[1].trim();
  } else {
    customerPhone = fallbackPhone || '';
  }

  return {
    customerName,
    customerPhone,
    incomingMessage: rawText,
  };
}

// ==============================================================================
// 5. צינור אירועים מרכזי: קבלת הודעות נכנסות והשבה (client.on('message'))
// ==============================================================================
client.on('message', async (msg) => {
  try {
    // סינון הודעות שנשלחו ע"י נועה עצמה
    if (msg.fromMe) return;

    serverStats.processedMessagesCount += 1;
    serverStats.lastMessageTime = new Date().toISOString();

    const rawFrom = msg.from || '';
    const cleanSenderPhone = rawFrom.replace(/@c\.us|@g\.us/g, '').replace(/[^0-9]/g, '');
    const isGroup = rawFrom.endsWith('@g.us') || msg.isGroup || false;
    
    // קבלת שם איש הקשר
    let senderName = 'לקוח';
    try {
      const contact = await msg.getContact();
      senderName = contact.pushname || contact.name || contact.shortName || 'לקוח';
    } catch (e) {
      senderName = msg._data?.notifyName || 'לקוח';
    }

    const incomingMessage = (msg.body || '').trim();
    if (!incomingMessage) return; // התעלמות מהודעות ריקות

    console.log(`\n📩 [${new Date().toLocaleTimeString('he-IL')}] הודעה נכנסת מ-${senderName} (${cleanSenderPhone}) [${isGroup ? 'קבוצה: ' + rawFrom : 'פרטי'}]: "${incomingMessage}"`);

    // ==========================================================================
    // בדיקה האם ההודעה הגיעה מקבוצת ההזמנות המוגדרת
    // קבוצה: 120363390702096083@g.us ("הזמנות לקוחות בלבד ח.סבן")
    // ==========================================================================
    const isOrderGroup = rawFrom.includes('120363390702096083') || rawFrom === TARGET_GROUPS.ORDER_GROUP_ID;

    // חילוץ פרטי הפנייה בלוגיקת Regex
    const parsedOrder = extractOrderDetails(incomingMessage, senderName, cleanSenderPhone);
    const customerFirstName = parsedOrder.customerName.trim().split(/\s+/)[0] || 'לקוח';

    // יצירת רשומת פנייה חדשה בסטטוס ראשוני: "חדש"
    const newInquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerName: parsedOrder.customerName,
      customerPhone: parsedOrder.customerPhone || cleanSenderPhone,
      incomingMessage: parsedOrder.incomingMessage,
      status: 'חדש', // סטטוס ראשוני: "חדש"
      timestamp: new Date().toISOString(),
      groupId: isGroup ? rawFrom : null,
      source: isOrderGroup ? 'order_group' : (isGroup ? 'group' : 'direct'),
      nudgeCount: 0,
      lastNudgeAt: null,
    };

    // הזרקה למאגר הפניות המקומי
    inboundInquiries.unshift(newInquiry);
    if (inboundInquiries.length > 300) inboundInquiries.pop();

    console.log(`📌 פנייה חדשה הוזרקה למאגר בסטטוס "חדש": [${newInquiry.customerName}] (${newInquiry.customerPhone})`);

    // סנכרון הרשומה ב-Webhooks / API מרכזי
    try {
      axios.post(`${VERCEL_APP_URL}/api/inquiries`, newInquiry, { timeout: 5000 }).catch(() => {});
    } catch (e) {}

    // ==========================================================================
    // ניסוח מענה אוטומטי
    // ==========================================================================
    let generatedReply = null;

    if (isOrderGroup) {
      // מענה קבוע ומדויק לקבוצת ההזמנות עם תיוג שקט ברקע (mentions)
      generatedReply = `היי ${customerFirstName}! 👋 קיבלנו את פנייתך והיא הועברה לסידור, תודה! ויום טוב 🚚`;
    } else {
      // ניסיון לקבלת מענה מ-AI / Vercel
      try {
        const vercelRes = await axios.post(`${VERCEL_APP_URL}/api/chat/respond`, {
          userMessage: incomingMessage,
          contactName: senderName,
          phone: cleanSenderPhone,
          isGroup,
          conversationHistory: [],
        }, { timeout: 8000 });

        if (vercelRes.data && vercelRes.data.response) {
          generatedReply = vercelRes.data.response;
        }
      } catch (vErr) {
        console.warn('⚠️ סנכרון מול Vercel/PWA נכשל:', vErr.message);
      }

      if (!generatedReply) {
        if (/^(היי|שלום|אהלן|בוקר טוב|ערב טוב|מה נשמע)/i.test(incomingMessage) && incomingMessage.length < 20) {
          generatedReply = `היי *${customerFirstName}*! 👋 במה אוכל לעזור לך היום בח. סבן?`;
        } else if (isGroup) {
          generatedReply = `אהלן *${customerFirstName}*, קיבלנו את ההודעה בקבוצה והיא בטיפול בסידור הובלות! 🚛`;
        } else {
          generatedReply = `היי *${customerFirstName}*, קיבלנו את הודעתך והיא בטיפול צוות ח. סבן! 🚚`;
        }
      }
    }

    // שיגור Webhook ל-Google Apps Script
    if (GAS_WEBHOOK_URL) {
      axios.post(GAS_WEBHOOK_URL, {
        phone: cleanSenderPhone,
        senderName: parsedOrder.customerName,
        isGroup,
        groupId: isGroup ? rawFrom : null,
        incomingMessage,
        timestamp: new Date().toISOString(),
        source: 'local_whatsapp_listener',
      }, { timeout: 5000 }).catch(() => {});
    }

    // השהיה אנושית (Humanized Typing Delay)
    console.log(`⏳ מנהיג השהיה אנושית של ${HUMAN_TYPING_DELAY_MS}ms לפני השבת התשובה...`);
    try {
      const chat = await msg.getChat();
      await chat.sendStateTyping();
    } catch (e) {}

    await new Promise((resolve) => setTimeout(resolve, HUMAN_TYPING_DELAY_MS));

    // שליחת המענה עם תיוג שקט במידת האפשר
    const sendOptions = {};
    if (msg.author) {
      sendOptions.mentions = [msg.author];
    }

    await client.sendMessage(msg.from, generatedReply, sendOptions);
    
    serverStats.successfulRepliesCount += 1;
    console.log(`🤖 נועה השיבה בהצלחה ל-[${parsedOrder.customerName}]: "${generatedReply}"`);

  } catch (err) {
    serverStats.failedRepliesCount += 1;
    serverStats.lastError = `Message processing error: ${err.message}`;
    console.error('❌ שגיאה במהלך טיפול בהודעה נכנסת:', err);
  }
});

// ==============================================================================
// 6. מנגנון הנודניק האוטומטי (Nudge Engine - בדיוק כל 5 דקות)
// ==============================================================================
const NUDGE_INTERVAL_MS = 5 * 60 * 1000; // 5 דקות

async function runNudgeEngine() {
  if (serverStats.status !== 'ready') {
    console.log('⏳ Nudge Engine: השרת עדיין אינו במצב ready, מדלג על המחזור הנוכחי');
    return;
  }

  try {
    // סריקת כל הפניות שטרם סומנו כ-"טופל" (סטטוס "חדש")
    const pendingInquiries = inboundInquiries.filter((inq) => inq.status === 'חדש');

    if (pendingInquiries.length === 0) {
      console.log(`🟢 [Nudge Engine - ${new Date().toLocaleTimeString('he-IL')}] אין פניות בסטטוס "חדש". כל הפניות טופלו!`);
      return;
    }

    console.log(`🚨 [Nudge Engine - ${new Date().toLocaleTimeString('he-IL')}] נמצאו ${pendingInquiries.length} פניות שלא טופלו! מפיץ התראות נודניק...`);

    for (const inq of pendingInquiries) {
      const nudgeMessage = `🚨 *תזכורת נודניק - פנייה טרם טופלה!*
👤 *שם לקוח:* ${inq.customerName || 'לא צוין'}
📱 *טלפון:* ${inq.customerPhone || 'לא צוין'}
📝 *תוכן הפנייה:* ${inq.incomingMessage || 'ללא פירוט'}
⏳ *סטטוס:* עדיין לא טופלה!
נא לעדכן במערכת ברגע שהפנייה מטופלת.`;

      // הפצה מקבילה לשני היעדים:
      // 1. קבוצת "עדכונים מהסידור" (120363428842730390@g.us)
      // 2. ראמי בפרטי (972508860896@c.us)
      try {
        await client.sendMessage(TARGET_GROUPS.NUDGE_GROUP_ID, nudgeMessage);
        console.log(`✅ נודניק נשלח בהצלחה לקבוצת עדכונים מהסידור (${TARGET_GROUPS.NUDGE_GROUP_ID}) עבור [${inq.customerName}]`);
      } catch (grpErr) {
        console.error(`❌ כישלון בשליחת נודניק לקבוצה עבור [${inq.customerName}]:`, grpErr.message);
      }

      try {
        await client.sendMessage(TARGET_GROUPS.RAMI_PHONE_ID, nudgeMessage);
        console.log(`✅ נודניק נשלח בהצלחה לראמי בפרטי (${TARGET_GROUPS.RAMI_PHONE_ID}) עבור [${inq.customerName}]`);
      } catch (ramiErr) {
        console.error(`❌ כישלון בשליחת נודניק לראמי עבור [${inq.customerName}]:`, ramiErr.message);
      }

      // עדכון מונים וזמן נודניק
      inq.nudgeCount = (inq.nudgeCount || 0) + 1;
      inq.lastNudgeAt = new Date().toISOString();
      serverStats.nudgesSentCount += 2;
      serverStats.lastNudgeTime = new Date().toISOString();

      // השהיה קצרה בין הודעות למניעת הצפה
      await new Promise((res) => setTimeout(res, 1500));
    }

  } catch (err) {
    console.error('❌ שגיאה בהרצת Nudge Engine:', err);
    serverStats.lastError = `Nudge engine failure: ${err.message}`;
  }
}

// הפעלת הטריגר המחזורי כל 5 דקות
setInterval(runNudgeEngine, NUDGE_INTERVAL_MS);

// ==============================================================================
// 7. שרת Express ללוגים, ניטור ניהול פניות והפעלות ידניות (Port 3000)
// ==============================================================================
const app = express();
app.use(express.json());

// דף סטטוס ניטור מרכזי
app.get('/', (req, res) => {
  res.json({
    app: 'Noa AI & Nudge Engine - 24/7 Local WhatsApp Server',
    version: '2.0.0',
    noaPhone: NOA_PHONE,
    uptimeSeconds: Math.floor(process.uptime()),
    stats: serverStats,
    pendingInquiriesCount: inboundInquiries.filter((i) => i.status === 'חדש').length,
    targets: TARGET_GROUPS,
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: serverStats.status,
    ready: serverStats.status === 'ready',
    uptime: Math.floor(process.uptime()),
    processedMessages: serverStats.processedMessagesCount,
    successfulReplies: serverStats.successfulRepliesCount,
    failedReplies: serverStats.failedRepliesCount,
    nudgesSentCount: serverStats.nudgesSentCount,
    lastNudgeTime: serverStats.lastNudgeTime,
    lastMessageTime: serverStats.lastMessageTime,
    lastError: serverStats.lastError,
    pendingInquiriesCount: inboundInquiries.filter((i) => i.status === 'חדש').length,
  });
});

// שליפת כל הפניות הנכנסות לטובת ה-Dashboard
app.get('/api/inquiries', (req, res) => {
  res.json({
    success: true,
    inquiries: inboundInquiries,
    pendingCount: inboundInquiries.filter((i) => i.status === 'חדש').length,
    handledCount: inboundInquiries.filter((i) => i.status === 'טופל').length,
  });
});

// קבלת פנייה חדשה או עדכון
app.post('/api/inquiries', (req, res) => {
  const body = req.body || {};
  if (!body.customerName && !body.incomingMessage) {
    return res.status(400).json({ error: 'Missing inquiry details' });
  }

  const existingIndex = inboundInquiries.findIndex((i) => i.id === body.id);
  if (existingIndex >= 0) {
    inboundInquiries[existingIndex] = { ...inboundInquiries[existingIndex], ...body };
  } else {
    const newInq = {
      id: body.id || `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerName: body.customerName || 'לקוח',
      customerPhone: body.customerPhone || '0500000000',
      incomingMessage: body.incomingMessage || '',
      status: body.status || 'חדש',
      timestamp: body.timestamp || new Date().toISOString(),
      groupId: body.groupId || null,
      source: body.source || 'manual_api',
      nudgeCount: body.nudgeCount || 0,
      lastNudgeAt: body.lastNudgeAt || null,
    };
    inboundInquiries.unshift(newInq);
  }

  res.json({ success: true, inquiriesCount: inboundInquiries.length });
});

// עדכון סטטוס פנייה: "חדש" ⬅️ "טופל" (מפסיק מיידית את הנודניק)
app.post('/api/inquiries/status', (req, res) => {
  const { id, status } = req.body || {};
  if (!id || !status) {
    return res.status(400).json({ error: 'Missing id or status' });
  }

  const inquiry = inboundInquiries.find((i) => i.id === id);
  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  inquiry.status = status; // למשל: "טופל"
  inquiry.updatedAt = new Date().toISOString();

  console.log(`✅ סטטוס פנייה [${inquiry.customerName}] עודכן ל-"${status}". הנודניק הופסק לגבי פנייה זו!`);

  res.json({
    success: true,
    id: inquiry.id,
    newStatus: inquiry.status,
    message: `סטטוס הפנייה שונה ל-${status}. הנודניק הופסק!`,
  });
});

// הרצה ידנית של Nudge Engine לצרכי בדיקה
app.post('/api/nudge/trigger', async (req, res) => {
  console.log('🧪 הפעלה ידנית של Nudge Engine מתוך ה-API...');
  await runNudgeEngine();
  res.json({ success: true, nudgesSentCount: serverStats.nudgesSentCount, lastNudgeTime: serverStats.lastNudgeTime });
});

// נקודת קצה לצפייה ב-QR code במנהל דפדפן
app.get('/qr', (req, res) => {
  if (serverStats.status === 'ready') {
    return res.send('<h3>✅ הוואטסאפ מחובר ופעיל! אין צורך בסריקת QR.</h3>');
  }
  if (!serverStats.qrCodeRaw) {
    return res.send('<h3>⏳ קוד QR טרם הופק או שנמצא בתהליך התחברות. נסה לרענן עוד מספר שניות.</h3>');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <title>סריקת קוד QR - נועה AI</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #111b21; color: #e9edef; text-align: center; padding: 40px; }
        .card { background: #202c33; max-width: 420px; margin: 0 auto; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h2 { color: #00a884; margin-bottom: 8px; }
        p { color: #8696a0; font-size: 14px; }
        code { background: #111b21; padding: 12px; display: block; border-radius: 8px; word-break: break-all; font-size: 11px; margin-top: 16px; color: #25d366; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🤖 חיבור נועה AI לוואטסאפ</h2>
        <p>פתחו את אפליקציית WhatsApp בטלפון (+972508861080) -> מכשירים מקושרים -> קשר מכשיר:</p>
        <p><strong>פתח את ה-Terminal בשרת המקומי לצפייה ב-QR הגרפי הקריא, או השתמש בקוד להלן:</strong></p>
        <code>${serverStats.qrCodeRaw}</code>
      </div>
    </body>
    </html>
  `);
});

// שליחת הודעה יזומה מתוך לוח הבקרה / API
app.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Missing phone or message parameter' });
    }

    if (serverStats.status !== 'ready') {
      return res.status(503).json({ error: 'WhatsApp client is not ready yet', currentStatus: serverStats.status });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const chatId = cleanPhone.includes('@g.us') || cleanPhone.includes('@c.us')
      ? cleanPhone
      : `${cleanPhone}@c.us`;

    await client.sendMessage(chatId, message);
    console.log(`📤 הודעה יזומה נשלחה בהצלחה ל-${cleanPhone}: "${message}"`);

    res.json({ success: true, targetPhone: cleanPhone, messageSent: message });
  } catch (err) {
    console.error('❌ שגיאה בשליחת הודעה יזומה:', err);
    res.status(500).json({ error: err.message });
  }
});

// הפעלת שרת ה-Express
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 שרת הניטור וה-Webhooks המקומי פעיל בפורט ${PORT} (http://localhost:${PORT})`);
});

// ==============================================================================
// 8. הגנות קריסה גלובליות (Self-Healing & Crash Protection)
// ==============================================================================
process.on('uncaughtException', (err) => {
  console.error('💥 [Uncaught Exception] נלכדה שגיאה לא מטופלת בשרת (מניעת קריסה):', err);
  serverStats.lastError = `Uncaught Exception: ${err.message}`;
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [Unhandled Rejection] נלכדה דחיית Promise לא מטופלת (מניעת קריסה):', reason);
  serverStats.lastError = `Unhandled Rejection: ${reason}`;
});

// אתחול הלקוח
client.initialize().catch((err) => {
  console.error('❌ כישלון באתחול הראשוני של WhatsApp Client:', err);
});
