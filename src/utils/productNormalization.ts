import { LogisticProduct, NormalizedOrderItem } from '../types';

export const INITIAL_LOGISTIC_DICTIONARY: LogisticProduct[] = [
  {
    sku: '10001',
    productName: 'שק מלט אפור 50 ק"ג',
    aliases: ['מלט אפור 50', 'שק מלט 50', 'מלט 50', 'מלט 50 קג', 'שק מלט אפור 50'],
    unit: 'שק',
    category: 'חומרי מליטה',
    price: 38,
  },
  {
    sku: '10002',
    productName: 'שק מלט אפור 25 ק"ג',
    aliases: ['מלט', 'שק מלט', 'מלט אפור', 'מלט 25', 'שקי מלט', 'שקי מלט אפור'],
    unit: 'שק',
    category: 'חומרי מליטה',
    price: 22,
  },
  {
    sku: '10003',
    productName: 'שק מלט לבן 25 ק"ג',
    aliases: ['מלט לבן', 'שק מלט לבן', 'מלט לבן 25', 'שקי מלט לבן'],
    unit: 'שק',
    category: 'חומרי מליטה',
    price: 34,
  },
  {
    sku: '20001',
    productName: 'בלה סומסום נקי',
    aliases: ['סומסום', 'בלה סומסום', 'שק סומסום', 'סומסום נקי', 'בלות סומסום'],
    unit: 'בלה',
    category: 'חול וסומסום',
    price: 110,
  },
  {
    sku: '20002',
    productName: 'בלה חול מחצבה (טיט)',
    aliases: ['חול', 'חול מחצבה', 'טיט', 'בלה חול', 'בלה טיט', 'בלות חול', 'בלות טיט'],
    unit: 'בלה',
    category: 'חול וסומסום',
    price: 105,
  },
  {
    sku: '20003',
    productName: 'בלה חצץ 1/2 (עדש)',
    aliases: ['חצץ', 'עדש', 'בלה חצץ', 'חצץ עדש', 'בלות חצץ'],
    unit: 'בלה',
    category: 'חול וסומסום',
    price: 115,
  },
  {
    sku: '20004',
    productName: 'בלה זיפזיף לריצוף',
    aliases: ['זיפזיף', 'בלה זיפזיף', 'חול זיפזיף', 'בלות זיפזיף'],
    unit: 'בלה',
    category: 'חול וסומסום',
    price: 120,
  },
  {
    sku: '30001',
    productName: 'משטח בלוק בטון 20 (96 יח\')',
    aliases: ['בלוק בטון', 'בלוק 20', 'בלוק בטון 20', 'בלוקים', 'משטח בלוק בטון'],
    unit: 'משטח',
    category: 'בלוקים',
    price: 480,
  },
  {
    sku: '30002',
    productName: 'משטח בלוק איטונג 20 (72 יח\')',
    aliases: ['איטונג', 'בלוק איטונג', 'איטונג 20', 'בלוק איטונג 20', 'משטח איטונג'],
    unit: 'משטח',
    category: 'בלוקים',
    price: 650,
  },
  {
    sku: '30003',
    productName: 'משטח בלוק פומס 20 (96 יח\')',
    aliases: ['פומס', 'בלוק פומס', 'פומס 20', 'משטח פומס'],
    unit: 'משטח',
    category: 'בלוקים',
    price: 520,
  },
  {
    sku: '40001',
    productName: 'שק טיח גבס תרמי 25 ק"ג',
    aliases: ['טיח', 'טיח גבס', 'טיח תרמי', 'שק טיח', 'טיח גבס 25'],
    unit: 'שק',
    category: 'גבס וטיח',
    price: 45,
  },
  {
    sku: '40002',
    productName: 'לוח גבס ירוק עמיד מים 12.5 מ"מ',
    aliases: ['גבס ירוק', 'לוח גבס ירוק', 'גבס נגד מים', 'לוחות גבס ירוק'],
    unit: 'יחידה',
    category: 'גבס וטיח',
    price: 42,
  },
  {
    sku: '40003',
    productName: 'לוח גבס לבן סטנדרטי 12.5 מ"מ',
    aliases: ['גבס לבן', 'לוח גבס לבן', 'לוח גבס', 'לוחות גבס לבן'],
    unit: 'יחידה',
    category: 'גבס וטיח',
    price: 32,
  },
  {
    sku: '50001',
    productName: 'פנל מבודד קלקר 50 מ"מ',
    aliases: ['פנל מבודד', 'פנל קלקר', 'פנל 50', 'פנל מבודד 50', 'פנלים 50'],
    unit: 'מ"ר',
    category: 'בידוד',
    price: 85,
  },
  {
    sku: '50002',
    productName: 'פנל מבודד צמר סלעים 80 מ"מ',
    aliases: ['פנל צמר סלעים', 'פנל מבודד 80', 'צמר סלעים', 'פנלים 80'],
    unit: 'מ"ר',
    category: 'בידוד',
    price: 125,
  },
  {
    sku: '60001',
    productName: 'משטח עץ טעון פיקדון',
    aliases: ['משטח', 'משטחים', 'פיקדון משטח', 'משטח עץ', 'משטח פיקדון'],
    unit: 'משטח',
    category: 'פקדונות',
    price: 45,
  },
];

// Hebrew number word mapper
const HEBREW_NUMBER_WORDS: Record<string, number> = {
  'אחד': 1,
  'אחת': 1,
  'שניים': 2,
  'שתי': 2,
  'שני': 2,
  'שלושה': 3,
  'שלוש': 3,
  'ארבעה': 4,
  'ארבע': 4,
  'חמישה': 5,
  'חמש': 5,
  'שישה': 6,
  'שש': 6,
  'שבעה': 7,
  'שבע': 7,
  'שמונה': 8,
  'תשעה': 9,
  'תשע': 9,
  'עשרה': 10,
  'עשר': 10,
  'עשרים': 20,
  'שלשים': 30,
  'שלושים': 30,
  'ארבעים': 40,
  'חמישים': 50,
  'שישים': 60,
  'שבעים': 70,
  'שמונים': 80,
  'תשעים': 90,
  'מאה': 100,
  'מאתיים': 200,
  'אלף': 1000,
};

// Cleanup filler conversational words
const FILLER_WORDS = [
  'רוצה', 'צריך', 'אני צריך', 'אני רוצה', 'תביא', 'תביא לי', 'תוסיף', 'תוסיף לי',
  'משלוח של', 'הזמנה של', 'חבילה של', 'בשבילי', 'בבקשה', 'שלח', 'אפשר', 'היי', 'שלום',
  'וגם', 'ועוד', 'יחידות', 'יח', 'שקים של', 'בלות של', 'משטחים של'
];

/**
 * Normalizes free text customer orders into structured SKU items against the Logistic Dictionary.
 */
export function normalizeCustomerItems(
  rawInput: string | string[],
  dictionary: LogisticProduct[] = INITIAL_LOGISTIC_DICTIONARY
): NormalizedOrderItem[] {
  const dict = dictionary.length > 0 ? dictionary : INITIAL_LOGISTIC_DICTIONARY;
  
  // Convert array or string into clause segments
  const lines: string[] = Array.isArray(rawInput)
    ? rawInput
    : rawInput
        .split(/[\n,;+]| וגם | ועוד |\t/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

  const results: NormalizedOrderItem[] = [];

  for (const line of lines) {
    if (!line || line.length < 2) continue;

    // 1. Extract Quantity
    let quantity = 1;
    let textWithoutQty = line;

    // Regex check for numeric digits e.g., "10 מלט" or "מלט 10" or "10x מלט"
    const numberDigitMatch = line.match(/(?:^|\s)(\d+)(?:\s*x|\s*שקים|\s*בלות|\s*משטחים|\s*יח|\s*יחידות|\s*מ"ר)?(?:\s+|$)/i);
    if (numberDigitMatch) {
      quantity = parseInt(numberDigitMatch[1], 10);
      textWithoutQty = line.replace(numberDigitMatch[0], ' ').trim();
    } else {
      // Check for Hebrew number words
      const words = line.split(/\s+/);
      for (const w of words) {
        const cleanedW = w.replace(/^[ובל-]/, ''); // remove Hebrew prefixes
        if (HEBREW_NUMBER_WORDS[cleanedW]) {
          quantity = HEBREW_NUMBER_WORDS[cleanedW];
          textWithoutQty = line.replace(w, ' ').trim();
          break;
        }
      }
    }

    // 2. Clean filler words
    let targetTerm = textWithoutQty.toLowerCase();
    for (const filler of FILLER_WORDS) {
      targetTerm = targetTerm.replace(new RegExp(`\\b${filler}\\b`, 'gi'), ' ').trim();
    }
    targetTerm = targetTerm.replace(/\s+/g, ' ').trim();

    if (!targetTerm) continue;

    // 3. Match against Dictionary aliases & productName
    let bestMatch: LogisticProduct | null = null;
    let highestScore = 0;

    for (const prod of dict) {
      let score = 0;

      // Check exact alias match
      for (const alias of prod.aliases) {
        const lowerAlias = alias.toLowerCase();
        if (targetTerm === lowerAlias) {
          score = Math.max(score, 100);
        } else if (targetTerm.includes(lowerAlias)) {
          score = Math.max(score, 80 + lowerAlias.length);
        } else if (lowerAlias.includes(targetTerm) && targetTerm.length >= 3) {
          score = Math.max(score, 60 + targetTerm.length);
        }
      }

      // Check product name match
      const lowerProdName = prod.productName.toLowerCase();
      if (targetTerm === lowerProdName) {
        score = Math.max(score, 100);
      } else if (targetTerm.includes(lowerProdName)) {
        score = Math.max(score, 85);
      } else if (lowerProdName.includes(targetTerm) && targetTerm.length >= 3) {
        score = Math.max(score, 70);
      }

      // Check keyword word overlap
      const termWords = targetTerm.split(/\s+/).filter((w) => w.length > 2);
      let wordHits = 0;
      for (const tw of termWords) {
        if (prod.aliases.some((a) => a.toLowerCase().includes(tw)) || lowerProdName.includes(tw)) {
          wordHits++;
        }
      }
      if (termWords.length > 0 && wordHits > 0) {
        const overlapScore = Math.round((wordHits / termWords.length) * 50);
        score = Math.max(score, overlapScore);
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = prod;
      }
    }

    if (bestMatch && highestScore >= 30) {
      // Calculate total item price if defined
      const unitPrice = bestMatch.price || 0;
      results.push({
        sku: bestMatch.sku,
        name: bestMatch.productName,
        quantity,
        unit: bestMatch.unit,
        originalText: line,
        confidence: highestScore >= 90 ? 1.0 : highestScore >= 70 ? 0.85 : 0.65,
        unitPrice,
        totalPrice: unitPrice * quantity,
      });
    } else {
      // Fallback unmatched item
      results.push({
        sku: 'GENERIC-99',
        name: textWithoutQty || line,
        quantity,
        unit: 'יחידה',
        originalText: line,
        confidence: 0.3,
      });
    }
  }

  return results;
}

/**
 * Formats a structured WhatsApp message output containing SKUs, names, quantities, and totals.
 */
export function formatNormalizedOrderSummary(
  items: NormalizedOrderItem[],
  customerName = 'לקוח'
): string {
  if (items.length === 0) return '';

  const formattedLines = items.map((item, idx) => {
    const skuTag = item.sku !== 'GENERIC-99' ? ` [מק"ט: ${item.sku}]` : '';
    const priceTag = item.totalPrice ? ` (₪${item.totalPrice})` : '';
    return `${idx + 1}. *${item.name}*${skuTag} — *${item.quantity} ${item.unit}*${priceTag}`;
  });

  const grandTotal = items.reduce((acc, i) => acc + (i.totalPrice || 0), 0);

  return `📦 *סיכום הזמנה תקנית לבדיקה (מילון לוגיסטי)* עבור *${customerName}*:\n\n${formattedLines.join(
    '\n'
  )}${grandTotal > 0 ? `\n\n💰 *סה"כ משוער:* ₪${grandTotal}` : ''}\n\n✅ *כל המק"טים אומתו מול מילון המוצרים של SabanOS.*`;
}

/**
 * Fetches live product dictionary from server / Google Apps Script endpoint.
 */
export async function fetchLiveLogisticDictionary(): Promise<LogisticProduct[]> {
  try {
    const res = await fetch('/api/products/dictionary');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.dictionary) && data.dictionary.length > 0) {
        return data.dictionary;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch live dictionary from server, using local fallback:', err);
  }
  return INITIAL_LOGISTIC_DICTIONARY;
}

export interface OrderVerificationResult {
  hasOrderItems: boolean;
  verifiedItems: {
    sku: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    originalText: string;
  }[];
  ambiguousItems: {
    requestedName: string;
    quantity: number;
    matchingProducts: LogisticProduct[];
  }[];
  unmatchedItems: {
    requestedName: string;
    quantity: number;
  }[];
  formattedResponse: string;
}

/**
 * Performs full verification against the Logistic Dictionary (מילון_לוגיסטי).
 * Outputs SKUs, exact names from dictionary, and handles ambiguous matches by asking the customer for clarification.
 */
export function verifyOrderAgainstLogisticDictionary(
  rawInput: string,
  dictionary: LogisticProduct[] = INITIAL_LOGISTIC_DICTIONARY,
  customerName = 'לקוח'
): OrderVerificationResult {
  const dict = dictionary.length > 0 ? dictionary : INITIAL_LOGISTIC_DICTIONARY;

  const clauses = rawInput
    .split(/[\n,;+]| וגם | ועוד |\t/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const verifiedItems: OrderVerificationResult['verifiedItems'] = [];
  const ambiguousItems: OrderVerificationResult['ambiguousItems'] = [];
  const unmatchedItems: OrderVerificationResult['unmatchedItems'] = [];

  for (const clause of clauses) {
    let quantity = 1;
    let textWithoutQty = clause;

    const numberMatch = clause.match(/(?:^|\s)(\d+)(?:\s*x|\s*שקים|\s*בלות|\s*משטחים|\s*יח|\s*יחידות|\s*מ"ר)?(?:\s+|$)/i);
    if (numberMatch) {
      quantity = parseInt(numberMatch[1], 10);
      textWithoutQty = clause.replace(numberMatch[0], ' ').trim();
    } else {
      const words = clause.split(/\s+/);
      for (const w of words) {
        const cleanedW = w.replace(/^[ובל-]/, '');
        if (HEBREW_NUMBER_WORDS[cleanedW]) {
          quantity = HEBREW_NUMBER_WORDS[cleanedW];
          textWithoutQty = clause.replace(w, ' ').trim();
          break;
        }
      }
    }

    let targetTerm = textWithoutQty.toLowerCase();
    for (const filler of FILLER_WORDS) {
      targetTerm = targetTerm.replace(new RegExp(`\\b${filler}\\b`, 'gi'), ' ').trim();
    }
    targetTerm = targetTerm.replace(/^(למחר|היום|משלוח|הזמנה|עבור|אתר)\s*/gi, '').trim();

    if (!targetTerm || targetTerm.length < 2) continue;

    const matchingProducts: { prod: LogisticProduct; score: number }[] = [];

    for (const prod of dict) {
      let maxScore = 0;

      for (const alias of prod.aliases) {
        const lowerAlias = alias.toLowerCase();
        if (targetTerm === lowerAlias) {
          maxScore = Math.max(maxScore, 100);
        } else if (targetTerm.includes(lowerAlias)) {
          maxScore = Math.max(maxScore, 85);
        } else if (lowerAlias.includes(targetTerm) && targetTerm.length >= 3) {
          maxScore = Math.max(maxScore, 75);
        }
      }

      const lowerProdName = prod.productName.toLowerCase();
      if (targetTerm === lowerProdName) {
        maxScore = Math.max(maxScore, 100);
      } else if (targetTerm.includes(lowerProdName)) {
        maxScore = Math.max(maxScore, 85);
      } else if (lowerProdName.includes(targetTerm) && targetTerm.length >= 3) {
        maxScore = Math.max(maxScore, 75);
      }

      const termWords = targetTerm.split(/\s+/).filter((w) => w.length > 2);
      for (const tw of termWords) {
        if (prod.aliases.some((a) => a.toLowerCase().includes(tw)) || lowerProdName.includes(tw)) {
          maxScore = Math.max(maxScore, 60);
        }
      }

      if (maxScore >= 50) {
        matchingProducts.push({ prod, score: maxScore });
      }
    }

    matchingProducts.sort((a, b) => b.score - a.score);

    if (matchingProducts.length === 0) {
      if (/(מלט|סומסום|חול|טיט|איטונג|בלוק|גבס|פנל|טיח|חצץ)/i.test(clause)) {
        unmatchedItems.push({ requestedName: textWithoutQty || clause, quantity });
      }
    } else if (
      matchingProducts.length === 1 ||
      matchingProducts[0].score >= 90 ||
      (matchingProducts[0].score - (matchingProducts[1]?.score || 0) >= 30)
    ) {
      const p = matchingProducts[0].prod;
      const unitPrice = p.price || 0;
      verifiedItems.push({
        sku: p.sku,
        productName: p.productName,
        quantity,
        unit: p.unit,
        unitPrice,
        totalPrice: unitPrice * quantity,
        originalText: clause,
      });
    } else {
      ambiguousItems.push({
        requestedName: textWithoutQty || clause,
        quantity,
        matchingProducts: matchingProducts.map((m) => m.prod),
      });
    }
  }

  const hasOrderItems =
    verifiedItems.length > 0 || ambiguousItems.length > 0 || unmatchedItems.length > 0;

  let responseText = '';

  if (hasOrderItems) {
    responseText += `שלום ${customerName}! קיבלנו את בקשת ההזמנה שלך ב-SabanOS. 📦\n\n`;
    responseText += `אימתנו את פריטי ההזמנה מול טאב *מילון_לוגיסטי*:\n\n`;

    if (verifiedItems.length > 0) {
      responseText += `✅ *מוצרים שאומתו במילון הלוגיסטי:*\n`;
      verifiedItems.forEach((item) => {
        const priceStr = item.totalPrice ? ` (₪${item.unitPrice} ל-${item.unit}, סה"כ: ₪${item.totalPrice})` : '';
        responseText += ` • ${item.quantity} ${item.unit} *[מק"ט ${item.sku}] ${item.productName}*${priceStr}\n`;
      });
      responseText += `\n`;
    }

    if (ambiguousItems.length > 0) {
      responseText += `❓ *נדרש אימות מק"ט מדויק מול המילון:*\n`;
      ambiguousItems.forEach((amb) => {
        responseText += `לגבי *${amb.requestedName}* (${amb.quantity} יחידות) — קיימים במילון מספר מוצרים תואמים. האם התכוונת ל:\n`;
        amb.matchingProducts.forEach((p, pIdx) => {
          responseText += `   ${pIdx + 1}. *[מק"ט ${p.sku}] ${p.productName}* (${p.price ? `₪${p.price} ל-${p.unit}` : p.unit})\n`;
        });
      });
      responseText += `\nאנא בחר/אישר את המק"ט והשם המדויק מתוך המילון!\n\n`;
    }

    if (unmatchedItems.length > 0) {
      responseText += `⚠️ *מוצרים שטרם נמצאו במילון:* ${unmatchedItems
        .map((u) => `${u.quantity}x ${u.requestedName}`)
        .join(', ')} (נבדוק מול המחסן).\n\n`;
    }

    if (ambiguousItems.length === 0) {
      const grandTotal = verifiedItems.reduce((acc, i) => acc + i.totalPrice, 0);
      if (grandTotal > 0) {
        responseText += `💰 *סה"כ לחיוב משוער:* ₪${grandTotal}\n\n`;
      }
      responseText += `ההזמנה המאומתת הועברה לצוות הלוגיסטיקה לטיפול מיידי ואישור סופי! 🚛 🏗️`;
    } else {
      responseText += `לאחר אישורך על המק"ט המדויק, נעביר את ההזמנה המאומתת מיידית לצוות הלוגיסטיקה לתיאום משלוח! 🚛`;
    }
  }

  return {
    hasOrderItems,
    verifiedItems,
    ambiguousItems,
    unmatchedItems,
    formattedResponse: responseText,
  };
}
