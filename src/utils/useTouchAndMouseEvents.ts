import { useState, useRef, useCallback, useEffect, TouchEvent, MouseEvent } from 'react';

export interface TouchPosition {
  x: number;
  y: number;
}

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  deltaX: number;
  deltaY: number;
  velocity: number;
}

export interface UseTouchAndMouseOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onTap?: () => void;
  swipeThreshold?: number; // Minimum pixels to register swipe (default: 40)
  longPressDelay?: number; // Delay in ms for long press (default: 500)
  preventDefaultOnSwipe?: boolean;
}

export interface TouchAndMouseHandlers {
  onTouchStart: (e: TouchEvent<HTMLElement>) => void;
  onTouchMove: (e: TouchEvent<HTMLElement>) => void;
  onTouchEnd: (e: TouchEvent<HTMLElement>) => void;
  onMouseDown: (e: MouseEvent<HTMLElement>) => void;
  onMouseMove: (e: MouseEvent<HTMLElement>) => void;
  onMouseUp: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave: (e: MouseEvent<HTMLElement>) => void;
}

export interface TouchAndMouseState {
  isSwiping: boolean;
  isPressing: boolean;
  startPos: TouchPosition | null;
  currentPos: TouchPosition | null;
  deltaX: number;
  deltaY: number;
  lastSwipeDirection: 'left' | 'right' | 'up' | 'down' | null;
}

/**
 * Custom hook providing robust Mouse & Touch Event handling for PWA Mobile & Desktop apps
 * Supports Swiping, Long-Pressing, Double-Tapping, and Drag tracking for Android, iPhone, and Desktop Web.
 */
export function useTouchAndMouseEvents(options: UseTouchAndMouseOptions = {}): {
  handlers: TouchAndMouseHandlers;
  state: TouchAndMouseState;
  resetState: () => void;
} {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onDoubleTap,
    onTap,
    swipeThreshold = 40,
    longPressDelay = 500,
    preventDefaultOnSwipe = false,
  } = options;

  const [isSwiping, setIsSwiping] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [startPos, setStartPos] = useState<TouchPosition | null>(null);
  const [currentPos, setCurrentPos] = useState<TouchPosition | null>(null);
  const [deltaX, setDeltaX] = useState(0);
  const [deltaY, setDeltaY] = useState(0);
  const [lastSwipeDirection, setLastSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  const startTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const isMouseDownRef = useRef<boolean>(false);

  // Clear timers
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Start Gesture
  const handleStart = useCallback(
    (x: number, y: number) => {
      clearLongPressTimer();
      const now = Date.now();
      startTimeRef.current = now;

      setStartPos({ x, y });
      setCurrentPos({ x, y });
      setDeltaX(0);
      setDeltaY(0);
      setIsPressing(true);
      setIsSwiping(false);

      // Long Press Timer
      if (onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          onLongPress();
          setIsPressing(false);
          // Vibrate if available on Android
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(60);
            } catch (e) {}
          }
        }, longPressDelay);
      }
    },
    [clearLongPressTimer, longPressDelay, onLongPress]
  );

  // Move Gesture
  const handleMove = useCallback(
    (x: number, y: number, event?: Event) => {
      if (!startPos) return;

      const dX = x - startPos.x;
      const dY = y - startPos.y;

      setDeltaX(dX);
      setDeltaY(dY);
      setCurrentPos({ x, y });

      const absX = Math.abs(dX);
      const absY = Math.abs(dY);

      if (absX > 10 || absY > 10) {
        clearLongPressTimer();
        setIsSwiping(true);

        if (preventDefaultOnSwipe && event && event.cancelable) {
          event.preventDefault();
        }
      }
    },
    [clearLongPressTimer, preventDefaultOnSwipe, startPos]
  );

  // End Gesture
  const handleEnd = useCallback(() => {
    clearLongPressTimer();
    setIsPressing(false);

    if (!startPos || !currentPos) {
      setIsSwiping(false);
      return;
    }

    const dX = currentPos.x - startPos.x;
    const dY = currentPos.y - startPos.y;
    const absX = Math.abs(dX);
    const absY = Math.abs(dY);
    const duration = Date.now() - startTimeRef.current;

    // Swipe Detection
    if (absX >= swipeThreshold || absY >= swipeThreshold) {
      if (absX > absY) {
        // Horizontal Swipe
        if (dX < 0) {
          setLastSwipeDirection('left');
          onSwipeLeft?.();
        } else {
          setLastSwipeDirection('right');
          onSwipeRight?.();
        }
      } else {
        // Vertical Swipe
        if (dY < 0) {
          setLastSwipeDirection('up');
          onSwipeUp?.();
        } else {
          setLastSwipeDirection('down');
          onSwipeDown?.();
        }
      }
    } else if (duration < 300 && absX < 10 && absY < 10) {
      // Tap & Double Tap Detection
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;

      if (timeSinceLastTap < 280 && timeSinceLastTap > 0) {
        onDoubleTap?.();
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
        onTap?.();
      }
    }

    setIsSwiping(false);
    setStartPos(null);
    setCurrentPos(null);
  }, [clearLongPressTimer, currentPos, onDoubleTap, onSwipeDown, onSwipeLeft, onSwipeRight, onSwipeUp, onTap, startPos, swipeThreshold]);

  // Touch Event Handlers
  const onTouchStart = useCallback(
    (e: TouchEvent<HTMLElement>) => {
      const touch = e.touches[0];
      if (touch) {
        handleStart(touch.clientX, touch.clientY);
      }
    },
    [handleStart]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent<HTMLElement>) => {
      const touch = e.touches[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY, e.nativeEvent);
      }
    },
    [handleMove]
  );

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Mouse Event Handlers
  const onMouseDown = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      isMouseDownRef.current = true;
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!isMouseDownRef.current) return;
      handleMove(e.clientX, e.clientY, e.nativeEvent);
    },
    [handleMove]
  );

  const onMouseUp = useCallback(() => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      handleEnd();
    }
  }, [handleEnd]);

  const onMouseLeave = useCallback(() => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      handleEnd();
    }
  }, [handleEnd]);

  const resetState = useCallback(() => {
    clearLongPressTimer();
    setIsSwiping(false);
    setIsPressing(false);
    setStartPos(null);
    setCurrentPos(null);
    setDeltaX(0);
    setDeltaY(0);
    setLastSwipeDirection(null);
  }, [clearLongPressTimer]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
    state: {
      isSwiping,
      isPressing,
      startPos,
      currentPos,
      deltaX,
      deltaY,
      lastSwipeDirection,
    },
    resetState,
  };
}
