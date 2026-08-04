import React, { useState } from 'react';
import { X, Phone, Bot, Pin, BellOff, ShieldAlert, Tag, Edit3, CheckCheck, Check, Archive, Plus } from 'lucide-react';
import { Contact, ContactTag } from '../../types';
import { getContactTags, getTagColorConfig, PRESET_TAGS, TAG_COLORS, TagColorKey } from '../../utils/tagUtils';

interface ContactInfoModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleAi: () => void;
  onTogglePin: () => void;
  onToggleArchive?: () => void;
  onUpdateContactBlueTicks?: (override: 'global' | 'enabled' | 'disabled') => void;
  onUpdateContactTags?: (tags: ContactTag[]) => void;
  globalBlueTicks?: boolean;
  darkTheme: boolean;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  contact,
  isOpen,
  onClose,
  onToggleAi,
  onTogglePin,
  onToggleArchive,
  onUpdateContactBlueTicks,
  onUpdateContactTags,
  globalBlueTicks = true,
  darkTheme,
}) => {
  const [isAddingCustomTag, setIsAddingCustomTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState<TagColorKey>('amber');

  if (!isOpen || !contact) return null;

  const currentOverride = contact.blueTicksOverride || 'global';
  const isEffectiveBlue = currentOverride === 'enabled' ? true : currentOverride === 'disabled' ? false : globalBlueTicks;
  const activeTags = getContactTags(contact);

  const handleRemoveTag = (tagIdOrName: string) => {
    const updated = activeTags.filter((t) => t.id !== tagIdOrName && t.name !== tagIdOrName);
    onUpdateContactTags?.(updated);
  };

  const handleAddTag = (tagToAdd: ContactTag) => {
    if (activeTags.some((t) => t.name.toLowerCase() === tagToAdd.name.toLowerCase())) return;
    const updated = [...activeTags, tagToAdd];
    onUpdateContactTags?.(updated);
  };

  const handleCreateCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const newTag: ContactTag = {
      id: `tag_custom_${Date.now()}`,
      name: newTagName.trim(),
      color: selectedColor,
    };
    handleAddTag(newTag);
    setNewTagName('');
    setIsAddingCustomTag(false);
  };

  return (
    <div className={`w-80 h-full border-r flex flex-col z-20 transition-all ${
      darkTheme ? 'bg-[#111b21] border-[#222d34] text-[#e9edef]' : 'bg-white border-[#e9edef] text-[#111b21]'
    }`}>
      {/* Header */}
      <div className={`h-[60px] px-4 flex items-center justify-between border-b ${
        darkTheme ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#e9edef]'
      }`}>
        <h3 className="text-sm font-semibold">פרטי איש קשר</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-[#374248]/50 text-[#8696a0]">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex flex-col items-center text-center">
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-24 h-24 rounded-full object-cover mb-3 ring-4 ring-[#00a884]/30"
          />
          <h2 className="text-lg font-bold">{contact.name}</h2>
          <p className="text-xs text-[#8696a0] dir-ltr mt-0.5">{contact.phone}</p>

          {/* Color-Coded Header Badges */}
          {activeTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              {activeTags.slice(0, 3).map((t) => {
                const colorCfg = getTagColorConfig(t.color || t.name);
                return (
                  <span
                    key={t.id || t.name}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${colorCfg.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${colorCfg.dotClass}`} />
                    <span>{t.name}</span>
                  </span>
                );
              })}
              {activeTags.length > 3 && (
                <span className="text-[10px] text-[#8696a0] bg-[#202c33] px-1.5 py-0.5 rounded-full">
                  +{activeTags.length - 3}
                </span>
              )}
            </div>
          )}

          <span className="mt-2 text-xs text-[#00a884] font-medium bg-[#00a884]/10 px-2.5 py-1 rounded-full">
            {contact.statusText || 'משתמש מחובר ב-SabanOS'}
          </span>
        </div>

        {/* Color-Coded CRM Tags Section */}
        <div className="bg-[#202c33] p-3.5 rounded-xl border border-[#2a3942] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#00a884] flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              תגיות וסיווג CRM צבעוניות
            </h4>
            <span className="text-[10px] text-[#8696a0]">
              {activeTags.length} תגיות
            </span>
          </div>

          {/* Active Tags */}
          {activeTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeTags.map((t) => {
                const colorCfg = getTagColorConfig(t.color || t.name);
                return (
                  <span
                    key={t.id || t.name}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${colorCfg.badgeClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${colorCfg.dotClass}`} />
                    <span>{t.name}</span>
                    <button
                      onClick={() => handleRemoveTag(t.id || t.name)}
                      className="p-0.5 rounded-full hover:bg-black/30 text-current transition-colors cursor-pointer"
                      title="הסר תגית"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-[#8696a0] italic">אין תגיות משויכות לאיש קשר זה.</p>
          )}

          {/* Quick Preset Add Chips */}
          <div className="pt-2 border-t border-[#2a3942]/60 space-y-1.5">
            <span className="text-[11px] font-medium text-[#8696a0] block">הוספה מהירה (Presets):</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((preset) => {
                const isAttached = activeTags.some((t) => t.name.toLowerCase() === preset.name.toLowerCase());
                const colorCfg = getTagColorConfig(preset.color);
                return (
                  <button
                    key={preset.id}
                    disabled={isAttached}
                    onClick={() => handleAddTag(preset)}
                    className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                      isAttached
                        ? 'opacity-40 cursor-not-allowed bg-[#182229] border-[#2a3942] text-[#8696a0]'
                        : `hover:scale-105 cursor-pointer ${colorCfg.badgeClass}`
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tag Creator */}
          <div className="pt-2 border-t border-[#2a3942]/60">
            {!isAddingCustomTag ? (
              <button
                onClick={() => setIsAddingCustomTag(true)}
                className="w-full text-xs py-1.5 text-[#00a884] hover:bg-[#00a884]/10 rounded-lg flex items-center justify-center gap-1.5 border border-[#00a884]/30 border-dashed transition-all cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>צור תגית מותאמת אישית (VIP, New Lead, Urgent...)</span>
              </button>
            ) : (
              <form onSubmit={handleCreateCustomTag} className="space-y-2.5 bg-[#182229] p-2.5 rounded-lg border border-[#2a3942]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#e9edef]">תגית חדשה:</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomTag(false)}
                    className="text-[#8696a0] hover:text-[#e9edef]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="שם התגית (למשל VIP, New Lead, דחוף...)"
                  className="w-full text-xs px-2.5 py-1.5 rounded-md bg-[#202c33] border border-[#2a3942] text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                  autoFocus
                />

                <div>
                  <span className="text-[10px] text-[#8696a0] block mb-1">בחר צבע לתגית:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(TAG_COLORS) as TagColorKey[]).map((cKey) => {
                      const cfg = TAG_COLORS[cKey];
                      const isSelected = selectedColor === cKey;
                      return (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => setSelectedColor(cKey)}
                          className={`w-6 h-6 rounded-full ${cfg.dotClass} flex items-center justify-center transition-all cursor-pointer ${
                            isSelected ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={cfg.label}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!newTagName.trim()}
                    className="flex-1 bg-[#00a884] hover:bg-[#00a884]/80 disabled:opacity-50 text-[#111b21] font-semibold text-xs py-1 rounded-md transition-all cursor-pointer"
                  >
                    אישור והוספה
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomTag(false)}
                    className="px-2.5 py-1 bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] text-xs rounded-md cursor-pointer"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* AI Management Status */}
        <div className="bg-[#202c33] p-3 rounded-xl border border-[#2a3942] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-2 text-[#00a884]">
              <Bot className="w-4 h-4" />
              ניהול Noa AI
            </span>
            <input
              type="checkbox"
              checked={contact.isAiManaged}
              onChange={onToggleAi}
              className="w-4 h-4 accent-[#00a884] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-[#8696a0] leading-relaxed">
            {contact.isAiManaged
              ? 'בינה מלאכותית משיבה אוטומטית להודעות של לקוח זה במערכת.'
              : 'המענה האוטומטי כבוי. מענה אנושי בלבד.'}
          </p>
        </div>

        {/* Read Receipts (Blue Ticks) Override Settings */}
        <div className="bg-[#202c33] p-3.5 rounded-xl border border-[#2a3942] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-2 text-[#53bdeb]">
              <CheckCheck className="w-4 h-4" />
              הגדרת אישורי קריאה (וי כחול)
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isEffectiveBlue ? 'bg-[#53bdeb]/20 text-[#53bdeb] border border-[#53bdeb]/40' : 'bg-[#182229] text-[#8696a0] border border-[#2a3942]'
            }`}>
              {isEffectiveBlue ? (
                <>
                  <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                  <span>וי כחול פעיל</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-[#8696a0]" />
                  <span>אפור בלבד</span>
                </>
              )}
            </span>
          </div>

          <p className="text-[11px] text-[#8696a0] leading-snug">
            הגדר האם הודעות שנקרות מאיש קשר זה יציגו סימון 'וי כחול' או יישארו אפורות בלבד.
          </p>

          <div className="space-y-2 text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#182229] border border-transparent hover:border-[#2a3942] transition-all">
              <input
                type="radio"
                name="blueTicksOverride"
                checked={currentOverride === 'global'}
                onChange={() => onUpdateContactBlueTicks?.('global')}
                className="accent-[#00a884] cursor-pointer"
              />
              <span className="text-[#e9edef] text-xs">
                ברירת מחדל גלובלית ({globalBlueTicks ? 'וי כחול מופעל' : 'וי כחול מושבת'})
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#182229] border border-transparent hover:border-[#2a3942] transition-all">
              <input
                type="radio"
                name="blueTicksOverride"
                checked={currentOverride === 'enabled'}
                onChange={() => onUpdateContactBlueTicks?.('enabled')}
                className="accent-[#00a884] cursor-pointer"
              />
              <span className="text-[#53bdeb] font-semibold text-xs flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                הפעל וי כחול תמיד עבור איש קשר זה
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#182229] border border-transparent hover:border-[#2a3942] transition-all">
              <input
                type="radio"
                name="blueTicksOverride"
                checked={currentOverride === 'disabled'}
                onChange={() => onUpdateContactBlueTicks?.('disabled')}
                className="accent-[#00a884] cursor-pointer"
              />
              <span className="text-[#8696a0] font-medium text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                בטל וי כחול (אפור בלבד) עבור איש קשר זה
              </span>
            </label>
          </div>
        </div>

        {/* Quick Action Toggles */}
        <div className="space-y-1">
          <button
            onClick={onTogglePin}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#202c33] text-sm text-right cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Pin className="w-4 h-4 text-[#8696a0]" />
              נעץ שיחה בראש הרשימה
            </span>
            <span className="text-xs font-semibold text-[#00a884]">
              {contact.isPinned ? 'נעוץ' : 'לא נעוץ'}
            </span>
          </button>

          <button
            onClick={onToggleArchive}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#202c33] text-sm text-right cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Archive className="w-4 h-4 text-[#8696a0]" />
              {contact.isArchived ? 'הוצא מתוך הארכיון' : 'העבר שיחה לארכיון'}
            </span>
            <span className={`text-xs font-semibold ${contact.isArchived ? 'text-amber-400' : 'text-[#8696a0]'}`}>
              {contact.isArchived ? 'בארכיון' : 'פעיל'}
            </span>
          </button>

          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#202c33] text-sm text-right cursor-pointer">
            <span className="flex items-center gap-3">
              <BellOff className="w-4 h-4 text-[#8696a0]" />
              השתק התראות
            </span>
            <span className="text-xs text-[#8696a0]">כבוי</span>
          </button>
        </div>

        {/* Notes */}
        <div>
          <h4 className="text-xs font-semibold text-[#8696a0] mb-1 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            הערות פנימיות
          </h4>
          <p className="text-xs text-[#d1d7db] bg-[#202c33] p-2.5 rounded-lg border border-[#2a3942] italic">
            {contact.notes || 'אין הערות פנימיות רשומות.'}
          </p>
        </div>
      </div>
    </div>
  );
};

