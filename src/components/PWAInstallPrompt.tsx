import React, { useState, useEffect } from 'react';
import { Download, Bell, BellOff, Smartphone, Check, X, ShieldAlert } from 'lucide-react';
import {
  requestNotificationPermission,
  getNotificationPermissionState,
  sendNotification,
  playNotificationSound,
} from '../utils/notificationService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  darkTheme?: boolean;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ darkTheme = true }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showNotificationTestToast, setShowNotificationTestToast] = useState(false);

  // Register Service Worker & Listen for beforeinstallprompt
  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[ServiceWorker] Successfully registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[ServiceWorker] Registration failed:', error);
          });
      });
    }

    // 2. Check if already running as PWA standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 3. Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA] App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Check initial notification permissions
    setNotificationPermission(getNotificationPermissionState());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle Install Action
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Error launching install prompt:', err);
    }
  };

  // Handle Requesting Notification Permission
  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      sendNotification('נועה AI - התראות הופעלו! 🔔', {
        body: bodyMessageForNotifications(),
        soundType: 'auto',
      });
      setShowNotificationTestToast(true);
      setTimeout(() => setShowNotificationTestToast(false), 4000);
    }
  };

  const bodyMessageForNotifications = () => {
    return 'המערכת מוכנה לקבלת התראות על הזמנות חיוניות, עדכוני לוגיסטיקה ושירות אנושי.';
  };

  const handleTestSound = () => {
    playNotificationSound('auto');
  };

  return (
    <>
      {/* Toast Notification when notifications are granted */}
      {showNotificationTestToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#10b981] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-bounce">
          <Bell className="w-4 h-4" />
          <span>התראות דפדפן וצלילי Push הופעלו בהצלחה!</span>
        </div>
      )}

      {/* Custom Install App Top/Bottom Banner if beforeinstallprompt caught */}
      {showInstallBanner && !isInstalled && deferredPrompt && (
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white border-b border-[#3b82f6]/30 px-4 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-sm z-40 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#38bdf8]" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">התקן את אפליקציית "נועה AI"</p>
              <p className="text-xs text-blue-200/80">גישה מהירה ישירות מסך הבית וצלילי התראה אופליין</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>התקן אפליקציה</span>
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
              title="סגור"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
