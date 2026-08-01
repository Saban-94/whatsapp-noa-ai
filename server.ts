import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server state / settings storage
let serverSettings = {
  systemPrompt: `אתה נועה AI (Noa AI) - העוזרת החכמה והייעודית של SabanOS.
תפקידך להעניק שירות לקוחות מעולה, מענה על תפריטים, הזמנות שולחן, שעות פעילות וסנכרון מול מנגנון SabanOS.
דבר בשפה אדיבה, קולחת ומקצועית בעברית, תוך שימוש באימוג'ים מתאימים במידת הצורך.`,
  webAppUrl: "https://script.google.com/macros/s/AKfycbwvTGiE1h1AR9csbFhVQczFbOpHVXpyQN6MlIQX1NykSvJnjfi6_zipZOj76xnPqfk/exec",
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

// AI Chat Respond API Route
app.post("/api/chat/respond", async (req, res) => {
  const {
    chatId,
    contactName,
    userMessage,
    conversationHistory = [],
    systemPrompt = serverSettings.systemPrompt,
    knowledgeBase = [],
  } = req.body;

  const ai = getGeminiClient();

  // Optionally trigger Google Apps Script Web App sync in background
  if (serverSettings.webhookSyncEnabled && serverSettings.webAppUrl) {
    fetch(serverSettings.webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "incoming_message",
        chatId,
        sender: contactName,
        message: userMessage,
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => console.log("Google Apps Script sync background error:", err?.message));
  }

  // Format Knowledge Base text for AI context
  const kbContext = Array.isArray(knowledgeBase) && knowledgeBase.length > 0
    ? `\n\nמאגר מידע ועובדות עסקיות (SabanOS KB):\n` +
      knowledgeBase
        .filter((k: any) => k.isEnabled !== false)
        .map((k: any) => `[${k.category || "כללי"}] ${k.title}: ${k.content}`)
        .join("\n")
    : "";

  const fullSystemInstruction = `${systemPrompt}${kbContext}\n\nאתה משיב כעת בצ'אט וואטסאפ ללקוח בשם: "${contactName}". השב בצורה טבעית, תמציתית, מועילה, ובעברית בלבד.`;

  if (ai) {
    try {
      // Build conversation turns for Gemini
      const contents = conversationHistory.slice(-10).map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text || "" }],
      }));

      // Append current user message if not included
      if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
        contents.push({
          role: "user",
          parts: [{ text: userMessage }],
        });
      }

      const response = await ai.models.generateContent({
        model: serverSettings.activeModel || "gemini-3.6-flash",
        contents: contents,
        config: {
          systemInstruction: fullSystemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "קיבלתי את הודעתך, אשמח לעזור!";

      return res.json({
        success: true,
        text: replyText,
        source: "gemini",
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      // Fallback response if Gemini fails or key reaches limit
    }
  }

  // Smart Intelligent Local Fallback Response based on keywords
  let replyText = "שלום! קיבלתי את הודעתך. במה אוכל לסייע לך היום מבית SabanOS?";
  const lowerMsg = (userMessage || "").toLowerCase();

  if (lowerMsg.includes("תפריט") || lowerMsg.includes("אוכל") || lowerMsg.includes("מנה")) {
    replyText = "בוודאי! התפריט היומי שלנו מעודכן בסינכרון מול SabanOS. תוכל לבחור בין מנות ראשונות, עיקריות וקינוחים. תרצה שאשלח לך את מחירון המנות?";
  } else if (lowerMsg.includes("שעות") || lowerMsg.includes("מתי פתוח") || lowerMsg.includes("זמנים")) {
    replyText = "אנחנו פתוחים בימים א'-ה' בין השעות 09:00 ל-23:00, ובימי שישי עד 15:00. נשמח לראותכם!";
  } else if (lowerMsg.includes("הזמנה") || lowerMsg.includes("שולחן") || lowerMsg.includes("מקום")) {
    replyText = "בטח! אשמח לרשום עבורך הזמנה. לכמה אנשים ההזמנה ועבור באיזה תאריך ושעה?";
  } else if (lowerMsg.includes("מחיר") || lowerMsg.includes("עלות") || lowerMsg.includes("כמה עולה")) {
    replyText = "המחירון המלא מעודכן במערכת SabanOS. עסקיות צהריים החל מ-55 ₪. תרצה לקבל פילוח לפי קטגוריה?";
  } else if (lowerMsg.includes("סבג") || lowerMsg.includes("דוד") || lowerMsg.includes("משלוח")) {
    replyText = "היי דוד, המשלוח שלך מסאבאן ספורט יצא לדרך ונמצא כעת אצל השליח. חותמת הסנכרון התקבלה מ-SabanOS!";
  }

  res.json({
    success: true,
    text: replyText,
    source: "smart_fallback",
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
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

startServer();
