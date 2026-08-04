import { ContactTag } from '../types';

export type TagColorKey = 'amber' | 'emerald' | 'rose' | 'indigo' | 'cyan' | 'purple' | 'blue' | 'slate' | 'orange' | 'pink';

export interface TagColorPreset {
  key: TagColorKey;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  badgeClass: string;
}

export const TAG_COLORS: Record<TagColorKey, TagColorPreset> = {
  amber: {
    key: 'amber',
    label: 'זהב (VIP)',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  emerald: {
    key: 'emerald',
    label: 'ירוק (ליד חדש)',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  rose: {
    key: 'rose',
    label: 'אדום (דחוף)',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/30',
    dotClass: 'bg-rose-400',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  indigo: {
    key: 'indigo',
    label: 'אינדיגו (קבלן)',
    bgClass: 'bg-indigo-500/15',
    textClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/30',
    dotClass: 'bg-indigo-400',
    badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
  cyan: {
    key: 'cyan',
    label: 'ציאן (סיטונאי)',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/30',
    dotClass: 'bg-cyan-400',
    badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  },
  purple: {
    key: 'purple',
    label: 'סגול (במעקב)',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
    dotClass: 'bg-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  blue: {
    key: 'blue',
    label: 'כחול (קבוע)',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
    dotClass: 'bg-blue-400',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  orange: {
    key: 'orange',
    label: 'כתום (הספקה)',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
    dotClass: 'bg-orange-400',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  pink: {
    key: 'pink',
    label: 'ורוד (קייטרינג)',
    bgClass: 'bg-pink-500/15',
    textClass: 'text-pink-400',
    borderClass: 'border-pink-500/30',
    dotClass: 'bg-pink-400',
    badgeClass: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  },
  slate: {
    key: 'slate',
    label: 'אפור (כללי)',
    bgClass: 'bg-slate-500/15',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-500/30',
    dotClass: 'bg-slate-400',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  },
};

// Quick preset tags requested by prompt + default CRM tags
export const PRESET_TAGS: ContactTag[] = [
  { id: 'tag_vip', name: 'VIP', color: 'amber' },
  { id: 'tag_new_lead', name: 'New Lead', color: 'emerald' },
  { id: 'tag_urgent', name: 'Urgent', color: 'rose' },
  { id: 'tag_contractor', name: 'קבלן VIP', color: 'indigo' },
  { id: 'tag_wholesale', name: 'סיטונאי', color: 'cyan' },
  { id: 'tag_followup', name: 'במעקב', color: 'purple' },
];

/**
 * Returns tag color preset configuration
 */
export function getTagColorConfig(colorKeyOrName?: string): TagColorPreset {
  if (colorKeyOrName && TAG_COLORS[colorKeyOrName as TagColorKey]) {
    return TAG_COLORS[colorKeyOrName as TagColorKey];
  }

  const name = (colorKeyOrName || '').toLowerCase();
  if (name.includes('vip') || name.includes('זהב')) return TAG_COLORS.amber;
  if (name.includes('lead') || name.includes('חדש') || name.includes('פנייה')) return TAG_COLORS.emerald;
  if (name.includes('urgent') || name.includes('דחוף') || name.includes('חוב')) return TAG_COLORS.rose;
  if (name.includes('קבלן') || name.includes('פרויקט')) return TAG_COLORS.indigo;
  if (name.includes('סיטונאי') || name.includes('חנות')) return TAG_COLORS.cyan;
  if (name.includes('מעקב') || name.includes('פתוח')) return TAG_COLORS.purple;
  if (name.includes('אירוע') || name.includes('אוכל')) return TAG_COLORS.pink;
  if (name.includes('הובלה') || name.includes('משלוח')) return TAG_COLORS.orange;
  if (name.includes('צוות') || name.includes('קבוצה') || name.includes('ספק')) return TAG_COLORS.blue;

  return TAG_COLORS.slate;
}

/**
 * Gets normalized tags array from a contact
 */
export function getContactTags(contact: { tags?: ContactTag[]; labels?: string[] }): ContactTag[] {
  if (contact.tags && contact.tags.length > 0) {
    return contact.tags;
  }
  if (contact.labels && contact.labels.length > 0) {
    return contact.labels.map((lbl, idx) => {
      const matchedPreset = PRESET_TAGS.find((p) => p.name.toLowerCase() === lbl.toLowerCase());
      if (matchedPreset) return matchedPreset;
      const colorCfg = getTagColorConfig(lbl);
      return {
        id: `label_${idx}_${lbl}`,
        name: lbl,
        color: colorCfg.key,
      };
    });
  }
  return [];
}
