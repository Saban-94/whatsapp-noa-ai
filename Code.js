/**
 * ==============================================================================
 * SabanOS - Google Apps Script Master Backend & WhatsApp Automation (Code.js)
 * ==============================================================================
 * ארכיטקטורה מלאה:
 * 1. קליטת Webhooks מ-JONI / Baileys pipeline.
 * 2. עיבוד פניות AI ע"י נועה (עוזרת ח. סבן חומרי בניין) דרך Gemini API.
 * 3. עיצוב הודעות WhatsApp מודגשות (*bold*, _italic_).
 * 4. ניהול אוטומטי של דשבורד מקיף ותיקי לקוחות ב-Google Sheets.
 * 
 * מחבר: ארכיטקט תוכנה בכיר & מפתח Automation
 * גרסה: 3.6.0 (Production Ready - SabanOS)
 * ==============================================================================
 */

// ==============================================================================
// 1. הגדרות גלובליות וקבועי מערכת (Global Configuration)
// ==============================================================================
var CONFIG = {
  // שם העסק והבינה המלאכותית
  BUSINESS_NAME: "ח. סבן חומרי בניין",
  AI_NAME: "נועה - עוזרת ח. סבן",
  
  // שעות פעילות (06:00 עד 18:00)
  BUSINESS_HOURS: {
    START_HOUR: 6,
    END_HOUR: 18,
    ACTIVE_DAYS: [0, 1, 2, 3, 4] // ימים ראשון עד חמישי (0 = ראשון)
  },
  
  // מפתח Gemini API (נלקח מ-ScriptProperties או ערך ברירת מחדל)
  DEFAULT_GEMINI_MODEL: "gemini-2.5-flash",
  
  // שמות הגיליונות במערכת
  SHEETS: {
    DASHBOARD: "דשבורד ראשי",
    CUSTOMERS: "תיקי לקוחות",
    LOGS: "תיעוד שיחות",
    SETTINGS: "הגדרות מערכת",
    LOGISTIC_DICTIONARY: "מילון_לוגיסטי"
  },
  
  // נקודת קצה לצינור JONI / WhatsApp API
  JONI_ENDPOINT_DEFAULT: "https://api.joni-whatsapp.co.il/v1/messages/send"
};

// ==============================================================================
// 2. נקודת כניסה ראשית לקבלת Webhooks (doPost / doGet)
// ==============================================================================

/**
 * נקודת קצה ראשית לקבלת בקשות POST מצינור JONI / WhatsApp Webhook
 * @param {Object} e - אובייקט האירוע מ-Google Apps Script
 * @returns {ContentService.TextOutput} תגובת JSON לצינור
 */
function doPost(e) {
  try {
    // 1. ווידוא ופענוח ה-Payload הנכנס
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "No POST body payload provided"
      }, 400);
    }
    
    var payload = JSON.parse(e.postData.contents);
    var result = handleIncomingWebhook(payload);
    
    return createJsonResponse(result, 200);
    
  } catch (err) {
    console.error("שגיאה קריטית ב-doPost:", err);
    
    // תיעוד שגיאה קריטית בגיליון הלוגים
    try {
      logConversation("SYSTEM_ERROR", "Webhook Error", false, e ? e.postData.contents : "N/A", "שגיאת שרת: " + err.message, "שגיאה");
    } catch (logErr) {
      console.error("נכשלה כתיבת הלוג:", logErr);
    }
    
    return createJsonResponse({
      status: "error",
      message: err.toString()
    }, 500);
  }
}

/**
 * נקודת קצה לבדיקת סטטוס המערכת (Health Check)
 * @param {Object} e - אובייקט האירוע
 * @returns {ContentService.TextOutput} HTML/JSON מראה שהמערכת פעילה
 */
function doGet(e) {
  setupDatabaseAndDashboard();
  
  var statusReport = {
    system: "SabanOS Master Backend - Noa AI Engine",
    status: "ONLINE",
    version: "3.6.0",
    businessName: CONFIG.BUSINESS_NAME,
    timestamp: new Date().toISOString(),
    businessHoursActive: isWithinBusinessHours()
  };
  
  return createJsonResponse(statusReport, 200);
}

// ==============================================================================
// 3. מנוע עיבוד הודעות נכנסות (Webhook Processing Logic)
// ==============================================================================

/**
 * מעבד פנייה נכנסת מצינור WhatsApp
 * @param {Object} payload - נתוני ההודעה הנכנסת
 * @returns {Object} תוצאת העיבוד והתגובה שנשלחה
 */
function handleIncomingWebhook(payload) {
  // הקמת תשתית הגיליונות במידה ועדיין לא הוקמה
  setupDatabaseAndDashboard();
  
  // טיפול בבקשת קבלת מילון מוצרים בלבד
  if (payload && payload.action === "get_logistic_dictionary") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dictList = [];
    if (ss) {
      var dictSheet = ss.getSheetByName(CONFIG.SHEETS.LOGISTIC_DICTIONARY);
      if (dictSheet) {
        var data = dictSheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0]) {
            var aliasesStr = data[i][2] ? data[i][2].toString() : "";
            dictList.push({
              sku: data[i][0].toString(),
              productName: data[i][1] ? data[i][1].toString() : "",
              aliases: aliasesStr.split(",").map(function(a){ return a.trim(); }).filter(Boolean),
              unit: data[i][3] ? data[i][3].toString() : "יחידה",
              category: data[i][4] ? data[i][4].toString() : "כללי",
              price: parseFloat(data[i][5]) || 0
            });
          }
        }
      }
    }
    return {
      success: true,
      tab: CONFIG.SHEETS.LOGISTIC_DICTIONARY,
      count: dictList.length,
      dictionary: dictList
    };
  }
  
  // חילוץ פרטי ההודעה מתוך נתוני JONI / Baileys
  var messageText = payload.message || payload.text || payload.body || "";
  var phone = payload.phone || payload.from || payload.sender || "לא ידוע";
  var senderName = payload.senderName || payload.pushName || payload.name || "לקוח ח. סבן";
  var groupId = payload.groupId || payload.groupJid || null;
  var groupName = payload.groupName || (groupId ? "קבוצת הזמנות ח. סבן" : null);
  var isGroup = !!groupId || payload.isGroup === true;
  
  // ניקוי מספר הטלפון והסרת תווים מיותרים
  phone = phone.toString().replace(/[^0-9]/g, "");
  if (!phone && isGroup) {
    phone = groupId;
  }
  
  console.log("התקבלה הודעה חדשה. מאת:", senderName, "| טלפון/קבוצה:", phone, "| קבוצה:", isGroup, "| תוכן:", messageText);
  
  // בדיקת שעות פעילות המשרד
  var inBusinessHours = isWithinBusinessHours();
  
  // מחולל את המענה החכם של נועה באמצעות Gemini API
  var noaResponse = generateNoaResponse(messageText, senderName, isGroup, {
    groupName: groupName,
    inBusinessHours: inBusinessHours
  });
  
  // שליחת התגובה בחזרה ללקוח/לקבוצה דרך צינור JONI
  var sendStatus = sendWhatsAppMessage(phone, noaResponse, isGroup, groupId);
  
  // עדכון תיק הלקוח ורישום השיחה בזמן אמת ב-Google Sheets
  updateCustomerRecord(phone, senderName, isGroup, messageText, noaResponse);
  logConversation(phone, senderName, isGroup, messageText, noaResponse, sendStatus ? "טופל" : "נכשל");
  updateDashboardCounters();
  
  return {
    success: true,
    phone: phone,
    senderName: senderName,
    isGroup: isGroup,
    incomingMessage: messageText,
    noaResponse: noaResponse,
    sentToWhatsapp: sendStatus
  };
}

// ==============================================================================
// 4. מנוע הבינה המלאכותית של נועה (Gemini AI Response Generator)
// ==============================================================================

/**
 * מייצר מענה AI חכם ומעוצב בפורמט WhatsApp
 * @param {string} messageText - תוכן הפנייה של הלקוח
 * @param {string} senderName - שם הלקוח/הפונה
 * @param {boolean} isGroup - האם מדובר בקבוצת WhatsApp
 * @param {Object} context - נתוני הקשר נוספים (שם קבוצה, שעות פעילות)
 * @returns {string} טקסט המענה המעוצב של נועה
 */
function generateNoaResponse(messageText, senderName, isGroup, context) {
  var apiKey = getScriptProperty("GEMINI_API_KEY") || getScriptProperty("GOOGLE_API_KEY");
  
  // במידה ולא מוגדר מפתח API, מוחזר מענה גיבוי מובנה ומעוצב
  if (!apiKey) {
    console.warn("לא מוגדר מפתח GEMINI_API_KEY. מפעיל מנגנון תגובת גיבוי.");
    return generateFallbackResponse(messageText, senderName, isGroup, context);
  }
  
  // הזרקת ה-System Prompt המקיף של "ח. סבן חומרי בניין"
  var systemInstruction = 
    "אתה *נועה - העוזרת האישית של ח. סבן חומרי בניין*.\n" +
    "מטרתך: לספק מענה מקצועי, אדיב, חם, מהיר ומדויק ללקוחות, קבלנים, נהגים ומזמינים.\n\n" +
    "כללי מפתח למענה:\n" +
    "1. שפה: עברית רהוטה, חמה, שירותית ומכבדת.\n" +
    "2. עיצוב WhatsApp: השתמש ב-*טקסט מודגש* לכותרות, מחירים ונקודות מפתח, וב-_טקסט נטוי_ להערות.\n" +
    "3. אימוג'ים: השתמש באימוג'ים מותאמים לענף הבנייה (🏗️, 🚛, 🧱, 📦, 📍, ✅, 📞, ⏳).\n" +
    "4. מוצרים ושירותים של ח. סבן: חול, סומסום, גבס, מלט, בלוקים, חומרי איטום, ציוד בנייה, הובלות מנוף, פריקת בלות ומשטחים.\n" +
    "5. " + (isGroup ? "זוהי קבוצת הזמנות/עבודה. המענה חייב להיות קצר, תכליתי, ממוקד פרטי משלוח, מיקום, כמות בלות/משטחים ופריקת מנוף." : "זהו צ'אט פרטי מול לקוח. הענק יחס חם ואישי.") + "\n" +
    "6. " + (!context.inBusinessHours ? "שים לב: כרגע מחוץ לשעות הפעילות (06:00-18:00). תן מענה אדיב, ציין ששעות המשרד הן 06:00-18:00, ואשר שהפנייה נקלטה ותטופל על הבוקר." : "הפנייה התקבלה בשעות הפעילות.") + "\n\n" +
    "שם הפונה: " + senderName + "\n" +
    (context.groupName ? "שם הקבוצה: " + context.groupName + "\n" : "");

  var userPrompt = "תוכן הודעת הלקוח הנכנסת: \"" + messageText + "\"\n\nאנא נסח תגובה מתאימה מניעה לפעולה.";

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + CONFIG.DEFAULT_GEMINI_MODEL + ":generateContent?key=" + apiKey;
    
    var payloadData = {
      contents: [
        {
          role: "user",
          parts: [
            { text: systemInstruction + "\n\n" + userPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 500
      }
    };

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payloadData),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    if (responseCode === 200) {
      var json = JSON.parse(responseBody);
      if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
        var reply = json.candidates[0].content.parts[0].text;
        return reply.trim();
      }
    } else {
      console.error("שגיאה ב-Gemini API. קוד:", responseCode, "גוף:", responseBody);
    }
  } catch (e) {
    console.error("חריגה בעת פנייה ל-Gemini API:", e);
  }

  return generateFallbackResponse(messageText, senderName, isGroup, context);
}

/**
 * מחולל תגובת גיבוי חכמה ומעוצבת בהתאם לסוג הפנייה
 */
function generateFallbackResponse(messageText, senderName, isGroup, context) {
  var timeStr = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  
  if (!context.inBusinessHours) {
    return "שלום *" + senderName + "* 🏗️\n\n" +
           "תודה שפנית ל-*ח. סבן חומרי בניין*.\n" +
           "קיבלנו את הודעתך: _\"" + messageText + "\"_\n\n" +
           "⏰ *שעות הפעילות שלנו:* ימים א'-ה' בין השעות *06:00 - 18:00*.\n" +
           "הודעתך נרשמה במערכת SabanOS ונענה לך בעדיפות ראשונה עם פתיחת המשרד ב-06:00 בבוקר! 🚛\n\n" +
           "למקרים דחופים בלבד ניתן להשאיר הודעה קולית.";
  }

  if (isGroup) {
    return "שלום לקבוצת *" + (context.groupName || "הזמנות ח. סבן") + "* 👷‍♂️🏗️\n\n" +
           "הודעתכם נקלטה בהצלחה: *\"" + messageText + "\"*\n" +
           "צוות התיאום והמנופים מעבד את הפרטים כעת. ✅\n\n" +
           "_לעדכון דחוף של כתובת פריקה או שעת הגעת מערבל/מנוף, אנא השיבו כאן._";
  }

  return "שלום *" + senderName + "* יקר/ה! 👋\n\n" +
         "תודה שפנית ל-*ח. סבן חומרי בניין* 🏗️\n" +
         "שמי *נועה*, והודעתך (*\"" + messageText + "\"*) נקלטה במערכת.\n\n" +
         "אנו מציעים מגוון חומרי בנייה, בלות חול/סומסום, ציוד גבס והובלות מנוף עד אתר הבנייה. 🚚\n\n" +
         "נציג או מנהל עבודה יחזור אליך בהקדם. שיהיה יום מוצלח!";
}

// ==============================================================================
// 5. שליחת הודעה דרך צינור JONI / WhatsApp API
// ==============================================================================

/**
 * שולח הודעה מעוצבת בחזרה לצינור Communication Pipeline (JONI / Baileys)
 * @param {string} recipient - מספר טלפון או מזהה קבוצה
 * @param {string} text - תוכן ההודעה המעוצבת
 * @param {boolean} isGroup - האם מדובר בקבוצה
 * @param {string} groupId - מזהה הקבוצה במידה וקיים
 * @returns {boolean} האם השליחה הצליחה
 */
function sendWhatsAppMessage(recipient, text, isGroup, groupId) {
  var joniUrl = getScriptProperty("JONI_API_URL") || CONFIG.JONI_ENDPOINT_DEFAULT;
  var joniToken = getScriptProperty("JONI_API_TOKEN") || "";

  var payload = {
    recipient: isGroup && groupId ? groupId : recipient,
    message: text,
    text: text,
    isGroup: isGroup,
    groupId: groupId || null,
    timestamp: new Date().toISOString()
  };

  try {
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    if (joniToken) {
      options.headers = {
        "Authorization": "Bearer " + joniToken
      };
    }

    var response = UrlFetchApp.fetch(joniUrl, options);
    var code = response.getResponseCode();
    
    if (code === 200 || code === 201) {
      console.log("ההודעה נשלחה בהצלחה ל-JONI עבור:", recipient);
      return true;
    } else {
      console.warn("צינור JONI החזיר קוד תשובה:", code, "גוף:", response.getContentText());
      return false;
    }
  } catch (e) {
    console.error("שגיאה בעת שליחת הודעה דרך JONI API:", e);
    return false;
  }
}

// ==============================================================================
// 6. ניהול מקיף של Google Sheets (Database & Dashboard Management)
// ==============================================================================

/**
 * מקימה אוטומטית את מבנה הגיליונות, הכותרות והעיצובים במידה ואינם קיימים
 */
function setupDatabaseAndDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    console.log("לא נמצא Spreadsheet פעיל בלוקאל. מדלג על הקמת הגיליונות.");
    return;
  }

  // 1. גיליון דשבורד ראשי
  var dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (!dashSheet) {
    dashSheet = ss.insertSheet(CONFIG.SHEETS.DASHBOARD, 0);
    dashSheet.getRange("A1:F1").merge().setValue("🏗️ דשבורד מנהל - SabanOS & נועה AI");
    dashSheet.getRange("A1:F1").setBackground("#005C4B").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(14).setHorizontalAlignment("center");
    
    var headers = [["תאריך", "שיחות יומיות", "פניות פתוחות", "הזמנות שבוצעו", "סטטוס מערכת", "עדכון אחרון"]];
    dashSheet.getRange("A2:F2").setValues(headers).setBackground("#202C33").setFontColor("#E9EDEF").setFontWeight("bold");
    dashSheet.getRange("A3:F3").setValues([[
      new Date().toLocaleDateString("he-IL"),
      0,
      0,
      0,
      "🟢 פעיל - תקין",
      new Date().toLocaleTimeString("he-IL")
    ]]);
    dashSheet.setColumnWidths(1, 6, 160);
  }

  // 2. גיליון תיק לקוח (Customers)
  var custSheet = ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS);
  if (!custSheet) {
    custSheet = ss.insertSheet(CONFIG.SHEETS.CUSTOMERS, 1);
    var custHeaders = [["מזהה / טלפון", "שם הלקוח", "סוג לקוח", "תאריך פנייה ראשונה", "תאריך פנייה אחרונה", "מספר שיחות", "הסטוריית הזמנות / הערות"]];
    custSheet.getRange("A1:G1").setValues(custHeaders).setBackground("#005C4B").setFontColor("#FFFFFF").setFontWeight("bold");
    custSheet.setColumnWidths(1, 7, 180);
  }

  // 3. גיליון תיעוד שיחות (Logs)
  var logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(CONFIG.SHEETS.LOGS, 2);
    var logHeaders = [["מזהה ייחודי", "תאריך ושעה", "מספר טלפון / קבוצה", "שם השולח", "סוג שיחה", "תוכן הודעה נכנסת", "מענה נועה (AI)", "סטטוס טיפול"]];
    logSheet.getRange("A1:H1").setValues(logHeaders).setBackground("#005C4B").setFontColor("#FFFFFF").setFontWeight("bold");
    logSheet.setColumnWidths(1, 8, 170);
  }

  // 4. גיליון מילון לוגיסטי (מילון_לוגיסטי - Dynamic SKUs & Aliases)
  var dictSheet = ss.getSheetByName(CONFIG.SHEETS.LOGISTIC_DICTIONARY);
  if (!dictSheet) {
    dictSheet = ss.insertSheet(CONFIG.SHEETS.LOGISTIC_DICTIONARY, 3);
    var dictHeaders = [["מק\"ט", "שם מוצר תקני", "כינויים / מילות מפתח", "יחידת מידה", "קטגוריה", "מחיר מחירון (₪)"]];
    dictSheet.getRange("A1:F1").setValues(dictHeaders).setBackground("#005C4B").setFontColor("#FFFFFF").setFontWeight("bold");
    
    var initialItems = [
      ["10001", "שק מלט אפור 50 ק\"ג", "מלט אפור 50, שק מלט 50, מלט 50", "שק", "חומרי מליטה", 38],
      ["10002", "שק מלט אפור 25 ק\"ג", "מלט, שק מלט, מלט אפור, מלט 25", "שק", "חומרי מליטה", 22],
      ["10003", "שק מלט לבן 25 ק\"ג", "מלט לבן, שק מלט לבן, מלט לבן 25", "שק", "חומרי מליטה", 34],
      ["20001", "בלה סומסום נקי", "סומסום, בלה סומסום, שק סומסום", "בלה", "חול וסומסום", 110],
      ["20002", "בלה חול מחצבה (טיט)", "חול, חול מחצבה, טיט, בלה חול", "בלה", "חול וסומסום", 105],
      ["20003", "בלה חצץ 1/2 (עדש)", "חצץ, עדש, בלה חצץ", "בלה", "חול וסומסום", 115],
      ["30001", "משטח בלוק בטון 20 (96 יח')", "בלוק בטון, בלוק 20, בלוקים", "משטח", "בלוקים", 480],
      ["30002", "משטח בלוק איטונג 20 (72 יח')", "איטונג, בלוק איטונג, איטונג 20", "משטח", "בלוקים", 650],
      ["40001", "שק טיח גבס תרמי 25 ק\"ג", "טיח, טיח גבס, טיח תרמי", "שק", "גבס וטיח", 45],
      ["40002", "לוח גבס ירוק עמיד מים 12.5 מ\"מ", "גבס ירוק, לוח גבס ירוק, גבס נגד מים", "יחידה", "גבס וטיח", 42]
    ];
    dictSheet.getRange(2, 1, initialItems.length, 6).setValues(initialItems);
    dictSheet.setColumnWidths(1, 6, 170);
  }
}

/**
 * מעדכנת או פותחת תיק לקוח חדש בגיליון Customers
 */
function updateCustomerRecord(phone, name, isGroup, incomingText, responseText) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  
  var custSheet = ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS);
  if (!custSheet) return;

  var data = custSheet.getDataRange().getValues();
  var rowIndex = -1;
  var nowStr = new Date().toLocaleString("he-IL");

  // חיפוש הלקוח לפי מספר טלפון / מזהה
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString() === phone.toString()) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }

  if (rowIndex > -1) {
    // עדכון לקוח קיים
    var currentCount = parseInt(custSheet.getRange(rowIndex, 6).getValue() || 0, 10);
    custSheet.getRange(rowIndex, 5).setValue(nowStr); // תאריך פנייה אחרונה
    custSheet.getRange(rowIndex, 6).setValue(currentCount + 1); // עדכון מונה שיחות
    
    // הצמדת הערה חדשה במידה ומדובר בהזמנה
    if (incomingText.indexOf("הזמנה") > -1 || incomingText.indexOf("מנוף") > -1 || incomingText.indexOf("בלה") > -1) {
      var oldNotes = custSheet.getRange(rowIndex, 7).getValue() || "";
      var newNote = "[" + nowStr + "]: " + incomingText;
      custSheet.getRange(rowIndex, 7).setValue(oldNotes ? oldNotes + " | " + newNote : newNote);
    }
  } else {
    // פתיחת תיק לקוח חדש
    var newRow = [
      phone,
      name,
      isGroup ? "קבוצה" : "פרטי",
      nowStr,
      nowStr,
      1,
      "פנייה ראשונית: " + incomingText
    ];
    custSheet.appendRow(newRow);
  }
}

/**
 * רישום ותיעוד בזמן אמת בגיליון הלוגים (Logs)
 */
function logConversation(phone, name, isGroup, incomingText, responseText, status) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  if (!logSheet) return;

  var logId = "LOG_" + Date.now();
  var nowStr = new Date().toLocaleString("he-IL");

  var row = [
    logId,
    nowStr,
    phone,
    name,
    isGroup ? "קבוצה" : "פרטי",
    incomingText,
    responseText,
    status || "טופל"
  ];

  logSheet.appendRow(row);
}

/**
 * מעדכנת את מונעי הדשבורד הראשי
 */
function updateDashboardCounters() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  var logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  if (!dashSheet || !logSheet) return;

  var logData = logSheet.getDataRange().getValues();
  var todayStr = new Date().toLocaleDateString("he-IL");
  
  var todayCount = 0;
  var openTickets = 0;
  var ordersCount = 0;

  for (var i = 1; i < logData.length; i++) {
    var rowDate = logData[i][1] ? logData[i][1].toString() : "";
    var text = logData[i][5] ? logData[i][5].toString() : "";
    var status = logData[i][7] ? logData[i][7].toString() : "";

    if (rowDate.indexOf(todayStr) > -1) {
      todayCount++;
    }
    if (status === "ממתין" || status === "פתוח") {
      openTickets++;
    }
    if (text.indexOf("הזמנה") > -1 || text.indexOf("מנוף") > -1 || text.indexOf("חול") > -1) {
      ordersCount++;
    }
  }

  dashSheet.getRange("A3").setValue(todayStr);
  dashSheet.getRange("B3").setValue(todayCount);
  dashSheet.getRange("C3").setValue(openTickets);
  dashSheet.getRange("D3").setValue(ordersCount);
  dashSheet.getRange("E3").setValue("🟢 פעיל - תקין");
  dashSheet.getRange("F3").setValue(new Date().toLocaleTimeString("he-IL"));
}

// ==============================================================================
// 7. פונקציות עזר, שעות פעילות וקריאת הגדרות (Utility Functions)
// ==============================================================================

/**
 * בודק האם השעה הנוכחית בתוך שעות הפעילות המוגדרות (06:00 - 18:00)
 * @returns {boolean}
 */
function isWithinBusinessHours() {
  var now = new Date();
  var currentHour = now.getHours();
  var currentDay = now.getDay(); // 0 = ראשון, 4 = חמישי
  
  var activeDays = CONFIG.BUSINESS_HOURS.ACTIVE_DAYS;
  var isDayActive = activeDays.indexOf(currentDay) > -1;
  var isHourActive = currentHour >= CONFIG.BUSINESS_HOURS.START_HOUR && currentHour < CONFIG.BUSINESS_HOURS.END_HOUR;
  
  return isDayActive && isHourActive;
}

/**
 * מקבל מפתח מ-ScriptProperties בבטחה
 */
function getScriptProperty(key) {
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty(key);
  } catch (e) {
    return null;
  }
}

/**
 * מחזיר תשובת JSON מובנית
 */
function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ==============================================================================
// 8. פונקציית בדיקה והרצה מקומית (Test Execution Handler)
// ==============================================================================

/**
 * פונקציה להרצת בדיקה סימולטיבית ישירות מתוך עורך הקוד ב-Google Apps Script
 */
function testWebhookHandler() {
  console.log("מריץ בדיקה סימולטיבית ל-SabanOS Webhook...");
  
  var samplePayload = {
    phone: "0501234567",
    senderName: "ישראל ישראלי (קבלן)",
    message: "שלום נועה, צרכים 3 בלות סומסום ובלת חול עם מנוף לקומה 2 באתר ברמת גן.",
    isGroup: false
  };
  
  var response = handleIncomingWebhook(samplePayload);
  console.log("תוצאת סימולציית ה-Webhook:", JSON.stringify(response, null, 2));
}
