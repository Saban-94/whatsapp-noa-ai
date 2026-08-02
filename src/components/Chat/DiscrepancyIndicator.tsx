import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Message } from '../../types';

interface DiscrepancyIndicatorProps {
  isReviewed?: boolean;
  onMarkReviewed?: () => void;
  darkTheme?: boolean;
  messageText?: string;
}

export const DiscrepancyIndicator: React.FC<DiscrepancyIndicatorProps> = ({
  isReviewed: initialReviewed = false,
  onMarkReviewed,
  darkTheme = false,
  messageText = '',
}) => {
  const [reviewed, setReviewed] = useState(initialReviewed);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleReviewed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !reviewed;
    setReviewed(nextState);
    if (onMarkReviewed) {
      onMarkReviewed();
    }
  };

  if (reviewed) {
    return (
      <div className="flex items-center justify-between gap-2 px-2.5 py-1 mb-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium select-none">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>נבדק ואושר על ידי הבקר</span>
        </div>
        <button
          onClick={handleToggleReviewed}
          className="text-[10px] underline hover:opacity-80 cursor-pointer"
        >
          בטל אישור
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2.5 rounded-md overflow-hidden border border-red-500/40 bg-red-500/10 dark:bg-red-950/40 select-none animate-in fade-in duration-200">
      {/* Alert Header Bar */}
      <div className="px-2.5 py-1.5 flex items-center justify-between text-red-600 dark:text-red-400 text-xs font-bold gap-2 bg-red-500/15 border-b border-red-500/20">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
          <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wide">
            Review Required / נדרשת בדיקה
          </span>
        </div>
        <span className="text-[10px] font-mono text-red-600 dark:text-red-300 bg-red-500/10 dark:bg-red-900/30 px-1.5 py-0.5 rounded border border-red-500/20">
          ⚠️ AUDIT FLAG
        </span>
      </div>

      {/* Alert Description Body */}
      <div className="p-2 text-[11px] leading-snug text-red-800 dark:text-red-200 space-y-1.5">
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="flex-1 font-medium">
            זוהתה אי-התאמה או חריגה בלוגים / הודעה זו. מומלץ לבצע אימות מול קומקס והזמנות רכש.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-red-500/15">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] font-semibold text-red-700 dark:text-red-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showDetails ? 'הסתר פרטים' : 'פרטי חריגה'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={handleToggleReviewed}
            className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>סמן כנבדק (Mark Reviewed)</span>
          </button>
        </div>

        {showDetails && (
          <div className="mt-1.5 p-1.5 rounded bg-black/5 dark:bg-black/30 border border-red-500/20 text-[10px] font-mono dir-rtl space-y-1">
            <div>🔍 <strong>סוג התראה:</strong> Discrepancy / Audit Keyword Match</div>
            <div>📋 <strong>פעולה מומלצת:</strong> בדוק כמויות מול מערכת הסידור והקומקס</div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Checks if a message contains discrepancy / audit keywords or flags.
 */
export function isDiscrepancyMessage(msg: Message): boolean {
  if (msg.hasDiscrepancy || msg.isDiscrepancy) {
    return true;
  }
  const content = `${msg.text || ''} ${msg.transcription || ''} ${msg.fileName || ''}`.toLowerCase();

  const keywords = [
    'discrepancy',
    'audit',
    'mismatch',
    'review required',
    'quantity discrepancy',
    'audit alert',
    'discrepancy alert',
    'חריגה',
    'חריגות',
    'אי התאמה',
    'אי-התאמה',
    'נדרשת בדיקה',
    'בדיקה נדרשת',
    'ביקורת',
    'חריגה לוגיסטית',
    'הפרש כמות',
  ];

  return keywords.some((kw) => content.includes(kw));
}
