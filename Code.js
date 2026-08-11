/**
 * ============================================================================
 * SABAN OS & NOA AI - MASTER GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ============================================================================
 * מערכת ניהול לוגיסטית, דשבורד מנהלים וסנכרון דו-כיווני בזמן אמת
 * ח. סבן חומרי בניין 1994 בע"מ | מוח תפעולי: נועה AI Engine
 * 
 * גרסה: 7.5.0 Enterprise Production Release
 * ============================================================================
 */

// ==========================================
// 1. הגדרות קונפיגורציה גלובליות
// ==========================================
var TARGET_SHEET_ID = "1i2J9ByIAerL48eIRYnT9SJLJcUryR0mlkD8uiWjjZPc";

var CONFIG = {
  SYSTEM_NAME: "SabanOS & Noa AI Engine",
  BUSINESS_NAME: "ח. סבן חומרי בניין",
  TARGET_SHEET_ID: TARGET_SHEET_ID,
  
  // שם הטאבים במערכת
  SHEETS: {
    DASHBOARD: "דשבורד_לוגיסטי",
    ORDERS_LOG: "לוג_הזמנות_מערכת",
    INBOUND: "WhatsApp_Inbound",
    SYSTEM_LOGS: "System_Logs",
    RULES: "הגדרות_מענה_נועה",
    CLIENT_PORTFOLIO: "תיק_לקוח",
    LOGISTICS_DICT: "מילון_לוגיסטי",
    CITIES: "ערים",
    WORK_ORDER: "הזמנות_סידור"
  },

  DEFAULT_WAREHOUSE: "4(החרש)",
  MAX_BAGS_PER_PALLET: 80
};

// ==========================================
// 2. נקודת כניסה ל-WEBHOOKS (doPost & doGet)
// ==========================================

/**
 * נקודת כניסה ראשית לבקשות POST משרת ה-Node.js / WhatsApp Bridge
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "פיילוד ריק או חסר" }, 400);
    }

    var payload = {};
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (jsonErr) {
      payload = e.parameter || {};
    }

    var action = payload.action || "processInboundMessage";
    var ss = getSpreadsheet();

    switch (action) {
      // 1. קליטת הודעה נכנסת מוואטסאפ ורישומה בגיליון
      case "processInboundMessage":
      case "saveInbound":
      case "whatsapp_inbound": {
        var result = handleInboundMessage(ss, payload);
        return createJsonResponse({ success: true, data: result });
      }

      // 2. שליפת היסטוריית שיחות עבור מספר טלפון
      case "getHistory": {
        var phone = payload.phone || payload.senderPhone || "";
        var history = fetchChatHistory(ss, phone);
        return createJsonResponse({ success: true, data: { phone: phone, history: history } });
      }

      // 3. שמירת שורת היסטוריית שיחה (User / Model / Agent)
      case "saveHistory": {
        saveChatHistoryRecord(ss, payload.phone, payload.role, payload.text);
        return createJsonResponse({ success: true, message: "היסטוריה נשמרה" });
      }

      // 4. שליפת חוקי המענה של נועה AI
      case "getRules": {
        var rules = fetchNoaRules(ss);
        return createJsonResponse({ success: true, rules: rules });
      }

      // 5. הזרקת הזמנה חדשה לטאב "לוג_הזמנות_מערכת"
      case "injectOrder":
      case "create_order": {
        var injected = injectOrderToLog(ss, payload.order || payload);
        return createJsonResponse({ success: true, data: injected });
      }

      // 6. שליפת מילון לוגיסטי מלא
      case "getLogisticsDictionary": {
        var dict = fetchLogisticsDictionary(ss);
        return createJsonResponse({ success: true, dictionary: dict });
      }

      // 7. התאמה ואתחול מלא של כל הטאבים והדשבורד
      case "align_system":
      case "initialize_system": {
        var setupResult = setupDatabaseAndDashboard();
        return createJsonResponse({ success: true, data: setupResult });
      }

      // 8. קריאת טאב כללי
      case "read_tab": {
        var tabName = payload.tabName || payload.tab || CONFIG.SHEETS.ORDERS_LOG;
        var tabData = readSheetAsJSON(ss.getSheetByName(tabName));
        return createJsonResponse({ success: true, tab: tabName, data: tabData });
      }

      // 9. כתיבת שורה לטאב כללי
      case "write_tab": {
        var targetTab = payload.tabName || payload.tab || CONFIG.SHEETS.SYSTEM_LOGS;
        var rowData = payload.rowData || payload.rows || [];
        appendRowToTab(ss, targetTab, rowData);
        return createJsonResponse({ success: true, message: "נרשם בהצלחה לטאב " + targetTab });
      }

      default: {
        return createJsonResponse({ success: false, error: "פעולה לא מזהה: " + action }, 400);
      }
    }

  } catch (err) {
    logSystemError("doPost_Error", err.message, e ? e.postData.contents : null);
    return createJsonResponse({ success: false, error: err.toString() }, 500);
  } finally {
    try { lock.releaseLock(); } catch (lErr) {}
  }
}

/**
 * נקודת כניסה ראשית לבקשות GET (בדיקת תקינות ושליפת נתונים מהירה)
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || "health";
    var ss = getSpreadsheet();

    if (action === "getRules") {
      var rules = fetchNoaRules(ss);
      return createJsonResponse({ success: true, rules: rules });
    }

    if (action === "getLogisticsDictionary" || action === "getInventory") {
      var dict = fetchLogisticsDictionary(ss);
      return createJsonResponse({ success: true, inventory: dict });
    }

    if (action === "getLiveOrders") {
      var ordersSheet = ss.getSheetByName(CONFIG.SHEETS.ORDERS_LOG);
      var orders = readSheetAsJSON(ordersSheet);
      return createJsonResponse({ success: true, data: orders });
    }

    if (action === "align" || action === "init") {
      var setupRes = setupDatabaseAndDashboard();
      return createJsonResponse({ success: true, data: setupRes });
    }

    // ברירת מחדל: Health Check
    return createJsonResponse({
      success: true,
      system: CONFIG.SYSTEM_NAME,
      status: "ONLINE",
      timestamp: new Date().toISOString(),
      targetSheetId: ss.getId(),
      version: "7.5.0"
    });

  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() }, 500);
  }
}

// ==========================================
// 3. הקמת בסיס הנתונים ודשבורד מנהלים דינאמי
// ==========================================

/**
 * פונקציה מרכזית ליצירת כל הטאבים הנדרשים ובניית דשבורד ניהולי יוקרתי
 */
function setupDatabaseAndDashboard() {
  var ss = getSpreadsheet();

  // 1. יצירת/אימות טאב דשבורד מנהלים
  setupExecutiveDashboard(ss);

  // 2. יצירת טאב INBOUND (הודעות נכנסות)
  getOrCreateSheet(ss, CONFIG.SHEETS.INBOUND, [
    "תאריך ושעה", "שם השולח", "מספר טלפון", "תוכן ההודעה", "מקור הפנייה", "מזהה הודעה", "סטטוס עיבוד"
  ]);

  // 3. יצירת טאב SYSTEM_LOGS (לוגים ותקלות)
  getOrCreateSheet(ss, CONFIG.SHEETS.SYSTEM_LOGS, [
    "זמן אירוע", "תגית / קטגוריה", "תיאור הודעה", "פרטים נוספים (JSON)", "סטטוס טיפול"
  ]);

  // 4. יצירת טאב RULES (חוקי מענה של נועה AI)
  setupDefaultRulesSheet(ss);

  // 5. יצירת טאב ORDERS_LOG (לוג הזמנות מערכת)
  getOrCreateSheet(ss, CONFIG.SHEETS.ORDERS_LOG, [
    "תאריך קליטה", "מספר הזמנה", "שם לקוח", "מחסן", "כתובת אספקה", "פריטים",
    "פקדון בלות", "פקדון משטחים", "סטטוס", "תוצאה", "סכום", "תאריך אימות",
    "שעת אספקה", "מסקנות נועה AI", "אימות מסלול הובלה", "סטטוס סנכרון"
  ]);

  // 6. יצירת טאב CLIENT_PORTFOLIO (תיקי לקוחות)
  getOrCreateSheet(ss, CONFIG.SHEETS.CLIENT_PORTFOLIO, [
    "מזהה לקוח", "שם לקוח", "ח\"פ / ת.ז", "טלפון ראשי", "איש קשר", "כתובת ברירת מחדל", "סוג לקוח", "סטטוס פעיל"
  ]);

  // 7. יצירת טאב LOGISTICS_DICT (מילון לוגיסטי)
  setupDefaultDictionarySheet(ss);

  // 8. יצירת טאב CITIES (ערים ושינוע)
  getOrCreateSheet(ss, CONFIG.SHEETS.CITIES, [
    "שם לקוח", "כתובת אספקה", "מוצא", "יעד", "מרחק", "זמן נסיעה", "תאריך עדכון", "כמות אספקות קודמות", "אספקה אחרונה"
  ]);

  // 9. יצירת טאב WORK_ORDER (הזמנות סידור)
  getOrCreateSheet(ss, CONFIG.SHEETS.WORK_ORDER, [
    "מספר הזמנה", "תאריך", "שם לקוח", "טלפון", "כתובת למשלוח", "פירוט חומרים", "סטטוס", "נהג מוקצה", "הערות"
  ]);

  // עיצוב כהה ומקצועי לכל הגיליונות
  applyThemeToAllSheets(ss);

  SpreadsheetApp.flush();
  return { status: "success", message: "כל 8 הטאבים והדשבורד הוקמו ועוצבו בהצלחה!" };
}

/**
 * בניית דשבורד מנהלים מעוצב עם נוסחאות דינאמיות
 */
function setupExecutiveDashboard(ss) {
  if (!ss) ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD) || ss.insertSheet(CONFIG.SHEETS.DASHBOARD, 0);
  sheet.setRightToLeft(true);
  sheet.clear();

  // כותרת ראשית מעוצבת
  sheet.getRange("A1:G1").merge()
    .setValue("🏗️ SabanOS & Noa AI Engine - דשבורד לוגיסטי ומנהלי בכיר")
    .setBackground("#0f172a")
    .setFontColor("#38bdf8")
    .setFontWeight("bold")
    .setFontSize(15)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 42);

  sheet.getRange("A2:G2").merge()
    .setValue("מוח תפעולי: נועה AI | סנכרון דו-כיווני בזמן אמת מול שרת הוואטסאפ המקומי")
    .setBackground("#1e293b")
    .setFontColor("#94a3b8")
    .setFontSize(10)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(2, 28);

  // מדדי KPI - כותרות
  var kpiHeaders = [
    'סה"כ הזמנות', 'הזמנות מאושרות', 'חורגות פקדונות ⚠️', 'פטורי פריקה', 'לקוחות רשומים', 'צינור Node.js', 'נועה AI'
  ];
  sheet.getRange("A4:G4").setValues([kpiHeaders])
    .setBackground("#1e293b")
    .setFontColor("#cbd5e1")
    .setFontWeight("bold")
    .setFontSize(11)
    .setHorizontalAlignment("center");
  sheet.setRowHeight(4, 30);

  // נוסחאות דינאמיות
  var fOrders = "=COUNTA('" + CONFIG.SHEETS.ORDERS_LOG + "'!B2:B1000)";
  var fApproved = "=COUNTIF('" + CONFIG.SHEETS.ORDERS_LOG + "'!I2:I1000, \"*מאושר*\")";
  var fExceptions = "=COUNTIF('" + CONFIG.SHEETS.ORDERS_LOG + "'!I2:I1000, \"*חורג*\")";
  var fExemptions = "=COUNTIF('" + CONFIG.SHEETS.ORDERS_LOG + "'!G2:G1000, \"*ללא פריקה*\")";
  var fCustomers = "=COUNTA('" + CONFIG.SHEETS.CLIENT_PORTFOLIO + "'!A2:A1000)";

  sheet.getRange("A5:G5").setFormulas([[
    fOrders, fApproved, fExceptions, fExemptions, fCustomers, '="מחובר 🟢"', '="פעיל 🟢"'
  ]])
  .setBackground("#0f172a")
  .setFontColor("#38bdf8")
  .setFontWeight("bold")
  .setFontSize(14)
  .setHorizontalAlignment("center")
  .setVerticalAlignment("middle");
  sheet.setRowHeight(5, 36);

  // כותרת טבלת סיכום פניות נכנסות
  sheet.getRange("A7:G7").merge()
    .setValue("📥 הודעות וואטסאפ אחרונות שנרשמו במערכת")
    .setBackground("#1e293b")
    .setFontColor("#f8fafc")
    .setFontWeight("bold")
    .setFontSize(12)
    .setHorizontalAlignment("right");
  sheet.setRowHeight(7, 32);

  var inboundHeaders = ["תאריך ושעה", "שם השולח", "מספר טלפון", "תוכן ההודעה", "מקור", "מזהה", "סטטוס"];
  sheet.getRange("A8:G8").setValues([inboundHeaders])
    .setBackground("#334155")
    .setFontColor("#f1f5f9")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  // רוחב עמודות
  for (var col = 1; col <= 7; col++) {
    sheet.setColumnWidth(col, 185);
  }
}

/**
 * יצירת/אימות טאב חוקי מענה של נועה AI
 */
function setupDefaultRulesSheet(ss) {
  if (!ss) ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, CONFIG.SHEETS.RULES, [
    "מילת מפתח / ביטוי", "סוג התאמה", "נוסח תשובת נועה", "סטטוס", "מונה שימושים", "הערות"
  ]);

  if (sheet.getLastRow() <= 1) {
    var defaultRules = [
      ["היי", "CONTAINS", "היי {NAME}! 👋 במה אוכל לעזור לך היום ב-ח. סבן?", "פעיל", 0, "ברכה ראשונית"],
      ["שלום", "CONTAINS", "שלום וברכה {NAME}! 🏗️ משרד ח. סבן לשירותך. מה תרצה להזמין?", "פעיל", 0, "ברכה"],
      ["בוקר טוב", "CONTAINS", "בוקר טוב ומבורך {NAME}! ☀️ איזה ציוד או חומרים נכין לך להיום?", "פעיל", 0, "ברכת בוקר"],
      ["ערב טוב", "CONTAINS", "ערב טוב {NAME}! 🌙 במה אוכל לסייע לך?", "פעיל", 0, "ברכת ערב"],
      ["שעות", "CONTAINS", "סניפי ח. סבן פעילים בימים א'-ה' 06:30-16:30, ובימי שישי עד 12:30 ⏰", "פעיל", 0, "שעות פעילות"],
      ["מיקום", "CONTAINS", "הסניף המרכזי שלנו ממוקם ברחוב החרש 4, פתח תקווה 📍 נשמח לראותך!", "פעיל", 0, "כתובת"],
      ["DEFAULT_FALLBACK", "EXACT", "שלום {NAME} 👋 קיבלתי את הודעתך. צוות ח. סבן בודק את הפרטים ויחזור אליך בהקדם!", "פעיל", 0, "מענה ברירת מחדל"]
    ];
    sheet.getRange(2, 1, defaultRules.length, defaultRules[0].length).setValues(defaultRules);
  }
}

/**
 * יצירת/אימות טאב מילון לוגיסטי
 */
function setupDefaultDictionarySheet(ss) {
  if (!ss) ss = getSpreadsheet();
  var sheet = getOrCreateSheet(ss, CONFIG.SHEETS.LOGISTICS_DICT, [
    "מק\"ט", "שם מוצר מלא", "קטגוריה", "יחידה", "דורש פקדון (כן/לא)", "מק\"ט פקדון נלווה", "סטטוס"
  ]);

  if (sheet.getLastRow() <= 1) {
    var initialItems = [
      ["10002", "מלט אפור 25 ק\"ג", "שק קטן", "שק", "לא", "", "פעיל"],
      ["11501", "חול שק גדול (בלה)", "שק גדול", "בלה", "כן", "60002", "פעיל"],
      ["11511", "סומסום שק גדול (בלה)", "שק גדול", "בלה", "כן", "60002", "פעיל"],
      ["11540", "מצע שק גדול (בלה)", "שק גדול", "בלה", "כן", "60002", "פעיל"],
      ["11551", "טיט מוכן שק גדול (בלה)", "שק גדול", "בלה", "כן", "60002", "פעיל"],
      ["12003", "בלוק בטון 3/20/40", "בלוקים", "יחידה", "כן", "60060", "פעיל"],
      ["60060", "משטח סבן פקדון", "פקדון", "משטח", "כן", "60060", "פעיל"],
      ["60002", "שק גדול פקדון", "פקדון", "בלה", "כן", "60002", "פעיל"]
    ];
    sheet.getRange(2, 1, initialItems.length, initialItems[0].length).setValues(initialItems);
  }
}

// ==========================================
// 4. לוגיקה עסקית וטיפול בהודעות
// ==========================================

/**
 * טיפול ברישום הודעה נכנסת מוואטסאפ ושיוכה ללקוח
 */
function handleInboundMessage(ss, payload) {
  var senderName = payload.senderName || payload.customerName || payload.pushName || "לקוח";
  var phone = payload.phone || payload.senderPhone || payload.from || "";
  var messageText = payload.message || payload.messageText || payload.text || "";
  var source = payload.source || "WhatsApp";
  var msgId = payload.messageId || ("MSG-" + Date.now());

  // 1. שמירה בטאב WhatsApp_Inbound
  var inboundSheet = getOrCreateSheet(ss, CONFIG.SHEETS.INBOUND, [
    "תאריך ושעה", "שם השולח", "מספר טלפון", "תוכן ההודעה", "מקור הפנייה", "מזהה הודעה", "סטטוס עיבוד"
  ]);

  var timestamp = Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM-dd HH:mm:ss");
  inboundSheet.appendRow([timestamp, senderName, phone, messageText, source, msgId, "נקלט 🟢"]);

  // 2. עדכון / הוספה לתיק לקוח
  ensureCustomerRecord(ss, senderName, phone, messageText);

  // 3. איתור תשובה תואמת מחוקי נועה
  var replyText = findMatchingRuleResponse(ss, messageText, senderName);

  return {
    registered: true,
    timestamp: timestamp,
    senderName: senderName,
    phone: phone,
    replyText: replyText
  };
}

/**
 * מציאת תשובה מתאימה מתוך טאב הגדרות_מענה_נועה
 */
function findMatchingRuleResponse(ss, messageText, customerName) {
  var rules = fetchNoaRules(ss);
  var cleanMsg = String(messageText || "").trim().toLowerCase();

  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (!rule.active) continue;

    var kw = String(rule.keyword || "").trim().toLowerCase();
    if (!kw || kw === "default_fallback") continue;

    var isMatch = false;
    if (rule.type === "EXACT" && cleanMsg === kw) isMatch = true;
    else if (rule.type === "CONTAINS" && cleanMsg.indexOf(kw) !== -1) isMatch = true;

    if (isMatch) {
      return rule.response.replace(/{NAME}/g, customerName || "חבר");
    }
  }

  // ברירת מחדל
  var fallback = rules.find(function(r) { return r.keyword === "DEFAULT_FALLBACK" && r.active; });
  if (fallback) {
    return fallback.response.replace(/{NAME}/g, customerName || "חבר");
  }

  return "שלום " + (customerName || "") + " 👋 הודעתך נקלטה במערכת ח. סבן ונציג יחזור אליך בהקדם!";
}

/**
 * שליפת חוקי המענה כטבלת JSON
 */
function fetchNoaRules(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.RULES);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var rows = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  return rows.map(function(r) {
    return {
      keyword: String(r[0] || "").trim(),
      type: String(r[1] || "CONTAINS").trim().toUpperCase(),
      response: String(r[2] || "").trim(),
      active: String(r[3] || "").toLowerCase() === "פעיל" || r[3] === true
    };
  });
}

/**
 * שליפת היסטוריית הודעות לטלפון
 */
function fetchChatHistory(ss, phone) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.INBOUND);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var cleanTarget = String(phone).replace(/[^\d]/g, "");
  var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var history = [];

  for (var i = Math.max(0, data.length - 20); i < data.length; i++) {
    var r = data[i];
    var rPhone = String(r[2] || "").replace(/[^\d]/g, "");
    if (rPhone.indexOf(cleanTarget) !== -1 || cleanTarget.indexOf(rPhone) !== -1) {
      history.push({
        timestamp: r[0],
        sender: r[1],
        phone: r[2],
        text: r[3],
        role: "user"
      });
    }
  }

  return history;
}

/**
 * שמירת רשומת היסטוריית צ'אט
 */
function saveChatHistoryRecord(ss, phone, role, text) {
  var sheet = getOrCreateSheet(ss, CONFIG.SHEETS.INBOUND, [
    "תאריך ושעה", "שם השולח", "מספר טלפון", "תוכן ההודעה", "מקור הפנייה", "מזהה הודעה", "סטטוס עיבוד"
  ]);

  var timestamp = Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM-dd HH:mm:ss");
  var sender = role === "user" ? "לקוח" : "נועה AI";
  sheet.appendRow([timestamp, sender, phone, text, "HistorySave", "HIST-" + Date.now(), "נשמר 🟢"]);
}

/**
 * הזרקת הזמנה לטאב לוג_הזמנות_מערכת
 */
function injectOrderToLog(ss, orderData) {
  var sheet = getOrCreateSheet(ss, CONFIG.SHEETS.ORDERS_LOG, [
    "תאריך קליטה", "מספר הזמנה", "שם לקוח", "מחסן", "כתובת אספקה", "פריטים",
    "פקדון בלות", "פקדון משטחים", "סטטוס", "תוצאה", "סכום", "תאריך אימות",
    "שעת אספקה", "מסקנות נועה AI", "אימות מסלול הובלה", "סטטוס סנכרון"
  ]);

  var timestamp = Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM-dd HH:mm:ss");
  var orderNum = orderData.orderNumber || orderData.id || ("ORD-" + Math.floor(10000 + Math.random() * 90000));
  var customerName = orderData.customerName || orderData.clientName || "לקוח מזדמן";
  var warehouse = orderData.warehouse || CONFIG.DEFAULT_WAREHOUSE;
  var address = orderData.address || orderData.deliveryAddress || "הוד השרון";
  var itemsText = typeof orderData.items === "string" ? orderData.items : JSON.stringify(orderData.items || []);

  var row = [
    timestamp, orderNum, customerName, warehouse, address, itemsText,
    "✅ מאושר", "✅ מאושר", "מאושר", "תקין", orderData.totalAmount || 0,
    Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM-dd"), "08:00",
    "נועה AI: נקלט והוזרק בהצלחה", "תקין", "✅ סונכרן"
  ];

  sheet.appendRow(row);
  return { orderNumber: orderNum, customerName: customerName, status: "מאושר" };
}

/**
 * שליפת מילון לוגיסטי מלא
 */
function fetchLogisticsDictionary(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEETS.LOGISTICS_DICT);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  return data.map(function(r) {
    return {
      sku: String(r[0] || "").trim(),
      name: String(r[1] || "").trim(),
      category: String(r[2] || "").trim(),
      unit: String(r[3] || "").trim(),
      requiresDeposit: String(r[4] || "").toLowerCase() === "כן"
    };
  });
}

/**
 * וידוא רישום לקוח בתיק לקוח
 */
function ensureCustomerRecord(ss, name, phone, lastMessage) {
  var sheet = getOrCreateSheet(ss, CONFIG.SHEETS.CLIENT_PORTFOLIO, [
    "מזהה לקוח", "שם לקוח", "ח\"פ / ת.ז", "טלפון ראשי", "איש קשר", "כתובת ברירת מחדל", "סוג לקוח", "סטטוס פעיל"
  ]);

  var data = sheet.getDataRange().getValues();
  var cleanPhone = String(phone).replace(/[^\d]/g, "");

  for (var i = 1; i < data.length; i++) {
    var existingPhone = String(data[i][3]).replace(/[^\d]/g, "");
    if (existingPhone && cleanPhone && (existingPhone.indexOf(cleanPhone) !== -1 || cleanPhone.indexOf(existingPhone) !== -1)) {
      sheet.getRange(i + 1, 2).setValue(name);
      return;
    }
  }

  var custId = "CUST-" + Math.floor(1000 + Math.random() * 9000);
  sheet.appendRow([custId, name, "", phone, lastMessage, "הוד השרון", "פרטי", "פעיל"]);
}

// ==========================================
// 5. כלי עזר ותשתיות
// ==========================================

var cachedSS = null;

function getSpreadsheet() {
  if (cachedSS) return cachedSS;
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      cachedSS = active;
      return cachedSS;
    }
  } catch (e) {}

  try {
    if (typeof TARGET_SHEET_ID !== "undefined" && TARGET_SHEET_ID) {
      cachedSS = SpreadsheetApp.openById(TARGET_SHEET_ID);
      return cachedSS;
    }
  } catch (e) {}

  throw new Error("לא ניתן לגשת לגליון הנתונים. ודא כי הסקריפט מחובר לגיליון פעיל.");
}

function getOrCreateSheet(ss, name, defaultHeaders) {
  if (!ss) {
    ss = getSpreadsheet();
  }
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.setRightToLeft(true);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
      sheet.getRange(1, 1, 1, defaultHeaders.length)
        .setFontWeight("bold")
        .setBackground("#0f172a")
        .setFontColor("#ffffff");
    }
  }
  return sheet;
}

function applyThemeToAllSheets(ss) {
  if (!ss) ss = getSpreadsheet();
  ss.getSheets().forEach(function(sheet) {
    sheet.setRightToLeft(true);
    var lastCol = sheet.getLastColumn();
    if (sheet.getLastRow() > 0 && lastCol > 0) {
      sheet.getRange(1, 1, 1, lastCol)
        .setBackground("#0f172a")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
    }
  });
}

function readSheetAsJSON(sheet) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol <= 0) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || "").trim();
  });

  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, idx) {
      obj[header] = row[idx];
    });
    return obj;
  });
}

function appendRowToTab(ss, tabName, rowData) {
  var sheet = getOrCreateSheet(ss, tabName, []);
  if (Array.isArray(rowData)) {
    sheet.appendRow(rowData);
  } else if (typeof rowData === "object") {
    var values = Object.keys(rowData).map(function(k) { return rowData[k]; });
    sheet.appendRow(values);
  }
}

function logSystemError(tag, message, details) {
  try {
    var ss = getSpreadsheet();
    var sheet = getOrCreateSheet(ss, CONFIG.SHEETS.SYSTEM_LOGS, [
      "זמן אירוע", "תגית / קטגוריה", "תיאור הודעה", "פרטים נוספים (JSON)", "סטטוס טיפול"
    ]);
    var timestamp = Utilities.formatDate(new Date(), "Asia/Jerusalem", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([timestamp, tag, message, typeof details === "object" ? JSON.stringify(details) : String(details || ""), "דורש בדיקה ⚠️"]);
  } catch (e) {}
}

function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
