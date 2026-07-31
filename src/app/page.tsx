'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, QrCode, Sparkles, Image, Video, ArrowRight, Play, Award, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';

// Confetti particle element
const Bubble = ({ delay, left, size }: { delay: number; left: number; size: number }) => (
  <motion.div
    initial={{ y: '110vh', opacity: 0 }}
    animate={{ 
      y: '-10vh', 
      opacity: [0, 0.7, 0.7, 0],
      x: ['0px', '20px', '-20px', '0px']
    }}
    transition={{ 
      duration: 12, 
      delay: delay, 
      repeat: Infinity, 
      ease: 'linear' 
    }}
    style={{ left: `${left}%`, width: size, height: size }}
    className="absolute rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 blur-[1px]"
  />
);

export default function Home() {
  const [bubbles, setBubbles] = useState<{ id: number; delay: number; left: number; size: number }[]>([]);

  useEffect(() => {
    // Generate bubble parameters on client side to avoid SSR mismatch
    const generated = Array.from({ length: 25 }).map((_, idx) => ({
      id: idx,
      delay: Math.random() * 8,
      left: Math.random() * 100,
      size: Math.random() * 30 + 10
    }));
    setBubbles(generated);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col justify-between">
      <Navbar />

      {/* Dynamic Animated Particles / Balloons Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Animated glowing circles */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full filter blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full filter blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        
        {/* Floating Bubble/Balloon particles */}
        {bubbles.map((b) => (
          <Bubble key={b.id} delay={b.delay} left={b.left} size={b.size} />
        ))}
      </div>

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        
        {/* Left Side Info */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-pink-400"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celebrate Friendship Day ❤️</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-500 bg-clip-text text-transparent"
          >
            Happy Friendship Day
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl font-medium text-slate-300 font-serif leading-relaxed"
          >
            Every memory deserves to stay forever.<br/>
            <span className="text-pink-400 font-sans font-bold tracking-wide">"Scan. Smile. Relive Memories."</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0"
          >
            Create a custom dynamic memory gallery containing photos, videos, quizzes, and a public wishes board. Download a permanent QR code that opens your gallery and keep updating your memories anytime!
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 text-center flex items-center justify-center space-x-2 transition-transform hover:scale-[1.02]"
            >
              <span>Create Free Gallery</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 rounded-xl font-semibold text-center flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Manage Galleries</span>
            </Link>
          </motion.div>
        </div>

        {/* Right Side Themed QR Mockup */}
        <div className="flex-1 flex justify-center items-center w-full max-w-md lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 50, delay: 0.2 }}
            className="relative p-8 rounded-3xl bg-gradient-to-tr from-slate-900/60 to-purple-950/40 border border-white/10 shadow-2xl overflow-hidden group select-none max-w-sm w-full"
          >
            {/* Glossy sheen */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 group-hover:animate-shimmer" />
            
            {/* Header of mockup */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-semibold text-pink-400 uppercase tracking-widest">Digital QR Card</span>
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500/30 animate-pulse" />
            </div>

            {/* QR Scanner Display */}
            <div className="relative p-6 bg-slate-950 border border-white/5 rounded-2xl flex flex-col items-center justify-center">
              <div className="relative p-3 bg-white rounded-xl shadow-inner">
                {/* Simulated QR Code matrix */}
                <QrCode className="w-44 h-44 text-slate-900 stroke-[1.5]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-pink-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg text-lg">
                    ❤️
                  </div>
                </div>
              </div>
              <span className="mt-4 text-xs font-semibold text-slate-400 tracking-wider">
                Scan to open the memories!
              </span>
            </div>

            {/* Bottom mockup details */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs">📸</div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs">🎥</div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs">🎵</div>
              </div>
              <span className="text-xs text-slate-400 font-medium">Friendship day 2026</span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Feature section */}
      <section className="bg-slate-950/60 border-t border-white/5 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-white mb-12">
            Why Choose Dynamic Memories QR?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:border-pink-500/20 transition-all">
              <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Permanent QR Code</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate the QR code once, and print or share it. You can modify, add, or delete the photos and videos in the gallery anytime without changing the QR!
              </p>
            </div>

            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:border-purple-500/20 transition-all">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-4">
                <Image className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Unlimited Media</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload photos and videos that define your friendship timeline. Choose custom theme colors, music soundtracks, and responsive view layouts.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/20 transition-all">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Festive Interactive UX</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                End users scanning the QR code receive full envelope opening, floating balloon animations, a scratch card, a quiz, and a custom guestbook wall.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 py-8 text-center text-xs text-slate-500 z-10">
        <p>&copy; {new Date().getFullYear()} Memories QR. Celebrate Friendship Day with love and memories. ❤️</p>
      </footer>
    </div>
  );
}
