'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import { 
  FolderHeart, Image as ImageIcon, Video as VideoIcon, 
  QrCode, Eye, Plus, Calendar, Settings, Trash2, 
  ToggleLeft, ToggleRight, Share2, Clipboard, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Gallery } from '../../types';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'galleries' | 'memories'>('galleries');

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/galleries');
      if (res.ok) {
        const data = await res.json();
        setGalleries(data.galleries || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load galleries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchGalleries();
    }
  }, [user, authLoading]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/galleries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentStatus })
      });
      if (res.ok) {
        toast.success(`Gallery ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
        fetchGalleries();
      }
    } catch (e) {
      toast.error('Failed to toggle gallery status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery permanently? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/galleries/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Gallery deleted permanently');
        fetchGalleries();
      } else {
        toast.error('Failed to delete gallery');
      }
    } catch (e) {
      toast.error('An error occurred');
    }
  };

  const handleCopyLink = (slug: string) => {
    const link = `${window.location.origin}/gallery/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Gallery link copied!');
  };

  // Calculate statistics
  const totalGalleries = galleries.length;
  const totalScans = galleries.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
  const totalImages = galleries.reduce((acc, curr) => 
    acc + curr.media.filter(m => m.type === 'IMAGE').length, 0
  );
  const totalVideos = galleries.reduce((acc, curr) => 
    acc + curr.media.filter(m => m.type === 'VIDEO').length, 0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        {authLoading || loading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <>
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Creator Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage and track your Friendship Day memory vaults</p>
          </div>
          
          <Link
            href="/dashboard/create"
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Gallery</span>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
              <FolderHeart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Galleries</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalGalleries}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">QR Scans</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalScans}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Images</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalImages}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <VideoIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Videos</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalVideos}</h3>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 mb-8 space-x-6">
          <button
            onClick={() => setActiveTab('galleries')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'galleries'
                ? 'border-pink-500 text-pink-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            My Galleries
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'memories'
                ? 'border-pink-500 text-pink-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Uploaded Memories ({totalImages + totalVideos})
          </button>
        </div>

        {activeTab === 'galleries' && (
          <>
            {galleries.length === 0 ? (
          <div className="bg-slate-900/20 border border-dashed border-white/10 rounded-3xl p-16 text-center">
            <FolderHeart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Galleries Created</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
              Create your first dynamic memory gallery, customize a beautiful QR code, and share it with your best friend!
            </p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-xl font-bold transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create Now</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <div 
                key={gallery.id}
                className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-pink-500/20 transition-all flex flex-col justify-between"
              >
                {/* Cover Image & Metadata */}
                <div className="relative h-44 w-full bg-slate-950">
                  {gallery.coverImage ? (
                    <img 
                      src={gallery.coverImage} 
                      alt={gallery.name} 
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-950/20 text-slate-600">
                      No Cover Image
                    </div>
                  )}
                  {/* Status Badge */}
                  <span className={`absolute top-4 right-4 px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                    gallery.isEnabled 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {gallery.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                  
                  {/* Title overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent p-4 pt-8">
                    <h3 className="text-lg font-bold text-white truncate">{gallery.name}</h3>
                    <p className="text-xs text-slate-400 truncate">To: {gallery.friendNames.join(', ')}</p>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-grow space-y-4">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {new Date(gallery.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center font-semibold text-pink-400">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      {gallery.viewCount} Scans
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-center">
                    <div className="bg-slate-950/60 border border-white/5 rounded-lg py-2">
                      <p className="text-slate-500">Photos/Videos</p>
                      <p className="text-sm font-bold text-slate-200 mt-0.5">{gallery.media.length}</p>
                    </div>
                    <div className="bg-slate-950/60 border border-white/5 rounded-lg py-2">
                      <p className="text-slate-500">Theme</p>
                      <p className="text-sm font-bold text-slate-200 mt-0.5 capitalize">{gallery.theme}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="bg-slate-950/60 border-t border-white/5 p-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyLink(gallery.slug)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                    title="Copy Share Link"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(gallery.id, gallery.isEnabled)}
                    className={`p-2 border rounded-lg transition-colors ${
                      gallery.isEnabled 
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                    }`}
                    title={gallery.isEnabled ? 'Disable QR code access' : 'Enable QR code access'}
                  >
                    {gallery.isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(gallery.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                    title="Delete Gallery"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/gallery/${gallery.slug}`}
                    target="_blank"
                    className="flex-grow flex items-center justify-center space-x-1 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg text-xs font-bold text-pink-400 transition-all"
                  >
                    <span>View Public</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}

        {/* Centralized Uploaded Memories grid */}
        {activeTab === 'memories' && (
          <div>
            {galleries.flatMap(g => 
              g.media.map(m => ({ ...m, galleryName: g.name, gallerySlug: g.slug }))
            ).length === 0 ? (
              <div className="bg-slate-900/20 border border-dashed border-white/10 rounded-3xl p-16 text-center">
                <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Memories Uploaded</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Photos and videos will appear here once you add them to your memory galleries.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 animate-scale-up">
                {galleries.flatMap(g => 
                  g.media.map(m => ({ ...m, galleryName: g.name, gallerySlug: g.slug }))
                ).map((item, idx) => (
                  <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-pink-500/20 transition-all hover:scale-[1.01]">
                    <div className="w-full aspect-square bg-slate-950 overflow-hidden relative">
                      {item.type === 'VIDEO' ? (
                        <video src={item.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.url} alt={item.caption || 'Memory'} className="w-full h-full object-cover" />
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded bg-pink-500/80 text-white">
                        {item.type}
                      </span>
                    </div>
                    <div className="p-4 space-y-1.5 bg-slate-950/20">
                      <p className="text-xs text-slate-300 line-clamp-2 italic leading-relaxed">
                        {item.caption ? `"${item.caption}"` : 'No caption'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Gallery:{' '}
                        <Link href={`/gallery/${item.gallerySlug}`} target="_blank" className="text-pink-400 hover:underline">
                          {item.galleryName}
                        </Link>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </>
    )}
  </div>
</div>
  );
}
