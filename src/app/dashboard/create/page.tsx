'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import Navbar from '../../../components/Navbar';
import QrGenerator from '../../../components/QrGenerator';
import { useDropzone } from 'react-dropzone';
import { 
  FolderHeart, Sparkles, Image as ImageIcon, Video as VideoIcon, 
  Trash2, Plus, ArrowRight, ArrowLeft, Save, Globe, Lock, ShieldAlert,
  Calendar, FileAudio, Check, UploadCloud, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TempMedia {
  url: string;
  publicId: string;
  type: 'IMAGE' | 'VIDEO';
  caption: string;
  file?: File;
  progress?: number;
}

export default function CreateGallery() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Form step navigation
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string>('');

  // Form State Fields
  const [name, setName] = useState('');
  const [friendNameInput, setFriendNameInput] = useState('');
  const [friendNames, setFriendNames] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [theme, setTheme] = useState<'retro' | 'cyberpunk' | 'pastels' | 'sunset' | 'dark' | 'default'>('default');
  const [musicUrl, setMusicUrl] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'PASSWORD'>('PUBLIC');
  const [password, setPassword] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  
  // Secret scratch message & Custom trivia question
  const [secretMessage, setSecretMessage] = useState('Happy Friendship Day! You are my absolute best friend.');
  const [triviaQuestion, setTriviaQuestion] = useState('Where did we first meet?');
  const [triviaAnswer, setTriviaAnswer] = useState('');
  const [triviaOptions, setTriviaOptions] = useState<string[]>(['College', 'School', 'Online', 'Café']);

  // Media upload State
  const [mediaList, setMediaList] = useState<TempMedia[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  // Friend name handlers
  const handleAddFriend = () => {
    if (friendNameInput.trim() && !friendNames.includes(friendNameInput.trim())) {
      setFriendNames([...friendNames, friendNameInput.trim()]);
      setFriendNameInput('');
    }
  };

  const handleRemoveFriend = (nameToRemove: string) => {
    setFriendNames(friendNames.filter(n => n !== nameToRemove));
  };

  // Upload handler for cover image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Uploading cover photo...');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setCoverImage(data.url);
        toast.success('Cover photo uploaded!', { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Cover photo upload failed', { id: toastId });
    }
  };

  // React Dropzone configuration for gallery memories
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': []
    },
    onDrop: async (acceptedFiles) => {
      setUploading(true);
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (res.ok) {
            return {
              url: data.url,
              publicId: data.publicId,
              type: data.type as 'IMAGE' | 'VIDEO',
              caption: ''
            };
          }
          return null;
        } catch (e) {
          console.error(e);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is TempMedia => r !== null);
      
      setMediaList((prev) => [...prev, ...successfulUploads]);
      setUploading(false);
      if (successfulUploads.length > 0) {
        toast.success(`Successfully uploaded ${successfulUploads.length} memory files! 💖`);
      } else {
        toast.error('All file uploads failed');
      }
    }
  });

  const handleRemoveMedia = (idx: number) => {
    setMediaList(mediaList.filter((_, i) => i !== idx));
  };

  const handleUpdateCaption = (idx: number, text: string) => {
    const updated = [...mediaList];
    updated[idx].caption = text;
    setMediaList(updated);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Gallery Name is required');
      return;
    }
    if (friendNames.length === 0) {
      toast.error('Please add at least one friend name');
      return;
    }
    if (!coverImage) {
      toast.error('Cover Photo is required');
      return;
    }
    if (privacy === 'PASSWORD' && !password.trim()) {
      toast.error('Please provide a password for your password protected gallery');
      return;
    }

    try {
      setLoading(true);
      
      // We append our secret scratch message and trivia options/questions to description or build custom structures.
      // To make the dynamic app extra robust and Vercel-ready with JSON, we will bundle the scratchcard info and trivia question
      // into a customized meta structure in the description or just save it. Wait, let's bundle it inside a structured string in description,
      // or we can save it! Let's bundle it in description JSON:
      const richMeta = {
        description: description,
        secretMessage: secretMessage,
        trivia: triviaAnswer ? {
          question: triviaQuestion,
          options: triviaOptions,
          correctAnswer: triviaAnswer
        } : null
      };

      const payload = {
        name,
        friendNames,
        description: JSON.stringify(richMeta),
        coverImage,
        theme,
        musicUrl: musicUrl.trim() || null,
        privacy,
        password: password.trim() || null,
        expirationDate: expirationDate ? new Date(expirationDate).toISOString() : null,
        media: mediaList.map(m => ({
          url: m.url,
          publicId: m.publicId,
          type: m.type,
          caption: m.caption
        }))
      };

      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create gallery');
      }

      toast.success('Friendship Gallery Created! 🎉');
      setCreatedSlug(data.gallery.slug);
      setCreatedName(data.gallery.name);
      setStep(3); // Go to QR generation step
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-28">
        {authLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <>
        
        {/* Wizard progress bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 1 ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              1
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 hidden sm:inline">Vibe & Meta Info</span>
          </div>
          <div className="flex-grow h-[1px] bg-slate-800 mx-4" />
          <div className="flex items-center space-x-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 2 ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 hidden sm:inline">Memories Upload</span>
          </div>
          <div className="flex-grow h-[1px] bg-slate-800 mx-4" />
          <div className="flex items-center space-x-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 3 ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              3
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 hidden sm:inline">Dynamic QR Code</span>
          </div>
        </div>

        {/* STEP 1: Basic gallery details */}
        {step === 1 && (
          <div className="space-y-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <FolderHeart className="w-6 h-6 text-pink-500" />
                <span>Gallery Vibe & Details</span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">Configure themes, privacy details, and background audio</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Gallery Title Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Best Friends Forever ❤️"
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Friend Names (Press Add)
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={friendNameInput}
                      onChange={(e) => setFriendNameInput(e.target.value)}
                      placeholder="e.g. Rachel, Monica"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFriend())}
                      className="flex-grow px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddFriend}
                      className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {friendNames.map((name) => (
                      <span key={name} className="inline-flex items-center space-x-1.5 px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-xs font-semibold">
                        <span>{name}</span>
                        <button type="button" onClick={() => handleRemoveFriend(name)} className="hover:text-rose-500 font-bold ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Description / Dedication
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a sweet introduction message to greet your friends when they scan..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium resize-none"
                  />
                </div>

                {/* Secret message for scratch card */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Secret Message (revealed via Scratch Card)
                  </label>
                  <input
                    type="text"
                    value={secretMessage}
                    onChange={(e) => setSecretMessage(e.target.value)}
                    placeholder="A special secret message only for them..."
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium"
                  />
                </div>
              </div>

              {/* Right Column Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Cover Image
                  </label>
                  <div className="border border-white/10 rounded-xl p-4 bg-slate-950/40 text-center flex flex-col items-center">
                    {coverImage ? (
                      <img src={coverImage} alt="Cover Preview" className="h-32 w-full object-cover rounded-lg mb-3" />
                    ) : (
                      <div className="h-32 w-full flex items-center justify-center bg-slate-900 border border-white/5 rounded-lg mb-3 text-slate-500 text-xs">
                        No image uploaded yet
                      </div>
                    )}
                    <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                      Upload Cover Photo
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Soundtrack MP3 or YouTube / Spotify Link
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                      <FileAudio className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="text"
                      value={musicUrl}
                      onChange={(e) => setMusicUrl(e.target.value)}
                      placeholder="Spotify URL, YouTube URL, or direct MP3 audio URL"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Gallery Theme Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['default', 'retro', 'cyberpunk', 'pastels', 'sunset', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`py-2 px-3 text-xs font-bold border rounded-lg capitalize transition-all ${
                          theme === t
                            ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                            : 'bg-slate-950/40 border-white/5 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy and Password protection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Privacy Setting
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setPrivacy('PUBLIC')}
                      className={`flex items-center justify-center space-x-1 py-2 px-3 text-xs font-bold border rounded-lg transition-all ${
                        privacy === 'PUBLIC'
                          ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrivacy('PASSWORD')}
                      className={`flex items-center justify-center space-x-1 py-2 px-3 text-xs font-bold border rounded-lg transition-all ${
                        privacy === 'PASSWORD'
                          ? 'bg-pink-500/10 border-pink-500 text-pink-400'
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Password</span>
                    </button>
                  </div>

                  {privacy === 'PASSWORD' && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set access password..."
                      className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Custom Trivia Quiz setup */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>Interactive Friendship Quiz Lock (Optional)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">If provided, friends must answer this question correctly to unlock the memories timeline!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Trivia Question
                  </label>
                  <input
                    type="text"
                    value={triviaQuestion}
                    onChange={(e) => setTriviaQuestion(e.target.value)}
                    placeholder="e.g. What is my favorite food?"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Correct Answer (exactly as one option below)
                  </label>
                  <input
                    type="text"
                    value={triviaAnswer}
                    onChange={(e) => setTriviaAnswer(e.target.value)}
                    placeholder="e.g. Pizza (leave blank to disable quiz)"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {triviaAnswer && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Choices / Options (separated by comma)
                  </label>
                  <input
                    type="text"
                    value={triviaOptions.join(', ')}
                    onChange={(e) => setTriviaOptions(e.target.value.split(',').map(s => s.trim()))}
                    placeholder="Pizza, Burger, Pasta, Sushi"
                    className="w-full px-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none text-sm font-medium"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-1.5 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
              >
                <span>Continue to Memories</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Drag & Drop upload memories */}
        {step === 2 && (
          <div className="space-y-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <ImageIcon className="w-6 h-6 text-pink-500" />
                  <span>Upload Friendship Memories</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">Drag and drop images and videos detailing your favorite bestie moments</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full">
                {mediaList.length} Uploaded
              </span>
            </div>

            {/* Drag Drop Area */}
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-pink-500 bg-pink-500/5' 
                  : 'border-white/15 bg-slate-950/40 hover:border-pink-500/35 hover:bg-slate-950/60'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-bounce" />
              <p className="text-base text-slate-200 font-semibold mb-1">
                {isDragActive ? 'Drop your memory files here!' : 'Drag & Drop photos or videos here'}
              </p>
              <p className="text-xs text-slate-500">
                Supports JPEG, PNG, WEBP, and MP4 up to 50MB.
              </p>
              {uploading && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-pink-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-pink-500"></div>
                  <span>Uploading assets...</span>
                </div>
              )}
            </div>

            {/* Uploaded Media Grid list with captions */}
            {mediaList.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">Memory Captions & Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
                  {mediaList.map((media, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-950/60 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex space-x-3 items-center">
                        <div className="h-16 w-16 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {media.type === 'VIDEO' ? (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-purple-950/20">
                              <VideoIcon className="w-6 h-6" />
                            </div>
                          ) : (
                            <img src={media.url} alt="Memory Thumbnail" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {media.type}
                          </span>
                          <p className="text-xs text-slate-400 truncate max-w-[150px]">
                            {media.url.split('/').pop()}
                          </p>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={media.caption}
                        onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                        placeholder="Write a sweet caption or caption date..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center space-x-1.5 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading || mediaList.length === 0}
                className="flex items-center space-x-1.5 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Generating...' : 'Generate Gallery & QR'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Complete & Show QR Code Customize/Download */}
        {step === 3 && createdSlug && (
          <div className="space-y-8 animate-scale-up">
            <div className="text-center bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 animate-scale-up" />
              </div>
              <h2 className="text-3xl font-extrabold text-white">Your QR Code is Ready!</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                Customize your dynamic QR code below. Download and print it! You can always edit this memory gallery at any time and the QR code will automatically load the updated memories.
              </p>
            </div>

            <QrGenerator slug={createdSlug} galleryName={createdName} />

            <div className="flex justify-center pt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors shadow-lg"
              >
                Go to Dashboard Overview
              </button>
            </div>
          </div>
        )}

          </>
        )}
      </div>
    </div>
  );
}
