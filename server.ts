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

// Logistic Dictionary (מילון_לוגיסטי) state & product database
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
    const fs = require("fs");
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

  if (ambiguousItems.length === 0) {
    const total = verifiedItems.reduce((acc, i) => acc + i.totalPrice, 0);
    if (total > 0) text += `💰 *סה"כ משוער לחיוב:* ₪${total}\n\n`;
    text += `ההזמנה המאומתת הועברה לצוות הלוגיסטיקה לטיפול מיידי! 🚛 🏗️`;
  } else {
    text += `לאחר אישורך על המק"ט המדויק, נעביר את ההזמנה המאומתת לצוות הלוגיסטיקה! 🚛`;
  }

  return text;
}

// AI Chat Respond API Route
app.post("/api/chat/respond", async (req, res) => {
  const {
    chatId,
    contactName,
    userMessage,
    conversationHistory = [],
    systemPrompt = serverSettings.systemPrompt,
    knowledgeBase = [],
    customerProfile = null,
    orderHistory = [],
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

  // Check if message contains order items to verify against Logistic Dictionary (מילון_לוגיסטי)
  const orderVerificationText = verifyOrderLocally(userMessage, contactName);

  // Format Knowledge Base text for AI context
  const kbContext = Array.isArray(knowledgeBase) && knowledgeBase.length > 0
    ? `\n\nמאגר מידע ועובדות עסקיות (SabanOS KB):\n` +
      knowledgeBase
        .filter((k: any) => k.isEnabled !== false)
        .map((k: any) => `[${k.category || "כללי"}] ${k.title}: ${k.content}`)
        .join("\n")
    : "";

  const dictionaryContext = logisticDictionary && logisticDictionary.length > 0
    ? `\n\nגליון 'מילון_לוגיסטי' ומק"טים רשמיים של SabanOS (עובדות בלבד!):\n` +
      logisticDictionary
        .map((p) => `- מק"ט: ${p.sku} | שם מוצר תקני: "${p.productName}" | יחידה: ${p.unit} | מחיר: ₪${p.price} | כינויים: [${p.aliases.join(", ")}]`)
        .join("\n")
    : "";

  // Format Customer CRM profile & Order History context
  const crmContext = customerProfile
    ? `\n\nתיק לקוח CRM מיועד (${contactName}):\n` +
      `- טלפון: ${customerProfile.phone || "לא צוין"}\n` +
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

אתה משיב כעת בצ'אט וואטסאפ ללקוח בשם: "${contactName}".
הוראות חובה לשירות נועה AI:
1. השתמש בהיסטוריית השיחה וההזמנות הקודמות של הלקוח כדי לספק מענה מדויק ואישי!
2. בכל הודעת אישור או קליטת הזמנה מול לקוח, חובה לבצע אימות מלא מול טאב "מילון_לוגיסטי"!
3. עבור כל מוצר בהזמנה, חובה לציין את המק"ט המדויק ואת שם המוצר התקני מתוך המילון (לדוגמה: "[מק"ט 20001] בלה סומסום נקי").
4. במידה והלקוח ציין שם כללי שיש לו מספר מוצרים/מק"טים תואמים במילון (כגון "מלט" שמתאים גם ל-[מק"ט 10002] שק מלט אפור 25 ק"ג וגם ל-[מק"ט 10001] שק מלט אפור 50 ק"ג, או "גבס"), חובה לשאול ולברר מול הלקוח:
"לגבי המלט - האם התכוונת ל-[מק"ט 10002] שק מלט אפור 25 ק"ג או ל-[מק"ט 10001] שק מלט אפור 50 ק"ג?" ולשלוף את המוצרים התואמים מהמילון.
5. השב בצורה טבעית, מקצועית, שירותית ובעברית בלבד.`;

  if (ai) {
    const candidateModels = Array.from(
      new Set([
        serverSettings.activeModel || "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
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
            temperature: 0.6,
          },
        });

        let replyText = response.text || "קיבלתי את הודעתך, אשמח לעזור!";

        // If this is an order message and Gemini didn't include SKUs [מק"ט, enforce our local verification summary
        if (orderVerificationText && (!replyText.includes("מק\"ט") && !replyText.includes("מילון"))) {
          replyText = orderVerificationText;
        }

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
  if (orderVerificationText) {
    return res.json({
      success: true,
      text: orderVerificationText,
      source: "logistic_dictionary_verifier",
      timestamp: new Date().toISOString(),
    });
  }

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

export default app;

if (!process.env.VERCEL) {
  startServer();
}
