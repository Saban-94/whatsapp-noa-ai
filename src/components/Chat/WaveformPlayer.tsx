import React, { useState } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface WaveformPlayerProps {
  duration?: string;
  waveform?: number[];
  isOutgoing?: boolean;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  duration = '0:18',
  waveform = [20, 45, 80, 60, 30, 90, 70, 40, 60, 85, 40, 25, 60, 95, 70, 30, 50, 20],
  isOutgoing = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Simulate playback
      let p = progress;
      const interval = setInterval(() => {
        p += 5;
        if (p > 100) {
          p = 0;
          setIsPlaying(false);
          clearInterval(interval);
        }
        setProgress(p);
      }, 150);
    }
  };

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[220px]">
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
          isOutgoing
            ? 'bg-[#00a884] text-[#111b21]'
            : 'bg-[#00a884] text-white'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current mr-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform Bars */}
        <div className="flex items-center gap-0.5 h-6">
          {waveform.map((heightPercent, index) => {
            const barProgress = (index / waveform.length) * 100;
            const isPlayed = barProgress <= progress;

            return (
              <div
                key={index}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? '#00a884'
                    : isOutgoing
                    ? 'bg-[#00a884]/40'
                    : 'bg-[#8696a0]/40'
                }`}
                style={{
                  height: `${Math.max(20, heightPercent)}%`,
                  backgroundColor: isPlayed ? '#00a884' : undefined,
                }}
              />
            );
          })}
        </div>

        {/* Audio Duration */}
        <div className="flex items-center justify-between text-[10px] text-[#8696a0]">
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3 text-[#00a884]" />
            הודעה קולית
          </span>
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
};
