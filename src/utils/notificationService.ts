/**
 * Notification & Sound Alert Service for Noa AI & SabanOS PWA
 */

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  silent?: boolean;
  soundType?: 'mobile' | 'desktop' | 'auto';
}

// Detect Mobile Device
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Web Audio API Sound Generator for Mobile vs Desktop
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Play distinct sound alert optimized for Mobile (double-chime ding) or Desktop (crisp radar alert)
 */
export const playNotificationSound = (type: 'mobile' | 'desktop' | 'auto' = 'auto'): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const actualType = type === 'auto' ? (isMobileDevice() ? 'mobile' : 'desktop') : type;

    if (actualType === 'mobile') {
      // Mobile Double-Chime Ding (High pitch, fast attack & decay for small speakers)
      const now = ctx.currentTime;
      
      // Tone 1: A5 (880 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Tone 2: D6 (1174.66 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.1);
      gain2.gain.setValueAtTime(0.4, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.3);

    } else {
      // Desktop Crisp Radar Alert (Harmonic tri-tone chord sweep: C5 -> E5 -> G5)
      const now = ctx.currentTime;

      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.25, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.4);
      });
    }
  } catch (err) {
    console.warn('[NotificationService] Audio playback error:', err);
  }
};

/**
 * Request Browser Notification Permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[NotificationService] Web Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[NotificationService] Error requesting permission:', err);
    return 'denied';
  }
};

/**
 * Check Notification Permission Status
 */
export const getNotificationPermissionState = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Send Native Browser Notification + Play Sound Alert
 */
export const sendNotification = async (
  title: string,
  options: NotificationOptions = {}
): Promise<boolean> => {
  const {
    body = '',
    icon = '/icon.svg',
    badge = '/icon.svg',
    tag,
    data,
    silent = false,
    soundType = 'auto',
  } = options;

  // Play audio alert first if not silent
  if (!silent) {
    playNotificationSound(soundType);
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.log('[NotificationService] Notification permission not granted');
    return false;
  }

  try {
    // Try Service Worker registration showNotification first for PWA consistency
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        await registration.showNotification(title, {
          body,
          icon,
          badge,
          tag,
          data,
          dir: 'rtl',
          lang: 'he',
          vibrate: [100, 50, 100],
        } as any);
        return true;
      }
    }

    // Fallback to standard window Notification constructor
    const notification = new Notification(title, {
      body,
      icon,
      badge,
      tag,
      data,
      dir: 'rtl',
      lang: 'he',
    } as any);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('[NotificationService] Failed to show notification:', err);
    return false;
  }
};

/**
 * Helper to notify on incoming order / logistics update
 */
export const notifyIncomingOrder = (contactName: string, orderDetails: string): void => {
  sendNotification(`הזמנה חדשה התקבלה מ-${contactName} 🚛`, {
    body: orderDetails,
    tag: 'order-incoming',
    soundType: 'auto',
  });
};

/**
 * Helper to notify on human operator intervention needed
 */
export const notifyHumanIntervention = (contactName: string, reason: string): void => {
  sendNotification(`⚠️ נדרשת התערבות אנושית: ${contactName}`, {
    body: reason,
    tag: 'human-intervention',
    soundType: 'auto',
  });
};

/**
 * Helper to notify on system exception or webhook failure
 */
export const notifySystemLogException = (source: string, errorMsg: string): void => {
  sendNotification(`🚨 שגיאת ניטור מערכת (${source})`, {
    body: errorMsg,
    tag: 'system-log-error',
    soundType: 'auto',
  });
};
