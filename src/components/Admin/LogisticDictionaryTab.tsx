import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Package,
  ArrowRight,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { LogisticProduct, NormalizedOrderItem } from '../../types';
import {
  INITIAL_LOGISTIC_DICTIONARY,
  normalizeCustomerItems,
  formatNormalizedOrderSummary,
  fetchLiveLogisticDictionary,
} from '../../utils/productNormalization';

export const LogisticDictionaryTab: React.FC = () => {
  const [dictionary, setDictionary] = useState<LogisticProduct[]>(INITIAL_LOGISTIC_DICTIONARY);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // New Product Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [newUnit, setNewUnit] = useState('שק');
  const [newCategory, setNewCategory] = useState('חומרי מליטה');
  const [newPrice, setNewPrice] = useState('25');

  // Normalizer Tester state
  const [rawTextOrder, setRawTextOrder] = useState(
    'היי, אני צריך 10 מלט אפור, 2 בלות סומסום נקי וגם 5 לוחות גבס ירוק'
  );
  const [normalizedItems, setNormalizedItems] = useState<NormalizedOrderItem[]>([]);
  const [formattedMessage, setFormattedMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Initial fetch from server
  useEffect(() => {
    handleLoadLiveDictionary();
    // Run initial test normalization
    handleRunNormalization('היי, אני צריך 10 מלט אפור, 2 בלות סומסום נקי וגם 5 לוחות גבס ירוק');
  }, []);

  const handleLoadLiveDictionary = async () => {
    setIsLoading(true);
    setSyncStatus(null);
    try {
      const items = await fetchLiveLogisticDictionary();
      setDictionary(items);
      setSyncStatus(`סונכרנו בהצלחה ${items.length} מוצרים מגליון "מילון_לוגיסטי"`);
    } catch (err: any) {
      setSyncStatus('טעינת גליון נכשלה, מוצגת גרסת ברירת מחדל.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunNormalization = (inputString?: string) => {
    const textToTest = inputString !== undefined ? inputString : rawTextOrder;
    const items = normalizeCustomerItems(textToTest, dictionary);
    setNormalizedItems(items);
    const summary = formatNormalizedOrderSummary(items, 'ישראל ישראלי');
    setFormattedMessage(summary);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newProductName.trim()) return;

    const aliasesArr = newAliases
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const newProd: LogisticProduct = {
      sku: newSku.trim(),
      productName: newProductName.trim(),
      aliases: aliasesArr.length > 0 ? aliasesArr : [newProductName.trim()],
      unit: newUnit.trim(),
      category: newCategory.trim(),
      price: parseFloat(newPrice) || 0,
    };

    try {
      const res = await fetch('/api/products/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.dictionary)) {
        setDictionary(data.dictionary);
      } else {
        setDictionary((prev) => [...prev.filter((p) => p.sku !== newProd.sku), newProd]);
      }
    } catch (e) {
      setDictionary((prev) => [...prev.filter((p) => p.sku !== newProd.sku), newProd]);
    }

    setNewSku('');
    setNewProductName('');
    setNewAliases('');
    setShowAddForm(false);
  };

  const handleCopyFormattedMessage = () => {
    navigator.clipboard.writeText(formattedMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const categories = Array.from(new Set(dictionary.map((d) => d.category || 'כללי')));

  const filteredProducts = dictionary.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      p.sku.toLowerCase().includes(query) ||
      p.productName.toLowerCase().includes(query) ||
      p.aliases.some((a) => a.toLowerCase().includes(query));

    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-[#005c4b]/30 via-[#182229] to-[#202c33] border border-[#00a884]/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#00a884]/20 rounded-xl text-[#00a884]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                מילון לוגיסטי & מנוע נרמול מק"טים (Google Sheets: 'מילון_לוגיסטי')
              </h3>
              <span className="bg-[#00a884] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-[#8696a0] mt-0.5">
              המנוע ממפה טקסט חופשי מוואטסאפ למוצרים תקניים, מק"טים, יחידות מידה וחישובי כמויות בזמן אמת.
            </p>
          </div>
        </div>

        <button
          onClick={handleLoadLiveDictionary}
          disabled={isLoading}
          className="px-3.5 py-2 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-black font-bold text-xs rounded-lg flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>סנכרן מול גליון גוגל</span>
        </button>
      </div>

      {syncStatus && (
        <div className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Section 1: NLP Order Normalizer Tester */}
      <div className="bg-[#182229] border border-[#2a3942] rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2a3942] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white">
              בחינת מנוע נרמול הזמנות (Free-Text to SKU Engine)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-[#8696a0]">normalizeCustomerItems()</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Input text */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#8696a0] block">
              הכנס טקסט חופשי מהלקוח בוואטסאפ (לדוגמה: "רוצה 10 מלט אפור וגם 2 בלות סומסום"):
            </label>
            <textarea
              value={rawTextOrder}
              onChange={(e) => setRawTextOrder(e.target.value)}
              rows={4}
              className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg p-3 text-xs text-white focus:border-[#00a884] outline-none dir-rtl font-mono"
              placeholder="רשום פה הזמנה חופשית..."
            />

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-[#8696a0] font-medium">דוגמאות לבדיקה מהירה:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'רוצה 10 מלט אפור',
                  '20 בלות סומסום נקי ו-5 שקי מלט לבן',
                  '2 משטחי איטונג וגם 50 מ"ר פנל קלקר',
                  'תביא 10 שקי טיח תרמי ו-30 לוחות גבס ירוק',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setRawTextOrder(sample);
                      handleRunNormalization(sample);
                    }}
                    className="text-[11px] bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] px-2.5 py-1 rounded-md border border-[#2a3942] transition-colors cursor-pointer"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleRunNormalization()}
              className="w-full py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-black font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>נרמל הזמנה מול מילון לוגיסטי</span>
            </button>
          </div>

          {/* Right Column: Parsed Results */}
          <div className="space-y-3 bg-[#111b21] border border-[#2a3942] rounded-lg p-3">
            <div className="flex items-center justify-between border-b border-[#2a3942] pb-2">
              <span className="text-xs font-bold text-[#00a884] flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                פריטים שנורמלו ({normalizedItems.length})
              </span>
              <button
                onClick={handleCopyFormattedMessage}
                className="text-[11px] bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] font-semibold px-2 py-1 rounded flex items-center gap-1 border border-[#2a3942] cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'הועתק!' : 'העתק הודעה מעוצבת'}</span>
              </button>
            </div>

            {/* List of Normalized Items */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {normalizedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#202c33] border border-[#2a3942] flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#00a884]/20 text-[#00a884] font-mono font-bold text-[11px] px-1.5 py-0.5 rounded border border-[#00a884]/30">
                        מק"ט: {item.sku}
                      </span>
                      <span className="font-bold text-white">{item.name}</span>
                    </div>
                    <div className="text-[11px] text-[#8696a0] flex items-center gap-3">
                      <span>
                        כמות: <strong className="text-emerald-400">{item.quantity}</strong> {item.unit}
                      </span>
                      {item.unitPrice ? (
                        <span>
                          מחיר: ₪{item.unitPrice} / {item.unit} (סה"כ: ₪{item.totalPrice})
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      item.confidence && item.confidence >= 0.8
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    התאמה {Math.round((item.confidence || 0.5) * 100)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Formatted Output Preview */}
            <div className="mt-2 pt-2 border-t border-[#2a3942]">
              <span className="text-[11px] text-[#8696a0] block mb-1 font-semibold">
                תצוגה מקדימה להודעת WhatsApp (Noa AI Format):
              </span>
              <pre className="text-[11px] font-sans text-emerald-300 bg-[#182229] p-2.5 rounded border border-[#2a3942] whitespace-pre-wrap">
                {formattedMessage}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Product Catalog & Dictionary Manager */}
      <div className="bg-[#182229] border border-[#2a3942] rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2a3942] pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-[#00a884]" />
              קטלוג מוצרים ומק"טים ב'מילון_לוגיסטי' ({filteredProducts.length} מוצרים)
            </h4>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#8696a0] absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש מקט, שם מוצר או כינוי..."
                className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg pr-9 pl-3 py-1.5 text-xs text-white focus:border-[#00a884] outline-none"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#111b21] border border-[#2a3942] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00a884] outline-none cursor-pointer"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף מוצר</span>
            </button>
          </div>
        </div>

        {/* Add Product Modal Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddProduct}
            className="p-4 bg-[#111b21] border border-[#00a884]/40 rounded-xl space-y-3 animate-in fade-in duration-200"
          >
            <h5 className="text-xs font-bold text-[#00a884] flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              הוספת מוצר חדש למילון הלוגיסטי
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#8696a0] block mb-1">מק"ט מוצר:</label>
                <input
                  type="text"
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="לדוגמה: 10004"
                  className="w-full bg-[#182229] border border-[#2a3942] rounded p-2 text-xs text-white outline-none focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8696a0] block mb-1">שם מוצר תקני:</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder='לדוגמה: שק מלט מהיר 25 ק"ג'
                  className="w-full bg-[#182229] border border-[#2a3942] rounded p-2 text-xs text-white outline-none focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8696a0] block mb-1">יחידת מידה:</label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full bg-[#182229] border border-[#2a3942] rounded p-2 text-xs text-white outline-none focus:border-[#00a884]"
                >
                  <option value="שק">שק</option>
                  <option value="בלה">בלה</option>
                  <option value="משטח">משטח</option>
                  <option value="יחידה">יחידה</option>
                  <option value='מ"ר'>מ"ר</option>
                  <option value="מטר">מטר</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#8696a0] block mb-1">קטגוריה:</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#182229] border border-[#2a3942] rounded p-2 text-xs text-white outline-none focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8696a0] block mb-1">מחיר מחירון (₪):</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-[#182229] border border-[#2a3942] rounded p-2 text-xs text-white outline-none focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8696a0] block mb-1">כינויים/מילות מפתח (מופרדים במיפסיק):</label>
                <input
                  type="text"
                  value={newAliases}
                  onChange={(e) => setNewAliases(e.target.value)}
                  placeholder="מלט מהיר, מלט מהיר 25"
                  className="w-full bg-[#182229] border border-[#2a3942] rounded p-2 text-xs text-white outline-none focus:border-[#00a884]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-[#8696a0] hover:text-white cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-black font-bold text-xs rounded transition-colors cursor-pointer"
              >
                שמור מוצר במילון
              </button>
            </div>
          </form>
        )}

        {/* Product Grid Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {filteredProducts.map((prod) => (
            <div
              key={prod.sku}
              className="p-3 bg-[#111b21] border border-[#2a3942] hover:border-[#00a884]/40 rounded-xl space-y-2 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="bg-[#00a884]/20 text-[#00a884] font-mono font-bold text-xs px-2 py-0.5 rounded border border-[#00a884]/30">
                  מק"ט: {prod.sku}
                </span>
                <span className="bg-[#202c33] text-[#8696a0] text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {prod.category}
                </span>
              </div>

              <div>
                <h5 className="text-xs font-bold text-white group-hover:text-[#00a884] transition-colors">
                  {prod.productName}
                </h5>
                <div className="text-[11px] text-[#8696a0] flex items-center justify-between mt-1">
                  <span>
                    יחידה: <strong className="text-white">{prod.unit}</strong>
                  </span>
                  {prod.price ? <span className="text-emerald-400 font-bold">₪{prod.price}</span> : null}
                </div>
              </div>

              {/* Aliases Tags */}
              <div className="pt-2 border-t border-[#2a3942]/60">
                <span className="text-[10px] text-[#8696a0] block mb-1">כינויים ומילות מפתח לחיפוש:</span>
                <div className="flex flex-wrap gap-1">
                  {prod.aliases.map((alias, aIdx) => (
                    <span
                      key={aIdx}
                      className="text-[10px] bg-[#202c33] text-emerald-300 px-1.5 py-0.5 rounded border border-[#2a3942]"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
