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
  DEFAULT_WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbz-pahAwjWD1d406RMp6Y0jnlOoiK8kEaJHOXXOGQEg-NADTWddK2IWKXAdqZZsXrIpOw/exec",
  
  SYSTEM_INSTRUCTIONS: `אתה 'נועה AI' - מנהלת התפעול והלוגיסטיקה הווירטואלית של 'ח. סבן חומרי בניין 1994 בע"מ'.
תפקידך לספק מענה מהיר, מדויק ומקצועי ללקוחות, קבלנים ונהגים בוואטסאפ.

חוקי ברזל למענה:
1. חוק הפרופורציונליות (Proportionality Rule): התאם את אורך התגובה בדיוק לאורך הודעת הלקוח! אם הלקוח שולח ברכה פשוטה ("היי", "שלום", "אהלן", "בוקר טוב"), השב בברכה אנושית, קצרה וחמה בלבד (משפט 1 או 2 max). אל תפרט היסטוריית הזמנות, אל תציג סיכומי עבר ואל תשלח תבניות ארוכות אלא אם הלקוח ביקש זאת במפורש.
2. טון דיבור אנושי וקולגיאלי (Conversational Tone): דבר כמו קולגה חדה, יציבה ועוזרת בצוות 'ח. סבן'. הימנע מניסוחים רובוטיים, תבניות קשיחות, חתימות אוטומטיות נפוחות, או טקסטים גנריים של בוט.
3. פשטות ובהירות (Simplicity): שמור על תשובות נקיות, קצרות (1-2 משפטים לפנייה ראשונית/פשוטה), בעברית יומיומית, פשוטה וטבעית.
4. זיהוי הזמנות ומילון לוגיסטי: כאשר מזהים פנייה המכילה ציוד בניין, מחומרי מליטה, בלוקים, גבס או מנוף - יש לאמת את המניפסט מול המילון הלוגיסטי (מק"טים ופקדונות) ולספק סיכום ברור עם מחירים משוערים.`
};

const SABAN_MASTER_INVENTORY = [
  { sku: "10002", name: "מלט אפור", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "15770", name: "טיח ממ\"ד", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "11526", name: "פינת טיח ישראלי 3.00 מטר", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "18050", name: "הובלת מנוף הוד השרון", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "1152", name: "סיד בור חבית", requiresDeposit: true, depositSku: "60004", depositName: "חבית פקדון (₪100)", category: "חומרי מליטה", unit: "חבית" },
  { sku: "30509", name: "שליכט שק גדול", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (₪30)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11500", name: "חול שק", requiresDeposit: false, category: "חול וסומסום", unit: "שק" },
  { sku: "11501", name: "חול שק גדול", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (₪30)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11505", name: "חצץ שק", requiresDeposit: false, category: "חול וסומסום", unit: "שק" },
  { sku: "11506", name: "חצץ שק גדול", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (₪30)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11507", name: "חצץ ניקוז 7/8 שק גדול", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (₪30)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11510", name: "סומסום שק", requiresDeposit: false, category: "חול וסומסום", unit: "שק" },
  { sku: "11511", name: "סומסום שק גדול", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (₪30)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11515", name: "מחצבה שק", requiresDeposit: false, category: "חול וסומסום", unit: "שק" },
  { sku: "11520", name: "שליכט חול שק", requiresDeposit: false, category: "חול וסומסום", unit: "שק" },
  { sku: "11540", name: "מצע שק גדול", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (₪30)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11550", name: "טיט מוכן שק", requiresDeposit: false, category: "חול וסומסום", unit: "שק" },
  { sku: "11551", name: "טיט מוכן שק גדול", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (₪30)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11570", name: "חמרה שק גדול", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (₪30)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11601", name: "חול גנים שק גדול כולל פקדון", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (כלול במחיר)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11600", name: "חול - שק גדול כולל פקדון", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (כלול במחיר)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11605", name: "טיט - שק גדול כולל פקדון", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (כלול במחיר)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "11615", name: "סומסום - שק גדול כולל פקדון", requiresDeposit: true, depositSku: "60002", depositName: "שק גדול פקדון (כלול במחיר)", category: "חול וסומסום", unit: "שק גדול" },
  { sku: "12003", name: "בלוק בטון 3/20/40 (פלטה)", requiresDeposit: true, depositSku: "60006", depositName: "משטח בלוקים פקדון (₪50)", category: "בלוקים", unit: "משטח" },
  { sku: "12004", name: "בלוק בטון 4/20/40 (פלטה)", requiresDeposit: true, depositSku: "60006", depositName: "משטח בלוקים פקדון (₪50)", category: "בלוקים", unit: "משטח" },
  { sku: "12007", name: "בלוק בטון 7/20/40", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12010", name: "בלוק בטון 10/20/40", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12018", name: "בלוק קוביה 20 []", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12021", name: "בלוק ופלה 20/10/40", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12022", name: "בלוק ופלה 10/10/40", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12154", name: "בלוק בטון 15/20/40 4 חורים", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12202", name: "בלוק בטון 20/20/40 2 חורים", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12204", name: "בלוק בטון 20/20/40 4 חורים", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12205", name: "בלוק תרמי 20/20/40 5 חורים", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12215", name: "בלוק שוקת 20/20/40", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12225", name: "בלוק תרמי 22/20/40 5 חורים", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "12913", name: "פריקת מנוף גדול (בלוקים)", requiresDeposit: false, category: "הובלות ומנוף", unit: "פריקה" },
  { sku: "13225", name: "בלוק תרמי 22/20/40 5 חורים", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "18209", name: "הובלת משאית מנוף 09", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "18408", name: "גישה לאתר+עבודת מנוף 15 מטר", requiresDeposit: false, category: "הובלות ומנוף", unit: "עבודה" },
  { sku: "60006", name: "משטח בלוקים פקדון", requiresDeposit: true, isDepositItem: true, depositPrice: 50, category: "פקדונות", unit: "משטח" },
  { sku: "60060", name: "משטח סבן פקדון", requiresDeposit: true, isDepositItem: true, depositPrice: 40, category: "פקדונות", unit: "משטח" },
  { sku: "60002", name: "שק גדול פקדון", requiresDeposit: true, isDepositItem: true, depositPrice: 30, category: "פקדונות", unit: "יחידה" },
  { sku: "60004", name: "חבית פקדון", requiresDeposit: true, isDepositItem: true, depositPrice: 100, category: "פקדונות", unit: "חבית" },
  { sku: "9383489", name: "פומיס בניה 20-25 קוב **", requiresDeposit: false, category: "בלוקים", unit: "קוב" },
  { sku: "9882334", name: "פומיס בניה 10-15 קוב **", requiresDeposit: false, category: "בלוקים", unit: "קוב" },
  { sku: "122102040", name: "פומיס בניה 10/20/40", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "122152040", name: "פומיס בניה 15/20/40", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "122202050", name: "פומיס בניה 20/20/50", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "122222040", name: "פומיס בניה 22/20/40", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "122222050", name: "פומיס בניה 22/20/50", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "122252050", name: "פומיס בניה 25/20/50", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "10015", name: "בטון מהיר מוכן 25 ק\"ג", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "14202", name: "גבס 2.5 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14233", name: "מלט לבן 2.5 ק\"ג", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "14245", name: "מלט אפור 2.5 ק\"ג", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "14800", name: "רובה לבן 1 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "15010", name: "טיח בריכות גלקסי 10 25 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "15020", name: "הרבצה גלקסי 20 כרמית 25 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "15023", name: "בונד 200 גלון 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "גלון" },
  { sku: "15101", name: "דבק אפוקסי 101 1.6 ק\"ג א+ב", requiresDeposit: false, category: "דבקים ואיטום", unit: "יחידה" },
  { sku: "15109", name: "דבק 109 25 ק\"ג כרמית", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "15116", name: "דבק 116 לבן 25 ק\"ג כרמית", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "15132", name: "דבק 132 לבן 25 ק\"ג כרמית", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "15181", name: "ריצופית אפור 181 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "15182", name: "ריצופית לבן 181 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "15420", name: "שפריץ מוכן 420 25 ק\"ג כרמית", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "15620", name: "מלט מהיר 620 2.5 ק\"ג", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "15634", name: "שפכטל חוץ/פנים 634 25 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "15710", name: "טיח חוץ 710 שק 25 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "15720", name: "הרבצה 720 25 ק\"ג כרמית", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "15750", name: "טיח תרמי 750 16 ק\"ג כרמית", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "15760", name: "טיח תרמי 760 23 ק\"ג כרמית", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "15800", name: "טיח גבס 800 25 ק\"ג כרמית", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "18182", name: "הובלת משאית 02", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "24810", name: "בוטילי לבד 10 10 מ.א.", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "24816", name: "בוטילי לבד 20 10 מ.א.", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "24820", name: "בוטילי אלומ' 10 10 מ.א.", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "24823", name: "בוטילי אלומ' 15 10 מ.א.", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "24826", name: "בוטילי אלומ' 20 10 מ.א.", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "650056", name: "מברשת צבע 830 \"2", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "1512105", name: "פריימר לטיח גבס 121 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "גלון" },
  { sku: "1512120", name: "פריימר לטיח גבס 121 20 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "פח" },
  { sku: "9875540", name: "שפכטל חיצוני 2.5 ק\"ג 633", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "9877651", name: "פריימר P4 גלון 8 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "גלון" },
  { sku: "9877681", name: "ביטום פיקס K1 ביטומני פח", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9878111", name: "תוספת למשטח מחולק", requiresDeposit: false, category: "הובלות ומנוף", unit: "תוספת" },
  { sku: "9880230", name: "סופר פיניש 5 ק\"ג ARDEX", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "9882297", name: "צבע לבטון לבן 5 ק\"ג ARDEX", requiresDeposit: false, category: "צבע וגמר", unit: "פח" },
  { sku: "9882298", name: "צבע לבטון אפור בהיר 5 ק\"ג A", requiresDeposit: false, category: "צבע וגמר", unit: "פח" },
  { sku: "9882299", name: "צבע לבטון אפור כהה 5 ק\"ג AR", requiresDeposit: false, category: "צבע וגמר", unit: "פח" },
  { sku: "9882300", name: "צבע לבטון אדום 5 ק\"ג ARDEX", requiresDeposit: false, category: "צבע וגמר", unit: "פח" },
  { sku: "14004", name: "פריימר SAKRET 004 דלי 12 ק\"", requiresDeposit: false, category: "דבקים ואיטום", unit: "דלי" },
  { sku: "14005", name: "פריימר SAKRET 005 דלי 5 ליט", requiresDeposit: false, category: "דבקים ואיטום", unit: "דלי" },
  { sku: "14007", name: "פריימר SAKRET 007 שק 20 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "14008", name: "פריימר 008 15 ק\"ג תרמוקיר", requiresDeposit: false, category: "דבקים ואיטום", unit: "פח" },
  { sku: "14100", name: "הרבצה PL100S תרמוקיר 25 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14102", name: "טיח חוץ 25 ק\"ג PL102", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14104", name: "טיח בריכות PL102Sי 25 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14122", name: "טיח מגן 40 ק\"ג PL122", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14123", name: "טיח ג'ל PL123 תרמוקיר 25 ק\"", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14130", name: "טיח ממ\"ד רב תכליתי 40 ק\"ג P", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14175", name: "תרמוסטפ AC420 י 20 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14185", name: "שליכט בגר חוץ/פנים 25 ק\"גPL", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14400", name: "טיח תרמי 400 23 ק\"ג תרמוקיר", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14500", name: "פלסטומר AD500 שק 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "14601", name: "פלסטומר AD601 שק 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "14603", name: "פלסטומר AD603 אפור 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "14604", name: "פלסטומר AD603 לבן 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "14700", name: "פלסטומר AD700 שק 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "14980", name: "אלסטוסיל לבן 25 ק\"ג SE980", requiresDeposit: false, category: "איטום ובידוד", unit: "שק" },
  { sku: "18060", name: "הובלת מנוף הרצליה - רמה\"ש", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "9870531", name: "פינת איטום SAKRET SE947י 10", requiresDeposit: false, category: "איטום ובידוד", unit: "יחידה" },
  { sku: "9870875", name: "סיליקון שקוף SE963 תרמיל", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "9882500", name: "טיח ממ\"ד רב תכליתי 25 ק\"ג P", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14920001", name: "כוחלה 001 שמנת 25 ק\"ג תרמוק", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "10155", name: "ווטרפלאג 25 ק\"ג THORO", requiresDeposit: false, category: "איטום ובידוד", unit: "שק" },
  { sku: "14890", name: "רובה SIKA TG ירוק 1181 5 ק\"", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "15665", name: "סיקה POOL אפור תרמיל SIKA", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15666", name: "סיקה POOL לבן תרמיל SIKA", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15680", name: "סיקפלקס FC11 לבן תרמיל SIKA", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15681", name: "סיקפלקס FC11 אפור תרמיל SIK", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15682", name: "סיקפלקס FC11 שחור תרמיל SIK", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15683", name: "סיקפלקס FC11 חום תרמיל SIKA", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15684", name: "סיקפלקס FC11 קרם תרמיל SIKA", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15685", name: "סיקפלקס FC11 לבן שרוול SIKA", requiresDeposit: false, category: "דבקים ואיטום", unit: "שרוול" },
  { sku: "15686", name: "סיקפלקס FC11 אפור שרוול SIK", requiresDeposit: false, category: "דבקים ואיטום", unit: "שרוול" },
  { sku: "15687", name: "סיקפלקס FC11 שחור שרוול SIK", requiresDeposit: false, category: "דבקים ואיטום", unit: "שרוול" },
  { sku: "15688", name: "סיקפלקס FC11 אוף ואייט שרוו", requiresDeposit: false, category: "דבקים ואיטום", unit: "שרוול" },
  { sku: "15689", name: "סיקה פלקס שקוף קריסטל 112 M", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15696", name: "סיקה 107 לבן 20 ק\"ג ללא תוס", requiresDeposit: false, category: "איטום ובידוד", unit: "שק" },
  { sku: "15698", name: "סיקה 107 נוזל בלבד 5 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "15699", name: "מולטיסיל 10 ס\"מ SIKAי 10מ.א", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "15706", name: "סיקה PRO3 אפור שרוול ML600", requiresDeposit: false, category: "דבקים ואיטום", unit: "שרוול" },
  { sku: "15708", name: "אנקור פיקס 1 תרמיל SIKA", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15709", name: "פריימר לסיקפלקס 1/2 ליטר 3N", requiresDeposit: false, category: "דבקים ואיטום", unit: "בקבוק" },
  { sku: "15711", name: "פריימר לסיקפלקס 1 ליטר 3N", requiresDeposit: false, category: "דבקים ואיטום", unit: "בקבוק" },
  { sku: "15714", name: "מולטיסיל 15 ס\"מ SIKAי 10מ.א", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "15715", name: "ווטרפלאג SIKAי 2 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "15719", name: "ווטרפלאג SIKAי 1 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "15721", name: "ווטרפלאג SIKAי 5 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "15722", name: "ווטרפלאג SIKAי 20 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "15753", name: "סיקה 4A מזרז 5 ליטר", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "15757", name: "סיקה SLT לטקס 18 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "פח" },
  { sku: "15759", name: "סיקה לטקס סופר 5 ליטר", requiresDeposit: false, category: "דבקים ואיטום", unit: "גלון" },
  { sku: "15761", name: "סיקה לטקס סופר 18 ליטר", requiresDeposit: false, category: "דבקים ואיטום", unit: "פח" },
  { sku: "15772", name: "סיקה טופ 107 E י 20+10 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "ערכה" },
  { sku: "15775", name: "סיקה ראפ 25 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "שק" },
  { sku: "15792", name: "סיקה ראפ פאוור 25 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "שק" },
  { sku: "15805", name: "סיקה לסטיק K1י 17 ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "15930", name: "סיליקון ניטראלי שקוף תרמיל", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15931", name: "סיליקון ניטראלי לבן תרמיל S", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15932", name: "סיליקון ניטראלי קרם תרמיל S", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15933", name: "סיליקון ניטראלי אפור תרמיל", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "15934", name: "סיליקון ניטראלי שחור תרמיל", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "19001", name: "סיקה 1 18 ליטר", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "19050", name: "טיח בריכות קריט SIKAי 25 ק\"", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "19056", name: "סיקה דור 56 א+ב 6 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "ערכה" },
  { sku: "19100", name: "רובה אפוקסי SIKA 100י 5 ק\"", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19103", name: "רובה אפוקסי SIKA 103י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19107", name: "סיקה 107 אפור+תוסף 25 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "ערכה" },
  { sku: "19108", name: "סיקה 107 לבן+תוסף 25 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "ערכה" },
  { sku: "19120", name: "רובה אפוקסי SIKA 120י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19121", name: "רובה אפוקסי SIKA 121י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19122", name: "רובה אפוקסי SIKA 122י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19123", name: "רובה אפוקסי SIKA 123י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19135", name: "סרם 135 SIKAי 20 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19200", name: "מדה צמנט SIKAי 25 ק\"ג", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "19214", name: "גראוט 214 25 ק\"ג SIKA", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "19215", name: "פריימר לסיקפלקס 215 1 ליטר", requiresDeposit: false, category: "דבקים ואיטום", unit: "בקבוק" },
  { sku: "19224", name: "סיקה סילוקסן 224 18 ליטר", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "19235", name: "סרם 235 SIKAי 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19255", name: "סרם 255 SIKAי 25 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19260", name: "לסטיק 260 SIKAי 7 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "19340", name: "גראוט הנדסי 340/800 SIKAי 2", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "19412", name: "מונוטופ SIKA ECO 412י 25 ק\"", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "19500", name: "סרם 500 SIKAי 20 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19612", name: "סיקלסטיק 612י 21.3ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9882622", name: "גרד 914W גלון 10 ליטר SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "24831", name: "בוטילי ביטומן 10 10 מ.א.SI", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "24834", name: "בוטילי ביטומן 15 10 מ.א.SI", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "41231", name: "אקדח לשרוול SIKA", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "191100", name: "רובה SIKA 1100י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191110", name: "רובה SIKA 1110י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191111", name: "רובה SIKA 1111י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "19111", name: "סיקה לסטיק 110Sי 25 ק\"ג SIK", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "191112", name: "רובה SIKA 1112י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191113", name: "רובה SIKA 1113י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191114", name: "רובה SIKA 1114י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191120", name: "רובה SIKA 1120י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191130", name: "רובה SIKA 1130י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191131", name: "רובה SIKA 1131י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191132", name: "רובה SIKA 1132י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191142", name: "רובה SIKA 1142י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "191144", name: "רובה SIKA 1144י 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "192010", name: "עצר מים כימי SIKA 2010 י10", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "192507", name: "עצר מים כימי SIKA 2507 י10", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "194901", name: "סיקה לסטיק פריימר 490Tי 1 ק", requiresDeposit: false, category: "איטום ובידוד", unit: "בקבוק" },
  { sku: "194905", name: "סיקה לסטיק 490Tי 5 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "197001", name: "גרד SIKA 700H מט 1 ליטר", requiresDeposit: false, category: "איטום ובידוד", unit: "בקבוק" },
  { sku: "197005", name: "גרד SIKA 700Hי מט 5 ליטר", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "199255", name: "גרד SIKA 925Tי 5 ליטר", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "1901005", name: "סיקה טופ 10 5 ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "1903101", name: "מלט אפוקסי SIKA 31י 1.2 ק\"ג", requiresDeposit: false, category: "חומרי מליטה", unit: "ערכה" },
  { sku: "1903106", name: "מלט אפוקסי SIKA 31י 6 ק\"ג", requiresDeposit: false, category: "חומרי מליטה", unit: "ערכה" },
  { sku: "1910225", name: "איגולפלקס 102 SIKAי 25 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "1911008", name: "ארמטק 110 (א+ב+ג) 8 ק\"ג SIK", requiresDeposit: false, category: "איטום ובידוד", unit: "ערכה" },
  { sku: "1918015", name: "שפכטל ויסקו רפ וול 15 ק\"ג 1", requiresDeposit: false, category: "גבס וטיח", unit: "פח" },
  { sku: "1930110", name: "איגולפלקס 301 SIKAי 10 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "1932025", name: "גראוט 3200 25 ק\"ג SIKA", requiresDeposit: false, category: "חומרי מליטה", unit: "שק" },
  { sku: "1949020", name: "סיקה לסטיק 490Tי 20 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "1956005", name: "לסטיק 560 לבן 5 ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "1956006", name: "לסטיק 560 טרקוטה 5 ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "1956020", name: "לסטיק 560 לבן 20 ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "1961001", name: "מונוטופ SIKA 610י 1 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "שק" },
  { sku: "1962805", name: "סיקה לסטיק 629T גלון 5 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "1962820", name: "סיקה לסטיק 629T פח 20 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "1968001", name: "סיקה גרד 680Sי 1 ליטר SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "בקבוק" },
  { sku: "1968005", name: "סיקה גרד 680Sי 5 ליטר SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "1968030", name: "סיקה גרד 680Sי 30 ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "1970018", name: "גרד SIKA 700Hי מט 18 ליטר", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "1979001", name: "סילר 790 מט SIKAי 1 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "בקבוק" },
  { sku: "1979005", name: "סילר 790 מט SIKAי 5 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "גלון" },
  { sku: "1991002", name: "מונוטופ SIKA 910י 2 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "שק" },
  { sku: "1991005", name: "מונוטופ SIKA 910י 5 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "שק" },
  { sku: "9371302", name: "פיות לאנקור פיקס 5 יחידות S", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "חבילה" },
  { sku: "9381755", name: "סיקה קונסטרקשן בג' שרוול", requiresDeposit: false, category: "דבקים ואיטום", unit: "שרוול" },
  { sku: "9381756", name: "סיקה קונסטרקשן אפור שרוול", requiresDeposit: false, category: "דבקים ואיטום", unit: "שרוול" },
  { sku: "9381907", name: "סיקה קונסטרקשן לבן שרוול", requiresDeposit: false, category: "דבקים ואיטום", unit: "שרוול" },
  { sku: "9382364", name: "פריימר סיקהפלור 156 10 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9383292", name: "כדורי זכוכית לצבע 1 ק\"ג SIK", requiresDeposit: false, category: "צבע וגמר", unit: "שק" },
  { sku: "9383427", name: "סיל טייפ F ר'10 ס\"מ 25 מ.א.", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "9383722", name: "שפכטל מוכן 303 5 ק\"ג SIKA", requiresDeposit: false, category: "גבס וטיח", unit: "גלון" },
  { sku: "9383723", name: "שפכטל ויסקו רפ 5 ק\"ג SIKA", requiresDeposit: false, category: "גבס וטיח", unit: "גלון" },
  { sku: "9870929", name: "סיקה 118 EXTREME תרמיל", requiresDeposit: false, category: "דבקים ואיטום", unit: "תרמיל" },
  { sku: "9873090", name: "תוסף לרובה 2 ק\"ג SIKA", requiresDeposit: false, category: "דבקים ואיטום", unit: "בקבוק" },
  { sku: "9873316", name: "טינר SIKA C'י 3 ליטר", requiresDeposit: false, category: "צבע וגמר", unit: "גלון" },
  { sku: "9875058", name: "פיה לשרוול סיקפלקס", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "9876401", name: "סיקה סים FIBERS שקית 600 גר", requiresDeposit: false, category: "איטום ובידוד", unit: "שקית" },
  { sku: "9876808", name: "רשת פליס 120 לשריון 560 '50", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "9876982", name: "סיקלסטיק 612י 7.1 ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9880445", name: "סיקפלור 4400 אפור SIKAי 20", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9882364", name: "סיקלסטיק 640י 25 ק\"ג SIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9882515", name: "סיקה לסטיק 688Sי 25 ק\"ג SIK", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9882559", name: "אקטיבייטור 205 1 ק\"ג לSIKA", requiresDeposit: false, category: "איטום ובידוד", unit: "בקבוק" },
  { sku: "9882662", name: "סיקה ברפרן SIKAי 30 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9888927", name: "מאסטרסיל PB 5000R פח 22.5 ק", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "9888953", name: "שפכטל חוץ מוכן 340 25 ק\"ג S", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "71700", name: "סרט/רשת 5 לגבס 20 מ.א.", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71710", name: "סרט/רשת 5 לגבס 90 מ.א.", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71712", name: "סרט/רשת 15 לגבס 20 מ.א.", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71720", name: "סרט פינה משתנה 30 מ.א. ריין", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71723", name: "סרט פינה משתנה 30 מ.א. חוץ", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71727", name: "פינה 3768 לקשת 33/13.5 3 מ.", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "71730", name: "סרט נייר לגבס \"2 75 מטר", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71735", name: "סרט נייר לגבס \"2 150 מטר", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71755", name: "פינה קשיחה+נייר 3 מטר", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "71760", name: "פינה J+נייר 3 מטר אורבונד", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "71780", name: "פינה אפס אלומ' גרמני 3 מ.א.", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "71785", name: "חצי פינה אפס אלומ' גרמני 3", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "71793", name: "פיבה FIBAFUSEי 76 מ.א.", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71796", name: "פיבה FIBAFUSEי 100 45 מ\"ר", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "71799", name: "פיבה פיוז 76 מ.א.", requiresDeposit: false, category: "פרופילים ופינות", unit: "גליל" },
  { sku: "75090", name: "מסלול אומגה תקן 300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "75300", name: "ניצב אומגה תקן 300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "76010", name: "בידוד מינרלי 12 ק\"ג 24 מ\"ר", requiresDeposit: false, category: "איטום ובידוד", unit: "חבילה" },
  { sku: "76011", name: "בידוד מינרלי 12 ק\"ג 18.2 מ\"", requiresDeposit: false, category: "איטום ובידוד", unit: "חבילה" },
  { sku: "76012", name: "בידוד מינרלי 24 ק\"ג 12 מ\"ר", requiresDeposit: false, category: "איטום ובידוד", unit: "חבילה" },
  { sku: "76020", name: "בידוד מינרלי 12 ק\"ג אלומיני", requiresDeposit: false, category: "איטום ובידוד", unit: "חבילה" },
  { sku: "76071", name: "בידוד לבן חשוף 250 גר' 120", requiresDeposit: false, category: "איטום ובידוד", unit: "חבילה" },
  { sku: "76690", name: "תופסן סרט לבידוד 660 מ\"מ", requiresDeposit: false, category: "איטום ובידוד", unit: "יחידה" },
  { sku: "76705", name: "קומפריבנד 50 25 מ.א. פס איט", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "76799", name: "סנדל ייצוב למשקוף 2 מ\"מ", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "111000", name: "לוח גבס לבן מ\"ר **", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "111200", name: "לוח גבס לבן 200 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "111260", name: "לוח גבס לבן 260 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "111280", name: "לוח גבס לבן 280 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "111300", name: "לוח גבס לבן 300 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "112000", name: "לוח גבס ירוק/ורוד מ\"ר **", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "112200", name: "לוח גבס ירוק 200 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "112260", name: "לוח גבס ירוק 260 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "112280", name: "לוח גבס ירוק 280 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "112300", name: "לוח גבס ירוק 300 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "113200", name: "לוח גבס ורוד 200 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "113260", name: "לוח גבס ורוד 260 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "114000", name: "לוח גבס כחול מ\"ר **", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "114260", name: "לוח גבס כחול 260 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "115200", name: "לוח גבס 4K לבן 200 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "115260", name: "לוח גבס 4K לבן 260 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "116000", name: "לוח גבס 4K ירוק/ורוד מ\"ר **", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "116260", name: "לוח גבס 4K ירוק 260 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "117000", name: "לוח גבס פיאנו מ\"ר **", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "119260", name: "לוח גבס לבן 260 ע 9.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "120200", name: "לוח גבס סוג*ב*200", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "120260", name: "לוח גבס סוג*ב*260", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "122260", name: "צמנט בורד 260 ע 8 מ\"מ", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "722060", name: "צ.סלעים \"2 עטוף 60 ק\"ג 120/", requiresDeposit: false, category: "איטום ובידוד", unit: "חבילה" },
  { sku: "722080", name: "צ.סלעים \"2 עטוף 80 ק\"ג 120/", requiresDeposit: false, category: "איטום ובידוד", unit: "חבילה" },
  { sku: "8510300", name: "מסלול 0.5 100/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "8528300", name: "מסלול 0.5 28/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "8537300", name: "מסלול 0.5 37/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "8550300", name: "מסלול 0.5 50/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "8570300", name: "מסלול 0.5 70/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "8650300", name: "מסלול 0.6 50/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "8670300", name: "מסלול 0.6 70/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9510300", name: "ניצב 0.5 100/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9528300", name: "ניצב 0.5 28/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9537300", name: "ניצב 0.5 37/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9550260", name: "ניצב 0.5 50/260", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9550280", name: "ניצב 0.5 50/280", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9550300", name: "ניצב 0.5 50/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9570260", name: "ניצב 0.5 70/260", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9570280", name: "ניצב 0.5 70/280", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9570300", name: "ניצב 0.5 70/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9650300", name: "ניצב 0.6 50/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9670300", name: "ניצב 0.6 70/300", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9870937", name: "לוח גבס סילבר בורד מ\"ר **", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "9872686", name: "לוח דנסגלאס 2.4/1.2 ע 12.7", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "9873023", name: "לוח גבס סוג ב מ\"ר **", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "9873231", name: "לוח גבס פיאנו 260 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "9876009", name: "שפכטל CLEANEO להסרת שפכטל", requiresDeposit: false, category: "גבס וטיח", unit: "קופסה" },
  { sku: "9876084", name: "מחבר אורך לפרופיל C60 חב' 1", requiresDeposit: false, category: "פרופילים ופינות", unit: "חבילה" },
  { sku: "9876085", name: "מחבר כפול לפרופיל C60 חב' 1", requiresDeposit: false, category: "פרופילים ופינות", unit: "חבילה" },
  { sku: "9876371", name: "לוח גבס ורוד 280 ע 15.90", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "9876797", name: "ניצב F47 אורך 3 מטר", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9876798", name: "מסלול F47 אורך 3 מטר", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "9877475", name: "לוח גבס סטרונג לבן 16 מ\"מ מ", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "9877476", name: "לוח גבס סטרונג ירוק 16 מ\"מ", requiresDeposit: false, category: "לוחות וגבס", unit: "מ\"ר" },
  { sku: "9879230", name: "תקרה אקוסטית פסיפיק 60/60", requiresDeposit: false, category: "לוחות וגבס", unit: "חבילה" },
  { sku: "9888918", name: "פתח שרות 60/120 קלסאיק OPEN", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "731020020", name: "פתח שרות 20 ORBOND", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "731030030", name: "פתח שרות 30 ORBOND", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "731040040", name: "פתח שרות 40 ORBOND", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "731050050", name: "פתח שרות 50 ORBOND", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "731060040", name: "פתח שרות 60/40 ORBOND", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "731060060", name: "פתח שרות 60 ORBOND", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "732060060", name: "פתח שרות 60 RUGSEMIN", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "732080080", name: "פתח שרות 80 RUGSEMIN", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "735040040", name: "פתח שרות 40 בייסיק OPEN ART", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "735050050", name: "פתח שרות 50 בייסיק OPEN ART", requiresDeposit: false, category: "לוחות וגבס", unit: "יחידה" },
  { sku: "18097", name: "הובלת מנוף (אלעד)", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "31014", name: "פינת טיח 1014 גרמני 3 מטר", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "30549", name: "מייק 10 מ\"מ 3.00 מ.א", requiresDeposit: false, category: "פרופילים ופינות", unit: "יחידה" },
  { sku: "24280", name: "רשת טיח לממ\"ד לבן 2.8 מ\"מ 45 מ.א", requiresDeposit: false, category: "גבס וטיח", unit: "גליל" },
  { sku: "729020", name: "מסמרי פלדה 50X3 ד.קישוט", requiresDeposit: false, category: "ברגים ומסמרים", unit: "קופסה" },
  { sku: "1610300", name: "ברזל בניין 10 מ\"מ 3 מ.א", requiresDeposit: false, category: "ברזל ורשתות", unit: "מוט" },
  { sku: "58044", name: "דלי עבודה שחור 10 ליטר", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "24112", name: "ניילון ממוחזר 200 גליל", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "58102", name: "שקית פסולת יוטה 25 יח'", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "חבילה" },
  { sku: "24250", name: "רשת טיח 20 50 מ.א.", requiresDeposit: false, category: "גבס וטיח", unit: "גליל" },
  { sku: "9870421", name: "מברשת רובי \"4", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "18095", name: "הובלת מנוף ראש העין-פ\"ת", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "1608320", name: "רשת ברזל 8.0 20#20 3X2.5", requiresDeposit: false, category: "ברזל ורשתות", unit: "יחידה" },
  { sku: "818050", name: "הובלה ללא פריקה הוד השרון", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "818095", name: "הובלה ללא פריקה ראש העין-פ\"ת", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "818080", name: "הובלה ללא פריקה ק.אונו-סביון", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "818078", name: "הובלה ללא פריקה בני ברק -ג.שמואל", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "818075", name: "הובלה ללא פריקה רמת גן-גבעתיים", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "818070", name: "הובלה ללא פריקה תל אביב מרכז", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "818065", name: "הובלה ללא פריקה תל אביב צפון", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "818060", name: "הובלה ללא פריקה הרצליה-רמה\"ש", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "818055", name: "הובלה ללא פריקה כ\"ס-רעננה", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "24608", name: "יריעה APP י4 לבן 10 מ\"ר", requiresDeposit: false, category: "איטום ובידוד", unit: "גליל" },
  { sku: "24650", name: "פריימר ליריעות 474GS פח 15 ק\"ג", requiresDeposit: false, category: "איטום ובידוד", unit: "פח" },
  { sku: "24050", name: "גליל קרטון לריצוף 50 מ\"ר", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "גליל" },
  { sku: "53009", name: "סופרקריל לבן 18 ליטר", requiresDeposit: false, category: "צבע וגמר", unit: "פח" },
  { sku: "650286", name: "רולר פס צהוב פרלון \"9", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "640012", name: "דיסק ברזל 1.6X4.5 גמל", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "18109", name: "הובלת מנוף (צ.שרון,כ.יונה)", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "41909", name: "שומר מרחק נדל 25 100 מ.א.", requiresDeposit: false, category: "ברזל ורשתות", unit: "יחידה" },
  { sku: "18055", name: "הובלת מנוף כפר סבא-רעננה", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "114200", name: "לוח גבס כחול 200 ע 12.50", requiresDeposit: false, category: "לוחות וגבס", unit: "לוח" },
  { sku: "15090", name: "רוקבונד 28 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "57076", name: "פרופילה 5 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "140075", name: "טיח גבס 75MP שק 25 ק\"ג", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "9882409", name: "רשת ברזל ג' חם 4.2 10#10 2.1X2.9", requiresDeposit: false, category: "ברזל ורשתות", unit: "יחידה" },
  { sku: "4910200", name: "H10 וולקן מ.א.", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "18075", name: "הובלת מנוף רמת גן-גבעתיים", requiresDeposit: false, category: "הובלות ומנוף", unit: "הובלה" },
  { sku: "90018900", name: "סולר - ליטר", requiresDeposit: false, category: "דלקים", unit: "ליטר" },
  { sku: "70070446", name: "מגורי עובדים זרים", requiresDeposit: false, category: "כללי", unit: "יחידה" },
  { sku: "65908122", name: "אזיקונים לבן 9/812", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "חבילה" },
  { sku: "65908121", name: "אזיקונים שחור 9/812", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "חבילה" },
  { sku: "65805502", name: "אזיקונים לבן 8/550", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "חבילה" },
  { sku: "65805501", name: "אזיקונים שחור 8/550", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "חבילה" },
  { sku: "65127400", name: "כוס יהלום 127 400\"1.1/4", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "65067400", name: "כוס יהלום 67 400\"1.1/4", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "64067400", name: "כוס יהלום 67 400\"1/2", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "64000105", name: "כוס יהלום וואקום 105 מ\"מ למשחזת", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "64000065", name: "כוס יהלום וואקום 65 מ\"מ למשחזת", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "47073050", name: "בלוק לבן/קל 7/30/50", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "47053050", name: "בלוק לבן/קל 5/30/50", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "47202560", name: "בלוק לבן/קל 20/25/60", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "47052560", name: "בלוק לבן/קל 5/25/60", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "47105060", name: "בלוק לבן/קל 10/50/60", requiresDeposit: false, category: "בלוקים", unit: "יחידה" },
  { sku: "45100703", name: "פלס 100 VOLA", requiresDeposit: false, category: "ציוד וכלי עבודה", unit: "יחידה" },
  { sku: "22080300", name: "בורג 8X300 TORX", requiresDeposit: false, category: "ברגים ומסמרים", unit: "קופסה" },
  { sku: "22080100", name: "בורג 8X100 TORX", requiresDeposit: false, category: "ברגים ומסמרים", unit: "קופסה" },
  { sku: "21060200", name: "סיבית זהב 6X200", requiresDeposit: false, category: "ברגים ומסמרים", unit: "קופסה" },
  { sku: "21060100", name: "סיבית זהב 6X100", requiresDeposit: false, category: "ברגים ומסמרים", unit: "קופסה" },
  { sku: "14920050", name: "כוחלה 050 קרם 25 ק\"ג תרמוקיר", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14920023", name: "כוחלה 023 אפור בהיר 25 ק\"ג תרמוקיר", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14920011", name: "כוחלה 011 אפור כהה 25 ק\"ג תרמוקיר", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14920010", name: "כוחלה 010 אפור בטון 25 ק\"ג תרמוקיר", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "14920000", name: "כוחלה 000 לבן 25 ק\"ג תרמוקיר", requiresDeposit: false, category: "גבס וטיח", unit: "שק" },
  { sku: "202120", name: "רובה CE40 ג 120 2 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "202100", name: "רובה CE40 ג 100 2 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "20100", name: "רובה CE40 ג 100 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "17180", name: "רובה 180 MAPEIי 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "17100", name: "רובה 100 MAPEIי 5 ק\"ג", requiresDeposit: false, category: "דבקים ואיטום", unit: "שק" },
  { sku: "10900", name: "אוקסיד אדום צנצנת", requiresDeposit: false, category: "צבע וגמר", unit: "צנצנת" },
  { sku: "10004", name: "מלט 25 ק\"ג 80 שק במשטח", requiresDeposit: true, depositSku: "60060", depositName: "משטח סבן פקדון (₪40)", category: "חומרי מליטה", unit: "שק" }
];

const SYSTEM_SHEET_COLUMNS = {
  LOGISTICAL_DICTIONARY: [
    "מק\"ט מוצר",
    "שם מוצר מלא",
    "קטגוריה",
    "יחידת מידה",
    "דורש פקדון (כן/לא)",
    "מק\"ט פקדון נלווה",
    "מחסן מקור",
    "סטטוס פעילות"
  ]
};

const LOGISTICS_DICTIONARY = SABAN_MASTER_INVENTORY.map(item => ({
  sku: item.sku,
  name: item.name,
  keywords: [item.name, item.sku, ...(item.name.split(' ').filter(w => w.length > 2))],
  unit: item.unit || "יחידה",
  price: item.price || 50,
  category: item.category || "ציוד לוגיסטי",
  depositRequired: !!item.requiresDeposit,
  depositSku: item.depositSku || (item.name.includes("בלוק") ? "60006" : item.name.includes("חבית") ? "60004" : item.name.includes("שק גדול") ? "60002" : "60060"),
  depositName: item.depositName || (item.name.includes("בלוק") ? "משטח בלוקים פקדון (₪50)" : item.name.includes("חבית") ? "חבית פקדון (₪100)" : item.name.includes("שק גדול") ? "שק גדול פקדון (₪30)" : "משטח סבן פקדון (₪40)")
}));

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

  const simpleGreetings = [
    "היי", "הי", "שלום", "אהלן", "בוקר טוב", "ערב טוב", "צהריים טובים", "לילה טוב",
    "מה שלומך", "היוש", "מה נשמע", "מה קורה", "מה העניינים", "נועה"
  ];
  const isExactGreeting = 
    simpleGreetings.some(g => lowerMsg === g || lowerMsg === g + "!" || lowerMsg === g + " נועה" || lowerMsg === "הי " + g || lowerMsg === "היי " + g) ||
    /^(היי?|שלום|אהלן|בוקר טוב|ערב טוב|צהריים טובים|מה שלומך|היוש|מה נשמע|מה קורה|מה העניינים)(\s+נועה)?[\s!.]*$/i.test(msgText);

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
  SABAN_MASTER_INVENTORY,
  SYSTEM_SHEET_COLUMNS,
  LOGISTICS_DICTIONARY,
  parseLogisticsOrder,
  evaluateRules,
  buildGeminiPayload,
  processInboundMessage
};

module.exports = noaBrainModule;
module.exports.default = noaBrainModule;
module.exports.SABAN_MASTER_INVENTORY = SABAN_MASTER_INVENTORY;
module.exports.SYSTEM_SHEET_COLUMNS = SYSTEM_SHEET_COLUMNS;
module.exports.LOGISTICS_DICTIONARY = LOGISTICS_DICTIONARY;
module.exports.parseLogisticsOrder = parseLogisticsOrder;
module.exports.evaluateRules = evaluateRules;
module.exports.buildGeminiPayload = buildGeminiPayload;
module.exports.processInboundMessage = processInboundMessage;

if (typeof window !== 'undefined') {
  window.noaBrain = noaBrainModule;
}
