import React, { useState } from 'react';
import { useTouchAndMouseEvents } from '../utils/useTouchAndMouseEvents';
import { ArrowLeft, ArrowRight, RefreshCw, Hand, Vibrate } from 'lucide-react';

interface TouchGestureContainerProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onLongPress?: () => void;
  className?: string;
  enableVisualFeedback?: boolean;
}

export const TouchGestureContainer: React.FC<TouchGestureContainerProps> = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  onSwipeDown,
  onSwipeUp,
  onLongPress,
  className = '',
  enableVisualFeedback = true,
}) => {
  const [gestureIndicator, setGestureIndicator] = useState<string | null>(null);

  const triggerIndicator = (msg: string) => {
    if (!enableVisualFeedback) return;
    setGestureIndicator(msg);
    setTimeout(() => {
      setGestureIndicator(null);
    }, 1200);
  };

  const { handlers, state } = useTouchAndMouseEvents({
    onSwipeRight: () => {
      triggerIndicator('מחוות מחליק ימינה ➔');
      onSwipeRight?.();
    },
    onSwipeLeft: () => {
      triggerIndicator('⬅ מחוות מחליק שמאלה');
      onSwipeLeft?.();
    },
    onSwipeDown: () => {
      triggerIndicator('⬇ מחוות גלילה מטה');
      onSwipeDown?.();
    },
    onSwipeUp: () => {
      triggerIndicator('⬆ מחוות גלילה מעלה');
      onSwipeUp?.();
    },
    onLongPress: () => {
      triggerIndicator('🖐️ לחיצה ממושכת (Long Press)');
      onLongPress?.();
    },
    swipeThreshold: 45,
    longPressDelay: 500,
  });

  return (
    <div
      {...handlers}
      className={`relative select-none touch-manipulation transition-transform duration-100 ${
        state.isPressing ? 'scale-[0.998]' : ''
      } ${className}`}
    >
      {/* Toast floating visual indicator for touch & mouse gestures */}
      {gestureIndicator && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b]/90 text-[#38bdf8] backdrop-blur-md border border-[#38bdf8]/30 px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in pointer-events-none">
          <Hand className="w-3.5 h-3.5 text-[#10b981] animate-bounce" />
          <span>{gestureIndicator}</span>
        </div>
      )}

      {children}
    </div>
  );
};
