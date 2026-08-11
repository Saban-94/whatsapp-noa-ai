/**
 * ============================================================================
 * 🧠 NOA AI ENGINE - MASTER BRAIN MODULE (noaBrain.js)
 * ============================================================================
 * מוח תפעולי וניהול מענה אינטליגנטי בזמן אמת ל-WhatsApp / SabanOS
 * ח. סבן חומרי בניין 1994 בע"מ
 * 
 * גרסה: 7.5.0 Enterprise Production
 * ============================================================================
 */

const CONFIG = {
  SYSTEM_NAME: "SabanOS & Noa AI Engine",
  BUSINESS_NAME: 'ח. סבן חומרי בניין 1994 בע"מ',
  AI_NAME: "נועה AI",
  DEFAULT_PHONE: "972508861080",
  DEFAULT_WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbxjs19kSI1zgpLuMd64aUcfVlKXfVE3_dBShrDfRbExy2fUXkmdhVzna28P3GnIrW4o/exec",
  
  SYSTEM_INSTRUCTIONS: `אתה 'נועה AI' - מנהלת התפעול והלוגיסטיקה הווירטואלית של 'ח. סבן חומרי בניין 1994 בע"מ'.
תפקידך לספק מענה מהיר, מדויק ומקצועי ללקוחות, קבלנים ונהגים בוואטסאפ.

חוקי ברזל למענה:
1. חוק הפרופורציונליות (Proportionality Rule): התאם את אורך התגובה בדיוק לאורך הודעת הלקוח! אם הלקוח שולח ברכה פשוטה ("היי", "שלום", "אהלן", "בוקר טוב"), השב בברכה אנושית, קצרה וחמה בלבד (משפט 1 או 2 max). אל תפרט היסטוריית הזמנות, אל תציג סיכומי עבר ואל תשלח תבניות ארוכות אלא אם הלקוח ביקש זאת במפורש.
2. טון דיבור אנושי וקולגיאלי (Conversational Tone): דבר כמו קולגה חדה, יציבה ועוזרת בצוות 'ח. סבן'. הימנע מניסוחים רובוטיים, תבניות קשיחות, חתימות אוטומטיות נפוחות, או טקסטים גנריים של בוט.
3. פשטות ובהירות (Simplicity): שמור על תשובות נקיות, קצרות (1-2 משפטים לפנייה ראשונית/פשוטה), בעברית יומיומית, פשוטה וטבעית.
4. זיהוי הזמנות ומילון לוגיסטי: כאשר מזהים פנייה המכילה ציוד בניין, מחומרי מליטה, בלוקים, גבס או מנוף - יש לאמת את המניפסט מול המילון הלוגיסטי (מק"טים ופקדונות) ולספק סיכום ברור עם מחירים משוערים.`
};

const LOGISTICS_DICTIONARY = [
  {
    sku: "20001",
    name: "בלה סומסום נקי",
    keywords: ["סומסום", "בלה סומסום", "סומסום נקי", "שומשום"],
    unit: "בלה",
    price: 110,
    category: "חומרי מחצבה",
    depositRequired: false
  },
  {
    sku: "20002",
    name: "בלה חול מחצבה (טיט)",
    keywords: ["חול", "טיט", "בלה חול", "בלה טיט", "חול מחצבה"],
    unit: "בלה",
    price: 105,
    category: "חומרי מחצבה",
    depositRequired: false
  },
  {
    sku: "20003",
    name: "בלה טיח ליישור",
    keywords: ["טיח", "בלה טיח", "טיח מיישר"],
    unit: "בלה",
    price: 115,
    category: "חומרי מחצבה",
    depositRequired: false
  },
  {
    sku: "20004",
    name: "בלה חצץ עדש",
    keywords: ["חצץ", "עדש", "בלה חצץ", "חצץ עדש"],
    unit: "בלה",
    price: 120,
    category: "חומרי מחצבה",
    depositRequired: false
  },
  {
    sku: "20005",
    name: "שק מלט אפור 50 ק\"ג",
    keywords: ["מלט", "מלט אפור", "שק מלט", "שקי מלט"],
    unit: "שק",
    price: 35,
    category: "חומרי מליטה",
    depositRequired: true,
    depositSku: "PALLET-01",
    depositName: "פלטת עץ למלט (פקדון ₪40)"
  },
  {
    sku: "20006",
    name: "בלוק איטונג 20x20x60",
    keywords: ["איטונג", "בלוק איטונג", "בלוק 20"],
    unit: "יחידה",
    price: 18,
    category: "בלוקים ובנייה",
    depositRequired: true,
    depositSku: "PALLET-02",
    depositName: "משטח איטונג (פקדון ₪50)"
  },
  {
    sku: "20007",
    name: "לוח גבס לבן 120x260",
    keywords: ["גבס", "לוח גבס", "גבס לבן"],
    unit: "לוח",
    price: 42,
    category: "לוחות וגבס",
    depositRequired: false
  },
  {
    sku: "20008",
    name: "דבק קרמיקה 110 25 ק\"ג",
    keywords: ["דבק", "דבק קרמיקה", "דבק 110"],
    unit: "שק",
    price: 48,
    category: "דבקים ואיטום",
    depositRequired: false
  },
  {
    sku: "20009",
    name: "פנל מבודד 50 מ\"מ",
    keywords: ["פנל", "פנל מבודד", "פנלים"],
    unit: "מ\"ר",
    price: 95,
    category: "בנייה קלה",
    depositRequired: false
  },
  {
    sku: "GENERIC-99",
    name: "מנוף לקומה / פריקה מיוחדת",
    keywords: ["מנוף", "קומה", "פריקה מנוף", "הנפה"],
    unit: "יחידה",
    price: 150,
    category: "שירותי הובלה",
    depositRequired: false
  }
];

const BUILTIN_RULES = [
  {
    keywords: ["גליונות", "גליון", "שיטס", "שיט", "אקסל", "excel", "sheets", "מחוברת לגליונות", "סנכרון", "גוגל שיטס"],
    matchType: "contains",
    response: "כן, בהחלט! 📊 אני מחוברת באופן ישיר ומסונכרנת בזמן אמת מול גליונות Google Sheets וסידור העבודה של SabanOS. כל עדכון, פנייה או הזמנה נרשמים ומסתנכרנים באופן אוטומטי.",
    category: "אינטגרציה"
  },
  {
    keywords: ["שעות", "מתי פתוח", "זמנים", "שעות פעילות", "מתי סגור"],
    matchType: "contains",
    response: "אנחנו פתוחים בימים א'-ה' בין השעות 08:00 ל-18:00, ובימי שישי עד 13:00. נשמח לראותכם!",
    category: "מידע כללי"
  },
  {
    keywords: ["מיקום", "כתובת", "ניווט", "איפה אתם", "waze", "ווייז"],
    matchType: "contains",
    response: "📍 הסניף המרכזי שלנו ממוקם ב*רחוב הברזל 11, תל אביב*. לחץ לניווט ב-Waze: https://waze.com/ul?ll=32.1092,34.8389&navigate=yes 🗺️",
    category: "מידע כללי"
  },
  {
    keywords: ["תפריט", "אוכל", "מנה", "קייטרינג"],
    matchType: "contains",
    response: "בוודאי! התפריט היומי מעודכן בסנכרון מול SabanOS. תרצה שאשלח לך את פירוט המנות והמחירים?",
    category: "שירות"
  },
  {
    keywords: ["מחיר", "עלות", "כמה עולה", "מחירון"],
    matchType: "contains",
    response: "המחירון המלא מעודכן במערכת SabanOS. תרצה לקבל פירוט והצעת מחיר מותאמת אישית לפרויקט שלך?",
    category: "מכירות"
  }
];

function parseLogisticsOrder(text) {
  if (!text || typeof text !== 'string') return null;

  const lowerText = text.toLowerCase();
  const isOrderPattern = /(הזמנה|משלוח|צריך|להביא|ציוד|מלט|סומסום|חול|טיט|איטונג|בלוק|גבס|פנל|טיח|חצץ|מק"ט|בלה|שק|בלאות|משטח)/i.test(text);
  if (!isOrderPattern) return null;

  const foundItems = [];
  let totalPrice = 0;
  let requiresDeposit = false;
  const deposits = [];

  LOGISTICS_DICTIONARY.forEach(item => {
    const matchedKeyword = item.keywords.find(kw => lowerText.includes(kw));
    if (matchedKeyword) {
      const qtyRegex = new RegExp(`(\\d+)\\s*(?:${item.keywords.join('|')})|(?:${item.keywords.join('|')})\\s*(\\d+)`, 'i');
      const match = text.match(qtyRegex);
      let quantity = 1;

      if (match) {
        quantity = parseInt(match[1] || match[2] || "1", 10);
      }

      const lineTotal = quantity * item.price;
      totalPrice += lineTotal;

      foundItems.push({
        sku: item.sku,
        name: item.name,
        quantity: quantity,
        unit: item.unit,
        unitPrice: item.price,
        lineTotal: lineTotal,
        category: item.category
      });

      if (item.depositRequired) {
        requiresDeposit = true;
        deposits.push({
          sku: item.depositSku || "PALLET-01",
          name: item.depositName || "פקדון משטח/פלטה"
        });
      }
    }
  });

  if (foundItems.length === 0) return null;

  let siteLocation = "לא צוין";
  const siteMatch = text.match(/(?:אתר|כתובת|לרחוב|באתר|לסניף|בסניף)\s+([^\n,.-]+)/i);
  if (siteMatch && siteMatch[1]) {
    siteLocation = siteMatch[1].trim();
  }

  let verificationSummary = `שלום! 👋\n*ההזמנה שלך נקלטה ופוענחה בהצלחה במערכת סידור ח.סבן:* 🚛\n\n`;
  foundItems.forEach(i => {
    verificationSummary += `• [מק"ט ${i.sku}] ${i.name} — ${i.quantity} ${i.unit} (₪${i.lineTotal})\n`;
  });

  if (requiresDeposit) {
    verificationSummary += `\n*הערה:* פריטים מסוימים דורשים פקדון פלטות/משטחים שיוחזר בעת החזרת הציוד.\n`;
  }

  verificationSummary += `\n*סה"כ משוער:* ₪${totalPrice}\n*מיקום פורק:* ${siteLocation}\n\nצוות הלוגיסטיקה מכין את המשלוח ויוצר עמך קשר לתיאום סופי!`;

  return {
    isOrder: true,
    items: foundItems,
    totalPrice: totalPrice,
    requiresDeposit: requiresDeposit,
    deposits: deposits,
    siteLocation: siteLocation,
    formattedSummary: verificationSummary
  };
}

function evaluateRules(text, customRules) {
  if (!text || typeof text !== 'string') return null;

  const lowerText = text.trim().toLowerCase();
  const rulesList = (Array.isArray(customRules) && customRules.length > 0) ? customRules : BUILTIN_RULES;

  for (const rule of rulesList) {
    if (!rule || !rule.keywords) continue;

    const keywords = Array.isArray(rule.keywords) ? rule.keywords : [rule.keywords];
    
    const isMatch = keywords.some(kw => {
      if (!kw) return false;
      const lowerKw = kw.toString().toLowerCase().trim();
      
      if (rule.matchType === 'exact') {
        return lowerText === lowerKw;
      } else if (rule.matchType === 'startsWith') {
        return lowerText.startsWith(lowerKw);
      } else {
        return lowerText.includes(lowerKw);
      }
    });

    if (isMatch && rule.response) {
      return rule.response;
    }
  }

  return null;
}

function buildGeminiPayload(userMessage, chatHistory = [], orderContext = null) {
  const cleanMsg = (userMessage || "").toString().trim();
  const contents = [];

  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    chatHistory.forEach(item => {
      if (!item || !item.text) return;
      const role = (item.role === 'model' || item.role === 'assistant' || item.role === 'agent') ? 'model' : 'user';
      contents.push({
        role: role,
        parts: [{ text: item.text }]
      });
    });
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    contents.push({
      role: 'user',
      parts: [{ text: cleanMsg || "שלום" }]
    });
  }

  let extraContext = "";
  if (orderContext && orderContext.formattedSummary) {
    extraContext = `\n[הערת מערכת: הודעה זו זוהתה כהזמנת ציוד. סיכום המניפסט שפוענח:\n${orderContext.formattedSummary}\nאנא התבסס על נתונים אלו ותן תשובה קצרה ומקצועית בלבד!]`;
  }

  return {
    contents: contents,
    systemInstruction: CONFIG.SYSTEM_INSTRUCTIONS + extraContext,
    temperature: 0.6,
    candidateModels: [
      "gemini-3.6-flash",
      "gemini-2.5-flash",
      "gemini-1.5-flash"
    ]
  };
}

function processInboundMessage(userMessage, options = {}) {
  const msgText = (userMessage || "").toString().trim();
  const lowerMsg = msgText.toLowerCase();

  const simpleGreetings = ["היי", "שלום", "אהלן", "בוקר טוב", "ערב טוב", "צהריים טובים", "מה שלומך", "היוש"];
  const isExactGreeting = simpleGreetings.some(g => lowerMsg === g || lowerMsg === g + "!" || lowerMsg === g + " נועה");

  if (isExactGreeting) {
    return {
      success: true,
      text: "שלום! 👋 במה אוכל לעזור לך היום בח. סבן?",
      source: "proportionality_rule",
      isSimpleGreeting: true
    };
  }

  const orderAnalysis = parseLogisticsOrder(msgText);
  if (orderAnalysis && orderAnalysis.isOrder) {
    return {
      success: true,
      text: orderAnalysis.formattedSummary,
      source: "logistics_order_parser",
      orderData: orderAnalysis
    };
  }

  const ruleMatch = evaluateRules(msgText, options.customRules);
  if (ruleMatch) {
    return {
      success: true,
      text: ruleMatch,
      source: "rules_engine"
    };
  }

  let fallbackText = "הודעתך התקבלה והועברה לצוות הלוגיסטיקה של ח. סבן. נחזור אליך בהקדם!";
  
  if (lowerMsg.includes("הזמנה") || lowerMsg.includes("משלוח")) {
    fallbackText = "שלום! *ההזמנה שלך נקלטה במערכת SabanOS* 🚚\nצוות הלוגיסטיקה מכין את המשלוח ויוצר קשר לתיאום סופי.";
  }

  return {
    success: true,
    text: fallbackText,
    source: "smart_fallback"
  };
}

const noaBrainModule = {
  getSystemConfig: function () {
    return Object.assign({}, CONFIG);
  },
  getLogisticsDictionary: function () {
    return LOGISTICS_DICTIONARY.slice();
  },
  getBuiltinRules: function () {
    return BUILTIN_RULES.slice();
  },
  parseLogisticsOrder,
  evaluateRules,
  buildGeminiPayload,
  processInboundMessage
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = noaBrainModule;
  module.exports.default = noaBrainModule;
  module.exports.processInboundMessage = processInboundMessage;
  module.exports.parseLogisticsOrder = parseLogisticsOrder;
  module.exports.evaluateRules = evaluateRules;
  module.exports.buildGeminiPayload = buildGeminiPayload;
}

if (typeof window !== 'undefined') {
  window.noaBrain = noaBrainModule;
}
