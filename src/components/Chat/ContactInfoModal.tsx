import React from 'react';
import { X, Phone, Bot, Pin, BellOff, ShieldAlert, Tag, Edit3, CheckCheck, Check } from 'lucide-react';
import { Contact } from '../../types';

interface ContactInfoModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleAi: () => void;
  onTogglePin: () => void;
  onUpdateContactBlueTicks?: (override: 'global' | 'enabled' | 'disabled') => void;
  globalBlueTicks?: boolean;
  darkTheme: boolean;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  contact,
  isOpen,
  onClose,
  onToggleAi,
  onTogglePin,
  onUpdateContactBlueTicks,
  globalBlueTicks = true,
  darkTheme,
}) => {
  if (!isOpen || !contact) return null;

  const currentOverride = contact.blueTicksOverride || 'global';
  const isEffectiveBlue = currentOverride === 'enabled' ? true : currentOverride === 'disabled' ? false : globalBlueTicks;

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
          <span className="mt-2 text-xs text-[#00a884] font-medium bg-[#00a884]/10 px-2.5 py-1 rounded-full">
            {contact.statusText || 'משתמש מחובר ב-SabanOS'}
          </span>
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

          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#202c33] text-sm text-right cursor-pointer">
            <span className="flex items-center gap-3">
              <BellOff className="w-4 h-4 text-[#8696a0]" />
              השתק התראות
            </span>
            <span className="text-xs text-[#8696a0]">כבוי</span>
          </button>
        </div>

        {/* Labels / Tags */}
        {contact.labels && contact.labels.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-[#8696a0] mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              תגיות וסיווג CRM
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {contact.labels.map((lbl) => (
                <span
                  key={lbl}
                  className="bg-[#202c33] border border-[#2a3942] text-[#d1d7db] text-xs px-2.5 py-1 rounded-md"
                >
                  {lbl}
                </span>
              ))}
            </div>
          </div>
        )}

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
