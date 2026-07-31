'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import { 
  Heart, Volume2, VolumeX, Calendar, Gift, Lock, 
  HelpCircle, Eye, Sparkles, AlertCircle, Share2, Clipboard, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Gallery, GuestbookEntry } from '../../../types';
import ScratchCard from '../../../components/ScratchCard';
import MiniQuiz from '../../../components/MiniQuiz';
import Guestbook from '../../../components/Guestbook';
import confetti from 'canvas-confetti';

// Confetti particle element
const FloatingBalloon = ({ emoji, delay, left, size }: { emoji: string; delay: number; left: number; size: number }) => (
  <div
    style={{
      left: `${left}%`,
      fontSize: `${size}px`,
      animationDelay: `${delay}s`,
      animationDuration: `${12 + Math.random() * 6}s`
    }}
    className="absolute bottom-[-100px] pointer-events-none opacity-40 animate-float select-none z-0"
  >
    {emoji}
  </div>
);

export default function GalleryView({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = use(params);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password Protection State
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Interactive Vault Unlock States (from custom Trivia Quiz)
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Floating background emojis
  const [balloons, setBalloons] = useState<{ id: number; emoji: string; delay: number; left: number; size: number }[]>([]);

  // Share overlay
  const [copied, setCopied] = useState(false);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      // Fetch public gallery details by slug
      const res = await fetch(`/api/galleries`);
      if (!res.ok) throw new Error('Gallery not found');
      
      const data = await res.json();
      const match = (data.galleries || []).find((g: Gallery) => g.slug === slug);
      
      if (!match) {
        setError('Gallery not found');
        return;
      }

      if (!match.isEnabled) {
        setError('This gallery has been disabled by the creator.');
        return;
      }

      setGallery(match);

      // Handle custom password locks
      if (match.privacy !== 'PASSWORD') {
        setIsPasswordUnlocked(true);
      }

      // Check if there is an interactive trivia lock. If not, unlock the vault immediately!
      let parsedMeta = { trivia: null };
      try {
        parsedMeta = JSON.parse(match.description || '{}');
      } catch(e) {}
      
      if (!parsedMeta.trivia) {
        setIsVaultUnlocked(true);
      }

      // Prepare Audio
      if (match.musicUrl) {
        setAudioUrl(match.musicUrl);
      }

      // Register Scan tracking in background
      fetch(`/api/galleries/${match.id}/scan`, { method: 'POST' }).catch(console.error);

    } catch (err: any) {
      setError(err.message || 'Gallery not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();

    // Generate floating backgrounds
    const emojis = ['🎈', '❤️', '💖', '🎁', '🤝', '🌸', '✨', '⭐'];
    const generated = Array.from({ length: 20 }).map((_, idx) => ({
      id: idx,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      delay: Math.random() * 10,
      left: Math.random() * 95,
      size: Math.random() * 24 + 16
    }));
    setBalloons(generated);
  }, [slug]);

  // Audio Play Toggle
  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.loop = true;
    setAudioElement(audio);

    return () => {
      audio.pause();
    };
  }, [audioUrl]);

  const toggleAudio = () => {
    if (!audioElement) return;
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch(err => {
        console.error('Playback block:', err);
        toast.error('Press click to interact first before playing music');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gallery) return;

    if (enteredPassword === gallery.password) {
      setIsPasswordUnlocked(true);
      setPasswordError('');
      
      // Fire confetti celebrating correct password
      confetti({
        particleCount: 50,
        spread: 45
      });
    } else {
      setPasswordError('Invalid password. Please try again.');
      toast.error('Incorrect password');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Gallery link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Heart className="w-12 h-12 text-pink-500 fill-pink-500/20 animate-pulse mb-4" />
        <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Loading Memory Vault...</p>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Error</h2>
        <p className="text-slate-400 max-w-sm mb-6">{error || 'The requested friendship memories vault could not be loaded.'}</p>
        <a href="/" className="px-6 py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-850 rounded-xl text-sm font-bold text-slate-200">
          Go Home
        </a>
      </div>
    );
  }

  // Parse rich JSON meta description
  let parsedDesc = gallery.description || '';
  let secretMessage = 'You are the best!';
  let triviaQuiz = null;

  try {
    const metaObj = JSON.parse(gallery.description || '');
    parsedDesc = metaObj.description;
    secretMessage = metaObj.secretMessage;
    triviaQuiz = metaObj.trivia;
  } catch(e) {}

  return (
    <div className={`min-h-screen text-white pb-24 relative overflow-hidden transition-all duration-1000 ${
      gallery.theme === 'cyberpunk' ? 'bg-zinc-950 shadow-[inset_0_0_100px_rgba(219,39,119,0.15)] font-mono' :
      gallery.theme === 'retro' ? 'bg-amber-950/20 bg-slate-950 font-serif' :
      gallery.theme === 'pastels' ? 'bg-indigo-950/20 bg-slate-950' :
      gallery.theme === 'sunset' ? 'bg-gradient-to-b from-slate-950 via-rose-950/20 to-orange-950/10' :
      gallery.theme === 'dark' ? 'bg-black' : 'bg-slate-950'
    }`}>
      
      {/* Floating festive background elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {balloons.map((b) => (
          <FloatingBalloon key={b.id} emoji={b.emoji} delay={b.delay} left={b.left} size={b.size} />
        ))}
      </div>

      {/* Floating Audio Controller */}
      {audioUrl && (
        <button
          onClick={toggleAudio}
          className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-tr from-pink-500 to-purple-600 hover:scale-110 active:scale-95 text-white rounded-full shadow-2xl transition-all flex items-center justify-center animate-bounce"
        >
          {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
        </button>
      )}

      <div className="max-w-4xl mx-auto px-4 pt-16 relative z-10 space-y-12">
        
        {/* Gallery Cover Header Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md">
          <div className="h-64 sm:h-96 w-full relative">
            <img 
              src={gallery.coverImage} 
              alt={gallery.name} 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            
            {/* Header branding */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-pink-400 uppercase">
                💖 Memories Vault
              </span>
              <button
                onClick={handleCopyLink}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl text-slate-200 transition-colors"
                title="Share Gallery link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Title Dedication overlay */}
            <div className="absolute bottom-8 left-8 right-8 text-left space-y-2">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
                {gallery.name}
              </h1>
              <p className="text-sm sm:text-base text-pink-400 font-semibold">
                Dedicated to: {gallery.friendNames.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* PASSWORD PROTECTION WALL */}
        {!isPasswordUnlocked ? (
          <div className="w-full max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6">
            <Lock className="w-12 h-12 text-pink-500 mx-auto animate-bounce" />
            <div>
              <h3 className="text-xl font-bold text-white">Password Protected</h3>
              <p className="text-slate-400 text-xs mt-1">This memory gallery is private. Please enter the pass-key to view.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                required
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                placeholder="Enter access code..."
                className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium text-center"
              />
              {passwordError && (
                <p className="text-xs text-rose-400 font-semibold">{passwordError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
              >
                Unlock Memories
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Gallery Description Message */}
            {parsedDesc && (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 text-center shadow-xl space-y-4">
                <Heart className="w-8 h-8 text-pink-500 mx-auto fill-pink-500/20" />
                <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-serif italic max-w-xl mx-auto">
                  &ldquo;{parsedDesc}&rdquo;
                </p>
                <div className="w-12 h-[1px] bg-pink-500/30 mx-auto mt-4" />
              </div>
            )}

            {/* SECRET SCRATCH CARD */}
            {secretMessage && (
              <div className="space-y-4 text-center">
                <h3 className="text-lg font-bold text-slate-300 flex items-center justify-center space-x-1.5">
                  <Gift className="w-5 h-5 text-pink-500" />
                  <span>A Special Note for You</span>
                </h3>
                <ScratchCard secretMessage={secretMessage} />
              </div>
            )}

            {/* TRIVIA QUIZ LOCK */}
            {!isVaultUnlocked && triviaQuiz ? (
              <div className="space-y-4">
                <div className="text-center">
                  <HelpCircle className="w-10 h-10 text-pink-500 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-slate-300">Unlock the Memory Vault</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Answer this trivia correctly to reveal the complete timeline of photos and videos!</p>
                </div>
                <MiniQuiz questions={[triviaQuiz]} onUnlock={() => setIsVaultUnlocked(true)} />
              </div>
            ) : (
              <>
                {/* UNLOCKED MEMORY GALLERY GRID */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-200 flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-pink-500" />
                      <span>Our Memories Timeline</span>
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full">
                      {gallery.media.length} items
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {gallery.media.map((media) => (
                      <div 
                        key={media.id}
                        className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg group hover:border-pink-500/20 transition-all flex flex-col justify-between"
                      >
                        <div className="w-full aspect-[4/3] bg-slate-950 overflow-hidden relative">
                          {media.type === 'VIDEO' ? (
                            <video 
                              src={media.url} 
                              controls 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img 
                              src={media.url} 
                              alt={media.caption || 'Friendship memory'} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                        </div>
                        {media.caption && (
                          <div className="p-4 bg-slate-950/40 text-sm text-slate-300 italic font-medium">
                            {media.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* GUESTBOOK SECTION */}
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <div className="text-center max-w-sm mx-auto mb-6">
                    <h3 className="text-xl font-bold text-white">Friends Guestbook Wall</h3>
                    <p className="text-xs text-slate-400 mt-1">Leave a sweet memory wish or message on our digital sticker wall!</p>
                  </div>
                  <Guestbook galleryId={gallery.id} initialEntries={gallery.guestbook} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
