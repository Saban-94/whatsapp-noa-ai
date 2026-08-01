import React, { useState, useEffect } from 'react';
import { DoorOpen, Sparkles, Key, Bot, Shield, ChevronRight, Volume2 } from 'lucide-react';
import { playWhatsAppIncomingSound } from '../utils/audio';

interface SplashGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  darkTheme?: boolean;
}

export const SplashGateway: React.FC<SplashGatewayProps> = ({
  isOpen,
  onClose,
  darkTheme = true,
}) => {
  const [isSplitting, setIsSplitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsSplitting(false);
    }
  }, [isOpen]);

  const handleOpenGateway = () => {
    if (isSplitting) return;
    playWhatsAppIncomingSound();
    setIsSplitting(true);

    // Wait for door sliding transition to complete before closing container
    setTimeout(() => {
      setIsMounted(false);
      onClose();
    }, 1250);
  };

  if (!isMounted && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden select-none transition-opacity duration-500 ${
        !isMounted ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
      }`}
    >
      {/* LEFT DOOR PANEL */}
      <div
        className={`absolute top-0 left-0 w-1/2 h-full overflow-hidden transition-transform duration-[1200ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-20 ${
          isSplitting ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <img
          src="https://i.ibb.co/Zz6H1zth/1785576538638.png"
          alt="Noa AI Gateway Left Panel"
          className="absolute top-0 left-0 w-[100vw] max-w-none h-full object-cover object-center"
        />
        {/* Dark Vignette & Sci-Fi Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Golden/Emerald Metallic Seam Line on Right Edge */}
        <div className="absolute top-0 right-0 w-[3px] h-full bg-gradient-to-b from-[#00a884]/10 via-[#00a884] to-[#00a884]/10 shadow-[0_0_20px_#00a884]" />
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00a884_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* RIGHT DOOR PANEL */}
      <div
        className={`absolute top-0 right-0 w-1/2 h-full overflow-hidden transition-transform duration-[1200ms] ease-[cubic-bezier(0.77,0,0.175,1)] z-20 ${
          isSplitting ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <img
          src="https://i.ibb.co/Zz6H1zth/1785576538638.png"
          alt="Noa AI Gateway Right Panel"
          className="absolute top-0 right-0 w-[100vw] max-w-none h-full object-cover object-center"
        />
        {/* Dark Vignette & Sci-Fi Gradients */}
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Golden/Emerald Metallic Seam Line on Left Edge */}
        <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-[#00a884]/10 via-[#00a884] to-[#00a884]/10 shadow-[0_0_20px_#00a884]" />

        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#00a884_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* CENTER GATEWAY EMBLEM & ENTER BUTTON */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center z-30 transition-all duration-700 ${
          isSplitting ? 'opacity-0 scale-125 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        {/* Glowing Radar Pulse Background */}
        <div className="absolute w-96 h-96 rounded-full bg-[#00a884]/20 blur-3xl animate-pulse pointer-events-none" />

        {/* Central Gate Badge Box */}
        <div className="relative bg-[#111b21]/85 backdrop-blur-xl border-2 border-[#00a884]/60 p-8 rounded-3xl shadow-[0_0_60px_rgba(0,168,132,0.3)] max-w-sm w-full mx-4 text-center text-[#e9edef] space-y-6 flex flex-col items-center">
          
          {/* Avatar Ring */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#00a884] via-[#53bdeb] to-[#00a884] animate-spin blur-xs opacity-75" />
            <img
              src="https://i.ibb.co/Zz6H1zth/1785576538638.png"
              alt="Noa AI Avatar"
              className="relative w-28 h-28 rounded-full object-cover border-2 border-white shadow-2xl"
            />
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-[#00a884] border-2 border-[#111b21] rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white fill-current" />
            </span>
          </div>

          {/* Titles */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 text-[#00a884] text-xs font-bold tracking-wider uppercase mb-1">
              <Bot className="w-3.5 h-3.5" />
              SabanOS • Gateway OS
            </div>
            <h1 className="text-2xl font-black text-white tracking-wide">
              שער כניסה למערכת Noa AI
            </h1>
            <p className="text-xs text-[#8696a0] dir-rtl">
              לחץ למטה לפתיחת דלתות המערכת ואפקט הכניסה היוקרתי
            </p>
          </div>

          {/* Action Open Button */}
          <button
            onClick={handleOpenGateway}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-[#00a884] to-[#008f70] hover:from-[#00b991] hover:to-[#009c7b] text-[#111b21] font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(0,168,132,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <DoorOpen className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>פתח דלתות כניסה</span>
            <ChevronRight className="w-4 h-4 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>

          <p className="text-[10px] text-[#8696a0] flex items-center gap-1 font-mono">
            <Shield className="w-3 h-3 text-[#00a884]" />
            SabanOS Security Verified • Version 3.6
          </p>
        </div>
      </div>
    </div>
  );
};
