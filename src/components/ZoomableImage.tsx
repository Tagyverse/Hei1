import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, X } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ZoomableImage({ src, alt, className = '' }: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Increase zoom when clicking the zoom button or tapping on image
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale < 3) {
      setScale(scale + 0.5);
    }
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      setScale(scale - 0.5);
    } else {
      closeZoom();
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    if (!isZoomed) {
      setScale(1.5);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const closeZoom = () => {
    setIsZoomed(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed || scale === 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed || scale === 1) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Limit dragging within bounds
    const maxX = (scale - 1) * (containerRef.current?.clientWidth || 0) / 2;
    const maxY = (scale - 1) * (containerRef.current?.clientHeight || 0) / 2;

    setPosition({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!isZoomed) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.max(1, Math.min(3, scale + delta));
    setScale(newScale);
  };

  return (
    <div className="relative inline-block w-full">
      {/* Normal view */}
      <div className="relative group cursor-pointer" onClick={toggleZoom}>
        <img
          src={src}
          alt={alt}
          className={`${className} transition-transform duration-300 group-hover:scale-105`}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Zoomed modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={closeZoom}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Image container */}
          <div
            ref={containerRef}
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                willChange: 'transform'
              }}
              onMouseDown={handleMouseDown}
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Controls */}
          <div className="absolute top-6 right-6 flex gap-2 z-[10000]">
            <button
              onClick={handleZoomIn}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            <button
              onClick={closeZoom}
              className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl transition-all"
              aria-label="Close zoom"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-6 left-6 text-white/70 text-sm">
            <p>Drag to move • Scroll to zoom • Click X to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
