import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface MediaLightboxModalProps {
  isOpen: boolean;
  mediaUrl: string | null;
  caption?: string;
  senderName?: string;
  timestamp?: string;
  onClose: () => void;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  isOpen,
  mediaUrl,
  caption,
  senderName,
  timestamp,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, mediaUrl]);

  // Keyboard controls (Esc to close, + / - to zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoom]);

  if (!isOpen || !mediaUrl) return null;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.3, 0.5);
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = `SabanOS_Media_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-between select-none animate-fadeIn"
      onClick={(e) => {
        // Close modal if user clicks on backdrop, not image or controls
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Navigation Bar */}
      <div className="w-full bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="סגור (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            {senderName && <p className="text-sm font-semibold text-white/90">{senderName}</p>}
            {timestamp && <p className="text-xs text-white/60">{timestamp}</p>}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-1.5 rounded-full hover:bg-white/20 text-white disabled:opacity-30 transition-all cursor-pointer"
            title="הקטן (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-0.5 rounded text-xs font-mono font-medium hover:bg-white/20 text-white/90 transition-all cursor-pointer"
            title="איפוס תצוגה"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1.5 rounded-full hover:bg-white/20 text-white disabled:opacity-30 transition-all cursor-pointer"
            title="הגדל (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          <button
            onClick={handleRotate}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer"
            title="סובב (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer"
            title="הורד תמונה"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer"
            title="מסך מלא"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-hidden p-4 relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={mediaUrl}
          alt={caption || 'מדיה בצ׳אט'}
          draggable={false}
          className="max-h-[82vh] max-w-[90vw] object-contain transition-transform duration-100 ease-out shadow-2xl rounded-lg"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      {/* Caption Footer */}
      {caption && (
        <div className="w-full bg-gradient-to-t from-black/90 to-transparent p-4 text-center z-10">
          <p className="text-sm text-white/90 bg-black/60 backdrop-blur-md inline-block px-4 py-2 rounded-xl border border-white/10 max-w-xl">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
};
