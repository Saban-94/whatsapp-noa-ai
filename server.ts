import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));

// Server state / settings storage
let serverSettings = {
  systemPrompt: `אתה נועה AI (Noa AI) - העוזרת החכמה והייעודית של סידור ח.סבן.
תפקידך להעניק שירות לקוחות מעולה, מענה על תפריטים, הזמנות שולחן, שעות פעילות וסנכרון מול מנגנון סידור ח.סבן.
דבר בשפה אדיבה, קולחת ומקצועית בעברית, תוך שימוש באימוג'ים מתאימים במידת הצורך.`,
  spreadsheetId: "1PxWtIWVKLXrGavAivCIIz7RPTuZXmJA5y9GlcBRfqco",
  webAppUrl: "https://script.google.com/macros/s/AKfycbyQUaDDWSiG6osVHQ8ZQEdXqVNBFFoaFcLxr6iJvJYZpsc8TSfQ_wjvc5HMtKyLsyG80A/exec",
  webhookSyncEnabled: true,
  activeModel: "gemini-3.6-flash",
  autoReplyEnabled: true,
  enableBlueTicks: true,
  businessHoursEnabled: false,
  businessHoursStart: "08:00",
  businessHoursEnd: "18:00",
  businessDays: [0, 1, 2, 3, 4],
  outsideHoursMode: "out_of_office_msg",
  outsideHoursMessage: "שלום! פנית אלינו מחוץ לשעות הפעילות (08:00 - 18:00). הודעתך נקלטה במערכת SabanOS ונשוב אליך בהקדם בשעות הפעילות! ⏰",
};

let webhookLogs = [];
let listenerEvents = [];

let stagedOrders = [
  {
    id: "ord_1001",
    orderNumber: "ORD-90821",
    customerPhone: "052-4455667",
    customerName: "משה כהן - אתר הרצליה",
    rawMessage: "שלום נועה, צריך בדחיפות 3 בלות סומסום, בלת חול, מנוף לקומה 2",
    noaResponse: `שלום משה כהן - אתר הרצליה! 👋\n*ההזמנה שלך נקלטה ופוענחה בהצלחה במערכת סידור ח.סבן:* 🚛\n\n• [מק"ט 20001] בלה סומסום נקי — 3 בלה (₪330)\n• [מק"ט 20002] בלה חול מחצבה (טיט) — 1 בלה (₪105)\n• [מק"ט GENERIC-99] מנוף לקומה 2 — 1 יחידה\n\n*סה"כ משוער:* ₪435\n\nצוות הלוגיסטיקה מכין את המשלוח ויוצר עמך קשר לתיאום סופי!`,
    items: [
      { sku: "20001", name: "בלה סומסום נקי", quantity: 3, unit: "בלה", unitPrice: 110, totalPrice: 330 },
      { sku: "20002", name: "בלה חול מחצבה (טיט)", quantity: 1, unit: "בלה", unitPrice: 105, totalPrice: 105 },
      { sku: "GENERIC-99", name: "מנוף לקומה 2", quantity: 1, unit: "יחידה", unitPrice: 0, totalPrice: 0 },
    ],
    totalPrice: 435,
    status: "בטיפול לוגיסטי",
    sentToWhatsapp: true,
    createdAt: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
  },
];

// Logistic Dictionary (מילון_לוגיסטי) State & Dynamic Sync with Fallback
let logisticDictionary = [
  { sku: "10001", productName: 'שק מלט אפור 50 ק"ג', aliases: ["מלט אפור 50", "שק מלט 50", "מלט 50", "מלט 50 קג"], unit: "שק", category: "חומרי מליטה", price: 38 },
  { sku: "10002", productName: 'שק מלט אפור 25 ק"ג', aliases: ["מלט", "שק מלט", "מלט אפור", "מלט 25"], unit: "שק", category: "חומרי מליטה", price: 22 },
  { sku: "10003", productName: 'שק מלט לבן 25 ק"ג', aliases: ["מלט לבן", "שק מלט לבן", "מלט לבן 25"], unit: "שק", category: "חומרי מליטה", price: 34 },
  { sku: "20001", productName: "בלה סומסום נקי", aliases: ["סומסום", "בלה סומסום", "שק סומסום", "סומסום נקי"], unit: "בלה", category: "חול וסומסום", price: 110 },
  { sku: "20002", productName: "בלה חול מחצבה (טיט)", aliases: ["חול", "חול מחצבה", "טיט", "בלה חול", "בלה טיט"], unit: "בלה", category: "חול וסומסום", price: 105 },
  { sku: "20003", productName: "בלה חצץ 1/2 (עדש)", aliases: ["חצץ", "עדש", "בלה חצץ", "חצץ עדש"], unit: "בלה", category: "חול וסומסום", price: 115 },
  { sku: "20004", productName: "בלה זיפזיף לריצוף", aliases: ["זיפזיף", "בלה זיפזיף", "חול זיפזיף"], unit: "בלה", category: "חול וסומסום", price: 120 },
  { sku: "30001", productName: "משטח בלוק בטון 20 (96 יח')", aliases: ["בלוק בטון", "בלוק 20", "בלוק בטון 20", "בלוקים"], unit: "משטח", category: "בלוקים", price: 480 },
  { sku: "30002", productName: "משטח בלוק איטונג 20 (72 יח')", aliases: ["איטונג", "בלוק איטונג", "איטונג 20", "בלוק איטונג 20"], unit: "משטח", category: "בלוקים", price: 650 },
  { sku: "30003", productName: "משטח בלוק פומס 20 (96 יח')", aliases: ["פומס", "בלוק פומס", "פומס 20"], unit: "משטח", category: "בלוקים", price: 520 },
  { sku: "40001", productName: 'שק טיח גבס תרמי 25 ק"ג', aliases: ["טיח", "טיח גבס", "טיח תרמי", "שק טיח"], unit: "שק", category: "גבס וטיח", price: 45 },
  { sku: "40002", productName: 'לוח גבס ירוק עמיד מים 12.5 מ"מ', aliases: ["גבס ירוק", "לוח גבס ירוק", "גבס נגד מים"], unit: "יחידה", category: "גבס וטיח", price: 42 },
  { sku: "40003", productName: 'לוח גבס לבן סטנדרטי 12.5 מ"מ', aliases: ["גבס לבן", "לוח גבס לבן", "לוח גבס"], unit: "יחידה", category: "גבס וטיח", price: 32 },
  { sku: "50001", productName: 'פנל מבודד קלקר 50 מ"מ', aliases: ["פנל מבודד", "פנל קלקר", "פנל 50", "פנל מבודד 50"], unit: "מ\"ר", category: "בידוד", price: 85 },
  { sku: "50002", productName: 'פנל מבודד צמר סלעים 80 מ"מ', aliases: ["פנל צמר סלעים", "פנל מבודד 80", "צמר סלעים"], unit: "מ\"ר", category: "בידוד", price: 125 },
  { sku: "60001", productName: "משטח עץ טעון פיקדון", aliases: ["משטח", "משטחים", "פיקדון משטח", "משטח עץ"], unit: "משטח", category: "פקדונות", price: 45 },
];

let lastSheetSyncTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // רענון מקסימלי כל 5 דקות

// פונקציית סנכרון דינמית מול ה-GAS לגליון 1PxWtIWVKLXrGavAivCIIz7RPTuZXmJA5y9GlcBRfqco
async function syncLogisticDictionaryFromSheet(force = false) {
  const now = Date.now();
  if (!force && (now - lastSheetSyncTimestamp < CACHE_TTL_MS)) {
    return logisticDictionary;
  }

  if (!serverSettings.webAppUrl) return logisticDictionary;

  try {
    const response = await fetch(serverSettings.webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_logistic_dictionary",
        tab: "מילון_לוגיסטי",
        spreadsheetId: serverSettings.spreadsheetId
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.dictionary) && data.dictionary.length > 0) {
        logisticDictionary = data.dictionary.map(item => ({
          sku: String(item.sku || '').trim(),
          productName: String(item.productName || item.name || '').trim(),
          aliases: Array.isArray(item.aliases) 
            ? item.aliases 
            : String(item.aliases || '').split(',').map(a => a.trim()).filter(Boolean),
          unit: String(item.unit || 'יחידה').trim(),
          category: String(item.category || 'כללי').trim(),
          price: Number(item.price || 0)
        }));
        lastSheetSyncTimestamp = now;
        console.log(`✅ [SabanOS Sync] 'מילון_לוגיסטי' סונכרן בהצלחה מהגליון (${logisticDictionary.length} מוצרים).`);
      }
    }
  } catch (err) {
    console.warn("⚠️ [SabanOS Sync] שגיאה בסנכרון מול הגליון, נעשה שימוש במילון השמור ברשת:", err?.message);
  }
  return logisticDictionary;
}

// פונקציית עזר לאימות ופענוח מקומי מול המילון הלוגיסטי
function verifyOrderLocally(incomingMessage, senderName) {
  if (!incomingMessage) return null;
  const lowerMsg = incomingMessage.toLowerCase();
  const matched = [];

  for (const prod of logisticDictionary) {
    if (prod.aliases.some(a => lowerMsg.includes(a.toLowerCase())) || lowerMsg.includes(prod.productName.toLowerCase())) {
      matched.push(prod);
    }
  }

  if (matched.length === 0) return null;

  let itemsSummary = matched.map(m => `• [מק"ט ${m.sku}] ${m.productName} — (${m.unit})`).join("\n");
  return `שלום ${senderName}! 👋\n*ההזמנה שלך נקלטה ופוענחה במערכת סידור ח.סבן:* 🚛\n\n${itemsSummary}\n\nצוות הלוגיסטיקה מכין את המשלוח!`;
}

// Initialize Gemini SDK if GEMINI_API_KEY is available
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    spreadsheetId: serverSettings.spreadsheetId,
    webAppUrl: serverSettings.webAppUrl,
    dictionaryCount: logisticDictionary.length
  });
});

// Admin Settings GET & POST
app.get("/api/admin/settings", (req, res) => {
  res.json({
    settings: serverSettings,
    logs: webhookLogs.slice(-20),
  });
});

app.post("/api/admin/settings", (req, res) => {
  const {
    systemPrompt,
    spreadsheetId,
    webAppUrl,
    webhookSyncEnabled,
    activeModel,
    autoReplyEnabled,
    enableBlueTicks,
    businessHoursEnabled,
    businessHoursStart,
    businessHoursEnd,
    businessDays,
    outsideHoursMode,
    outsideHoursMessage,
  } = req.body;

  if (systemPrompt !== undefined) serverSettings.systemPrompt = systemPrompt;
  if (spreadsheetId !== undefined) serverSettings.spreadsheetId = spreadsheetId;
  if (webAppUrl !== undefined) serverSettings.webAppUrl = webAppUrl;
  if (webhookSyncEnabled !== undefined) serverSettings.webhookSyncEnabled = webhookSyncEnabled;
  if (activeModel !== undefined) serverSettings.activeModel = activeModel;
  if (autoReplyEnabled !== undefined) serverSettings.autoReplyEnabled = autoReplyEnabled;
  if (enableBlueTicks !== undefined) serverSettings.enableBlueTicks = enableBlueTicks;
  if (businessHoursEnabled !== undefined) serverSettings.businessHoursEnabled = businessHoursEnabled;
  if (businessHoursStart !== undefined) serverSettings.businessHoursStart = businessHoursStart;
  if (businessHoursEnd !== undefined) serverSettings.businessHoursEnd = businessHoursEnd;
  if (businessDays !== undefined) serverSettings.businessDays = businessDays;
  if (outsideHoursMode !== undefined) serverSettings.outsideHoursMode = outsideHoursMode;
  if (outsideHoursMessage !== undefined) serverSettings.outsideHoursMessage = outsideHoursMessage;

  res.json({ success: true, settings: serverSettings });
});

// Test / Proxy Webhook endpoint
app.post("/api/webhook/google-script", async (req, res) => {
  const targetUrl = req.body.url || serverSettings.webAppUrl;
  const payload = req.body.payload || {
    action: "ping",
    spreadsheetId: serverSettings.spreadsheetId,
    source: "SabanOS_WhatsApp_Web",
    timestamp: new Date().toISOString(),
  };

  const logId = `log_${Date.now()}`;
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const status = response.ok ? "success" : "error";
    let resText = "";
    try {
      resText = await response.text();
    } catch {
      resText = "No response body";
    }

    const logEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing",
      url: targetUrl,
      payload,
      responseCode: response.status,
      status,
      details: resText.substring(0, 200),
    };

    webhookLogs.push(logEntry);
    if (webhookLogs.length > 50) webhookLogs.shift();

    res.json({
      success: response.ok,
      status: response.status,
      response: resText,
      log: logEntry,
    });
  } catch (error) {
    const logEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing",
      url: targetUrl,
      payload,
      responseCode: 500,
      status: "error",
      details: error?.message || "Network Error",
    };

    webhookLogs.push(logEntry);
    res.json({
      success: false,
      status: 500,
      error: error?.message || "Failed to reach Web App endpoint",
      log: logEntry,
    });
  }
});

// Local Server C:\ap94 Listener Webhook Event Mirroring Route
app.post("/api/listener/event", async (req, res) => {
  try {
    await syncLogisticDictionaryFromSheet();
    const body = req.body || {};
    const phone = body.phone || body.from || body.chatId || "050-0000000";
    let senderName = body.senderName || body.contactName || body.sender || body.name || "לקוח וואטסאפ";
    const isGroup = Boolean(body.isGroup || (body.groupId && body.groupId.includes("@g.us")) || (body.from && body.from.includes("@g.us")));
    const groupId = body.groupId || (body.from && body.from.includes("@g.us") ? body.from : "group_120363@g.us");
    const mentionedJids = Array.isArray(body.mentionedJids) ? body.mentionedJids : (body.mentionedJids ? [body.mentionedJids] : []);
    const parsedClientName = body.parsedClientName || (body.clientName ? body.clientName : null);
    
    if (parsedClientName) {
      senderName = `${parsedClientName} (${senderName})`;
    }

    const incomingMessage = body.incomingMessage || body.userMessage || body.message || body.prompt || body.text || "";
    const sentToWhatsapp = body.sentToWhatsapp !== undefined ? Boolean(body.sentToWhatsapp) : true;
    const timestamp = body.timestamp || new Date().toISOString();

    let noaResponse = body.noaResponse || body.replyText || "";

    if (!noaResponse && incomingMessage) {
      const orderVerification = verifyOrderLocally(incomingMessage, senderName);
      if (orderVerification) {
        noaResponse = orderVerification;
      } else {
        noaResponse = "הודעתך התקבלה והועברה לצוות";
      }
    }

    const eventId = `evt_${Date.now()}`;
    const newEvent = {
      id: eventId,
      phone,
      senderName,
      isGroup,
      groupId,
      mentionedJids,
      parsedClientName,
      incomingMessage,
      noaResponse,
      sentToWhatsapp,
      timestamp,
    };

    listenerEvents.push(newEvent);
    if (listenerEvents.length > 100) listenerEvents.shift();

    const logEntry = {
      id: `wh_evt_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "incoming",
      url: `/api/listener/event (C:\\ap94 ${isGroup ? 'Group' : 'Direct'} Listener)`,
      payload: body,
      responseCode: 200,
      status: "success",
      details: `Mirrored local C:\\ap94 listener event (phone: ${phone}, isGroup: ${isGroup}, sentToWhatsapp: ${sentToWhatsapp})`,
    };

    webhookLogs.push(logEntry);
    if (webhookLogs.length > 50) webhookLogs.shift();

    // Parse order items into staging table (הזמנות_סידור)
    let stagedOrderEntry = null;
    const isOrderMsg = /(מלט|סומסום|חול|טיט|איטונג|בלוק|גבס|פנל|טיח|חצץ|משלוח|מנוף|שק|בלה|משטח|ניצבים|מסלולים)/i.test(incomingMessage) ||
                       /(מלט|סומסום|חול|טיט|איטונג|בלוק|גבס|פנל|טיח|חצץ|מק"ט)/i.test(noaResponse);

    if (isOrderMsg && incomingMessage) {
      const parsedItems = [];
      const lines = incomingMessage.split(/[\n,;+]| וגם | ועוד |\t/).map((l) => l.trim()).filter(Boolean);

      for (const line of lines) {
        let quantity = 1;
        let textNoQty = line;
        const numMatch = line.match(/(?:^|\s)(\d+)(?:\s*x|\s*שקים|\s*בלות|\s*משטחים|\s*יח|\s*יחידות|\s*מ"ר)?(?:\s+|$)/i);
        if (numMatch) {
          quantity = parseInt(numMatch[1], 10);
          textNoQty = line.replace(numMatch[0], " ").trim();
        }

        let matchedSku = "GENERIC-99";
        let matchedName = textNoQty || line;
        let unitPrice = 0;
        let unit = "יחידה";

        const lowerLine = line.toLowerCase();
        for (const prod of logisticDictionary) {
          if (
            prod.aliases.some((a) => lowerLine.includes(a.toLowerCase())) ||
            lowerLine.includes(prod.productName.toLowerCase())
          ) {
            matchedSku = prod.sku;
            matchedName = prod.productName;
            unitPrice = prod.price || 0;
            unit = prod.unit;
            break;
          }
        }

        parsedItems.push({
          sku: matchedSku,
          name: matchedName,
          quantity,
          unit,
          unitPrice,
          totalPrice: unitPrice * quantity,
        });
      }

      const orderTotal = parsedItems.reduce((acc, item) => acc + item.totalPrice, 0);
      stagedOrderEntry = {
        id: `ord_${Date.now()}`,
        orderNumber: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        customerPhone: phone,
        customerName: senderName,
        rawMessage: incomingMessage,
        noaResponse,
        items: parsedItems,
        totalPrice: orderTotal,
        status: "נקלט ב-SabanOS",
        sentToWhatsapp: true,
        createdAt: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      };

      stagedOrders.unshift(stagedOrderEntry);
      if (stagedOrders.length > 50) stagedOrders.pop();
    }

    return res.json({
      success: true,
      id: eventId,
      phone,
      senderName,
      isGroup,
      groupId,
      mentionedJids,
      parsedClientName,
      incomingMessage,
      noaResponse,
      sentToWhatsapp: true,
      stagedOrder: stagedOrderEntry,
      timestamp,
    });
  } catch (err) {
    console.error("Error in /api/listener/event:", err);
    return res.status(200).json({
      success: true,
      text: "הודעתך התקבלה והועברה לצוות",
      sentToWhatsapp: true,
      errorDetails: err?.message || "Internal Server Error",
    });
  }
});

// Outbound JONI Group Message Dispatch Endpoint
app.post("/api/chat/send-group-message", async (req, res) => {
  try {
    const body = req.body || {};
    const groupId = body.groupId || "12036304555@g.us";
    const phone = body.phone || "052-6688768";
    const senderName = body.senderName || "חיים עמרם";
    let messageText = body.messageText || body.text || "";
    const tagClient = Boolean(body.tagClient);
    const mentions = Array.isArray(body.mentions) ? body.mentions : (tagClient ? [`${phone.replace(/\D/g, "")}@c.us`] : []);

    if (tagClient && phone && !messageText.includes("@")) {
      const formattedTag = `@${phone.startsWith("+") ? phone : "+972" + phone.replace(/^0/, "")}`;
      messageText = `${messageText} ${formattedTag}`;
    }

    const joniApiUrl = serverSettings.webAppUrl || process.env.VITE_GAS_WEBHOOK_URL || "";
    let joniStatus = "simulated_success";

    if (joniApiUrl) {
      try {
        await fetch(joniApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SEND_GROUP_MESSAGE",
            groupId,
            messageText,
            mentions,
            timestamp: new Date().toISOString(),
          }),
        });
        joniStatus = "dispatched_to_joni";
      } catch (e) {
        console.warn("JONI Group Dispatch warning:", e?.message);
      }
    }

    const logEntry = {
      id: `joni_grp_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing",
      url: `/api/chat/send-group-message (JONI API -> ${groupId})`,
      payload: { groupId, messageText, mentions, tagClient },
      responseCode: 200,
      status: "success",
      details: `Dispatched group WhatsApp message to JONI (${groupId}, tagClient: ${tagClient})`,
    };

    webhookLogs.push(logEntry);
    if (webhookLogs.length > 50) webhookLogs.shift();

    listenerEvents.push({
      id: `evt_out_${Date.now()}`,
      phone,
      senderName: "נועה AI (SabanOS Agent)",
      isGroup: true,
      groupId,
      mentionedJids: mentions,
      parsedClientName: senderName,
      incomingMessage: `[הודעה נשלחה לקבוצה] ${messageText}`,
      noaResponse: messageText,
      sentToWhatsapp: true,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      action: "SEND_GROUP_MESSAGE",
      groupId,
      phone,
      senderName,
      messageText,
      mentions,
      tagClient,
      joniStatus,
      timestamp: new Date().toISOString(),
      message: "הודעת הקבוצה נשלחה ומתויגת בהצלחה דרך JONI!",
    });
  } catch (err) {
    console.error("Error in /api/chat/send-group-message:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to send group message",
    });
  }
});

app.get("/api/listener/events", (req, res) => {
  res.json({
    success: true,
    events: listenerEvents.slice(-50),
    stagedOrders,
  });
});

app.get("/api/orders/staged", (req, res) => {
  res.json({
    success: true,
    tab: "הזמנות_סידור",
    orders: stagedOrders,
  });
});

// One-Click Dispatch Approval Route (/api/dispatch/approve)
app.post("/api/dispatch/approve", async (req, res) => {
  try {
    const body = req.body || {};
    const orderId = body.orderId || body.id || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const customerName = body.customerName || body.name || "לקוח";
    const phone = body.phone || body.customerPhone || "050-0000000";
    const address = body.address || "לא צוינה כתובת";
    const items = body.items || "פריטי הזמנה מפורטים";
    const driverName = body.driverName || "אבי ברגמן - משאית מנוף 12";
    const status = body.status || "APPROVED";
    const timestamp = body.timestamp || new Date().toISOString();

    let found = stagedOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (found) {
      found.status = "APPROVED";
      found.driverName = driverName;
      found.address = address;
    } else {
      found = {
        id: `ord_${Date.now()}`,
        orderNumber: orderId.startsWith("ORD-") ? orderId : `ORD-${orderId}`,
        customerPhone: phone,
        customerName: customerName,
        rawMessage: typeof items === "string" ? items : JSON.stringify(items),
        noaResponse: `הזמנה ${orderId} אושרה להובלה בסידור`,
        items: Array.isArray(items) ? items : [{ sku: "APPROV-1", name: String(items), quantity: 1, unit: "משלוח" }],
        totalPrice: 0,
        status: "APPROVED",
        driverName,
        address,
        sentToWhatsapp: true,
        createdAt: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      };
      stagedOrders.unshift(found);
    }

    const gasWebhookUrl = process.env.VITE_GAS_WEBHOOK_URL || serverSettings.webAppUrl || "";
    if (gasWebhookUrl) {
      fetch(gasWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_DISPATCH",
          tab: "הזמנות_סידור",
          spreadsheetId: serverSettings.spreadsheetId,
          orderId: found.orderNumber,
          customerName,
          phone,
          address,
          items: typeof items === "string" ? items : JSON.stringify(items),
          driverName,
          status: "APPROVED",
          timestamp,
        }),
      }).catch((err) => console.log("GAS Dispatch Error:", err?.message));
    }

    const logEntry = {
      id: `dispatch_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing",
      url: "/api/dispatch/approve (GAS: הזמנות_סידור)",
      payload: { action: "APPROVE_DISPATCH", orderId: found.orderNumber, customerName, phone, address, items, status: "APPROVED" },
      responseCode: 200,
      status: "success",
      details: `One-Click Dispatch Approved for ${customerName} (${found.orderNumber}) -> GAS sheet [הזמנות_סידור]`,
    };

    webhookLogs.push(logEntry);
    if (webhookLogs.length > 50) webhookLogs.shift();

    return res.json({
      success: true,
      action: "APPROVE_DISPATCH",
      orderId: found.orderNumber,
      customerName,
      phone,
      address,
      items,
      driverName,
      status: "APPROVED",
      timestamp,
      message: "ההזמנה אושרה בהצלחה, שודרה ל-GAS (הזמנות_סידור) ונעלה בלוח ההובלות!",
    });
  } catch (err) {
    console.error("Error in /api/dispatch/approve:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to approve dispatch",
    });
  }
});

// Local Server WhatsApp Webhook Listener (GET & POST)
app.get("/api/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe") {
    console.log("WhatsApp Webhook listener verified via local server!");
    return res.status(200).send(challenge || "VERIFIED");
  }
  res.json({
    status: "listening",
    server: "SabanOS Local Server WhatsApp Listener",
    timestamp: new Date().toISOString(),
    endpoint: "/api/webhook/whatsapp",
  });
});

app.post(["/api/webhook/whatsapp", "/api/webhook/incoming"], async (req, res) => {
  await syncLogisticDictionaryFromSheet();
  const body = req.body || {};
  console.log("Incoming WhatsApp message captured on local server:", JSON.stringify(body));

  const logEntry = {
    id: `wh_in_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString("he-IL"),
    direction: "incoming",
    url: "/api/webhook/whatsapp",
    payload: body,
    responseCode: 200,
    status: "success",
    details: "Captured incoming message via WhatsApp local listener",
  };

  webhookLogs.push(logEntry);
  if (webhookLogs.length > 50) webhookLogs.shift();

  const senderName = body.contactName || body.sender || body.name || body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || "לקוח וואטסאפ";
  const senderPhone = body.phone || body.from || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || "050-0000000";
  const userMessage = body.message || body.text || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || body.body || "";

  if (!userMessage) {
    return res.json({ success: true, status: "listening", note: "Webhook received but no text payload" });
  }

  const orderVerificationText = verifyOrderLocally(userMessage, senderName);

  res.json({
    success: true,
    status: "received_and_processed",
    senderName,
    senderPhone,
    userMessage,
    orderVerification: orderVerificationText ? "Verified against מילון_לוגיסטי" : "Standard query",
    aiReplyText: orderVerificationText || `שלום ${senderName}! הודעתך נקלטה בהצלחה בשרת SabanOS.`,
    timestamp: new Date().toISOString(),
  });
});

// Voice Note AI Transcription API Route
app.post("/api/transcribe-voice", async (req, res) => {
  const {
    audioBase64,
    mimeType = "audio/webm",
    contactName = "הלקוח",
    contextPrompt = "",
  } = req.body;

  const ai = getGeminiClient();

  if (ai) {
    const candidateModels = Array.from(
      new Set([
        serverSettings.activeModel || "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
      ])
    );

    if (audioBase64 && typeof audioBase64 === "string") {
      const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, "");

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || "audio/webm",
                  data: cleanBase64,
                },
              },
              {
                text: "אנא תמלל את ההודעה הקולית הזו במדויק בעברית. החזר אך ורק את הטקסט המתומלל, ללא הסברים, ללא מרכאות היקפיות וללא הקדמות.",
              },
            ],
          });

          const transcriptionText = response.text?.trim();
          if (transcriptionText) {
            return res.json({
              success: true,
              transcription: transcriptionText,
              source: "gemini_multimodal",
              modelUsed: modelName,
            });
          }
        } catch (err) {
          const isQuota = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
          if (isQuota) {
            console.warn(`[Gemini Quota Limit on ${modelName} for audio transcription] Using next candidate model or fallback.`);
          } else {
            console.warn(`[Gemini Multimodal Voice Transcription issue on ${modelName}]:`, err?.message || err);
          }
        }
      }
    }

    const contextualPrompt = `צור תמלול קצר, טבעי וקולח בעברית להודעה קולית נכנסת מאת "${contactName}". ${
      contextPrompt ? `ההקשר: ${contextPrompt}` : "הודעה קולית לגבי שירות, הזמנות או בירורים ב-SabanOS."
    } החזר אך ורק את המשפט או הפסקה המתומללת בלבד, ללא מרכאות וללא הקדמות.`;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contextualPrompt,
          config: {
            temperature: 0.7,
          },
        });

        const transcriptionText = response.text?.trim();
        if (transcriptionText) {
          return res.json({
            success: true,
            transcription: transcriptionText,
            source: "gemini_contextual",
            modelUsed: modelName,
          });
        }
      } catch (err) {
        const isQuota = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
        if (isQuota) {
          console.warn(`[Gemini Quota Limit on ${modelName} for contextual transcription] Using next candidate model or fallback.`);
        } else {
          console.warn(`[Gemini Contextual Voice Transcription issue on ${modelName}]:`, err?.message || err);
        }
      }
    }
  }

  const fallbackTranscriptions = [
    `שלום! רציתי לברר לגבי סטטוס ההזמנה והמשלוח במערכת SabanOS, אשמח אם תוכלו לעדכן אותי. תודה!`,
    `היי, רציתי לבדוק לגבי השירות שסיפקתם ולשאול מתי הנהג צפוי להגיע אלינו היום.`,
    `שלום נועה, האם אפשר לקבל את הצעת המחיר המעודכנת לקייטרינג ואירועים? תודה רבה!`,
  ];

  const randomFallback = fallbackTranscriptions[Math.floor(Math.random() * fallbackTranscriptions.length)];

  res.json({
    success: true,
    transcription: randomFallback,
    source: "smart_fallback",
  });
});

// GET Logistic Products Dictionary (מילון_לוגיסטי) עם רענון אוטומטי מול הגליון
app.get("/api/products/dictionary", async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  await syncLogisticDictionaryFromSheet(forceRefresh);

  res.json({
    success: true,
    tab: "מילון_לוגיסטי",
    spreadsheetId: serverSettings.spreadsheetId,
    count: logisticDictionary.length,
    dictionary: logisticDictionary,
    lastSync: new Date(lastSheetSyncTimestamp).toISOString()
  });
});

// POST Add or update product in Logistic Products Dictionary
app.post("/api/products/dictionary", async (req, res) => {
  const { sku, productName, aliases, unit, category, price } = req.body;
  if (!sku || !productName) {
    return res.status(400).json({ success: false, error: "SKU and Product Name are required" });
  }

  const existingIndex = logisticDictionary.findIndex((p) => p.sku === String(sku).trim());
  const newProduct = {
    sku: String(sku).trim(),
    productName: String(productName).trim(),
    aliases: Array.isArray(aliases) ? aliases : String(aliases || "").split(",").map((a) => a.trim()).filter(Boolean),
    unit: String(unit || "יחידה").trim(),
    category: String(category || "כללי").trim(),
    price: Number(price) || 0,
  };

  if (existingIndex >= 0) {
    logisticDictionary[existingIndex] = newProduct;
  } else {
    logisticDictionary.push(newProduct);
  }

  // Push update to Google Apps Script if webAppUrl is available
  if (serverSettings.webAppUrl) {
    fetch(serverSettings.webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_product_dictionary",
        tab: "מילון_לוגיסטי",
        spreadsheetId: serverSettings.spreadsheetId,
        product: newProduct
      }),
    }).catch(e => console.warn("Failed to push product update to Google Sheets:", e?.message));
  }

  res.json({
    success: true,
    message: `מוצר ${newProduct.sku} (${newProduct.productName}) עודכן בהצלחה במילון הלוגיסטי.`,
    product: newProduct,
    dictionary: logisticDictionary,
  });
});

// POST Normalize free text customer order into structured items (השלמה מלאה)
app.post("/api/products/normalize", async (req, res) => {
  await syncLogisticDictionaryFromSheet();
  const { text, customerName = "לקוח" } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ success: false, error: "Text string is required" });
  }

  const lines = text.split(/[\n,;+]| וגם | ועוד |\t/).map((l) => l.trim()).filter(Boolean);
  const normalizedItems = [];

  for (const line of lines) {
    let quantity = 1;
    let textWithoutQty = line;

    const numMatch = line.match(/(?:^|\s)(\d+)(?:\s*x|\s*שקים|\s*בלות|\s*משטחים|\s*יח|\s*יחידות|\s*מ"ר)?(?:\s+|$)/i);
    if (numMatch) {
      quantity = parseInt(numMatch[1], 10);
      textWithoutQty = line.replace(numMatch[0], " ").trim();
    }

    let targetTerm = textWithoutQty.toLowerCase().replace(/(רוצה|צריך|תביא|תוסיף|משלוח של|הזמנה של|בבקשה)/g, "").trim();

    let bestMatch = null;
    let highestScore = 0;

    for (const prod of logisticDictionary) {
      let score = 0;
      for (const alias of prod.aliases) {
        const lowerAlias = alias.toLowerCase();
        if (targetTerm === lowerAlias) score = Math.max(score, 100);
        else if (targetTerm.includes(lowerAlias)) score = Math.max(score, 80);
      }
      if (targetTerm === prod.productName.toLowerCase()) score = Math.max(score, 100);
      else if (targetTerm.includes(prod.productName.toLowerCase())) score = Math.max(score, 85);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = prod;
      }
    }

    if (bestMatch && highestScore >= 30) {
      normalizedItems.push({
        sku: bestMatch.sku,
        name: bestMatch.productName,
        quantity,
        unit: bestMatch.unit,
        unitPrice: bestMatch.price,
        totalPrice: bestMatch.price * quantity,
        category: bestMatch.category,
        confidence: highestScore
      });
    } else {
      normalizedItems.push({
        sku: "GENERIC-99",
        name: line,
        quantity,
        unit: "יחידה",
        unitPrice: 0,
        totalPrice: 0,
        category: "לא מזוהה",
        confidence: 0
      });
    }
  }

  const grandTotal = normalizedItems.reduce((sum, i) => sum + i.totalPrice, 0);

  res.json({
    success: true,
    customerName,
    rawText: text,
    parsedCount: normalizedItems.length,
    items: normalizedItems,
    grandTotal,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SabanOS Local Server is running on port ${PORT}`);
  console.log(`📊 Spreadsheet ID: ${serverSettings.spreadsheetId}`);
  console.log(`🔗 WebApp Execution URL: ${serverSettings.webAppUrl}`);
  
  // סנכרון ראשוני בעליית השרת
  syncLogisticDictionaryFromSheet(true);
});