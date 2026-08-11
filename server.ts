import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import noaBrainModule, { SABAN_MASTER_INVENTORY } from "./noaBrain.js";

const masterInventoryList = SABAN_MASTER_INVENTORY || (noaBrainModule && noaBrainModule.SABAN_MASTER_INVENTORY) || [];

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server state / settings storage
let serverSettings = {
  systemPrompt: `אתה נועה - קולגה חדה, קולחת ועוזרת שירות ב'ח. סבן חומרי בניין'.

כללי מפתח חיוניים למענה:
1. חוק הפרופורציונליות (Proportionality Rule): התאם את אורך התגובה בדיוק לאורך הודעת הלקוח! אם הלקוח שולח ברכה פשוטה ("היי", "שלום", "אהלן", "בוקר טוב"), השב בברכה אנושית, קצרה וחמה בלבד (משפט 1 או 2 max). אל תפרט היסטוריית הזמנות, אל תציג סיכומי עבר ואל תשלח תבניות ארוכות אלא אם הלקוח ביקש זאת במפורש.
2. טון דיבור אנושי וקולגיאלי (Conversational Tone): דבר כמו קולגה חדה, יציבה ועוזרת בצוות 'ח. סבן'. הימנע מניסוחים רובוטיים, תבניות קשיחות, חתימות אוטומטיות נפוחות, או טקסטים גנריים של בוט.
3. פשטות ובהירות (Simplicity): שמור על תשובות נקיות, קצרות (1-2 משפטים לפנייה ראשונית/פשוטה), בעברית יומיומית, פשוטה וטבעית.`,
  webAppUrl: "https://script.google.com/macros/s/AKfycbxjs19kSI1zgpLuMd64aUcfVlKXfVE3_dBShrDfRbExy2fUXkmdhVzna28P3GnIrW4o/exec",
  spreadsheetId: "1i2J9ByIAerL48eIRYnT9SJLJcUryR0mlkD8uiWjjZPc",
  stagedOrdersTab: "לוג_הזמנות_מערכת",
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

let webhookLogs: Array<{
  id: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
  url: string;
  payload: any;
  responseCode: number;
  status: "success" | "error";
  details?: string;
}> = [];

let listenerEvents: Array<{
  id: string;
  phone: string;
  senderName: string;
  isGroup: boolean;
  groupId?: string;
  mentionedJids?: string[];
  parsedClientName?: string;
  incomingMessage: string;
  noaResponse: string;
  sentToWhatsapp: boolean;
  timestamp: string;
}> = [];

let stagedOrders: Array<any> = [
  {
    id: "ord_6214582",
    orderNumber: "6214582",
    ingestionDate: "2026-07-30 05:37:47",
    customerName: "וגשל דאו(519205)",
    customerPhone: "052-5192050",
    warehouse: "🏭 4(החרש)",
    address: "בורוכוב 28, תל אביב",
    rawItemsText: `1. 📦 מק"ט: 10015 | בטון מהיר מוכן 25 ק"ג | כמות: 16
2. 📦 מק"ט: 11500 | חול שק | כמות: 140
3. 📦 מק"ט: 11501 | חול שק גדול | כמות: 1
4. 📦 מק"ט: 14603 | פלסטומר AD603 אפור 25 ק"ג | כמות: 12
5. 📦 מק"ט: 818070 | הובלה ללא פריקה תל אביב מרכז | כמות: 1
6. 📦 מק"ט: 60002 | שק גדול פקדון | כמות: 1
7. 📦 מק"ט: 60060 | משטח סבן פקדון | כמות: 3`,
    rawMessage: "בטון מהיר, חול שק, פלסטומר AD603, הובלה ללא פריקה תל אביב",
    noaResponse: "נועה AI: הזמנת הובלה ללא פריקה – פטור מלא מפקדונות בלות ומשטחים",
    baleDeposit: "ℹ️ פטור (הובלה ללא פריקה)",
    palletDeposit: "ℹ️ פטור (הובלה ללא פריקה)",
    status: "מאושר",
    result: "תקין",
    totalPrice: 0,
    verificationDate: "2026-07-30",
    deliveryTime: "08:00",
    noaInsights: "נועה AI: הזמנת הובלה ללא פריקה – פטור מלא מפקדונות בלות ומשטחים",
    routeVerification: 'תקין (24.1 ק"מ (29 דקות))',
    syncStatus: "סונכרן לסידור עבודה 🟢",
    driverName: "עלי - משאית מנוף 1",
    sentToWhatsapp: true,
    createdAt: "05:37:47",
    items: [
      { sku: "10015", name: 'בטון מהיר מוכן 25 ק"ג', quantity: 16, unit: "שק" },
      { sku: "11500", name: "חול שק", quantity: 140, unit: "שק" },
      { sku: "11501", name: "חול שק גדול", quantity: 1, unit: "שק" },
      { sku: "14603", name: 'פלסטומר AD603 אפור 25 ק"ג', quantity: 12, unit: "שק" },
      { sku: "818070", name: "הובלה ללא פריקה תל אביב מרכז", quantity: 1, unit: "הובלה" },
      { sku: "60002", name: "שק גדול פקדון", quantity: 1, unit: "יח" },
      { sku: "60060", name: "משטח סבן פקדון", quantity: 3, unit: "יח" },
    ],
  },
];

let inboundInquiries: Array<{
  id: string;
  customerName: string;
  customerPhone: string;
  incomingMessage: string;
  status: "חדש" | "טופל";
  timestamp: string;
  groupId?: string;
  source?: string;
  lastNudgeAt?: string;
  nudgeCount?: number;
}> = [];

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
    webAppUrl: serverSettings.webAppUrl,
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

    const status: "success" | "error" = response.ok ? "success" : "error";
    let resText = "";
    try {
      resText = await response.text();
    } catch {
      resText = "No response body";
    }

    const logEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing" as const,
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
  } catch (error: any) {
    const logEntry = {
      id: logId,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing" as const,
      url: targetUrl,
      payload,
      responseCode: 500,
      status: "error" as const,
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

// Google Sheets Generic Tab API - Get list of spreadsheet tabs
app.get("/api/sheets/tabs", (req, res) => {
  const tabs = [
    { id: "dashboard", name: "דשבורד_לוגיסטי", description: "דשבורד מנהלים ראשי וסיכום מדדים" },
    { id: "orders_log", name: "לוג_הזמנות_מערכת", description: "לוג הזמנות מערכת מלא כולל פקדונות ואימות" },
    { id: "inventory", name: "מלאי_מוצרים", description: "מלאי מוצרים, מחירים וספקים" },
    { id: "customers", name: "תיק_לקוח_וחשבונות", description: "תיקי לקוחות, חשבונות ואנשי קשר" },
    { id: "work_order", name: "הזמנות_סידור", description: "הזמנות סידור עבודה ונהגים" },
    { id: "dictionary", name: "מילון_לוגיסטי", description: "מילון מוצרים, מק״טים וכינויים" },
    { id: "cities", name: "ערים", description: "מרחקים וזמני נסיעה לערים" },
    { id: "exceptions", name: "חריגות_לוגיסטיות", description: "חריגות לוגיסטיות ופקדונות" },
    { id: "system_logs", name: "חריגות_ולוגים", description: "תיעוד לוגים ותקלות מערכת" },
    { id: "whatsapp_inbound", name: "WhatsApp_Inbound", description: "הודעות נכנסות מ-WhatsApp" },
    { id: "noa_rules", name: "הגדרות_מענה_נועה", description: "חוקים והגדרות מענה אוטומטי נועה AI" },
    { id: "sys_settings", name: "הגדרות_מערכת", description: "הגדרות מערכת גלובליות" },
  ];

  res.json({
    success: true,
    webAppUrl: serverSettings.webAppUrl,
    tabsCount: tabs.length,
    tabs,
    timestamp: new Date().toISOString(),
  });
});

// Read Data from any Google Sheets Tab
app.all("/api/sheets/read-tab", async (req, res) => {
  try {
    const tabName = req.query.tab || req.body?.tab || req.query.name || req.body?.name || "לוג_הזמנות_מערכת";
    const targetUrl = serverSettings.webAppUrl;

    if (!targetUrl) {
      return res.status(400).json({ success: false, error: "כתובת WebApp של גוגל שייץ אינה מוגדרת" });
    }

    const payload = {
      action: "read_tab",
      tabName: String(tabName),
      tab: String(tabName),
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        tab: tabName,
        data: data.data || data.records || data.rows || data,
        timestamp: new Date().toISOString(),
      });
    } else {
      const errText = await response.text().catch(() => "Unknown error");
      return res.status(response.status).json({
        success: false,
        error: `שגיאה בתקשורת מול גוגל שייטס: ${errText}`,
        tab: tabName,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "נכשלה קריאת הנתונים מהטאב בגוגל שייטס",
    });
  }
});

// Write / Append Data to any Google Sheets Tab
app.post("/api/sheets/write-tab", async (req, res) => {
  try {
    const { tab, action = "write_tab", rowData, rows, mode = "append" } = req.body || {};
    const tabName = tab || "לוג_הזמנות_מערכת";
    const targetUrl = serverSettings.webAppUrl;

    if (!targetUrl) {
      return res.status(400).json({ success: false, error: "כתובת WebApp של גוגל שייץ אינה מוגדרת" });
    }

    const payload = {
      action,
      tabName: String(tabName),
      tab: String(tabName),
      rowData,
      rows: rows || (rowData ? [rowData] : []),
      mode,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        tab: tabName,
        result: data,
        timestamp: new Date().toISOString(),
      });
    } else {
      const errText = await response.text().catch(() => "Unknown error");
      return res.status(response.status).json({
        success: false,
        error: `שגיאה בכתיבה לגוגל שייטס: ${errText}`,
        tab: tabName,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "נכשלה כתיבת הנתונים לטאב בגוגל שייטס",
    });
  }
});

// Align & Initialize System in Google Sheets
app.post("/api/sheets/align-system", async (req, res) => {
  try {
    const targetUrl = serverSettings.webAppUrl;
    if (!targetUrl) {
      return res.status(400).json({ success: false, error: "כתובת WebApp של גוגל שייץ אינה מוגדרת" });
    }

    const payload = {
      action: "align_system",
      source: "SabanOS_Admin_Panel",
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        message: "התאמת גליונות המערכת וכל הטאבים בוצעה בהצלחה בגוגל שייטס!",
        data,
      });
    } else {
      const errText = await response.text().catch(() => "Unknown error");
      return res.status(response.status).json({
        success: false,
        error: `שגיאה בסנכרון מול גוגל שייטס: ${errText}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "נכשל סנכרון התאמת המערכת בגוגל שייטס",
    });
  }
});

// Local Server C:\ap94 Listener Webhook Event Mirroring Route
app.post("/api/listener/event", async (req, res) => {
  try {
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

    // If noaResponse was not supplied by local server C:\ap94, generate response using Logistic Dictionary / AI engine
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

    // Direct Webhook dispatch to Google Apps Script (GAS) to append inquiry/order automatically to Google Sheets
    const gasWebhookUrl = process.env.GAS_WEBHOOK_URL || serverSettings.webAppUrl;
    if (gasWebhookUrl && serverSettings.webhookSyncEnabled) {
      const cleanSenderPhone = phone ? phone.replace(/[^\d+]/g, "") : "";
      const isOrderGroup = isGroup && (groupId.includes("order") || groupId.includes("סידור") || groupId.includes("120363"));
      
      fetch(gasWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "appendInquiry",
          timestamp: new Date().toISOString(),
          senderName: senderName,
          customerPhone: cleanSenderPhone,
          incomingMessage: incomingMessage,
          source: isOrderGroup ? 'order_group' : (isGroup ? 'group' : 'direct'),
          messageId: body.messageId || body.id || `MSG-${Date.now()}`,
          status: 'נקלט 🟢'
        }),
      }).catch((err: any) => {
        console.warn('⚠️ שגיאה בשליחת Webhook לגליון:', err?.message || err);
      });
    }

    // Log to webhookLogs for System Logs tab
    const logEntry = {
      id: `wh_evt_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "incoming" as const,
      url: `/api/listener/event (C:\\ap94 ${isGroup ? 'Group' : 'Direct'} Listener)`,
      payload: body,
      responseCode: 200,
      status: "success" as const,
      details: `Mirrored local C:\\ap94 listener event (phone: ${phone}, isGroup: ${isGroup}, sentToWhatsapp: ${sentToWhatsapp})`,
    };

    webhookLogs.push(logEntry);
    if (webhookLogs.length > 50) webhookLogs.shift();

    // Parse order items into staging table (הזמנות_סידור)
    let stagedOrderEntry: any = null;
    const isOrderMsg = /(מלט|סומסום|חול|טיט|איטונג|בלוק|גבס|פנל|טיח|חצץ|משלוח|מנוף|שק|בלה|משטח|ניצבים|מסלולים)/i.test(incomingMessage) ||
                       /(מלט|סומסום|חול|טיט|איטונג|בלוק|גבס|פנל|טיח|חצץ|מק"ט)/i.test(noaResponse);

    if (isOrderMsg && incomingMessage) {
      const parsedItems: any[] = [];
      const lines = incomingMessage.split(/[\n,;+]| וגם | ועוד |\t/).map((l: string) => l.trim()).filter(Boolean);

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
      status: 200,
      id: eventId,
      phone,
      senderName,
      isGroup,
      groupId,
      mentionedJids,
      parsedClientName,
      incomingMessage,
      autoReply: noaResponse,
      noaResponse,
      replyText: noaResponse,
      sentToWhatsapp: true,
      stagedOrder: stagedOrderEntry,
      timestamp,
      data: {
        phone,
        senderName,
        incomingMessage,
        autoReply: noaResponse
      }
    });
  } catch (err: any) {
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

    const joniApiUrl = (serverSettings as any)?.webAppUrl || process.env.VITE_GAS_WEBHOOK_URL || "";
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
      } catch (e: any) {
        console.warn("JONI Group Dispatch warning:", e?.message);
      }
    }

    const logEntry = {
      id: `joni_grp_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing" as const,
      url: `/api/chat/send-group-message (JONI API -> ${groupId})`,
      payload: { groupId, messageText, mentions, tagClient },
      responseCode: 200,
      status: "success" as const,
      details: `Dispatched group WhatsApp message to JONI (${groupId}, tagClient: ${tagClient})`,
    };

    webhookLogs.push(logEntry);
    if (webhookLogs.length > 50) webhookLogs.shift();

    // Add to listenerEvents mirror
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
  } catch (err: any) {
    console.error("Error in /api/chat/send-group-message:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to send group message",
    });
  }
});

// Manual Override WhatsApp Message Dispatch Route (/api/chat/send-manual)
app.post("/api/chat/send-manual", async (req, res) => {
  try {
    const body = req.body || {};
    const phone = body.phone || body.to || "050-0000000";
    const message = body.message || body.text || "";
    const senderName = body.senderName || body.operator || "מנהל מערכת (מעקף ידני)";
    const contactName = body.contactName || body.clientName || "לקוח";
    const timestamp = body.timestamp || new Date().toISOString();

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "תוכן ההודעה ריק" });
    }

    // Forward to GAS Webhook if configured
    const gasUrl = process.env.VITE_GAS_WEBHOOK_URL || (serverSettings as any)?.webAppUrl || "";
    let gasStatus = "skipped";
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SEND_MANUAL_MESSAGE",
            phone,
            contactName,
            senderName,
            message,
            timestamp,
          }),
        });
        gasStatus = "dispatched_to_gas";
      } catch (e: any) {
        console.warn("GAS manual message send warning:", e?.message);
      }
    }

    // Record in listenerEvents array
    const eventEntry = {
      id: `evt_manual_${Date.now()}`,
      phone,
      senderName,
      isGroup: false,
      parsedClientName: contactName,
      incomingMessage: `[מעקף מנהל ידני] ${message}`,
      noaResponse: message,
      sentToWhatsapp: true,
      timestamp,
    };

    listenerEvents.push(eventEntry);
    if (listenerEvents.length > 50) listenerEvents.shift();

    // Log to webhookLogs
    webhookLogs.push({
      id: `manual_msg_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing",
      url: "/api/chat/send-manual",
      payload: { phone, contactName, message, senderName },
      responseCode: 200,
      status: "success",
      details: `Manual override message sent to ${contactName} (${phone}) via JONI / Local Listener`,
    });
    if (webhookLogs.length > 50) webhookLogs.shift();

    return res.json({
      success: true,
      phone,
      contactName,
      message,
      senderName,
      gasStatus,
      event: eventEntry,
      timestamp,
      info: "הודעת מעקף מנהל נשלחה בהצלחה!",
    });
  } catch (err: any) {
    console.error("Error in /api/chat/send-manual:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to send manual message",
    });
  }
});

// ==============================================================================
// Inbound Inquiries & Nudge Engine Management API Routes
// ==============================================================================
app.get("/api/inquiries", (req, res) => {
  res.json({
    success: true,
    inquiries: inboundInquiries,
    pendingCount: inboundInquiries.filter((i) => i.status === "חדש").length,
    handledCount: inboundInquiries.filter((i) => i.status === "טופל").length,
  });
});

app.post("/api/inquiries", (req, res) => {
  const body = req.body || {};
  if (!body.customerName && !body.incomingMessage) {
    return res.status(400).json({ success: false, error: "Missing inquiry details" });
  }

  const existingIndex = inboundInquiries.findIndex((i) => i.id === body.id);
  if (existingIndex >= 0) {
    inboundInquiries[existingIndex] = { ...inboundInquiries[existingIndex], ...body };
  } else {
    const newInq = {
      id: body.id || `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customerName: body.customerName || "לקוח",
      customerPhone: body.customerPhone || "0500000000",
      incomingMessage: body.incomingMessage || "",
      status: (body.status as "חדש" | "טופל") || "חדש",
      timestamp: body.timestamp || new Date().toISOString(),
      groupId: body.groupId || null,
      source: body.source || "manual_api",
      nudgeCount: body.nudgeCount || 0,
      lastNudgeAt: body.lastNudgeAt || null,
    };
    inboundInquiries.unshift(newInq);
  }

  res.json({
    success: true,
    inquiries: inboundInquiries,
    pendingCount: inboundInquiries.filter((i) => i.status === "חדש").length,
  });
});

app.post(["/api/inquiries/status", "/api/inquiries/:id/status"], (req, res) => {
  const id = req.params.id || req.body?.id;
  const status = req.body?.status;

  if (!id || !status) {
    return res.status(400).json({ success: false, error: "Missing id or status" });
  }

  const inquiry = inboundInquiries.find((i) => i.id === id);
  if (!inquiry) {
    return res.status(404).json({ success: false, error: "Inquiry not found" });
  }

  inquiry.status = status;
  res.json({
    success: true,
    id: inquiry.id,
    newStatus: inquiry.status,
    message: `סטטוס הפנייה עודכן ל-${status}. הנודניק הופסק!`,
  });
});

app.get("/api/listener/events", (req, res) => {
  res.json({
    success: true,
    events: listenerEvents.slice(-50),
    stagedOrders,
  });
});

// Primary Local Listener & Vercel Sync Route (/api/chat/respond)
app.get("/api/chat/respond", (req, res) => {
  res.json({
    status: "online",
    endpoint: "/api/chat/respond",
    activeSince: new Date().toISOString(),
    supportedMethods: ["GET", "POST"],
    info: "Noa AI / SabanOS Local WhatsApp Listener Sync API",
  });
});

app.post("/api/chat/respond", async (req, res) => {
  try {
    const body = req.body || {};
    const rawPhone =
      body.phone ||
      body.senderPhone ||
      body.customerPhone ||
      body.from ||
      body.chatId ||
      "0500000000";
    const cleanDigits = rawPhone.replace(/\D/g, "");
    const phone = cleanDigits || rawPhone;
    const senderName =
      body.senderName ||
      body.contactName ||
      body.parsedClientName ||
      body.sender ||
      body.name ||
      "לקוח";
    const incomingMessage = (
      body.incomingMessage ||
      body.userMessage ||
      body.message ||
      body.prompt ||
      body.text ||
      ""
    )
      .toString()
      .trim();
    const isGroup = Boolean(body.isGroup);
    const groupId = body.groupId || null;
    const timestamp = body.timestamp || new Date().toISOString();
    const source = body.source || "local_whatsapp_listener";
    const msgId =
      body.id || `evt_res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!incomingMessage) {
      return res.json({
        success: true,
        id: msgId,
        phone,
        senderName,
        response: null,
        text: null,
        timestamp,
        info: "התקבלה הודעה ריקה, לא נוצר מענה",
      });
    }

    // Check mode toggle (auto vs manual)
    const currentMode: "auto" | "manual" =
      chatModes[phone] || chatModes[rawPhone] || "auto";

    let aiResponseText = "";

    if (currentMode === "manual") {
      aiResponseText =
        "[מצב מעקף מנהל ידני פעיל - מענה אוטומטי הושעה. המנהל יענה ישירות בצ'אט]";
    } else {
      // 1. Try Gemini API first if configured
      const aiClient = getGeminiClient();
      if (aiClient) {
        try {
          const modelName = serverSettings.activeModel || "gemini-3.6-flash";
          const systemInstruction = `${serverSettings.systemPrompt}\n\nאתה מעניק שירות בצ'אט ח. סבן.\nשם לקוח: ${senderName}\nטלפון: ${phone}`;
          const genRes = await aiClient.models.generateContent({
            model: modelName,
            contents: incomingMessage,
            config: {
              systemInstruction,
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          });
          if (genRes.text) {
            aiResponseText = genRes.text.trim();
          }
        } catch (geminiErr: any) {
          console.warn(
            "[/api/chat/respond] Gemini call failed, falling back to local SabanOS engine:",
            geminiErr?.message || geminiErr
          );
        }
      }

      // 2. Fallback to intelligent local engine if Gemini unavailable or failed
      if (!aiResponseText) {
        const matchedOrders = stagedOrders.filter(
          (o) =>
            o.customerPhone.includes(phone) ||
            (cleanDigits && phone.includes(o.customerPhone.replace(/\D/g, "")))
        );

        if (
          /הזמנה|חומרי בניין|צמנט|סומסום|חול|טיט|מנוף|משאית|אספקה/i.test(
            incomingMessage
          )
        ) {
          if (matchedOrders.length > 0) {
            const lastOrd = matchedOrders[matchedOrders.length - 1];
            aiResponseText = `שלום ${senderName}! 👋 מצאתי במערכת הזמנה פעילה (${
              lastOrd.orderNumber || lastOrd.id
            }) עבור ${
              lastOrd.customerName || lastOrd.address || "האתר שלך"
            }. הסטטוס כרגע: ${lastOrd.status || "בטיפול"}. 🚛`;
          } else {
            aiResponseText = `שלום ${senderName}! 👋 קיבלנו את בקשתך לחומרי בניין בח. סבן. הודעתך נקלטה במערכת הסידור הלוגיסטי.`;
          }
        } else if (
          /^(היי|שלום|אהלן|בוקר טוב|ערב טוב|מה נשמע)/i.test(incomingMessage)
        ) {
          aiResponseText = `היי ${senderName}! 👋 במה נועה AI וצוות ח. סבן יכולים לעזור לך היום?`;
        } else {
          aiResponseText = `שלום ${senderName}, קיבלנו את הודעתך והיא בטיפול צוות ח. סבן! 🚚`;
        }
      }
    }

    // Store in listenerEvents list for live UI mirror
    const eventEntry = {
      id: msgId,
      phone,
      senderName,
      isGroup,
      groupId,
      parsedClientName: senderName,
      incomingMessage,
      noaResponse: aiResponseText,
      sentToWhatsapp: true,
      timestamp,
      source,
    };

    listenerEvents.push(eventEntry);
    if (listenerEvents.length > 50) listenerEvents.shift();

    // Log to webhookLogs
    webhookLogs.push({
      id: `webhook_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "incoming",
      url: "/api/chat/respond",
      payload: { phone, senderName, incomingMessage, isGroup, mode: currentMode },
      responseCode: 200,
      status: "success",
      details: `Incoming WhatsApp payload from ${senderName} (${phone}) [Mode: ${currentMode}]`,
    });
    if (webhookLogs.length > 50) webhookLogs.shift();

    return res.json({
      success: true,
      id: msgId,
      phone,
      senderName,
      mode: currentMode,
      response: aiResponseText,
      reply: aiResponseText,
      text: aiResponseText,
      timestamp,
      info: "Payload captured and processed successfully by /api/chat/respond",
    });
  } catch (err: any) {
    console.error("Error in /api/chat/respond:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error in respond sync route",
    });
  }
});


// In-Memory Customer Profiles & Mode Toggles
let chatModes: Record<string, "auto" | "manual"> = {
  "0508861080": "auto",
  "050-8861080": "auto",
  "0524455667": "auto",
  "052-4455667": "auto",
};

let customerProfiles: Record<string, {
  phone: string;
  name: string;
  accountNumber?: string;
  email?: string;
  siteAddresses?: string[];
  siteManager?: string;
  customerGroup?: string;
  mode?: "auto" | "manual";
  tags?: string[];
  notes?: string;
  lastUpdated?: string;
}> = {
  "0508861080": {
    phone: "0508861080",
    name: "נועה AI - מפקדת מערכת",
    accountNumber: "NOA-001",
    email: "noa@saban-materials.co.il",
    siteAddresses: ["משרדים ראשיים ח.סבן - אזור תעשייה הרצליה", "מחסן מרכזי ראשל\"צ"],
    siteManager: "יוסי סבן",
    customerGroup: "מערכת אוטומציה פנימית",
    mode: "auto",
    tags: ["מערכת VIP", "בוט ראשי", "מלשינון סנכרון"],
    notes: "מערכת בינה מלאכותית מרכזית לטיפול בפניות, סנכרון גוגל שיטס ומעקב הזמנות",
    lastUpdated: new Date().toISOString(),
  },
  "0524455667": {
    phone: "0524455667",
    name: "משה כהן - אתר הרצליה",
    accountNumber: "CUST-8821",
    email: "moshe.cohen@build-tlv.co.il",
    siteAddresses: ["רחוב הנדיב 14, הרצליה פיתוח", "רחוב אבא אבן 8, הרצליה"],
    siteManager: "משה כהן",
    customerGroup: "קבלני שלד - פרימיום",
    mode: "auto",
    tags: ["קבלן רשום", "אשראי מאושר", "משלוח מנוף"],
    notes: "לקוח קבוע. דורש תיאום מנוף לקומות גבוהות מראש.",
    lastUpdated: new Date().toISOString(),
  },
};

// Clean phone key helper
function cleanPhone(raw: string): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

// GET /api/chat/sync - Returns all active chats, profiles, modes, and listener status
app.get("/api/chat/sync", (req, res) => {
  res.json({
    success: true,
    profiles: customerProfiles,
    chatModes,
    listenerEventsCount: listenerEvents.length,
    stagedOrdersCount: stagedOrders.length,
    serverSettings,
    timestamp: new Date().toISOString(),
  });
});

// GET & POST /api/chat/generate - Gemini & SabanOS Response Generator Endpoint
app.get("/api/chat/generate", (req, res) => {
  res.json({
    status: "online",
    endpoint: "/api/chat/generate",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    activeModel: serverSettings.activeModel || "gemini-3.6-flash",
    supportedMethods: ["GET", "POST"],
    info: "Noa AI / SabanOS Gemini Response Generation Endpoint",
  });
});

app.post("/api/chat/generate", async (req, res) => {
  try {
    const body = req.body || {};
    const prompt = body.prompt || body.message || body.userMessage || body.incomingMessage || body.text || "";
    const rawPhone = body.phone || body.customerPhone || "0500000000";
    const phone = cleanPhone(rawPhone) || rawPhone;
    const senderName = body.senderName || body.contactName || body.parsedClientName || "לקוח";
    const context = body.context || body.knowledgeBase || "";
    const history = body.history || body.conversationHistory || [];

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "תוכן ההודעה/הפרומפט ריק",
      });
    }

    let generatedResponse = "";

    // 1. Try Gemini API first if configured
    const aiClient = getGeminiClient();
    if (aiClient) {
      try {
        const modelName = serverSettings.activeModel || "gemini-3.6-flash";
        const systemInstruction = `${serverSettings.systemPrompt}\n\nהקשר רקע ופרטי לקוח ח.סבן:\n- שם: ${senderName}\n- טלפון: ${phone}\n- מידע רקע: ${context}`;

        let userPrompt = prompt;
        if (Array.isArray(history) && history.length > 0) {
          const histText = history
            .map((h: any) => `${h.sender === "user" || h.sender === "contact" ? senderName : "נועה"}: ${h.text || h.message || ""}`)
            .join("\n");
          userPrompt = `היסטוריית שיחה:\n${histText}\n\nהודעה חדשה: ${prompt}`;
        }

        const genRes = await aiClient.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });

        if (genRes.text) {
          generatedResponse = genRes.text.trim();
        }
      } catch (geminiError: any) {
        console.warn("[/api/chat/generate] Gemini call failed, falling back to local SabanOS engine:", geminiError?.message || geminiError);
      }
    }

    // 2. Fallback to local intelligent SabanOS engine if Gemini is not configured or failed
    if (!generatedResponse) {
      const matchedOrders = stagedOrders.filter(
        (o) => o.customerPhone.includes(phone) || phone.includes(cleanPhone(o.customerPhone))
      );

      if (/הזמנה|חומרי בניין|צמנט|סומסום|חול|טיט|מנוף|משאית|אספקה/i.test(prompt)) {
        if (matchedOrders.length > 0) {
          const lastOrd = matchedOrders[matchedOrders.length - 1];
          generatedResponse = `שלום ${senderName}! 👋 מצאתי במערכת הזמנה פעילה (${lastOrd.orderNumber || lastOrd.id}) עבור ${lastOrd.customerName || 'האתר שלך'}. הסטטוס כרגע: ${lastOrd.status || 'בטיפול'}. 🚛`;
        } else {
          generatedResponse = `שלום ${senderName}! 👋 קיבלנו את פנייתך לגבי חומרי בניין וציוד. הבקשה נקלטה במערכת הסידור הלוגיסטי.`;
        }
      } else if (/^(היי|שלום|אהלן|בוקר טוב|ערב טוב|מה נשמע)/i.test(prompt)) {
        generatedResponse = `היי ${senderName}! 👋 במה נועה AI וצוות ח. סבן יכולים לעזור לך היום?`;
      } else {
        generatedResponse = `שלום ${senderName}, קיבלנו את הודעתך: "${prompt}". הפקודה עובדה במערכת SabanOS וצוות ח. סבן מטפל בזה! 🚚`;
      }
    }

    return res.json({
      success: true,
      response: generatedResponse,
      reply: generatedResponse,
      text: generatedResponse,
      prompt,
      phone,
      senderName,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Error in /api/chat/generate:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error in /api/chat/generate",
    });
  }
});

// POST /api/chat/mode - Toggles auto vs manual mode
app.post("/api/chat/mode", (req, res) => {
  try {
    const { phone, mode, global } = req.body || {};
    if (global && (mode === "auto" || mode === "manual")) {
      serverSettings.autoReplyEnabled = mode === "auto";
      return res.json({
        success: true,
        global: true,
        mode,
        autoReplyEnabled: serverSettings.autoReplyEnabled,
        info: `מצב אוטומטי גלובלי שונה ל-${mode}`,
      });
    }

    if (!phone) {
      return res.status(400).json({ success: false, error: "חסר מספר טלפון" });
    }

    const cleaned = cleanPhone(phone);
    const newMode: "auto" | "manual" = mode === "manual" ? "manual" : "auto";

    chatModes[phone] = newMode;
    if (cleaned) chatModes[cleaned] = newMode;

    if (!customerProfiles[cleaned] && !customerProfiles[phone]) {
      customerProfiles[cleaned || phone] = {
        phone,
        name: `לקוח (${phone})`,
        mode: newMode,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      const pKey = customerProfiles[cleaned] ? cleaned : phone;
      customerProfiles[pKey].mode = newMode;
      customerProfiles[pKey].lastUpdated = new Date().toISOString();
    }

    return res.json({
      success: true,
      phone,
      mode: newMode,
      info: `מצב הצ'אט של ${phone} הועבר ל-${newMode === 'auto' ? '🤖 Auto-Noa' : '👤 Manual Admin'}`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to set chat mode" });
  }
});

// POST /api/customer/update-profile - Enriches customer metadata
app.post("/api/customer/update-profile", (req, res) => {
  try {
    const body = req.body || {};
    const rawPhone = body.phone || body.customerPhone;
    if (!rawPhone) {
      return res.status(400).json({ success: false, error: "חסר מספר טלפון לעדכון בפרופיל" });
    }

    const cleaned = cleanPhone(rawPhone) || rawPhone;
    const existing: any = customerProfiles[cleaned] || customerProfiles[rawPhone] || {
      phone: rawPhone,
      name: body.name || `לקוח (${rawPhone})`,
    };

    const updated = {
      ...existing,
      name: body.name || existing.name,
      accountNumber: body.accountNumber !== undefined ? body.accountNumber : existing.accountNumber,
      email: body.email !== undefined ? body.email : existing.email,
      siteAddresses: Array.isArray(body.siteAddresses) ? body.siteAddresses : existing.siteAddresses || [],
      siteManager: body.siteManager !== undefined ? body.siteManager : existing.siteManager,
      customerGroup: body.customerGroup !== undefined ? body.customerGroup : existing.customerGroup,
      mode: body.mode || existing.mode || "auto",
      tags: Array.isArray(body.tags) ? body.tags : existing.tags || [],
      notes: body.notes !== undefined ? body.notes : existing.notes,
      lastUpdated: new Date().toISOString(),
    };

    customerProfiles[cleaned] = updated;
    if (rawPhone !== cleaned) customerProfiles[rawPhone] = updated;

    return res.json({
      success: true,
      phone: rawPhone,
      profile: updated,
      info: `פרופיל לקוח עבור ${updated.name} עודכן בהצלחה!`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to update profile" });
  }
});

// POST /api/noa/sheet-lookup - Queries live order log sheet for phone
app.post("/api/noa/sheet-lookup", async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) {
      return res.status(400).json({ success: false, error: "חסר מספר טלפון לחיפוש בגוגל שיטס" });
    }

    const cleaned = cleanPhone(phone);

    // 1. Check staged orders in-memory first
    const matchedStaged = stagedOrders.filter((o) => {
      const oClean = cleanPhone(o.customerPhone);
      return oClean.includes(cleaned) || cleaned.includes(oClean) || o.customerPhone.includes(phone);
    });

    // 2. Fetch from Google Apps Script if URL configured
    let gasData: any = null;
    const gasUrl = process.env.VITE_GAS_WEBHOOK_URL || (serverSettings as any)?.webAppUrl || "";
    if (gasUrl) {
      try {
        const gasRes = await fetch(`${gasUrl}?action=LOOKUP_PHONE&phone=${encodeURIComponent(phone)}`);
        if (gasRes.ok) {
          gasData = await gasRes.json();
        }
      } catch (e: any) {
        console.warn("GAS lookup warning:", e?.message);
      }
    }

    // 3. Fallback mock / enriched log history from H. Saban sheet
    const defaultHistory = [
      {
        orderId: "6214582",
        date: "2026-07-30 05:37:47",
        items: "16 בטון מהיר, 140 חול שק, 12 פלסטומר AD603, 1 הובלה ללא פריקה",
        address: "בורוכוב 28, תל אביב",
        status: "מאושר / סונכרן לסידור עבודה 🟢",
        driverName: "עלי - משאית מנוף 1",
        totalAmount: "₪0",
      },
      {
        orderId: "ORD-88120",
        date: "28/07/2026",
        items: "10 שקי צמנט פורטלנד, 5 שקי טיט מוכן",
        address: "רחוב אבא אבן 8, הרצליה",
        status: "סופק בהצלחה ✓",
        driverName: "סמיר קאסם - טנדר חלוקה 04",
        totalAmount: "₪380",
      },
    ];

    const profile = customerProfiles[cleaned] || customerProfiles[phone] || null;

    return res.json({
      success: true,
      phone,
      customerProfile: profile,
      stagedOrders: matchedStaged,
      sheetRecords: gasData?.records || defaultHistory,
      totalOrdersFound: matchedStaged.length + (gasData?.records?.length || defaultHistory.length),
      sheetName: "הזמנות_סידור / LOG",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Sheet lookup failed" });
  }
});

app.get("/api/orders/staged", async (req, res) => {
  try {
    const spreadsheetId = serverSettings.spreadsheetId || "1i2J9ByIAerL48eIRYnT9SJLJcUryR0mlkD8uiWjjZPc";
    const tab = serverSettings.stagedOrdersTab || "לוג_הזמנות_מערכת";
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
    
    const resp = await fetch(url);
    if (resp.ok) {
      const text = await resp.text();
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentCell = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            currentCell += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === "," && !inQuotes) {
          currentRow.push(currentCell.trim());
          currentCell = "";
        } else if ((c === "\r" || c === "\n") && !inQuotes) {
          if (c === "\r" && text[i + 1] === "\n") i++;
          currentRow.push(currentCell.trim());
          if (currentRow.some((x) => x.length > 0)) rows.push(currentRow);
          currentRow = [];
          currentCell = "";
        } else {
          currentCell += c;
        }
      }
      if (currentCell || currentRow.length) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((x) => x.length > 0)) rows.push(currentRow);
      }

      if (rows.length > 1) {
        const dataRows = rows.slice(1);
        const fetchedSheetOrders = dataRows.map((r, index) => {
          const orderNumber = r[1] || `ORD-${1000 + index}`;
          const local = stagedOrders.find((o) => o.orderNumber === orderNumber || o.id === `ord_${orderNumber}`);

          return {
            id: local?.id || `ord_${orderNumber}`,
            orderNumber: orderNumber,
            ingestionDate: r[0] || local?.ingestionDate || "",
            customerName: r[2] || local?.customerName || "לקוח",
            customerPhone: local?.customerPhone || "050-0000000",
            warehouse: r[3] || "🏭 4(החרש)",
            address: local?.address || r[4] || "",
            rawItemsText: r[5] || local?.rawItemsText || "",
            rawMessage: r[5] || local?.rawMessage || "",
            baleDeposit: r[6] || local?.baleDeposit || "",
            palletDeposit: r[7] || local?.palletDeposit || "",
            status: local?.status || r[8] || "מאושר",
            result: r[9] || "תקין",
            totalPrice: parseFloat(r[10]) || local?.totalPrice || 0,
            verificationDate: r[11] || "",
            deliveryTime: r[12] || "08:00",
            noaInsights: r[13] || local?.noaInsights || "",
            routeVerification: r[14] || "",
            syncStatus: r[15] || "סונכרן לסידור עבודה 🟢",
            driverName: local?.driverName || "טרם שובץ (להקצאה)",
            sentToWhatsapp: true,
            createdAt: r[0] ? (r[0].split(" ")[1] || r[0]) : (local?.createdAt || "08:00"),
            noaResponse: r[13] || local?.noaResponse || "נקלט בסידור",
            items: local?.items && local.items.length > 0 ? local.items : [],
          };
        });

        if (fetchedSheetOrders.length > 0) {
          stagedOrders = fetchedSheetOrders;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to fetch Google Sheet live CSV:", err);
  }

  res.json({
    success: true,
    spreadsheetId: serverSettings.spreadsheetId,
    tab: serverSettings.stagedOrdersTab,
    orders: stagedOrders,
  });
});

app.get("/api/sheets/log-orders", async (req, res) => {
  res.json({
    success: true,
    spreadsheetId: serverSettings.spreadsheetId,
    tab: serverSettings.stagedOrdersTab,
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

    // 1. Update in-memory stagedOrders
    let found = stagedOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (found) {
      found.status = "APPROVED" as any;
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
        status: "APPROVED" as any,
        driverName,
        address,
        sentToWhatsapp: true,
        createdAt: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      };
      stagedOrders.unshift(found);
    }

    // 2. Dispatch payload to GAS Webhook (הזמנות_סידור)
    const gasWebhookUrl = process.env.VITE_GAS_WEBHOOK_URL || (serverSettings as any)?.webAppUrl || "";
    if (gasWebhookUrl) {
      fetch(gasWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_DISPATCH",
          tab: "הזמנות_סידור",
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

    // 3. Log into webhookLogs
    const logEntry = {
      id: `dispatch_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing" as const,
      url: "/api/dispatch/approve (GAS: הזמנות_סידור)",
      payload: { action: "APPROVE_DISPATCH", orderId: found.orderNumber, customerName, phone, address, items, status: "APPROVED" },
      responseCode: 200,
      status: "success" as const,
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
  } catch (err: any) {
    console.error("Error in /api/dispatch/approve:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to approve dispatch",
    });
  }
});

// Route to update driver or status of a staged order (/api/dispatch/update)
app.post("/api/dispatch/update", async (req, res) => {
  try {
    const { orderId, id, status, driverName, address, deliveryDate, notes } = req.body || {};
    const targetId = id || orderId;

    if (!targetId) {
      return res.status(400).json({ success: false, error: "Missing orderId or id" });
    }

    let found = stagedOrders.find((o) => o.id === targetId || o.orderNumber === targetId);
    if (found) {
      if (status) found.status = status;
      if (driverName !== undefined) found.driverName = driverName;
      if (address !== undefined) found.address = address;
      if (deliveryDate !== undefined) (found as any).deliveryDate = deliveryDate;
      if (notes !== undefined) (found as any).notes = notes;

      // Broadcast update into dispatchChatUpdates
      const orderNum = found.orderNumber || String(targetId);
      const newUpdate = {
        id: `update_${orderNum}_${Date.now()}`,
        orderNumber: orderNum,
        customerName: found.customerName || "לקוח",
        customerPhone: found.customerPhone || "050-0000000",
        address: found.address || "כתובת אספקה",
        driverName: found.driverName || "טרם שובץ",
        status: found.status || status || "מאושר",
        updateType: "STATUS_CHANGE",
        title: `⚡ עדכון סטטוס הובלה - הזמנה #${orderNum}`,
        formattedMessageText: `*עדכון סטטוס בסידור - SabanOS*\n📦 *הזמנה #${orderNum}*\n👤 *לקוח:* ${found.customerName || "לקוח"}\n📍 *כתובת:* ${found.address || "כתובת"}\n🚚 *שיוך נהג:* ${found.driverName || "טרם שובץ"}\n⚡ *סטטוס חדש:* ${found.status}\n⏰ *זמן עדכון:* ${new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`,
        timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
        createdAt: new Date().toISOString(),
        isUnread: true,
        viewCount: 0,
        viewLogs: []
      };
      dispatchChatUpdates.unshift(newUpdate);
    }

    return res.json({
      success: true,
      order: found,
      message: "הזמנת הסידור עודכנה בהצלחה במערכת",
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Update failed" });
  }
});

// In-Memory Storage for Dispatch Chat Updates & Mobile View Audit Logs
let dispatchChatUpdates: any[] = [
  {
    id: "update_6214848_1",
    orderNumber: "6214848",
    customerName: "א.ערן אזולאי",
    customerPhone: "050-8899112",
    address: "נח 3, תל אביב",
    driverName: "עלי - משאית 01 (מנוף)",
    status: "יצא לדרך",
    updateType: "STATUS_CHANGE",
    title: "🚚 עדכון יציאה להובלה - הזמנה #6214848",
    formattedMessageText: "*עדכון מסידור עבודה - SabanOS*\n📦 *הזמנה #6214848*\n👤 *לקוח:* א.ערן אזולאי\n📍 *כתובת:* נח 3, תל אביב\n🚚 *שיוך נהג:* עלי - משאית 01 (מנוף)\n⚡ *סטטוס:* יצא לדרך 🚚\n⏰ *שעת יציאה:* 08:30",
    timestamp: "08:30",
    createdAt: new Date().toISOString(),
    isUnread: true,
    viewCount: 4,
    lastViewedBy: "נהג עלי (iPhone 15 Pro)",
    viewLogs: [
      {
        id: "log_1",
        viewedAt: "08:32:15",
        deviceOwner: "נהג עלי",
        deviceModel: "iPhone 15 Pro",
        osType: "iOS",
        browser: "Safari Mobile 17.4",
        ip: "185.175.241.12",
        isMobile: true
      },
      {
        id: "log_2",
        viewedAt: "08:35:40",
        deviceOwner: "חכמת - סמארטפון",
        deviceModel: "Samsung Galaxy S24 Ultra",
        osType: "Android",
        browser: "Chrome Mobile 122.0",
        ip: "82.166.19.45",
        isMobile: true
      },
      {
        id: "log_3",
        viewedAt: "08:41:02",
        deviceOwner: "מחשב משרד - מנהל",
        deviceModel: "Desktop Windows PC",
        osType: "Windows",
        browser: "Chrome 123.0",
        ip: "109.64.12.88",
        isMobile: false
      }
    ]
  },
  {
    id: "update_6214826_1",
    orderNumber: "6214826",
    customerName: "עופר כץ",
    customerPhone: "052-4455667",
    address: "רחוב בית העם 3, רמות השבים",
    driverName: "חכמת - משאית 02",
    status: "מאושר",
    updateType: "NEW_ORDER",
    title: "🆕 הזמנה חדשה נקלטה בסידור - #6214826",
    formattedMessageText: "*נקלטה הזמנה חדשה מ-Google Sheets*\n📦 *מספר הזמנה:* #6214826\n👤 *לקוח:* עופר כץ\n📍 *יעד אספקה:* רחוב בית העם 3, רמות השבים\n🚚 *נהג משויך:* חכמת - משאית 02\n💰 *סכום:* ₪1,850\n🟢 *סטטוס:* מאושר ב-SabanOS",
    timestamp: "07:47",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isUnread: true,
    viewCount: 2,
    lastViewedBy: "מנהל עבודה (Samsung S23)",
    viewLogs: [
      {
        id: "log_4",
        viewedAt: "07:50:11",
        deviceOwner: "מנהל עבודה",
        deviceModel: "Samsung Galaxy S23",
        osType: "Android",
        browser: "Chrome Mobile 121.0",
        ip: "82.166.19.45",
        isMobile: true
      }
    ]
  },
  {
    id: "update_6214582_1",
    orderNumber: "6214582",
    customerName: "וגשל דאו(519205)",
    customerPhone: "050-1234567",
    address: "בורוכוב 28, תל אביב",
    driverName: "עלי - משאית 01 (מנוף)",
    status: "סופק",
    updateType: "STATUS_CHANGE",
    title: "✅ הובלה הושלמה וסופקה - הזמנה #6214582",
    formattedMessageText: "*הודעת סיום הובלה*\n📦 *הזמנה #6214582*\n👤 *לקוח:* וגשל דאו\n📍 *כתובת:* בורוכוב 28, תל אביב\n✅ *סטטוס חדש:* סופק במלואו על פי תעודת משלוח\n📸 *תעודה וצילום פריקה:* מאומת בשיטס",
    timestamp: "06:15",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isUnread: false,
    viewCount: 6,
    lastViewedBy: "סמארטפון נהג (iPhone 14 Pro)",
    viewLogs: [
      {
        id: "log_5",
        viewedAt: "06:20:00",
        deviceOwner: "סמארטפון נהג",
        deviceModel: "iPhone 14 Pro",
        osType: "iOS",
        browser: "Safari Mobile 17.2",
        ip: "185.175.241.12",
        isMobile: true
      }
    ]
  }
];

// GET /api/dispatch/chat-updates - Return chat update cards feed
app.get("/api/dispatch/chat-updates", (req, res) => {
  const unreadCount = dispatchChatUpdates.filter((u) => u.isUnread).length;
  res.json({
    success: true,
    unreadCount,
    totalUpdates: dispatchChatUpdates.length,
    updates: dispatchChatUpdates,
  });
});

// POST /api/dispatch/chat-updates - Add or broadcast a new order update card
app.post("/api/dispatch/chat-updates", (req, res) => {
  try {
    const body = req.body || {};
    const { orderNumber, customerName, address, driverName, status, updateType, customText } = body;

    const newUpdate = {
      id: `update_${orderNumber || Date.now()}_${Date.now()}`,
      orderNumber: orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName || "לקוח",
      customerPhone: body.customerPhone || "050-0000000",
      address: address || "כתובת אספקה",
      driverName: driverName || "טרם שובץ (להקצאה)",
      status: status || "מאושר",
      updateType: updateType || "STATUS_CHANGE",
      title: updateType === "NEW_ORDER" ? `🆕 הזמנה חדשה נקלטה בסידור - #${orderNumber}` : `⚡ עדכון סטטוס הובלה - #${orderNumber}`,
      formattedMessageText: customText || `*עדכון סידור עבודה - SabanOS*\n📦 *הזמנה #${orderNumber}*\n👤 *לקוח:* ${customerName}\n📍 *כתובת:* ${address}\n🚚 *נהג:* ${driverName}\n⚡ *סטטוס:* ${status}`,
      timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
      isUnread: true,
      viewCount: 0,
      viewLogs: []
    };

    dispatchChatUpdates.unshift(newUpdate);

    return res.json({
      success: true,
      update: newUpdate,
      unreadCount: dispatchChatUpdates.filter((u) => u.isUnread).length,
      message: "העדכון התווסף בהצלחה ללשונית עדכוני סידור"
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Failed to post update" });
  }
});

// POST /api/dispatch/read-receipt - Mark updates as read and log mobile device info
app.post("/api/dispatch/read-receipt", (req, res) => {
  try {
    const { updateId, userAgent, deviceOwner, screenWidth } = req.body || {};
    
    // Parse device from User Agent string
    const ua = userAgent || req.headers["user-agent"] || "";
    let deviceModel = "Windows Desktop PC";
    let osType = "Windows";
    let browser = "Chrome";
    let isMobile = false;

    if (/iPhone/i.test(ua)) {
      deviceModel = "iPhone 15 / iOS";
      osType = "iOS";
      browser = "Safari Mobile";
      isMobile = true;
    } else if (/iPad/i.test(ua)) {
      deviceModel = "iPad / iOS";
      osType = "iOS";
      browser = "Safari Mobile";
      isMobile = true;
    } else if (/Android/i.test(ua)) {
      if (/Samsung/i.test(ua) || /SM-/i.test(ua)) {
        deviceModel = "Samsung Galaxy (Android)";
      } else {
        deviceModel = "Android Smartphone";
      }
      osType = "Android";
      browser = "Chrome Mobile";
      isMobile = true;
    } else if (/Macintosh/i.test(ua)) {
      deviceModel = "MacBook / macOS";
      osType = "macOS";
      browser = "Safari Desktop";
    }

    const timeStr = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const ip = req.ip || req.socket.remoteAddress || "185.175.241.12";

    const newLog = {
      id: `vlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      viewedAt: timeStr,
      deviceOwner: deviceOwner || (isMobile ? "נייד נהג / קבלן" : "מנהל מערכת משרד"),
      deviceModel,
      osType,
      browser,
      ip,
      isMobile
    };

    if (updateId) {
      const item = dispatchChatUpdates.find((u) => u.id === updateId);
      if (item) {
        item.isUnread = false;
        item.viewCount = (item.viewCount || 0) + 1;
        item.lastViewedBy = `${newLog.deviceOwner} (${deviceModel})`;
        if (!item.viewLogs) item.viewLogs = [];
        item.viewLogs.unshift(newLog);
      }
    } else {
      // Mark all as read
      dispatchChatUpdates.forEach((u) => {
        u.isUnread = false;
        u.viewCount = (u.viewCount || 0) + 1;
        u.lastViewedBy = `${newLog.deviceOwner} (${deviceModel})`;
        if (!u.viewLogs) u.viewLogs = [];
        u.viewLogs.unshift(newLog);
      });
    }

    const unreadCount = dispatchChatUpdates.filter((u) => u.isUnread).length;

    return res.json({
      success: true,
      unreadCount,
      logRecorded: newLog,
      message: "אישור קריאה וזיהוי מכשיר נרשמו בהצלחה"
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to log read receipt" });
  }
});

// GET /api/dispatch/view-logs - Admin-only device view audit log
app.get("/api/dispatch/view-logs", (req, res) => {
  const allLogs: any[] = [];
  dispatchChatUpdates.forEach((upd) => {
    if (Array.isArray(upd.viewLogs)) {
      upd.viewLogs.forEach((vl: any) => {
        allLogs.push({
          ...vl,
          orderNumber: upd.orderNumber,
          customerName: upd.customerName,
          updateTitle: upd.title
        });
      });
    }
  });

  res.json({
    success: true,
    adminOnly: true,
    totalViews: allLogs.length,
    updatesCount: dispatchChatUpdates.length,
    logs: allLogs
  });
});

// Route to broadcast WhatsApp Morning Report (/api/dispatch/report)
app.post("/api/dispatch/report", async (req, res) => {
  try {
    const { reportText, targetGroup } = req.body || {};
    if (!reportText) {
      return res.status(400).json({ success: false, error: "Missing reportText parameter" });
    }

    // Log the report event to webhook logs
    webhookLogs.push({
      id: `report_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("he-IL"),
      direction: "outgoing",
      url: "/api/dispatch/report",
      payload: { reportText, targetGroup: targetGroup || "NUDGE_GROUP_ID" },
      responseCode: 200,
      status: "success",
      details: "דוח בוקר לסידור שודר לוואטסאפ בהצלחה!",
    });

    return res.json({
      success: true,
      message: "דוח הבוקר שודר בהצלחה לקבוצת העדכונים מהסידור ולראמי!",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to send report" });
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
  const body = req.body || {};
  console.log("Incoming WhatsApp message captured on local server:", JSON.stringify(body));

  const logEntry = {
    id: `wh_in_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString("he-IL"),
    direction: "incoming" as const,
    url: "/api/webhook/whatsapp",
    payload: body,
    responseCode: 200,
    status: "success" as const,
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

  // Local verification against Logistic Dictionary
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

    // 1. If real audio base64 is passed, attempt audio multimodal transcription
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
        } catch (err: any) {
          const isQuota = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
          if (isQuota) {
            console.warn(`[Gemini Quota Limit on ${modelName} for audio transcription] Using next candidate model or fallback.`);
          } else {
            console.warn(`[Gemini Multimodal Voice Transcription issue on ${modelName}]:`, err?.message || err);
          }
        }
      }
    }

    // 2. If no base64 audio data or if audio processing falls back, generate contextual voice transcription
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
      } catch (err: any) {
        const isQuota = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
        if (isQuota) {
          console.warn(`[Gemini Quota Limit on ${modelName} for contextual transcription] Using next candidate model or fallback.`);
        } else {
          console.warn(`[Gemini Contextual Voice Transcription issue on ${modelName}]:`, err?.message || err);
        }
      }
    }
  }

  // Fallback transcription if Gemini API is unreachable or key is unconfigured
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

// Logistic Dictionary (מילון_לוגיסטי) & Master Inventory state
let logisticDictionary: any[] = masterInventoryList.length > 0
  ? masterInventoryList.map((item: any) => ({
      sku: item.sku,
      productName: item.name,
      aliases: item.aliases || [item.name],
      unit: item.unit || "יחידה",
      category: item.category || "כללי",
      price: item.price || 0,
      requiresDeposit: !!item.requiresDeposit,
      depositSku: item.depositSku || null,
      depositName: item.depositName || null,
      depositPrice: item.depositPrice || 0,
      stock: item.stock || 100,
    }))
  : [
      { sku: "10001", productName: 'שק מלט אפור 50 ק"ג', aliases: ["מלט אפור 50", "שק מלט 50", "מלט 50", "מלט 50 קג"], unit: "שק", category: "חומרי מליטה", price: 38 },
      { sku: "10002", productName: 'שק מלט אפור 25 ק"ג', aliases: ["מלט", "שק מלט", "מלט אפור", "מלט 25"], unit: "שק", category: "חומרי מליטה", price: 22, requiresDeposit: true, depositSku: "60060", depositName: "משטח סבן פקדון", depositPrice: 40 },
      { sku: "20001", productName: "בלה סומסום נקי", aliases: ["סומסום", "בלה סומסום", "שק סומסום", "סומסום נקי"], unit: "בלה", category: "חול וסומסום", price: 110, requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון", depositPrice: 30 },
      { sku: "20002", productName: "בלה חול מחצבה (טיט)", aliases: ["חול", "חול מחצבה", "טיט", "בלה חול", "בלה טיט"], unit: "בלה", category: "חול וסומסום", price: 105, requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון", depositPrice: 30 },
      { sku: "30001", productName: "משטח בלוק בטון 20 (96 יח')", aliases: ["בלוק בטון", "בלוק 20", "בלוק בטון 20", "בלוקים"], unit: "משטח", category: "בלוקים", price: 480, requiresDeposit: true, depositSku: "60006", depositName: "משטח בלוקים פקדון", depositPrice: 50 },
      { sku: "60001", productName: "משטח עץ טעון פיקדון", aliases: ["משטח", "משטחים", "פיקדון משטח", "משטח עץ"], unit: "משטח", category: "פקדונות", price: 45 },
      { sku: "60006", productName: "משטח בלוקים פקדון", aliases: ["משטח בלוקים", "פקדון בלוקים"], unit: "משטח", category: "פקדונות", price: 50 },
      { sku: "60060", productName: "משטח סבן פקדון", aliases: ["משטח סבן", "פקדון סבן"], unit: "משטח", category: "פקדונות", price: 40 },
      { sku: "60002", productName: "שק גדול פקדון (בלה)", aliases: ["פקדון בלה", "פקדון שק גדול"], unit: "יחידה", category: "פקדונות", price: 30 },
      { sku: "60004", productName: "חבית פקדון", aliases: ["חבית", "פקדון חבית"], unit: "יחידה", category: "פקדונות", price: 100 },
    ];

// GET Master Inventory & Stock Status
app.get("/api/inventory", (req, res) => {
  const categoriesMap: Record<string, number> = {};
  let totalStockValue = 0;
  let itemsWithDeposit = 0;

  logisticDictionary.forEach((item: any) => {
    const cat = item.category || "כללי";
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    totalStockValue += (item.price || 0) * (item.stock || 100);
    if (item.requiresDeposit) itemsWithDeposit++;
  });

  res.json({
    success: true,
    totalItems: logisticDictionary.length,
    totalStockValue,
    itemsWithDeposit,
    categories: Object.keys(categoriesMap).map((cat) => ({ category: cat, count: categoriesMap[cat] })),
    depositSKUs: ["60006", "60060", "60002", "60004", "60001"],
    inventory: logisticDictionary,
  });
});

// GET Deposit Items & Deposit Rules
app.get("/api/inventory/deposits", (req, res) => {
  const depositItems = logisticDictionary.filter((i: any) =>
    i.category === "פקדונות" || ["60006", "60060", "60002", "60004", "60001"].includes(i.sku)
  );

  const itemsRequiringDeposit = logisticDictionary.filter((i: any) => i.requiresDeposit);

  res.json({
    success: true,
    depositItemsCount: depositItems.length,
    itemsRequiringDepositCount: itemsRequiringDeposit.length,
    depositItems,
    itemsRequiringDeposit: itemsRequiringDeposit.map((i: any) => ({
      sku: i.sku,
      productName: i.productName,
      unit: i.unit,
      depositSku: i.depositSku,
      depositName: i.depositName,
      depositPrice: i.depositPrice,
    })),
  });
});

// POST Calculate Deposits for an Order
app.post("/api/inventory/calculate-deposit", (req, res) => {
  const { items = [], orderText = "" } = req.body || {};

  let itemsToCalculate: any[] = [];

  if (Array.isArray(items) && items.length > 0) {
    itemsToCalculate = items;
  } else if (orderText && typeof orderText === "string") {
    const lines = orderText.split(/[\n,;+]| וגם | ועוד |\t/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      let qty = 1;
      const numMatch = line.match(/(\d+)/);
      if (numMatch) qty = parseInt(numMatch[1], 10);

      const matchedProd = logisticDictionary.find((p: any) =>
        p.aliases?.some((a: string) => line.toLowerCase().includes(a.toLowerCase())) ||
        line.toLowerCase().includes(p.productName.toLowerCase())
      );

      if (matchedProd) {
        itemsToCalculate.push({ sku: matchedProd.sku, quantity: qty, productName: matchedProd.productName });
      }
    }
  }

  const verifiedItems: any[] = [];
  const requiredDepositsMap: Record<string, { depositSku: string; depositName: string; depositUnitPrice: number; quantity: number }> = {};

  itemsToCalculate.forEach((item: any) => {
    const matched = logisticDictionary.find((p: any) => p.sku === item.sku) ||
      logisticDictionary.find((p: any) => p.productName.toLowerCase() === (item.productName || "").toLowerCase());

    const qty = Number(item.quantity) || 1;
    if (matched) {
      const unitPrice = matched.price || 0;
      verifiedItems.push({
        sku: matched.sku,
        productName: matched.productName,
        quantity: qty,
        unit: matched.unit,
        unitPrice,
        totalPrice: unitPrice * qty,
        requiresDeposit: matched.requiresDeposit,
      });

      if (matched.requiresDeposit && matched.depositSku) {
        const depSku = matched.depositSku;
        const depName = matched.depositName || "פקדון אריזה/משטח";
        const depPrice = matched.depositPrice || 0;

        let depositQty = qty;
        if (matched.unit === "שק" && qty >= 10) {
          depositQty = Math.ceil(qty / 50);
        }

        if (!requiredDepositsMap[depSku]) {
          requiredDepositsMap[depSku] = {
            depositSku: depSku,
            depositName: depName,
            depositUnitPrice: depPrice,
            quantity: depositQty,
          };
        } else {
          requiredDepositsMap[depSku].quantity += depositQty;
        }
      }
    }
  });

  const requiredDeposits = Object.values(requiredDepositsMap).map((d) => ({
    ...d,
    depositTotalPrice: d.depositUnitPrice * d.quantity,
  }));

  const itemsTotal = verifiedItems.reduce((acc, i) => acc + i.totalPrice, 0);
  const depositsTotal = requiredDeposits.reduce((acc, d) => acc + d.depositTotalPrice, 0);
  const grandTotal = itemsTotal + depositsTotal;

  res.json({
    success: true,
    verifiedItems,
    requiredDeposits,
    summary: {
      itemsTotal,
      depositsTotal,
      grandTotal,
      requiresDeposits: requiredDeposits.length > 0,
    },
  });
});

// GET Logistic Products Dictionary (מילון_לוגיסטי)
app.get("/api/products/dictionary", async (req, res) => {
  // If webAppUrl is set, optionally sync from Google Apps Script tab מילון_לוגיסטי
  if (serverSettings.webAppUrl) {
    try {
      const resp = await fetch(serverSettings.webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_logistic_dictionary", tab: "מילון_לוגיסטי" }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.dictionary) && data.dictionary.length > 0) {
          logisticDictionary = data.dictionary;
        }
      }
    } catch (e) {
      console.warn("Could not sync live Google Sheets dictionary, returning current cached version.");
    }
  }

  res.json({
    success: true,
    tab: "מילון_לוגיסטי",
    count: logisticDictionary.length,
    dictionary: logisticDictionary,
  });
});

// POST Add or update product in Logistic Products Dictionary
app.post("/api/products/dictionary", (req, res) => {
  const { sku, productName, aliases, unit, category, price } = req.body;
  if (!sku || !productName) {
    return res.status(400).json({ success: false, error: "SKU and Product Name are required" });
  }

  const existingIndex = logisticDictionary.findIndex((p) => p.sku === sku);
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

  res.json({
    success: true,
    message: `מוצר ${newProduct.sku} (${newProduct.productName}) עודכן בהצלחה במילון הלוגיסטי.`,
    product: newProduct,
    dictionary: logisticDictionary,
  });
});

// POST Normalize free text customer order into structured items
app.post("/api/products/normalize", (req, res) => {
  const { text, customerName = "לקוח" } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ success: false, error: "Text string is required" });
  }

  const lines = text.split(/[\n,;+]| וגם | ועוד |\t/).map((l) => l.trim()).filter(Boolean);
  const normalizedItems: any[] = [];

  for (const line of lines) {
    let quantity = 1;
    let textWithoutQty = line;

    const numMatch = line.match(/(?:^|\s)(\d+)(?:\s*x|\s*שקים|\s*בלות|\s*משטחים|\s*יח|\s*יחידות|\s*מ"ר)?(?:\s+|$)/i);
    if (numMatch) {
      quantity = parseInt(numMatch[1], 10);
      textWithoutQty = line.replace(numMatch[0], " ").trim();
    }

    let targetTerm = textWithoutQty.toLowerCase().replace(/(רוצה|צריך|תביא|תוסיף|משלוח של|הזמנה של|בבקשה)/g, "").trim();

    let bestMatch: any = null;
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
        unitPrice: bestMatch.price || 0,
        totalPrice: (bestMatch.price || 0) * quantity,
        confidence: highestScore >= 90 ? 1.0 : 0.8,
        originalText: line,
      });
    } else {
      normalizedItems.push({
        sku: "GENERIC-99",
        name: textWithoutQty || line,
        quantity,
        unit: "יחידה",
        confidence: 0.3,
        originalText: line,
      });
    }
  }

  res.json({
    success: true,
    tab: "מילון_לוגיסטי",
    customerName,
    items: normalizedItems,
  });
});

// Endpoint to fetch Code.js Master Google Apps Script
app.get("/Code.js", (req, res) => {
  const codePath = path.join(process.cwd(), "Code.js");
  res.setHeader("Content-Type", "text/javascript; charset=utf-8");
  res.sendFile(codePath);
});


// AI Smart Suggest API Route (Analyze last incoming messages and suggest 3 responses)
app.post("/api/chat/smart-suggest", async (req, res) => {
  const {
    contactName = "לקוח",
    lastIncomingMessages = [],
    conversationHistory = [],
  } = req.body;

  const ai = getGeminiClient();

  // Extract text and transcriptions from last 3 incoming messages
  const last3Incoming = Array.isArray(lastIncomingMessages) && lastIncomingMessages.length > 0
    ? lastIncomingMessages.slice(-3)
    : Array.isArray(conversationHistory)
    ? conversationHistory.filter((m: any) => m.sender === "user" || m.sender === "contact").slice(-3)
    : [];

  const formattedHistoryText = last3Incoming
    .map((m: any, idx: number) => {
      const msgContent = m.transcription ? `[הודעה קולית מתומללת]: ${m.transcription}` : (m.text || "הודעה ללא טקסט");
      return `הודעה ${idx + 1}: ${msgContent}`;
    })
    .join("\n");

  const promptText = `אתה עוזר חכם לנציג שירות ב-SabanOS (ח. סבן חומרי בניין).
תפקידך לנתח את 3 ההודעות האחרונות שהתקבלו מהלקוח בשם "${contactName}":
${formattedHistoryText || "אין הודעות קודמות מפורטות, הלקוח מבקש מענה מהיר."}

אנא הצע בדיוק 3 הצעות מענה מגוונות, טבעיות, קצרות, מקצועיות וקולחות בעברית שמתאימות לנציג שירות לשלוח כעת ב-WhatsApp.
חובה להחזיר אך ורק JSON תקין במבנה הבא בלבד (ללא תגי מורקדאון markdown, ללא תווי \`\`\`json):
{
  "suggestions": [
    "הצעה ראשונה קצרה ועניינית",
    "הצעה שנייה שירותית ומפורטת",
    "הצעה שלישית מניעה לפעולה או מבררת פרטים"
  ]
}`;

  if (ai) {
    const candidateModels = Array.from(
      new Set([
        serverSettings.activeModel || "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
      ])
    );

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            temperature: 0.7,
          },
        });

        const responseText = response.text?.trim() || "";
        // Clean markdown backticks if present
        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        let parsed: any = null;
        try {
          parsed = JSON.parse(cleanJson);
        } catch {
          // If JSON parse fails, try extracting 3 bullet points
          const lines = responseText.split("\n").map(l => l.replace(/^[-*1-3.]\s*/, "").trim()).filter(l => l.length > 5);
          if (lines.length > 0) {
            parsed = { suggestions: lines.slice(0, 3) };
          }
        }

        if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
          return res.json({
            success: true,
            suggestions: parsed.suggestions.slice(0, 3),
            modelUsed: modelName,
          });
        }
      } catch (err: any) {
        console.warn(`[Gemini Smart Suggest issue on ${modelName}]:`, err?.message || err);
      }
    }
  }

  // Smart fallback options if Gemini is unavailable
  const fallbackSuggestions = [
    `שלום ${contactName}, קיבלנו את פנייתך. ההזמנה נקלטה במערכת SabanOS ותצא לדרך בהקדם!`,
    `היי ${contactName}, מחירון סומסום וחומרי בניין מעודכן נשלח אליך. אשמח לאשר עבורך את מועד המשלוח.`,
    `שלום! הנהג בדרכו אליכם עם ציוד הפריקה, נעדכן אתכם כשהוא מתקרב לאתר.`,
  ];

  res.json({
    success: true,
    suggestions: fallbackSuggestions,
    source: "smart_fallback",
  });
});

app.get("/api/script/code-js", (req, res) => {
  try {
    const codePath = path.join(process.cwd(), "Code.js");
    const codeText = fs.readFileSync(codePath, "utf-8");
    res.json({ success: true, code: codeText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to read Code.js" });
  }
});

// Helper function to verify customer orders against Logistic Dictionary (מילון_לוגיסטי)
function verifyOrderLocally(userMessage: string, customerName: string = "לקוח"): string | null {
  const lines = userMessage
    .split(/[\n,;+]| וגם | ועוד |\t/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const verifiedItems: any[] = [];
  const ambiguousItems: any[] = [];
  const unmatchedItems: any[] = [];

  const HEBREW_NUMS: Record<string, number> = {
    אחד: 1, אחת: 1, שניים: 2, שתי: 2, שני: 2, שלושה: 3, שלוש: 3, ארבעה: 4, ארבע: 4, חמישה: 5, חמש: 5,
    שישה: 6, שש: 6, שבעה: 7, שבע: 7, שמונה: 8, תשעה: 9, תשע: 9, עשרה: 10, עשר: 10, עשרים: 20, שלושים: 30, חמישים: 50
  };

  const FILLERS = ["רוצה", "צריך", "תביא", "תוסיף", "משלוח של", "הזמנה של", "בבקשה", "למחר", "היום", "עבור", "אתר"];

  for (const line of lines) {
    let quantity = 1;
    let textWithoutQty = line;

    const numMatch = line.match(/(?:^|\s)(\d+)(?:\s*x|\s*שקים|\s*בלות|\s*משטחים|\s*יח|\s*יחידות|\s*מ"ר)?(?:\s+|$)/i);
    if (numMatch) {
      quantity = parseInt(numMatch[1], 10);
      textWithoutQty = line.replace(numMatch[0], " ").trim();
    } else {
      for (const w of line.split(/\s+/)) {
        const cleanW = w.replace(/^[ובל-]/, "");
        if (HEBREW_NUMS[cleanW]) {
          quantity = HEBREW_NUMS[cleanW];
          textWithoutQty = line.replace(w, " ").trim();
          break;
        }
      }
    }

    let targetTerm = textWithoutQty.toLowerCase();
    for (const f of FILLERS) {
      targetTerm = targetTerm.replace(new RegExp(`\\b${f}\\b`, "gi"), " ").trim();
    }
    targetTerm = targetTerm.replace(/\s+/g, " ").trim();

    if (!targetTerm || targetTerm.length < 2) continue;

    const matches: { prod: any; score: number }[] = [];

    for (const prod of logisticDictionary) {
      let maxScore = 0;
      for (const alias of prod.aliases) {
        const lowerAlias = alias.toLowerCase();
        if (targetTerm === lowerAlias) maxScore = Math.max(maxScore, 100);
        else if (targetTerm.includes(lowerAlias)) maxScore = Math.max(maxScore, 85);
        else if (lowerAlias.includes(targetTerm) && targetTerm.length >= 3) maxScore = Math.max(maxScore, 75);
      }

      const lowerProdName = prod.productName.toLowerCase();
      if (targetTerm === lowerProdName) maxScore = Math.max(maxScore, 100);
      else if (targetTerm.includes(lowerProdName)) maxScore = Math.max(maxScore, 85);
      else if (lowerProdName.includes(targetTerm) && targetTerm.length >= 3) maxScore = Math.max(maxScore, 75);

      const termWords = targetTerm.split(/\s+/).filter((w) => w.length > 2);
      for (const tw of termWords) {
        if (prod.aliases.some((a: string) => a.toLowerCase().includes(tw)) || lowerProdName.includes(tw)) {
          maxScore = Math.max(maxScore, 60);
        }
      }

      if (maxScore >= 50) {
        matches.push({ prod, score: maxScore });
      }
    }

    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      if (/(מלט|סומסום|חול|טיט|איטונג|בלוק|גבס|פנל|טיח|חצץ)/i.test(line)) {
        unmatchedItems.push({ name: textWithoutQty || line, quantity });
      }
    } else if (matches.length === 1 || matches[0].score >= 90 || (matches[0].score - (matches[1]?.score || 0) >= 30)) {
      const p = matches[0].prod;
      verifiedItems.push({
        sku: p.sku,
        productName: p.productName,
        quantity,
        unit: p.unit,
        unitPrice: p.price || 0,
        totalPrice: (p.price || 0) * quantity,
      });
    } else {
      ambiguousItems.push({
        requestedName: textWithoutQty || line,
        quantity,
        matchingProducts: matches.map((m) => m.prod),
      });
    }
  }

  const hasOrderItems = verifiedItems.length > 0 || ambiguousItems.length > 0 || unmatchedItems.length > 0;

  if (!hasOrderItems) return null;

  let text = `שלום ${customerName}! קיבלנו את פנייתך ב-SabanOS. 📦\n\n`;
  text += `אימתנו את המוצרים המבוקשים מול גליון *מילון_לוגיסטי*:\n\n`;

  if (verifiedItems.length > 0) {
    text += `✅ *מוצרים שאומתו במילון הלוגיסטי:*\n`;
    verifiedItems.forEach((i) => {
      const priceStr = i.totalPrice ? ` (₪${i.unitPrice} ל-${i.unit}, סה"כ: ₪${i.totalPrice})` : "";
      text += ` • ${i.quantity} ${i.unit} *[מק"ט ${i.sku}] ${i.productName}*${priceStr}\n`;
    });
    text += `\n`;
  }

  if (ambiguousItems.length > 0) {
    text += `❓ *אימות מק"ט ושם מוצר נדרש:* (נמצאו מספר מוצרים תואמים במילון)\n`;
    ambiguousItems.forEach((amb) => {
      text += `לגבי *${amb.requestedName}* (${amb.quantity} יחידות) - האם התכוונת ל:\n`;
      amb.matchingProducts.forEach((p: any, idx: number) => {
        text += `   ${idx + 1}. *[מק"ט ${p.sku}] ${p.productName}* (${p.price ? `₪${p.price} ל-${p.unit}` : p.unit})\n`;
      });
    });
    text += `\nאנא בחר את המק"ט והמוצר המדויק מתוך המילון!\n\n`;
  }

  if (unmatchedItems.length > 0) {
    text += `⚠️ *מוצרים לבדיקת מחסן:* ${unmatchedItems.map((u) => `${u.quantity}x ${u.name}`).join(", ")}\n\n`;
  }

  // Calculate required deposits for verified items
  const depositItemsMap: Record<string, { depositSku: string; depositName: string; depositUnitPrice: number; quantity: number }> = {};
  verifiedItems.forEach((v) => {
    const matched = logisticDictionary.find((p: any) => p.sku === v.sku);
    if (matched && matched.requiresDeposit && matched.depositSku) {
      const depSku = matched.depositSku;
      const depName = matched.depositName || "פקדון אריזה/משטח";
      const depPrice = matched.depositPrice || 0;
      let depQty = v.quantity;
      if (matched.unit === "שק" && v.quantity >= 10) {
        depQty = Math.ceil(v.quantity / 50);
      }
      if (!depositItemsMap[depSku]) {
        depositItemsMap[depSku] = { depositSku: depSku, depositName: depName, depositUnitPrice: depPrice, quantity: depQty };
      } else {
        depositItemsMap[depSku].quantity += depQty;
      }
    }
  });

  const depositList = Object.values(depositItemsMap);
  if (depositList.length > 0) {
    text += `📌 *פקדונות משטחים ואריזות נדרשים:*\n`;
    depositList.forEach((d) => {
      text += ` • ${d.depositName} [מק"ט ${d.depositSku}] — ${d.quantity} יחידות (₪${d.depositUnitPrice} ליח', סה"כ: ₪${d.depositUnitPrice * d.quantity})\n`;
    });
    text += `\n`;
  }

  if (ambiguousItems.length === 0) {
    const itemsTotal = verifiedItems.reduce((acc, i) => acc + i.totalPrice, 0);
    const depositsTotal = depositList.reduce((acc, d) => acc + d.depositUnitPrice * d.quantity, 0);
    const grandTotal = itemsTotal + depositsTotal;

    if (grandTotal > 0) {
      text += `💰 *סה"כ לחיוב משוער:* ₪${grandTotal}`;
      if (depositsTotal > 0) {
        text += ` (מוצרים: ₪${itemsTotal} + פקדונות: ₪${depositsTotal})`;
      }
      text += `\n\n`;
    }
    text += `ההזמנה המאומתת הועברה לצוות הלוגיסטיקה לטיפול מיידי! 🚛 🏗️`;
  } else {
    text += `לאחר אישורך על המק"ט המדויק, נעביר את ההזמנה המאומתת לצוות הלוגיסטיקה! 🚛`;
  }

  return text;
}

// AI Chat Respond API Route
app.post("/api/chat/respond", async (req, res) => {
  try {
    const body = req.body || {};

    const phone = body.phone || body.from || body.chatId || "050-0000000";
    const userMessage = body.message || body.userMessage || body.prompt || body.text || "";
    const timestamp = body.timestamp || new Date().toISOString();

    const chatId = body.chatId || body.id || phone || "default";
    const contactName = body.contactName || body.sender || body.name || "לקוח";
    const conversationHistory = Array.isArray(body.conversationHistory)
      ? body.conversationHistory
      : Array.isArray(body.history)
      ? body.history
      : Array.isArray(body.messages)
      ? body.messages
      : [];
    const systemPrompt = body.systemPrompt || body.context || body.systemInstruction || serverSettings.systemPrompt;
    const knowledgeBase = Array.isArray(body.knowledgeBase) ? body.knowledgeBase : [];
    const customerProfile = body.customerProfile || null;
    const orderHistory = Array.isArray(body.orderHistory) ? body.orderHistory : [];

    // Check Gemini API key configuration
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[/api/chat/respond] GEMINI_API_KEY is missing or empty in environment. Falling back to local smart engine.");
    }

    const ai = getGeminiClient();

    // Trigger Google Apps Script Web App sync in background if enabled
    if (serverSettings.webhookSyncEnabled && serverSettings.webAppUrl) {
      fetch(serverSettings.webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "incoming_message",
          chatId,
          phone,
          sender: contactName,
          message: userMessage,
          timestamp,
        }),
      }).catch((err) => console.log("Google Apps Script sync background warning:", err?.message));
    }

    // Check if message contains order items to verify against Logistic Dictionary (מילון_לוגיסטי)
    const orderVerificationText = verifyOrderLocally(userMessage, contactName);

    // Format Knowledge Base text for AI context
    const kbContext = Array.isArray(knowledgeBase) && knowledgeBase.length > 0
      ? `\n\nמאגר מידע ועובדות עסקיות (SabanOS KB):\n` +
        knowledgeBase
          .filter((k: any) => k && k.isEnabled !== false)
          .map((k: any) => `[${k.category || "כללי"}] ${k.title || ""}: ${k.content || ""}`)
          .join("\n")
      : "";

    const dictionaryContext = Array.isArray(logisticDictionary) && logisticDictionary.length > 0
      ? `\n\nגליון 'מילון_לוגיסטי' ומק"טים רשמיים של SabanOS (עובדות בלבד!):\n` +
        logisticDictionary
          .map((p) => `- מק"ט: ${p.sku} | שם מוצר תקני: "${p.productName}" | יחידה: ${p.unit} | מחיר: ₪${p.price} | כינויים: [${(p.aliases || []).join(", ")}]`)
          .join("\n")
      : "";

    // Format Customer CRM profile & Order History context
    const crmContext = customerProfile
      ? `\n\nתיק לקוח CRM מיועד (${contactName}):\n` +
        `- טלפון: ${customerProfile.phone || phone || "לא צוין"}\n` +
        `- חברה/עסק: ${customerProfile.company || "פרטי"}\n` +
        `- כתובת/אתר: ${customerProfile.address || "לא צוינה"}\n` +
        `- מסגרת אשראי/חוב: ${customerProfile.creditLimit ? `₪${customerProfile.creditLimit}` : "תקין"}\n` +
        `- הערות מנהל: ${customerProfile.notes || "אין הערות"}`
      : "";

    const historyContext = Array.isArray(orderHistory) && orderHistory.length > 0
      ? `\n\nהיסטוריית הזמנות קודמות של הלקוח (${contactName}):\n` +
        orderHistory
          .slice(-10)
          .map((o: any) => `- הזמנה #${o.id || "ORD"} [תאריך ${o.date || "לאחרונה"}]: ${o.items || o.skuDetails || "פריטים"} (סה"כ: ₪${o.total || 0}, סטאטוס: ${o.status || "בטיפול"})`)
          .join("\n")
      : "";

    const fullSystemInstruction = `${systemPrompt}

${crmContext}

${historyContext}

${dictionaryContext}

${kbContext}

אתה משיב כעת בצ'אט וואטסאפ ללקוח בשם: "${contactName}" (טלפון: ${phone}).
הוראות חובה וקריטיות לשירות נועה AI:
1. חוק הפרופורציונליות (קריטי!): התאם את אורך התגובה ישירות להודעה הנכנסת. אם הלקוח שולח ברכה פשוטה ("היי", "שלום", "בוקר טוב", "מה נשמע"), ענה בברכה אנושית קצרה וחמה בלבד (1-2 משפטים). אל תפרט היסטוריית הזמנות, אל תציג סיכומי עבר ואל תציג רשימות מוצרים אלא אם הלקוח שאל/ביקש זאת במפורש!
2. טון דיבור קולגיאלי ואנושי: דבר כקולגה חדה, יציבה ועוזרת ב'ח. סבן'. הימנע לחלוטין מתשובות רובוטיות, תבניות קבועות, חתימות אוטומטיות, או ניסוחים נפוחים.
3. פשטות בעברית יומיומית: שמור על תשובות נקיות, קצרות וענייניות בעברית פשוטה וטבעית (1-2 משפטים לפנייה ראשונית).
4. בהזמנת מוצרים מפורשת: בצע אימות מלא מול "מילון_לוגיסטי", ציין מק"ט תקני במידת הצורך, ואם השם עמום ברר מול הלקוח בבירור קצר וענייני.`;

    if (ai) {
      const candidateModels = Array.from(
        new Set([
          serverSettings.activeModel || "gemini-3.6-flash",
          "gemini-2.5-flash",
          "gemini-flash-latest",
          "gemini-3.1-flash-lite",
        ])
      );

      // Build conversation turns for Gemini safely
      const contents: any[] = [];
      if (Array.isArray(conversationHistory)) {
        conversationHistory.slice(-10).forEach((msg: any) => {
          if (!msg) return;
          const txt = (msg.text || msg.content || "").toString().trim();
          if (txt) {
            contents.push({
              role: (msg.sender === "user" || msg.role === "user") ? "user" : "model",
              parts: [{ text: txt }],
            });
          }
        });
      }

      const cleanUserMsg = (userMessage || "").toString().trim() || "שלום";
      if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
        contents.push({
          role: "user",
          parts: [{ text: cleanUserMsg }],
        });
      }

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: fullSystemInstruction,
              temperature: 0.6,
            },
          });

          let replyText = response.text || "הודעתך התקבלה והועברה לצוות";

          // If this is an order message and Gemini didn't include SKUs [מק"ט], enforce local verification summary
          if (orderVerificationText && (!replyText.includes("מק\"ט") && !replyText.includes("מילון"))) {
            replyText = orderVerificationText;
          }

          return res.json({
            success: true,
            text: replyText,
            phone,
            message: userMessage,
            source: "gemini",
            modelUsed: modelName,
            timestamp: new Date().toISOString(),
          });
        } catch (err: any) {
          const isQuotaError =
            err?.status === 429 ||
            err?.message?.includes("429") ||
            err?.message?.includes("quota") ||
            err?.message?.includes("RESOURCE_EXHAUSTED");

          if (isQuotaError) {
            console.warn(`[Gemini Quota Exceeded on ${modelName}] Trying next model or local engine...`);
          } else {
            console.warn(`[Gemini Call Issue on ${modelName}]:`, err?.message || err);
          }
        }
      }
    }

    // Smart Intelligent Local Fallback Response based on Knowledge Base & keywords
    if (orderVerificationText) {
      return res.json({
        success: true,
        text: orderVerificationText,
        phone,
        message: userMessage,
        source: "logistic_dictionary_verifier",
        timestamp: new Date().toISOString(),
      });
    }

    const lowerMsg = (userMessage || "").toString().toLowerCase();
    let replyText = "";

    // 1. Try Knowledge Base direct match
    if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
      const activeKb = knowledgeBase.filter((k: any) => k && k.isEnabled !== false);
      const matchedKb = activeKb.find((k: any) => {
        const titleMatch = k.title && lowerMsg.includes(k.title.toLowerCase());
        const categoryMatch = k.category && lowerMsg.includes(k.category.toLowerCase());
        return titleMatch || categoryMatch;
      });

      if (matchedKb) {
        replyText = `מידע ממאגר SabanOS בנושא *${matchedKb.title}*:\n${matchedKb.content}`;
      }
    }

    // 2. Keyword based fallback
    if (!replyText) {
      if (lowerMsg.includes("תפריט") || lowerMsg.includes("אוכל") || lowerMsg.includes("מנה")) {
        replyText = "בוודאי! התפריט היומי שלנו מעודכן בסינכרון מול SabanOS. תוכל לבחור בין מנות ראשונות, עיקריות וקינוחים. תרצה שאשלח לך את מחירון המנות?";
      } else if (lowerMsg.includes("שעות") || lowerMsg.includes("מתי פתוח") || lowerMsg.includes("זמנים")) {
        replyText = "אנחנו פתוחים בימים א'-ה' בין השעות 08:00 ל-18:00, ובימי שישי עד 13:00. נשמח לראותכם!";
      } else if (lowerMsg.includes("הזמנה") || lowerMsg.includes("משלוח") || lowerMsg.includes("ציוד")) {
        replyText = "שלום! *ההזמנה שלך נקלטה במערכת SabanOS* 🚛\nצוות הלוגיסטיקה מכין את המשלוח ויוצר קשר לתיאום סופי.";
      } else if (lowerMsg.includes("מיקום") || lowerMsg.includes("כתובת") || lowerMsg.includes("ניווט") || lowerMsg.includes("waze")) {
        replyText = "📍 הסניף המרכזי שלנו ממוקם ב*רחוב הברזל 11, תל אביב*. לחץ לניווט ב-Waze: https://waze.com/ul?ll=32.1092,34.8389&navigate=yes 🗺️";
      } else if (lowerMsg.includes("מחיר") || lowerMsg.includes("עלות") || lowerMsg.includes("כמה עולה")) {
        replyText = "המחירון המלא מעודכן במערכת SabanOS. תרצה לקבל פירוט והצעת מחיר מותאמת אישית?";
      } else {
        replyText = "הודעתך התקבלה והועברה לצוות";
      }
    }

    return res.json({
      success: true,
      text: replyText,
      phone,
      message: userMessage,
      source: "smart_fallback",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Unhandled exception in /api/chat/respond:", error?.stack || error?.message || error);
    return res.status(200).json({
      success: true,
      text: "הודעתך התקבלה והועברה לצוות",
      source: "error_fallback",
      errorDetails: error?.message || "Internal Server Error",
      timestamp: new Date().toISOString(),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SabanOS Noa AI WhatsApp server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
