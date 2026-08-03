import { normalizeCustomerItems, INITIAL_LOGISTIC_DICTIONARY } from './productNormalization';
import { LogisticProduct, NormalizedOrderItem } from '../types';

export interface NoaProcessResult {
  text: string;
  orderItems: NormalizedOrderItem[];
  isOrder: boolean;
  totalEstimatedPrice: number;
}

export function processNoaMessage(
  userMessage: string,
  contactName: string = 'לקוח',
  dictionary: LogisticProduct[] = INITIAL_LOGISTIC_DICTIONARY
): NoaProcessResult {
  const normalizedItems = normalizeCustomerItems(userMessage, dictionary);
  const matchedItems = normalizedItems.filter((item) => item.sku !== 'UNKNOWN');

  if (matchedItems.length > 0) {
    let total = 0;
    const itemSummaries = matchedItems.map((item) => {
      const itemTotal = item.totalPrice || 0;
      total += itemTotal;
      return `• [מק"ט ${item.sku}] ${item.name} — ${item.quantity} ${item.unit} (₪${itemTotal})`;
    });

    const unknownItems = normalizedItems.filter((item) => item.sku === 'UNKNOWN');
    let unknownText = '';
    if (unknownItems.length > 0) {
      unknownText = `\n\n⚠️ *שימו לב:* הפריטים הבאים לא זוהו במילון הלוגיסטי ויועברו לבדיקה אנושית: ${unknownItems.map((u) => u.originalText || u.name).join(', ')}`;
    }

    const replyText = `שלום ${contactName}! 👋\n*ההזמנה שלך נקלטה ופוענחה בהצלחה במערכת SabanOS:* 🚛\n\n${itemSummaries.join('\n')}\n\n*סה"כ משוער:* ₪${total}${unknownText}\n\nצוות הלוגיסטיקה מכין את המשלוח ויוצר עמך קשר לתיאום סופי!`;

    return {
      text: replyText,
      orderItems: normalizedItems,
      isOrder: true,
      totalEstimatedPrice: total,
    };
  }

  const lower = (userMessage || '').toLowerCase();
  let defaultReply = `שלום ${contactName}! הודעתך נקלטה במערכת SabanOS. צוות השירות והלוגיסטיקה שלנו ישמח לסייע לך בכל שאלה! 😊`;

  if (lower.includes('תפריט') || lower.includes('אוכל')) {
    defaultReply = `בוודאי ${contactName}! התפריט והמחירון מעודכנים בסינכרון מול SabanOS. תרצה לקבל פירוט ציוד ומנות?`;
  } else if (lower.includes('שעות') || lower.includes('זמנים') || lower.includes('מתי פתוח')) {
    defaultReply = `אנו פתוחים בימים א'-ה' בין השעות 08:00 ל-18:00, ובימי שישי עד 13:00. נשמח לראותכם!`;
  } else if (lower.includes('מיקום') || lower.includes('כתובת') || lower.includes('waze') || lower.includes('סניף')) {
    defaultReply = `📍 סניף SabanOS מרכזי: רחוב הברזל 11, תל אביב. לחץ לניווט ב-Waze: https://waze.com/ul?ll=32.1092,34.8389`;
  } else if (lower.includes('מחיר') || lower.includes('כמה עולה') || lower.includes('עלות')) {
    defaultReply = `מחירון SabanOS מעודכן בזמן אמת. תרצה שנפיק עבורך הצעת מחיר מסודרת?`;
  }

  return {
    text: defaultReply,
    orderItems: [],
    isOrder: false,
    totalEstimatedPrice: 0,
  };
}
