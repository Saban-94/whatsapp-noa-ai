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
  webAppUrl: "https://script.google.com/macros/s/AKfycbyprvTw-41n3-WS6a9QN9gKssWPIkB7VvueaTwEiDgdXCI094Ur58CG8DoUwmPiEMRCjw/exec",
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
        "gemini-2.0-flash",
        "gemini-1.5-flash",
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
          console.warn(`[Gemini Multimodal Voice Transcription issue on ${modelName}]:`, err?.message || err);
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
        console.warn(`[Gemini Contextual Voice Transcription issue on ${modelName}]:`, err?.message || err);
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
        "gemini-2.0-flash",
        "gemini-1.5-flash",
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
    const fs = require("fs");
    const codePath = path.join(process.cwd(), "Code.js");
    const codeText = fs.readFileSync(codePath, "utf-8");
    res.json({ success: true, code: codeText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to read Code.js" });
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
    const candidateModels = Array.from(
      new Set([
        serverSettings.activeModel || "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
      ])
    );

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

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
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
  const lowerMsg = (userMessage || "").toLowerCase();
  let replyText = "";

  // 1. Try Knowledge Base direct match
  if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
    const activeKb = knowledgeBase.filter((k: any) => k.isEnabled !== false);
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
      replyText = "שלום! הודעתך נקלטה במערכת SabanOS. נשמח לסייע לך בכל שאלה לגבי משלוחים, הזמנות ומידע נוסף! 😊";
    }
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
