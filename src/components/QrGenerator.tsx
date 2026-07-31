'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Link as LinkIcon, Share2, Check, ArrowRight, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

interface QrGeneratorProps {
  slug: string;
  galleryName: string;
}

export default function QrGenerator({ slug, galleryName }: QrGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [dotColor, setDotColor] = useState('#db2777'); // pink-600
  const [bgColor, setBgColor] = useState('#0f172a'); // slate-900
  const [qrStyle, setQrStyle] = useState<'dots' | 'squares'>('dots');
  const [centerLogo, setCenterLogo] = useState<'heart' | 'star' | 'smile' | 'none'>('heart');
  const [frameText, setFrameText] = useState('Scan to Relive Memories ❤️');

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/gallery/${slug}` 
    : `/gallery/${slug}`;

  // Generate customized QR Code on Canvas
  const drawQr = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // 1. Generate QR matrix data with high error correction
      const qrData = QRCode.create(shareUrl, { errorCorrectionLevel: 'H' });
      const modules = qrData.modules;
      const size = modules.size;

      // 2. Set Canvas Size (Adding padding for frame)
      const scale = 8; // pixels per module
      const qrPadding = 24; // padding around QR code
      const frameHeight = frameText ? 60 : 0;
      
      canvas.width = size * scale + qrPadding * 2;
      canvas.height = size * scale + qrPadding * 2 + frameHeight;

      // 3. Clear and Draw Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rounded border for the canvas itself
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

      // 4. Draw Modules
      ctx.fillStyle = dotColor;

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const isDark = modules.get(c, r);
          if (!isDark) continue;

          // Detect finder patterns (top-left, top-right, bottom-left)
          const isFinder = 
            (r < 7 && c < 7) || // top-left
            (r < 7 && c >= size - 7) || // top-right
            (r >= size - 7 && c < 7); // bottom-left

          // Skip drawing central modules if we want a logo
          const centerSize = 5;
          const centerStart = Math.floor((size - centerSize) / 2);
          const centerEnd = centerStart + centerSize;
          if (centerLogo !== 'none' && r >= centerStart && r < centerEnd && c >= centerStart && c < centerEnd) {
            continue;
          }

          const x = qrPadding + c * scale;
          const y = qrPadding + r * scale;

          if (isFinder) {
            // Draw standard finder squares but color them nicely
            ctx.fillStyle = dotColor;
            ctx.fillRect(x, y, scale, scale);
          } else {
            ctx.fillStyle = dotColor;
            if (qrStyle === 'dots') {
              // Draw rounded dot
              ctx.beginPath();
              ctx.arc(x + scale / 2, y + scale / 2, (scale / 2) * 0.85, 0, 2 * Math.PI);
              ctx.fill();
            } else {
              // Draw square module
              ctx.fillRect(x + 0.5, y + 0.5, scale - 1, scale - 1);
            }
          }
        }
      }

      // 5. Draw Center Logo / Emoji
      if (centerLogo !== 'none') {
        const qrSizePixels = size * scale;
        const centerX = qrPadding + qrSizePixels / 2;
        const centerY = qrPadding + qrSizePixels / 2;
        const logoSize = scale * 4;

        // Draw background white card in center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoSize / 2 + 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.font = `${logoSize * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let emoji = '❤️';
        if (centerLogo === 'star') emoji = '⭐';
        if (centerLogo === 'smile') emoji = '😊';

        ctx.fillText(emoji, centerX, centerY + 1);
      }

      // 6. Draw Frame Text (at the bottom)
      if (frameText) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          frameText, 
          canvas.width / 2, 
          canvas.height - 30
        );
      }

    } catch (err) {
      console.error('Error drawing QR canvas:', err);
    }
  };

  useEffect(() => {
    drawQr();
  }, [dotColor, bgColor, qrStyle, centerLogo, frameText]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Gallery link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-qr.png`;
    a.click();
    toast.success('Downloaded PNG!');
  };

  const downloadSVG = () => {
    // Generate a basic vector file
    try {
      const qrData = QRCode.create(shareUrl, { errorCorrectionLevel: 'H' });
      const modules = qrData.modules;
      const size = modules.size;
      
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="512" height="512">`;
      // background
      svgContent += `<rect width="100%" height="100%" fill="${bgColor}"/>`;
      
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (modules.get(c, r)) {
            // If dot
            if (qrStyle === 'dots') {
              svgContent += `<circle cx="${c + 0.5}" cy="${r + 0.5}" r="0.4" fill="${dotColor}"/>`;
            } else {
              svgContent += `<rect x="${c}" y="${r}" width="1" height="1" fill="${dotColor}"/>`;
            }
          }
        }
      }
      svgContent += `</svg>`;
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}-qr.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded SVG!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate SVG');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Our Memories - ${galleryName}`,
          text: `Scan the QR code to check out our Friendship memories gallery!`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const socialLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out our Friendship Day Memories Gallery! 💖 ${shareUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out our Friendship Day Memories Gallery! 💖`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Visual Canvas Display */}
      <div className="flex flex-col items-center justify-center bg-slate-950/40 border border-white/5 rounded-xl p-6">
        <canvas 
          ref={canvasRef} 
          className="max-w-full h-auto rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-[1.01]"
        />
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={downloadPNG}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-pink-500/20 transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={downloadSVG}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span>Download SVG</span>
          </button>
        </div>
      </div>

      {/* Control Customizer Panels */}
      <div className="flex flex-col justify-between space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 flex items-center space-x-2">
            <Palette className="w-5 h-5 text-pink-500" />
            <span>Customize QR Code</span>
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Make the QR code match your vibe before printing or sharing.
          </p>

          <div className="space-y-4">
            {/* Color Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  QR Pattern Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={dotColor}
                    onChange={(e) => setDotColor(e.target.value)}
                    className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden"
                  />
                  <span className="text-sm text-slate-300 font-mono">{dotColor.toUpperCase()}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden"
                  />
                  <span className="text-sm text-slate-300 font-mono">{bgColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Pattern Style selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                QR Design Pattern
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setQrStyle('dots')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                    qrStyle === 'dots'
                      ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Smooth Dots
                </button>
                <button
                  onClick={() => setQrStyle('squares')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                    qrStyle === 'squares'
                      ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Sharp Squares
                </button>
              </div>
            </div>

            {/* Center Logo/Emoji */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Center Accent Logo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['heart', 'star', 'smile', 'none'] as const).map((logo) => (
                  <button
                    key={logo}
                    onClick={() => setCenterLogo(logo)}
                    className={`py-2 rounded-lg text-base font-semibold border capitalize transition-all ${
                      centerLogo === logo
                        ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                        : 'bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {logo === 'heart' ? '❤️' : logo === 'star' ? '⭐' : logo === 'smile' ? '😊' : 'None'}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame custom text */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Frame Call-to-Action Text
              </label>
              <input
                type="text"
                value={frameText}
                onChange={(e) => setFrameText(e.target.value)}
                placeholder="Scan me!"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Share buttons section */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-grow px-3 py-2 bg-slate-950/80 border border-white/10 text-slate-400 rounded-lg text-xs font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg transition-colors"
              title="Copy sharing link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center p-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-lg transition-colors"
              title="Share Web API"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3 justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quick Share:
            </span>
            <div className="flex items-center space-x-2">
              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg text-xs font-semibold transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 border border-sky-600/30 rounded-lg text-xs font-semibold transition-colors"
              >
                Telegram
              </a>
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg text-xs font-semibold transition-colors"
              >
                Facebook
              </a>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <LinkIcon className="w-4 h-4 text-slate-500 mr-2 self-center" />
            <a 
              href={`/gallery/${slug}`} 
              target="_blank" 
              className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center group transition-colors"
            >
              <span>Test public gallery link</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
