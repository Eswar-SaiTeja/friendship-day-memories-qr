'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Gift } from 'lucide-react';

interface ScratchCardProps {
  secretMessage: string;
  coverLabel?: string;
}

export default function ScratchCard({ secretMessage, coverLabel = "Scratch to Reveal Secret Message ✨" }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchedPercentage, setScratchedPercentage] = useState(0);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions based on container
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 320;
    canvas.height = rect?.height || 180;

    // Fill with a gorgeous metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ec4899'); // pink-500
    gradient.addColorStop(0.5, '#d946ef'); // fuchsia-500
    gradient.addColorStop(1, '#8b5cf6'); // violet-500

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add overlay text
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(coverLabel, canvas.width / 2, canvas.height / 2);

    // Draw some festive sparkles / stars on the cover
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 20; i++) {
      const rx = Math.random() * canvas.width;
      const ry = Math.random() * canvas.height;
      const rsize = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(rx, ry, rsize, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  useEffect(() => {
    initCanvas();
    // Re-initialize on resize
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, []);

  const getMousePos = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    // Check if mouse event
    const mouseEvent = e as MouseEvent;
    return {
      x: mouseEvent.clientX - rect.left,
      y: mouseEvent.clientY - rect.top
    };
  };

  const scratch = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || isRevealed) return;

    const pos = getMousePos(e);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
    ctx.fill();

    // Check scratched percentage occasionally
    if (Math.random() < 0.1) {
      calculateScratched(canvas, ctx);
    }
  };

  const calculateScratched = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparent = 0;
    
    // Check every 10th pixel to speed up computation
    for (let i = 0; i < pixels.length; i += 40) {
      if (pixels[i + 3] === 0) {
        transparent++;
      }
    }
    
    const percentage = (transparent / (pixels.length / 40)) * 100;
    setScratchedPercentage(Math.round(percentage));

    if (percentage > 55) {
      revealCard();
    }
  };

  const revealCard = () => {
    setIsRevealed(true);
    // Confetti burst for magic effect!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#ec4899', '#d946ef', '#8b5cf6', '#eab308']
    });
  };

  // Event handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsScratching(true);
    scratch(e.nativeEvent);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    e.preventDefault(); // stop scrolling when scratching
    scratch(e.nativeEvent);
  };

  const handleEnd = () => {
    setIsScratching(false);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-lg h-44 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-purple-950/40 border border-white/10 flex items-center justify-center p-6 mx-auto select-none"
    >
      {/* Revealed content (underneath) */}
      <div className="text-center z-0 px-4 py-2 transition-all duration-700 max-h-full overflow-y-auto">
        <Gift className="w-8 h-8 text-pink-400 mx-auto mb-2 animate-bounce" />
        <p className="text-lg md:text-xl font-medium text-white italic leading-relaxed font-serif">
          &ldquo;{secretMessage}&rdquo;
        </p>
      </div>

      {/* Scratch overlay canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className={`absolute inset-0 cursor-pointer z-10 transition-opacity duration-1000 ${
          isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />
    </div>
  );
}
