import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Bell,
  Volume2,
  CheckCircle,
  Share,
  PlusSquare,
  HelpCircle,
  ShieldCheck,
  Vibrate,
  Hand,
  X,
  Radio,
  Zap,
  Globe,
  Music,
  Check
} from 'lucide-react';
import {
  isMobileDevice,
  isIOSDevice,
  isAndroidDevice,
  isStandalonePWA,
  requestNotificationPermission,
  getNotificationPermissionState,
  sendNotification,
  playNotificationSound,
  startRingtoneLoop,
  stopRingtoneLoop,
  triggerVibration
} from '../utils/notificationService';
import { useTouchAndMouseEvents } from '../utils/useTouchAndMouseEvents';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAMobileInstallerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAMobileInstaller: React.FC<PWAMobileInstallerProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isPlayingRingtone, setIsPlayingRingtone] = useState(false);
  const [gestureTestLog, setGestureTestLog] = useState<string>('נסה להחליק, ללחוץ ארוכות או ללחוץ פעמיים בריבוע למטה');
  const [activeTab, setActiveTab] = useState<'install' | 'notifications' | 'gestures' | 'vercel'>('install');

  // Detect PWA state & listen for install prompt
  useEffect(() => {
    setIsInstalled(isStandalonePWA());
    setNotificationPermission(getNotificationPermissionState());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismissAndNeverShow = () => {
    try {
      localStorage.setItem('pwa_banner_dismissed', 'true');
    } catch (e) {}
    stopRingtoneLoop();
    setIsPlayingRingtone(false);
    onClose();
  };
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Error launching prompt:', err);
    }
  };

  // Handle Notification permission request
  const handleRequestNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      sendNotification('נועה AI - התראות וצלילי Push הופעלו! 🔔', {
        body: 'המערכת תתריע על הזמנות נכנסות, עדכוני לוגיסטיקה וסידור עבודה.',
        soundType: 'auto',
      });
    }
  };

  // Sound Tests
  const handleTestChime = () => {
    playNotificationSound('mobile');
    triggerVibration([80, 40, 100]);
  };

  const handleToggleRingtone = () => {
    if (isPlayingRingtone) {
      stopRingtoneLoop();
      setIsPlayingRingtone(false);
    } else {
      startRingtoneLoop();
      setIsPlayingRingtone(true);
    }
  };

  // Touch & Mouse Gesture Test Handlers
  const { handlers, state } = useTouchAndMouseEvents({
    onSwipeRight: () => {
      setGestureTestLog('➔ החלקה ימינה (Swipe Right)');
      triggerVibration(50);
    },
    onSwipeLeft: () => {
      setGestureTestLog('⬅ החלקה שמאלה (Swipe Left)');
      triggerVibration(50);
    },
    onSwipeUp: () => {
      setGestureTestLog('⬆ החלקה למעלה (Swipe Up)');
      triggerVibration(50);
    },
    onSwipeDown: () => {
      setGestureTestLog('⬇ החלקה למטה (Swipe Down)');
      triggerVibration(50);
    },
    onLongPress: () => {
      setGestureTestLog('🖐️ לחיצה ממושכת מזוהה (Long Press)');
      triggerVibration([100, 50, 100]);
    },
    onDoubleTap: () => {
      setGestureTestLog('⚡ לחיצה כפולה (Double Tap)');
      triggerVibration([40, 40]);
    },
    onTap: () => {
      setGestureTestLog('הקשה בודדת (Single Tap)');
    },
    swipeThreshold: 35,
    longPressDelay: 450,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in text-[#e9edef] dir-rtl">
      <div className="relative w-full max-w-lg bg-[#0f172a] border border-[#38bdf8]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3a8a] via-[#0f172a] to-[#1e293b] p-4 border-b border-[#3b82f6]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#38bdf8]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">מרכז PWA והתקנה למובייל</h3>
              <p className="text-xs text-blue-200/80">אנדרואיד, אייפון (iOS) ופריסת Vercel</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopRingtoneLoop();
              setIsPlayingRingtone(false);
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-800 bg-[#0b141a] px-2 pt-2 gap-1 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setActiveTab('install')}
            className={`px-3 py-2 rounded-t-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'install'
                ? 'bg-[#1e293b] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>התקנה (PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-2 rounded-t-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-[#1e293b] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>התראות וצלצול</span>
          </button>
          <button
            onClick={() => setActiveTab('gestures')}
            className={`px-3 py-2 rounded-t-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'gestures'
                ? 'bg-[#1e293b] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>אירועי מגע/עכבר</span>
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`px-3 py-2 rounded-t-lg font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
              activeTab === 'vercel'
                ? 'bg-[#1e293b] text-[#38bdf8] border-t-2 border-[#38bdf8]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>תאימות Vercel</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-sm flex-1">
          {/* TAB 1: INSTALLATION (ANDROID & IOS) */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              {/* Standalone Active Banner */}
              {isInstalled ? (
                <div className="p-3.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center gap-3 text-[#10b981]">
                  <CheckCircle className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">האפליקציה מותקנת ופועלת כמובייל Standalone PWA!</p>
                    <p className="text-xs text-emerald-300/80">יש לך ניווט מסך מלא, תמיכת אופליין וגישה מהירה מסך הבית.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-xs text-blue-200">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#38bdf8] animate-pulse" />
                    <span>זיהוי פלטפורמה: <strong>{isIOSDevice() ? 'אייפון (iOS Safari)' : isAndroidDevice() ? 'אנדרואיד (Android Chrome)' : 'דפדפן שולחני (Desktop)'}</strong></span>
                  </div>
                </div>
              )}

              {/* Android Direct Install Button */}
              {isAndroidDevice() && !isInstalled && (
                <div className="p-4 rounded-xl bg-[#1e293b] border border-[#38bdf8]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Smartphone className="w-4 h-4 text-[#10b981]" />
                      <span>התקנה קלה באנדרואיד</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      1-Click Install
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    לחץ על הכפתור למטה להתקנת האפליקציה ישירות למסך הבית ללא צורך בהורדה מחנות האפליקציות.
                  </p>
                  {deferredPrompt ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleInstallClick}
                        className="flex-1 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>התקן עכשיו באנדרואיד</span>
                      </button>
                      <button
                        onClick={handleDismissAndNeverShow}
                        className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>לא להתקין</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-gray-800/80 text-xs text-gray-300 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>כדי להתקין, פתח את תפריט הדפדפן (⋮) ובחר "הוסף למסך הבית" או "התקן אפליקציה".</span>
                    </div>
                  )}
                </div>
              )}

              {/* iOS / iPhone Installation Instructions */}
              {(isIOSDevice() || !isAndroidDevice()) && !isInstalled && (
                <div className="p-4 rounded-xl bg-[#1e293b] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Share className="w-4 h-4 text-amber-400" />
                      <span>הוראות התקנה לאייפון (iOS Safari)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      Apple PWA Guide
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    מכשירי iPhone אינם מאפשרים התקנה בלחיצה אחת. בצע את הצעדים הפשוטים הבאים בדפדפן Safari:
                  </p>
                  <ol className="space-y-2 text-xs text-gray-200 pr-2">
                    <li className="flex items-center gap-2.5 bg-[#0f172a] p-2 rounded-lg border border-gray-800">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">1</span>
                      <span>לחץ על כפתור <strong>השיתוף (Share ⎋)</strong> בתחתית או בראש המסך בספארי.</span>
                    </li>
                    <li className="flex items-center gap-2.5 bg-[#0f172a] p-2 rounded-lg border border-gray-800">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">2</span>
                      <span>גלול בתפריט ובחר באפשרות <strong>"הוסף למסך הבית" (Add to Home Screen ➕)</strong>.</span>
                    </li>
                    <li className="flex items-center gap-2.5 bg-[#0f172a] p-2 rounded-lg border border-gray-800">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">3</span>
                      <span>לחץ על <strong>"הוסף"</strong> בפינה העליונה. האפליקציה תופיע כסמל במסך הבית!</span>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS & RINGTONE */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {/* Permission card */}
              <div className="p-3.5 rounded-xl bg-[#1e293b] border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white text-xs">הרשאת התראות דפדפן</p>
                  <p className="text-[11px] text-gray-400">
                    סטטוס נוכחי: <strong className={notificationPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>{notificationPermission}</strong>
                  </p>
                </div>
                {notificationPermission !== 'granted' ? (
                  <button
                    onClick={handleRequestNotifications}
                    className="px-3 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white font-medium text-xs flex items-center gap-1.5 shadow"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>אפשר התראות</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>מאושר</span>
                  </span>
                )}
              </div>

              {/* Audio Sound & Ringtone Test Controls */}
              <div className="p-4 rounded-xl bg-[#1e293b] border border-[#38bdf8]/30 space-y-3">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Volume2 className="w-4 h-4 text-[#38bdf8]" />
                  <span>בדיקת צלילים וצלצולי אזהרה</span>
                </div>
                <p className="text-xs text-gray-300">
                  מנוע הצלילים פועל ישירות דרך Web Audio API ומותאם לרמקול הנייד.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleTestChime}
                    className="p-2.5 rounded-xl bg-[#0f172a] hover:bg-gray-800 border border-gray-700 text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>צליל התראה מהיר (Chime)</span>
                  </button>

                  <button
                    onClick={handleToggleRingtone}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors active:scale-95 ${
                      isPlayingRingtone
                        ? 'bg-rose-900/60 border-rose-500 text-white animate-pulse'
                        : 'bg-[#0f172a] hover:bg-gray-800 border-gray-700 text-white'
                    }`}
                  >
                    <Music className="w-4 h-4 text-[#38bdf8]" />
                    <span>{isPlayingRingtone ? 'עצור צלצול שיחה' : 'הפעל צלצול הזמנה (Ringtone)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MOUSE & TOUCH EVENT TESTER */}
          {activeTab === 'gestures' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-300">
                הכלי הבא מאפשר לבדוק את כל מחוות המגע והעכבר (Swiping, Long Press, Double Tap) הפעילות באפליקציה:
              </p>

              {/* Touchpad Interactive Area */}
              <div
                {...handlers}
                className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all select-none touch-manipulation ${
                  state.isSwiping
                    ? 'bg-[#38bdf8]/10 border-[#38bdf8] text-[#38bdf8]'
                    : state.isPressing
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                    : 'bg-[#0f172a] border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <Hand className={`w-8 h-8 mb-2 ${state.isPressing ? 'scale-125 text-emerald-400' : 'text-[#38bdf8]'}`} />
                <p className="font-bold text-xs">{gestureTestLog}</p>
                <div className="mt-2 text-[10px] text-gray-400 flex gap-3">
                  <span>DeltaX: {Math.round(state.deltaX)}px</span>
                  <span>DeltaY: {Math.round(state.deltaY)}px</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERCEL DEPLOYMENT INFORMATION */}
          {activeTab === 'vercel' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#1e293b] border border-gray-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Globe className="w-4 h-4 text-[#38bdf8]" />
                  <span>התאמה מלאה לפריסת Vercel Production</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  האפליקציה כוללת קובץ <code>vercel.json</code> מותאם עם כותרות Service Worker מתקדמות (<code>Service-Worker-Allowed: /</code>), נתיבי SPA Fallback מוגדרים, ותמיכה מלאה ב-HTTPS ו-PWA caching.
                </p>
                <div className="space-y-1 text-[11px] text-gray-400 pt-1">
                  <div className="flex justify-between border-t border-gray-800 pt-1">
                    <span>Service Worker Caching:</span>
                    <strong className="text-emerald-400">sw.js Network-First</strong>
                  </div>
                  <div className="flex justify-between border-t border-gray-800 pt-1">
                    <span>Manifest File:</span>
                    <strong className="text-emerald-400">manifest.json Validated</strong>
                  </div>
                  <div className="flex justify-between border-t border-gray-800 pt-1">
                    <span>Single Page Routing (SPA):</span>
                    <strong className="text-emerald-400">Rewrites Active</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0b141a] border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismissAndNeverShow}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 font-medium transition-colors flex items-center gap-1"
              title="אל תציג התראת התקנה יותר"
            >
              <X className="w-3.5 h-3.5" />
              <span>אל תציג שוב</span>
            </button>
            <span className="text-[11px] text-gray-500 hidden sm:inline">SabanOS & Noa AI Engine PWA</span>
          </div>

          <button
            onClick={() => {
              stopRingtoneLoop();
              setIsPlayingRingtone(false);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-[#1e293b] hover:bg-gray-800 text-white font-medium transition-colors flex items-center gap-1.5"
          >
            <span>סגור</span>
          </button>
        </div>
      </div>
    </div>
  );
};
