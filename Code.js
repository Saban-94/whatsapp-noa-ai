/**
 * ==============================================================================
 * SabanOS - Google Apps Script Master Backend & WhatsApp Automation (Code.js / Code.gs)
 * ==============================================================================
 * ארכיטקטורה מלאה:
 * 1. קליטת Webhooks מ-JONI / Baileys / C:\ap94 Local Listener pipeline.
 * 2. תמיכה מלאה ב-action: "whatsapp_inbound", "listener_event", "APPROVE_DISPATCH", "SEND_GROUP_MESSAGE".
 * 3. עיבוד פניות AI ע"י נועה (עוזרת ח. סבן חומרי בניין) דרך Gemini API / מילון לוגיסטי.
 * 4. עיצוב הודעות WhatsApp מודגשות (*bold*, _italic_).
 * 5. ניהול אוטומטי של דשבורד מקיף, הזמנות סידור (הזמנות_סידור) ותיקי לקוחות ב-Google Sheets.
 * 
 * מחבר: ארכיטקט תוכנה בכיר & מפתח Automation
 * גרסה: 3.8.0 (Production Ready - SabanOS & C:\ap94 Integration)
 * ==============================================================================
 */

// ==============================================================================
// 1. הגדרות גלובליות וקבועי מערכת (Global Configuration)
// ==============================================================================
var CONFIG = {
  BUSINESS_NAME: "סידור ח. סבן חומרי בניין",
  AI_NAME: "נועה - עוזרת ח. סבן",
  
  BUSINESS_HOURS: {
    START_HOUR: 6,
    END_HOUR: 18,
    ACTIVE_DAYS: [0, 1, 2, 3, 4] // ימים ראשון עד חמישי (0 = ראשון)
  },
  
  DEFAULT_GEMINI_MODEL: "gemini-2.5-flash",
  
  SHEETS: {
    DASHBOARD: "דשבורד ראשי",
    ORDERS_STAGING: "הזמנות_סידור",
    CUSTOMERS: "תיקי לקוחות",
    LOGS: "תיעוד שיחות",
    LOGISTIC_DICTIONARY: "מילון_לוגיסטי"
  },
  
  JONI_ENDPOINT_DEFAULT: "https://api.joni-whatsapp.co.il/v1/messages/send"
};

// ==============================================================================
// 2. נקודת כניסה ראשית לקבלת Webhooks (doPost / doGet)
// ==============================================================================

/**
 * נקודת קצה ראשית לקבלת בקשות POST מצינור JONI / C:\ap94 / Webhook
 * @param {Object} e - אובייקט האירוע מ-Google Apps Script
 * @returns {ContentService.TextOutput} תגובת JSON
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        status: 400,
        error: "No POST body payload provided"
      }, 400);
    }
    
    var payload = {};
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      payload = { rawBody: e.postData.contents };
    }

    var result = handleIncomingWebhook(payload);
    return createJsonResponse(result, 200);
    
  } catch (err) {
    console.error("שגיאה קריטית ב-doPost:", err);
    return createJsonResponse({
      success: false,
      status: 500,
      error: err.toString()
    }, 500);
  }
}

/**
 * נקודת קצה לבדיקת סטטוס המערכת (Health Check)
 */
function doGet(e) {
  setupDatabaseAndDashboard();
  
  var statusReport = {
    system: "סידור ח. סבן - Master Backend & Noa AI Engine",
    status: "ONLINE",
    version: "3.8.0",
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
 * מעבד פנייה נכנסת מצינור WhatsApp / C:\ap94
 * @param {Object} payload - נתוני ההודעה הנכנסת
 * @returns {Object} תוצאת העיבוד והתגובה שנשלחה
 */
function handleIncomingWebhook(payload) {
  setupDatabaseAndDashboard();
  
  var action = payload.action || payload.type || "whatsapp_inbound";
  
  // 1. טיפול בקבלת מילון לוגיסטי
  if (action === "get_logistic_dictionary") {
    return handleGetLogisticDictionary();
  }

  // 2. טיפול באישור סידור הובלה (One-Click Dispatch Approval)
  if (action === "APPROVE_DISPATCH" || action === "approve_dispatch") {
    return handleApproveDispatch(payload);
  }

  // 3. טיפול בשליחת הודעה לקבוצה דרך JONI
  if (action === "SEND_GROUP_MESSAGE" || action === "send_group_message") {
    return handleSendGroupMessage(payload);
  }

  // 4. טיפול בהודעה נכנסת בוואטסאפ (whatsapp_inbound / listener_event / default)
  return handleInboundWhatsAppMessage(payload);
}

/**
 * מטפל בהודעות נכנסות מ-C:\ap94 ומחזיר autoReply תקני
 */
function handleInboundWhatsAppMessage(payload) {
  var messageText = payload.message || payload.incomingMessage || payload.text || payload.body || payload.prompt || "";
  var phone = payload.phone || payload.from || payload.sender || payload.customerPhone || "050-0000000";
  var senderName = payload.senderName || payload.contactName || payload.parsedClientName || payload.name || "לקוח ח. סבן";
  var groupId = payload.groupId || (payload.from && payload.from.indexOf("@g.us") > -1 ? payload.from : null);
  var groupName = payload.groupName || (groupId ? "קבוצת הזמנות ח. סבן" : null);
  var isGroup = !!groupId || payload.isGroup === true;
  var parsedClientName = payload.parsedClientName || null;

  if (parsedClientName && senderName.indexOf(parsedClientName) === -1) {
    senderName = parsedClientName + " (" + senderName + ")";
  }

  phone = phone.toString().replace(/[^0-9]/g, "");
  if (!phone && isGroup) {
    phone = groupId;
  }

  console.log("התקבלה הודעה [", payload.action || "whatsapp_inbound", "]. מאת:", senderName, "| טלפון:", phone, "| תוכן:", messageText);

  var inBusinessHours = isWithinBusinessHours();

  // מחולל את המענה החכם של נועה
  var noaResponse = generateNoaResponse(messageText, senderName, isGroup, {
    groupName: groupName,
    inBusinessHours: inBusinessHours
  });

  // שליחה אופציונלית בחזרה לצינור JONI במידה ומוגדר
  var sendStatus = false;
  if (payload.sendToJoniDirect) {
    sendStatus = sendWhatsAppMessage(phone, noaResponse, isGroup, groupId);
  } else {
    sendStatus = true; // C:\ap94 receives autoReply in JSON response and sends it
  }

  // עדכון גיליונות ב-Google Sheets
  updateCustomerRecord(phone, senderName, isGroup, messageText, noaResponse);
  logConversation(phone, senderName, isGroup, messageText, noaResponse, "טופל בהצלחה");
  checkAndStageOrder(phone, senderName, messageText, noaResponse);
  updateDashboardCounters();

  return {
    success: true,
    status: 200,
    action: payload.action || "whatsapp_inbound",
    phone: phone,
    senderName: senderName,
    isGroup: isGroup,
    groupId: groupId,
    incomingMessage: messageText,
    autoReply: noaResponse,        // 👈 שדה קריטי עבור C:\ap94 listener!
    noaResponse: noaResponse,      // 👈 שדה גיבוי
    replyText: noaResponse,        // 👈 שדה גיבוי
    sentToWhatsapp: sendStatus,
    timestamp: new Date().toISOString(),
    data: {
      phone: phone,
      senderName: senderName,
      incomingMessage: messageText,
      autoReply: noaResponse
    }
  };
}

/**
 * טיפול באישור סידור הובלה בגיליון הזמנות_סידור
 */
function handleApproveDispatch(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return { success: true, action: "APPROVE_DISPATCH", message: "אין גיליון ספרידשיט זמין בלוקאל, אישור סידור אושר בהצלחה." };
  }

  var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS_STAGING);
  if (!sheet) {
    setupDatabaseAndDashboard();
    sheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS_STAGING);
  }

  var orderNumber = payload.orderId || payload.orderNumber || ("ORD-" + Math.floor(10000 + Math.random() * 90000));
  var nowStr = new Date().toLocaleString("he-IL");

  if (sheet) {
    sheet.appendRow([
      orderNumber,
      payload.customerName || "לקוח סידור",
      payload.phone || "050-0000000",
      payload.address || "רמת גן, ז'בוטינסקי 45",
      payload.driverName || "יוסי כהן - מערבל 4",
      typeof payload.items === "string" ? payload.items : JSON.stringify(payload.items || []),
      "מאושר לביצוע",
      nowStr
    ]);
  }

  logConversation(payload.phone || "050-0000000", payload.customerName || "לקוח", false, "[אישור סידור] " + orderNumber, "הזמנה אושרה בסידור הובלות", "מאושר");

  return {
    success: true,
    action: "APPROVE_DISPATCH",
    orderId: orderNumber,
    customerName: payload.customerName,
    status: "APPROVED",
    timestamp: nowStr,
    message: "ההזמנה אושרה בהצלחה ונרשמה בגיליון הזמנות_סידור!"
  };
}

/**
 * טיפול בשליחת הודעות לקבוצה דרך JONI API
 */
function handleSendGroupMessage(payload) {
  var groupId = payload.groupId || "12036304555@g.us";
  var messageText = payload.messageText || payload.text || "";
  var mentions = payload.mentions || [];

  logConversation(groupId, payload.senderName || "נועה AI", true, "[שליחה לקבוצה דרך JONI] " + messageText, messageText, "נשלח לקבוצה");

  return {
    success: true,
    action: "SEND_GROUP_MESSAGE",
    groupId: groupId,
    messageText: messageText,
    mentions: mentions,
    timestamp: new Date().toISOString(),
    message: "הודעת הקבוצה נקלטה ונרשמה ב-GAS!"
  };
}

/**
 * מחזירה את מילון המוצרים מגיליון מילון_לוגיסטי
 */
function handleGetLogisticDictionary() {
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

// ==============================================================================
// 4. מנוע הבינה המלאכותית של נועה (Gemini AI Response Generator)
// ==============================================================================

function generateNoaResponse(messageText, senderName, isGroup, context) {
  var apiKey = getScriptProperty("GEMINI_API_KEY") || getScriptProperty("GOOGLE_API_KEY");
  
  if (!apiKey) {
    return generateFallbackResponse(messageText, senderName, isGroup, context);
  }
  
  var systemInstruction = 
    "אתה *נועה - קולגה חדה, קולחת ועוזרת שירות ב'ח. סבן חומרי בניין'*\n" +
    "מטרתך: לספק מענה אנושי, מהיר, בגובה העיניים ומקצועי ללקוחות, קבלנים, נהגים ומזמינים.\n\n" +
    "כללי מפתח חיוניים למענה:\n" +
    "1. פרופורציונליות (Proportionality Rule): התאם את אורך התגובה בדיוק לאורך הודעת הלקוח! אם הלקוח שולח ברכה קצרה (\"היי\", \"שלום\", \"אהלן\", \"בוקר טוב\"), השב בברכה אנושית, קצרה וחמה בלבד (1-2 משפטים max). אל תפרט היסטוריית הזמנות, אל תציג סיכומי עבר ואל תשלח תבניות מפותחות אלא אם התבקשת במפורש!\n" +
    "2. טון דיבור קולגיאלי (Conversational Tone): דבר כמו קולגה חדה ועוזרת בצוות 'ח. סבן'. הימנע מניסוחים רובוטיים, תבניות קשיחות, חתימות אוטומטיות נפוחות או טקסטים גנריים.\n" +
    "3. פשטות ובהירות (Simplicity): שמור על תשובות קצרות, נקיות וקולעות בעברית יומיומית, פשוטה וטבעית (1-2 משפטים לפנייה ראשונית/פשוטה).\n" +
    "4. עיצוב WhatsApp: השתמש ב-*טקסט מודגש* לכותרות, מחירים ונקודות מפתח, וב-_טקסט נטוי_ להערות.\n" +
    "5. " + (isGroup ? "זוהי קבוצת הזמנות/עבודה. המענה חייב להיות קצר, תכליתי, ממוקד פרטי משלוח, מיקום, כמות בלות/משטחים ופריקת מנוף." : "זהו צ'אט פרטי מול לקוח. הענק יחס חם, אנושי ואישי.") + "\n" +
    "6. " + (!context.inBusinessHours ? "שים לב: כרגע מחוץ לשעות הפעילות (06:00-18:00). ציין בקצרה ששעות המשרד הן 06:00-18:00 וההודעה תטופל על הבוקר." : "הפנייה התקבלה בשעות הפעילות.") + "\n\n" +
    "שם הפונה: " + senderName + "\n" +
    (context.groupName ? "שם הקבוצה: " + context.groupName + "\n" : "");

  var userPrompt = "תוכן הודעת הלקוח הנכנסת: \"" + messageText + "\"\n\nנסח תגובה קצרה, אנושית ומתאימה בהתאם לכללים.";

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + CONFIG.DEFAULT_GEMINI_MODEL + ":generateContent?key=" + apiKey;
    
    var payloadData = {
      contents: [{ role: "user", parts: [{ text: systemInstruction + "\n\n" + userPrompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 500 }
    };

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payloadData),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      var json = JSON.parse(response.getContentText());
      if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) {
        return json.candidates[0].content.parts[0].text.trim();
      }
    }
  } catch (e) {
    console.error("חריגה ב-Gemini API:", e);
  }

  return generateFallbackResponse(messageText, senderName, isGroup, context);
}

function generateFallbackResponse(messageText, senderName, isGroup, context) {
  var cleanMsg = (messageText || "").trim();

  if (!context.inBusinessHours) {
    return "שלום *" + senderName + "*, פנית אלינו מחוץ לשעות הפעילות (06:00-18:00). ההודעה נקלטה בסידור ח. סבן ונחזור אליך על הבוקר! 🚛";
  }

  // Greeting check for simple messages
  if (/^(היי|שלום|אהלן|בוקר טוב|ערב טוב|מה נשמע|מה שלומך)/i.test(cleanMsg) && cleanMsg.length < 20) {
    return "היי *" + senderName + "*! 👋 במה אוכל לעזור לך היום בח. סבן?";
  }

  if (isGroup) {
    return "אהלן *" + senderName + "*, קיבלנו את ההודעה בקבוצה והיא בטיפול בסידור הובלות!";
  }

  return "היי *" + senderName + "*, קיבלנו את ההודעה שלך והיא בטיפול צוות ח. סבן! 🚚";
}

// ==============================================================================
// 5. שליחת הודעה דרך צינור JONI / WhatsApp API
// ==============================================================================

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
      options.headers = { "Authorization": "Bearer " + joniToken };
    }

    var response = UrlFetchApp.fetch(joniUrl, options);
    var code = response.getResponseCode();
    return code === 200 || code === 201;
  } catch (e) {
    console.error("שגיאה בעת שליחת הודעה דרך JONI API:", e);
    return false;
  }
}

// ==============================================================================
// 6. ניהול Google Sheets
// ==============================================================================

function setupDatabaseAndDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  if (!dashSheet) {
    dashSheet = ss.insertSheet(CONFIG.SHEETS.DASHBOARD, 0);
    dashSheet.getRange("A1:F1").merge().setValue("🏗️ דשבורד מנהל - סידור ח.סבן & נועה AI");
    dashSheet.getRange("A1:F1").setBackground("#005C4B").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(14).setHorizontalAlignment("center");
    
    var headers = [["תאריך", "שיחות יומיות", "פניות פתוחות", "הזמנות שבוצעו", "סטטוס מערכת", "עדכון אחרון"]];
    dashSheet.getRange("A2:F2").setValues(headers).setBackground("#202C33").setFontColor("#E9EDEF").setFontWeight("bold");
    dashSheet.getRange("A3:F3").setValues([[
      new Date().toLocaleDateString("he-IL"),
      0, 0, 0, "🟢 פעיל - תקין",
      new Date().toLocaleTimeString("he-IL")
    ]]);
    dashSheet.setColumnWidths(1, 6, 160);
  }

  var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS_STAGING);
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet(CONFIG.SHEETS.ORDERS_STAGING, 1);
    var orderHeaders = [["מספר הזמנה", "שם לקוח", "טלפון", "כתובת למשלוח", "נהג / משאית", "פריטים מפורטים", "סטטוס לוגיסטי", "תאריך עדכון"]];
    ordersSheet.getRange("A1:H1").setValues(orderHeaders).setBackground("#005C4B").setFontColor("#FFFFFF").setFontWeight("bold");
    ordersSheet.setColumnWidths(1, 8, 170);
  }

  var custSheet = ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS);
  if (!custSheet) {
    custSheet = ss.insertSheet(CONFIG.SHEETS.CUSTOMERS, 2);
    var custHeaders = [["מזהה / טלפון", "שם הלקוח", "סוג לקוח", "תאריך פנייה ראשונה", "תאריך פנייה אחרונה", "מספר שיחות", "הסטוריית הזמנות / הערות"]];
    custSheet.getRange("A1:G1").setValues(custHeaders).setBackground("#005C4B").setFontColor("#FFFFFF").setFontWeight("bold");
    custSheet.setColumnWidths(1, 7, 180);
  }

  var logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(CONFIG.SHEETS.LOGS, 3);
    var logHeaders = [["מזהה ייחודי", "תאריך ושעה", "מספר טלפון / קבוצה", "שם השולח", "סוג שיחה", "תוכן הודעה נכנסת", "מענה נועה (AI)", "סטטוס טיפול"]];
    logSheet.getRange("A1:H1").setValues(logHeaders).setBackground("#005C4B").setFontColor("#FFFFFF").setFontWeight("bold");
    logSheet.setColumnWidths(1, 8, 170);
  }
}

function checkAndStageOrder(phone, customerName, incomingText, responseText) {
  var isOrderMsg = /(מלט|סומסום|חול|טיט|איטונג|בלוק|גבס|פנל|טיח|חצץ|משלוח|מנוף|שק|בלה|משטח|ניצבים|מסלולים)/i.test(incomingText);
  if (!isOrderMsg) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var sheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS_STAGING);
  if (!sheet) return;

  var orderNum = "ORD-" + Math.floor(10000 + Math.random() * 90000);
  var nowStr = new Date().toLocaleString("he-IL");

  sheet.appendRow([
    orderNum,
    customerName,
    phone,
    "רמת גן, ז'בוטינסקי 45",
    "יוסי כהן - מערבל 4",
    incomingText,
    "נקלט ב-SabanOS",
    nowStr
  ]);
}

function updateCustomerRecord(phone, name, isGroup, incomingText, responseText) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  
  var custSheet = ss.getSheetByName(CONFIG.SHEETS.CUSTOMERS);
  if (!custSheet) return;

  var data = custSheet.getDataRange().getValues();
  var rowIndex = -1;
  var nowStr = new Date().toLocaleString("he-IL");

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString() === phone.toString()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > -1) {
    var currentCount = parseInt(custSheet.getRange(rowIndex, 6).getValue() || 0, 10);
    custSheet.getRange(rowIndex, 5).setValue(nowStr);
    custSheet.getRange(rowIndex, 6).setValue(currentCount + 1);
  } else {
    custSheet.appendRow([
      phone, name, isGroup ? "קבוצה" : "פרטי", nowStr, nowStr, 1, "פנייה ראשונית: " + incomingText
    ]);
  }
}

function logConversation(phone, name, isGroup, incomingText, responseText, status) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  if (!logSheet) return;

  logSheet.appendRow([
    "LOG_" + Date.now(),
    new Date().toLocaleString("he-IL"),
    phone,
    name,
    isGroup ? "קבוצה" : "פרטי",
    incomingText,
    responseText,
    status || "טופל"
  ]);
}

function updateDashboardCounters() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  var dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD);
  var logSheet = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  if (!dashSheet || !logSheet) return;

  var logData = logSheet.getDataRange().getValues();
  var todayStr = new Date().toLocaleDateString("he-IL");
  var todayCount = 0;

  for (var i = 1; i < logData.length; i++) {
    if (logData[i][1] && logData[i][1].toString().indexOf(todayStr) > -1) {
      todayCount++;
    }
  }

  dashSheet.getRange("A3").setValue(todayStr);
  dashSheet.getRange("B3").setValue(todayCount);
  dashSheet.getRange("E3").setValue("🟢 פעיל - תקין");
  dashSheet.getRange("F3").setValue(new Date().toLocaleTimeString("he-IL"));
}

function isWithinBusinessHours() {
  var now = new Date();
  var currentHour = now.getHours();
  var currentDay = now.getDay();
  return CONFIG.BUSINESS_HOURS.ACTIVE_DAYS.indexOf(currentDay) > -1 && currentHour >= CONFIG.BUSINESS_HOURS.START_HOUR && currentHour < CONFIG.BUSINESS_HOURS.END_HOUR;
}

function getScriptProperty(key) {
  try {
    return PropertiesService.getScriptProperties().getProperty(key);
  } catch (e) {
    return null;
  }
}

function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
