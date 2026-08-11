/**
 * Advanced Notification & Audio Alert Service for Noa AI & SabanOS Mobile PWA
 * Optimized for Android, iOS Safari, Desktop Browsers & Vercel Deployments.
 */

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  silent?: boolean;
  soundType?: 'mobile' | 'desktop' | 'ringtone' | 'auto';
}

// Device & OS Detectors
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isAndroidDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

export const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Web Audio API Ringtone & Chime Sound Engine
let audioCtx: AudioContext | null = null;
let ringtoneInterval: NodeJS.Timeout | null = null;

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
 * Trigger Haptic Vibration feedback on supported devices (Android)
 */
export const triggerVibration = (pattern: number | number[] = [100, 50, 150]): void => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
};

/**
 * Play single chime alert (Mobile double-chime or Desktop radar sweep)
 */
export const playNotificationSound = (type: 'mobile' | 'desktop' | 'ringtone' | 'auto' = 'auto'): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const actualType = type === 'auto' ? (isMobileDevice() ? 'mobile' : 'desktop') : type;

    if (actualType === 'mobile') {
      // Mobile Double-Chime Ding (A5 -> D6)
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.1);
      gain2.gain.setValueAtTime(0.45, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.32);

      triggerVibration([80, 40, 120]);

    } else if (actualType === 'ringtone') {
      // Phone Ringtone Pattern Sequence
      playIncomingOrderRingtoneOnce();
    } else {
      // Desktop Crisp Tri-Tone Radar Chord Sweep (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99];
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
    console.warn('[NotificationService] Audio play error:', err);
  }
};

/**
 * Single sequence ringtone burst for incoming orders
 */
const playIncomingOrderRingtoneOnce = (): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 880, delay: 0.0, duration: 0.15 },
    { freq: 1108.73, delay: 0.15, duration: 0.15 },
    { freq: 1318.51, delay: 0.30, duration: 0.25 },
    { freq: 1760, delay: 0.60, duration: 0.35 },
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + note.delay;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, startTime);
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + note.duration);
  });

  triggerVibration([200, 100, 200, 100, 300]);
};

/**
 * Start continuous incoming call/order ringtone alert loop
 */
export const startRingtoneLoop = (): void => {
  stopRingtoneLoop();
  playIncomingOrderRingtoneOnce();
  ringtoneInterval = setInterval(() => {
    playIncomingOrderRingtoneOnce();
  }, 2200);
};

/**
 * Stop continuous ringtone alert loop
 */
export const stopRingtoneLoop = (): void => {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
};

/**
 * Request Browser Notification Permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[NotificationService] Web Notifications not supported in this environment');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[NotificationService] Error requesting notification permission:', err);
    return 'denied';
  }
};

/**
 * Check Notification Permission State
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

  if (!silent) {
    playNotificationSound(soundType);
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
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
    soundType: 'ringtone',
  });
};
