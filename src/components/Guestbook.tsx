'use client';

import { useState } from 'react';
import { GuestbookEntry } from '../types';
import { MessageSquare, Send, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface GuestbookProps {
  galleryId: string;
  initialEntries: GuestbookEntry[];
}

const STICKERS = ['❤️', '🎉', '✨', '🎈', '⭐', '🎂', '🍕', '🤝', '🍫', '🍻', '💖', '👑'];

export default function Guestbook({ galleryId, initialEntries }: GuestbookProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>(initialEntries);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedSticker, setSelectedSticker] = useState('❤️');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error('Name and message are required!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/galleries/${galleryId}/guestbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          sticker: selectedSticker
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post message');
      }

      setEntries([data.entry, ...entries]);
      setName('');
      setMessage('');
      toast.success('Wishes posted on the wall! 💖');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
      {/* Form (Col Span 2) */}
      <div className="md:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl h-fit">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-pink-500" />
          <span>Write your Wishes</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bestie / Name"
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Memory Wish / Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a sweet message, private joke, or a thank you wish..."
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium resize-none"
            />
          </div>

          {/* Sticker Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select a Sticker
            </label>
            <div className="grid grid-cols-6 gap-2">
              {STICKERS.map((sticker) => (
                <button
                  key={sticker}
                  type="button"
                  onClick={() => setSelectedSticker(sticker)}
                  className={`w-10 h-10 flex items-center justify-center text-lg border rounded-xl transition-all ${
                    selectedSticker === sticker
                      ? 'bg-pink-500/20 border-pink-500 scale-105'
                      : 'bg-slate-950/40 border-white/5 hover:bg-slate-800'
                  }`}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Posting...' : 'Post wishes'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Wishes Wall (Col Span 3) */}
      <div className="md:col-span-3 space-y-4 max-h-[500px] overflow-y-auto pr-2">
        <h3 className="text-lg font-bold text-slate-300 mb-2">
          Wishes Wall ({entries.length})
        </h3>
        
        {entries.length === 0 ? (
          <div className="bg-slate-900/10 border border-dashed border-white/10 rounded-2xl p-12 text-center text-slate-500">
            <p className="text-sm font-medium">No messages on the wall yet.</p>
            <p className="text-xs mt-1">Be the first to write something sweet!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between relative hover:border-pink-500/20 transition-all hover:scale-[1.01]"
              >
                {/* Sticker badge */}
                {entry.sticker && (
                  <div className="absolute top-4 right-4 text-2xl animate-bounce">
                    {entry.sticker}
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-semibold text-pink-400 mb-2">
                    {entry.name}
                  </p>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed italic pr-8">
                    &ldquo;{entry.message}&rdquo;
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500">
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
