import React, { useState } from 'react';
import { X, UserPlus, Phone, Bot, MapPin, FileText, ShoppingCart, Building, Tag, Check } from 'lucide-react';
import { ContactTag } from '../../types';
import { PRESET_TAGS, getTagColorConfig } from '../../utils/tagUtils';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (
    name: string,
    phone: string,
    isAiManaged: boolean,
    extraDetails?: {
      company?: string;
      address?: string;
      notes?: string;
      initialOrderSummary?: string;
      tags?: ContactTag[];
    }
  ) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [initialOrderSummary, setInitialOrderSummary] = useState('');
  const [isAiManaged, setIsAiManaged] = useState(true);
  const [selectedTags, setSelectedTags] = useState<ContactTag[]>([
    { id: 'tag_preset_new_lead', name: 'New Lead', color: 'emerald' },
  ]);

  if (!isOpen) return null;

  const toggleTag = (preset: ContactTag) => {
    if (selectedTags.some((t) => t.name.toLowerCase() === preset.name.toLowerCase())) {
      setSelectedTags(selectedTags.filter((t) => t.name.toLowerCase() !== preset.name.toLowerCase()));
    } else {
      setSelectedTags([...selectedTags, preset]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateChat(name, phone || '050-0000000', isAiManaged, {
      company,
      address,
      notes,
      initialOrderSummary,
      tags: selectedTags,
    });
    setName('');
    setPhone('');
    setCompany('');
    setAddress('');
    setNotes('');
    setInitialOrderSummary('');
    setSelectedTags([{ id: 'tag_preset_new_lead', name: 'New Lead', color: 'emerald' }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#222e35] text-[#e9edef] w-full max-w-lg rounded-xl shadow-2xl border border-[#2a3942] overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a3942] bg-[#111b21] shrink-0">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00a884]" />
            הוספת איש קשר ידנית + שיוך היסטוריה והקשר
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1">
                שם איש הקשר / לקוח *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: יובל - אתר אשדוד"
                className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1">
                מספר טלפון (וואטסאפ)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8696a0] absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-1234567"
                  className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg pr-9 pl-3 py-2 text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#00a884]" />
                חברה / עסק (אופציונלי)
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="סאבאן תשתיות בע''מ"
                className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#00a884]" />
                כתובת / אתר פרויקט
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="רחוב הבנאים 10, יבנה"
                className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1 flex items-center gap-1">
              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
              היסטוריית הזמנות ראשונית / מוצרים משוייכים (למזער ambiguity)
            </label>
            <input
              type="text"
              value={initialOrderSummary}
              onChange={(e) => setInitialOrderSummary(e.target.value)}
              placeholder="לדוגמה: 50 שק מלט אפור [10001], 10 בלה סומסום [20001]"
              className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#00a884]" />
              תגיות וסיווג ראשוני (VIP, New Lead, Urgent...)
            </label>
            <div className="flex flex-wrap gap-1.5 bg-[#111b21] p-2.5 rounded-lg border border-[#2a3942]">
              {PRESET_TAGS.map((preset) => {
                const isSelected = selectedTags.some(
                  (t) => t.name.toLowerCase() === preset.name.toLowerCase()
                );
                const colorCfg = getTagColorConfig(preset.color);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => toggleTag(preset)}
                    className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? `${colorCfg.badgeClass} ring-1 ring-white/20 font-bold scale-105`
                        : 'bg-[#182229] border-[#2a3942] text-[#8696a0] hover:text-[#e9edef]'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3" /> : <span className={`w-2 h-2 rounded-full ${colorCfg.dotClass}`} />}
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#00a884]" />
              הערות מנהל לתיק לקוח
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="מאושר אשראי, מעדיף אספקה בשעות הבוקר..."
              className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg p-3 text-xs text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
            />
          </div>

          <div className="flex items-center justify-between bg-[#111b21] p-3 rounded-lg border border-[#2a3942]">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#00a884]" />
              <div>
                <p className="text-xs font-semibold text-[#e9edef]">הפעלת Noa AI והאזנה לוואטסאפ</p>
                <p className="text-[11px] text-[#8696a0]">נועה AI תשיב אוטומטית לפי היסטוריית ההזמנות ותיק הלקוח</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAiManaged}
              onChange={(e) => setIsAiManaged(e.target.checked)}
              className="w-4 h-4 accent-[#00a884] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8696a0] hover:text-white"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#00a884] hover:bg-[#008f70] text-[#111b21] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              צור והתחל שיחה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
