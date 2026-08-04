/**
 * ==============================================================================
 * 🤖 24/7 Local WhatsApp Listener & Responder Server - SabanOS / Noa AI
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
// 1. הגדרות סביבה ומשתנים גלובליים
// ==============================================================================
const PORT = process.env.PORT || 3000;
const NOA_PHONE = process.env.NOA_PHONE || '972508861080';
const GAS_WEBHOOK_URL = process.env.GAS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbyQUaDDWSiG6osVHQ8ZQEdXqVNBFFoaFcLxr6iJvJYZpsc8TSfQ_wjvc5HMtKyLsyG80A/exec';
const VERCEL_APP_URL = process.env.VERCEL_APP_URL || 'http://localhost:3000';
const HUMAN_TYPING_DELAY_MS = parseInt(process.env.HUMAN_TYPING_DELAY_MS || '2500', 10);

// מונים וסטטוס לניטור
const serverStats = {
  startTime: new Date().toISOString(),
  status: 'initializing', // 'initializing' | 'qr_ready' | 'authenticated' | 'ready' | 'disconnected'
  qrCodeRaw: null,
  processedMessagesCount: 0,
  successfulRepliesCount: 0,
  failedRepliesCount: 0,
  lastMessageTime: null,
  lastError: null,
};

// ==============================================================================
// 2. אתחול לקוח WhatsApp Web (whatsapp-web.js עם LocalAuth)
// ==============================================================================
console.log('🚀 מתחיל אתחול שרת הוואטסאפ של נועה (SabanOS) ...');

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
// 4. צינור אירועים מרכזי: קבלת הודעות נכנסות והשבה (client.on('message'))
// ==============================================================================
client.on('message', async (msg) => {
  try {
    // 1. סינון הודעות שנשלחו ע"י נועה עצמה
    if (msg.fromMe) return;

    serverStats.processedMessagesCount += 1;
    serverStats.lastMessageTime = new Date().toISOString();

    // 2. חילוץ וניקוי נתוני המודעה והשולח
    const rawFrom = msg.from || '';
    const phone = rawFrom.replace(/@c\.us|@g\.us/g, '').replace(/[^0-9]/g, '');
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
    if (!incomingMessage) return; // התעלמות מהודעות ריקות/מדיה ללא טקסט

    console.log(`\n📩 [${new Date().toLocaleTimeString('he-IL')}] הודעה נכנסת מ-${senderName} (${phone}) [${isGroup ? 'קבוצה' : 'פרטי'}]: "${incomingMessage}"`);

    // 3. בניית ה-Payload לשיגור ל-Webhooks
    const payload = {
      phone,
      senderName,
      isGroup,
      groupId: isGroup ? rawFrom : null,
      incomingMessage,
      timestamp: new Date().toISOString(),
      source: 'local_whatsapp_listener',
    };

    // 4. שיגור מקביל ל-Google Apps Script (GAS) וללוח הבקרה (Vercel PWA)
    let generatedReply = null;

    // א. סנכרון מול Vercel Dashboard PWA
    try {
      const vercelRes = await axios.post(`${VERCEL_APP_URL}/api/chat/respond`, {
        userMessage: incomingMessage,
        contactName: senderName,
        phone,
        isGroup,
        conversationHistory: [],
      }, { timeout: 8000 });

      if (vercelRes.data && vercelRes.data.response) {
        generatedReply = vercelRes.data.response;
      }
    } catch (vErr) {
      console.warn('⚠️ אזהרה: סנכרון מול Vercel/PWA נכשל (משתמש במענה גיבוי local):', vErr.message);
    }

    // ב. שיגור Webhook מראה ל-Google Apps Script
    if (GAS_WEBHOOK_URL) {
      axios.post(GAS_WEBHOOK_URL, payload, { timeout: 5000 })
        .then(() => console.log('✅ Webhook שוגר בהצלחה ל-Google Apps Script'))
        .catch((gErr) => console.warn('⚠️ Webhook ל-GAS נכשל:', gErr.message));
    }

    // 5. ניסוח מענה ברירת מחדל במידה ושרת ה-AI לא החזיר תשובה
    if (!generatedReply) {
      if (/^(היי|שלום|אהלן|בוקר טוב|ערב טוב|מה נשמע)/i.test(incomingMessage) && incomingMessage.length < 20) {
        generatedReply = `היי *${senderName}*! 👋 במה אוכל לעזור לך היום בח. סבן?`;
      } else if (isGroup) {
        generatedReply = `אהלן *${senderName}*, קיבלנו את ההודעה בקבוצה והיא בטיפול בסידור הובלות! 🚛`;
      } else {
        generatedReply = `היי *${senderName}*, קיבלנו את הודעתך והיא בטיפול צוות ח. סבן! 🚚`;
      }
    }

    // 6. השהיה אנושית (Humanized Typing Delay) למניעת זיהוי רובוטי
    console.log(`⏳ מנהיג השהיה אנושית של ${HUMAN_TYPING_DELAY_MS}ms לפני השבת התשובה...`);
    
    // סימון הקלדה בצ'אט
    try {
      const chat = await msg.getChat();
      await chat.sendStateTyping();
    } catch (e) {
      // ignore typing state errors
    }

    await new Promise((resolve) => setTimeout(resolve, HUMAN_TYPING_DELAY_MS));

    // 7. שליחת התשובה בחזרה לוואטסאפ
    await client.sendMessage(msg.from, generatedReply);
    
    serverStats.successfulRepliesCount += 1;
    console.log(`🤖 Noa responded successfully to [${senderName}] (${phone}):\n"${generatedReply}"\n`);

  } catch (err) {
    serverStats.failedRepliesCount += 1;
    serverStats.lastError = `Message processing error: ${err.message}`;
    console.error('❌ שגיאה במהלך טיפול בהודעה נכנסת:', err);
  }
});

// ==============================================================================
// 5. שרת Express ללוגים, ניטור בריאות והפעלות ידניות (Port 3000)
// ==============================================================================
const app = express();
app.use(express.json());

// דף סטטוס ניטור מרכזי
app.get('/', (req, res) => {
  res.json({
    app: 'Noa AI - 24/7 Local WhatsApp Listener Server',
    version: '1.0.0',
    noaPhone: NOA_PHONE,
    uptimeSeconds: Math.floor(process.uptime()),
    stats: serverStats,
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
    lastMessageTime: serverStats.lastMessageTime,
    lastError: serverStats.lastError,
  });
});

// נקודת קצה לצפייה ב-QR code במנהל דפדפן
app.get('/qr', (req, res) => {
  if (serverStats.status === 'ready') {
    return res.send('<h3>✅ הוואטסאפ מחובר ופעיל! אין צורך בסריקת QR.</h3>');
  }
  if (!serverStats.qrCodeRaw) {
    return res.send('<h3>⏳ קוד QR טרם הופק או שנמצא בתהליך התחברות. נסה לרענן עוד מספר שניות.</h3>');
  }
  
  // HTML מובנה המרנדר את הקוד
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
    const chatId = cleanPhone.includes('@c.us') ? cleanPhone : `${cleanPhone}@c.us`;

    await client.sendMessage(chatId, message);
    console.log(`📤 הודעה יזומה נשלחה בהצלחה ל-${cleanPhone}: "${message}"`);

    res.json({ success: true, targetPhone: cleanPhone, messageSent: message });
  } catch (err) {
    console.error('❌ שגיאה בשליחת הודעה יזומה:', err);
    res.status(500).json({ error: err.message });
  }
});

// סימולציית הודעה נכנסת לבדיקה
app.post('/simulate', async (req, res) => {
  const { phone = '0524455667', senderName = 'ישראל ישראלי (בדיקה)', message = 'היי נועה, מה מחיר בלת סומסום?' } = req.body;
  
  console.log(`🧪 מריץ סימולציית הודעה נכנסת מ-${senderName}...`);
  
  try {
    const vercelRes = await axios.post(`${VERCEL_APP_URL}/api/chat/respond`, {
      userMessage: message,
      contactName: senderName,
      phone,
      isGroup: false,
    });

    res.json({
      simulation: 'success',
      incomingTestMessage: message,
      noaAiResponse: vercelRes.data?.response || 'אין מענה משרת ה-AI',
    });
  } catch (err) {
    res.status(500).json({ simulation: 'failed', error: err.message });
  }
});

// הפעלת שרת ה-Express
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 שרת הניטור וה-Webhooks המקומי פעיל בפורט ${PORT} (http://localhost:${PORT})`);
});

// ==============================================================================
// 6. הגנות קריסה גלובליות (Self-Healing & Crash Protection)
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
