'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import { 
  ShieldAlert, Users, FolderHeart, LogIn, Calendar, Search, 
  Trash2, Edit, Image as ImageIcon, MessageSquare, Eye, Key, 
  UserPlus, Globe, CheckCircle, XCircle, Play, Music, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'SUPERADMIN';
  createdAt: string;
  galleryCount: number;
}

interface MediaItem {
  id: string;
  url: string;
  publicId: string;
  type: 'IMAGE' | 'VIDEO';
  caption?: string | null;
  createdAt: string;
}

interface GuestbookWish {
  id: string;
  name: string;
  message: string;
  sticker?: string | null;
  createdAt: string;
}

interface ScanLog {
  id: string;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  country?: string | null;
  city?: string | null;
  createdAt: string;
}

interface ManagedGallery {
  id: string;
  slug: string;
  name: string;
  friendNames: string[];
  description?: string | null;
  coverImage: string;
  theme: string;
  musicUrl?: string | null;
  privacy: 'PUBLIC' | 'PRIVATE' | 'PASSWORD';
  password?: string | null;
  isEnabled: boolean;
  viewCount: number;
  createdAt: string;
  creatorId: string;
  media: MediaItem[];
  guestbook: GuestbookWish[];
  scans: ScanLog[];
}

export default function SuperadminPanel() {
  const router = useRouter();
  const { user, loading: authLoading, checkSession } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'creators' | 'galleries' | 'scans'>('creators');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [galleries, setGalleries] = useState<ManagedGallery[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [editUserModal, setEditUserModal] = useState<ManagedUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', password: '', role: 'USER' as 'USER' | 'SUPERADMIN' });
  
  const [editGalleryModal, setEditGalleryModal] = useState<ManagedGallery | null>(null);
  const [editGalleryForm, setEditGalleryForm] = useState({ name: '', coverImage: '', theme: 'sunset', privacy: 'PUBLIC' as any, password: '', musicUrl: '' });
  
  const [mediaManageModal, setMediaManageModal] = useState<ManagedGallery | null>(null);
  const [guestbookManageModal, setGuestbookManageModal] = useState<ManagedGallery | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersRes = await fetch('/api/superadmin/users');
      // Fetch galleries
      const galleriesRes = await fetch('/api/superadmin/galleries');
      
      if (usersRes.ok && galleriesRes.ok) {
        const usersData = await usersRes.json();
        const galleriesData = await galleriesRes.json();
        setUsers(usersData.users || []);
        setGalleries(galleriesData.galleries || []);
      } else {
        toast.error('Failed to load system records');
      }
    } catch (e) {
      toast.error('Error fetching dashboard records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'SUPERADMIN') {
        router.push('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading]);

  // Impersonate
  const handleImpersonate = async (targetUserId: string, targetName: string) => {
    const toastId = toast.loading(`Impersonating ${targetName}...`);
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Swapped session to ${targetName}! 👤`, { id: toastId });
        await checkSession();
        router.push('/dashboard');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to impersonate', { id: toastId });
    }
  };

  // User Actions
  const openEditUser = (userRecord: ManagedUser) => {
    setEditUserModal(userRecord);
    setEditUserForm({
      name: userRecord.name || '',
      email: userRecord.email,
      password: '',
      role: userRecord.role
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;

    try {
      const res = await fetch(`/api/superadmin/users/${editUserModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm)
      });
      if (res.ok) {
        toast.success('User updated successfully! 💾');
        setEditUserModal(null);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to update user');
      }
    } catch (err) {
      toast.error('Error saving user changes');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}" and all their galleries?`)) return;

    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User and data deleted! 🗑️');
        fetchData();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (e) {
      toast.error('Error deleting user');
    }
  };

  // Gallery Actions
  const openEditGallery = (gallery: ManagedGallery) => {
    setEditGalleryModal(gallery);
    setEditGalleryForm({
      name: gallery.name,
      coverImage: gallery.coverImage,
      theme: gallery.theme,
      privacy: gallery.privacy,
      password: gallery.password || '',
      musicUrl: gallery.musicUrl || ''
    });
  };

  const handleUpdateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGalleryModal) return;

    try {
      const res = await fetch(`/api/superadmin/galleries/${editGalleryModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGalleryForm)
      });
      if (res.ok) {
        toast.success('Gallery settings updated! 💾');
        setEditGalleryModal(null);
        fetchData();
      } else {
        toast.error('Failed to update gallery');
      }
    } catch (err) {
      toast.error('Error saving gallery changes');
    }
  };

  const handleToggleGalleryState = async (galleryId: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/galleries/${galleryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentState })
      });
      if (res.ok) {
        toast.success(`Gallery ${!currentState ? 'Enabled' : 'Disabled'}!`);
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDeleteGallery = async (galleryId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the gallery "${name}"?`)) return;

    try {
      const res = await fetch(`/api/superadmin/galleries/${galleryId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Gallery deleted! 🗑️');
        fetchData();
      } else {
        toast.error('Failed to delete gallery');
      }
    } catch (e) {
      toast.error('Error deleting gallery');
    }
  };

  // Media Management
  const handleDeleteMedia = async (galleryId: string, mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) return;

    try {
      const res = await fetch(`/api/superadmin/galleries/${galleryId}/media/${mediaId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Media removed!');
        // Refresh modals
        if (mediaManageModal) {
          const updatedMedia = mediaManageModal.media.filter(m => m.id !== mediaId);
          setMediaManageModal({ ...mediaManageModal, media: updatedMedia });
        }
        fetchData();
      } else {
        toast.error('Failed to delete media');
      }
    } catch (e) {
      toast.error('Error removing media');
    }
  };

  // Guestbook Management
  const handleDeleteWish = async (galleryId: string, entryId: string) => {
    if (!confirm('Are you sure you want to delete this guestbook wish?')) return;

    try {
      const res = await fetch(`/api/superadmin/galleries/${galleryId}/guestbook/${entryId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Wish deleted!');
        if (guestbookManageModal) {
          const updatedWishes = guestbookManageModal.guestbook.filter(w => w.id !== entryId);
          setGuestbookManageModal({ ...guestbookManageModal, guestbook: updatedWishes });
        }
        fetchData();
      } else {
        toast.error('Failed to delete wish');
      }
    } catch (e) {
      toast.error('Error deleting wish');
    }
  };

  // Filter lists
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGalleries = galleries.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Global Scans Feed
  const allScans: { scan: ScanLog; galleryName: string; gallerySlug: string }[] = galleries
    .flatMap(g => (g.scans || []).map(s => ({ scan: s, galleryName: g.name, gallerySlug: g.slug })))
    .sort((a, b) => new Date(b.scan.createdAt).getTime() - new Date(a.scan.createdAt).getTime());

  const totalUsersCount = users.length;
  const totalGalleriesCount = galleries.length;
  const totalScansCount = galleries.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);

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
        
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center space-x-2.5">
              <ShieldAlert className="w-8 h-8 text-pink-500 animate-pulse" />
              <span>System Super Admin Panel</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Direct, code-free administrative management over creators, memory lanes, media assets, and guestbooks.
            </p>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Creators</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalUsersCount}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
              <FolderHeart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Galleries</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalGalleriesCount}</h3>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global QR Scans</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalScansCount}</h3>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 mb-6 space-x-6">
          <button
            onClick={() => { setActiveSubTab('creators'); setSearchTerm(''); }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'creators'
                ? 'border-pink-500 text-pink-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Creators ({totalUsersCount})
          </button>
          <button
            onClick={() => { setActiveSubTab('galleries'); setSearchTerm(''); }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'galleries'
                ? 'border-pink-500 text-pink-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Galleries ({totalGalleriesCount})
          </button>
          <button
            onClick={() => { setActiveSubTab('scans'); setSearchTerm(''); }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'scans'
                ? 'border-pink-500 text-pink-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Global Scan Logs ({allScans.length})
          </button>
        </div>

        {/* Search Bar (Only for Creators and Galleries) */}
        {activeSubTab !== 'scans' && (
          <div className="mb-6">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeSubTab === 'creators' ? 'Search creators by name or email...' : 'Search galleries by title or slug...'}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-sm font-medium"
              />
            </div>
          </div>
        )}

        {/* SUBTAB 1: CREATORS MANAGEMENT */}
        {activeSubTab === 'creators' && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                    <th className="px-6 py-4">User Identity</th>
                    <th className="px-6 py-4">Security Role</th>
                    <th className="px-6 py-4">Galleries</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No creator accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((creator) => (
                      <tr key={creator.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-200">{creator.name || 'No Name'}</p>
                            <p className="text-xs text-slate-400">{creator.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase ${
                            creator.role === 'SUPERADMIN' 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                          }`}>
                            {creator.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-350">{creator.galleryCount} vaults</td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            {new Date(creator.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditUser(creator)}
                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Edit credentials"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleImpersonate(creator.id, creator.name || creator.email)}
                            className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-750 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                            title="Login As User"
                          >
                            Login As
                          </button>
                          {creator.id !== user?.id && (
                            <button
                              onClick={() => handleDeleteUser(creator.id, creator.name || creator.email)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all cursor-pointer"
                              title="Delete Creator"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: GALLERIES MANAGEMENT */}
        {activeSubTab === 'galleries' && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                    <th className="px-6 py-4">Cover / Vibe</th>
                    <th className="px-6 py-4">Security QR Lock</th>
                    <th className="px-6 py-4">Photos & Videos</th>
                    <th className="px-6 py-4">Guestbook wishes</th>
                    <th className="px-6 py-4">Total Scans</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredGalleries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No galleries found.
                      </td>
                    </tr>
                  ) : (
                    filteredGalleries.map((gallery) => {
                      const creator = users.find(u => u.id === gallery.creatorId);
                      return (
                        <tr key={gallery.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={gallery.coverImage} 
                                alt={gallery.name} 
                                className="w-12 h-12 object-cover rounded-lg border border-white/10"
                              />
                              <div>
                                <p className="font-bold text-slate-200 leading-tight">{gallery.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  Slug: <span className="text-pink-400 font-bold">{gallery.slug}</span> | Owner:{' '}
                                  <span className="italic">{creator?.email || 'Unknown'}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                                gallery.privacy === 'PUBLIC'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {gallery.privacy}
                              </span>
                              <button
                                onClick={() => handleToggleGalleryState(gallery.id, gallery.isEnabled)}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase flex items-center space-x-0.5 border cursor-pointer ${
                                  gallery.isEnabled
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                    : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                                }`}
                              >
                                {gallery.isEnabled ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                                <span>{gallery.isEnabled ? 'Active' : 'Disabled'}</span>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setMediaManageModal(gallery)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-pink-400 hover:text-pink-300 hover:underline cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{gallery.media?.length || 0} Media items</span>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setGuestbookManageModal(gallery)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{gallery.guestbook?.length || 0} Comments</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-200">
                            <span className="flex items-center">
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              {gallery.viewCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end space-x-2 mt-2">
                            <button
                              onClick={() => openEditGallery(gallery)}
                              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                              title="Edit Vibe details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGallery(gallery.id, gallery.name)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all cursor-pointer"
                              title="Delete Gallery"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: SCAN LOGS */}
        {activeSubTab === 'scans' && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                    <th className="px-6 py-4">Scanned Memory Lane</th>
                    <th className="px-6 py-4">Scan Location</th>
                    <th className="px-6 py-4">Platform Info</th>
                    <th className="px-6 py-4">Time of Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {allScans.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                        No scan activities recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allScans.map((log) => (
                      <tr key={log.scan.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-200">{log.galleryName}</p>
                            <p className="text-xs text-pink-400">/{log.gallerySlug}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-300">
                          {log.scan.city || log.scan.country 
                            ? `${log.scan.city || 'Unknown City'}, ${log.scan.country || 'Unknown Country'}` 
                            : 'Local Host scan'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          <span className="block font-semibold text-slate-300">
                            {log.scan.device || 'Unknown'} - {log.scan.os || 'Unknown OS'}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            Browser: {log.scan.browser || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(log.scan.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}

      </div>

      {/* MODAL 1: EDIT CREATOR CREDENTIALS */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-slate-950/50 p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Key className="w-5 h-5 text-pink-500" />
                <span>Edit Creator Credentials</span>
              </h3>
              <button onClick={() => setEditUserModal(null)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-semibold"
                  placeholder="Creator Name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-semibold"
                  placeholder="name@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password (Leave blank to keep current)</label>
                <input 
                  type="password" 
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Platform Access Level</label>
                <select 
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-bold capitalize"
                >
                  <option value="USER">Standard Creator (USER)</option>
                  <option value="SUPERADMIN">System Admin (SUPERADMIN)</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-white/5 justify-end">
                <button 
                  type="button" 
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT GALLERY VIBE DETAILS */}
      {editGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-slate-950/50 p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FolderHeart className="w-5 h-5 text-pink-500" />
                <span>Edit Gallery Vibe Meta</span>
              </h3>
              <button onClick={() => setEditGalleryModal(null)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleUpdateGallery} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gallery Title</label>
                <input 
                  type="text" 
                  value={editGalleryForm.name}
                  onChange={(e) => setEditGalleryForm({ ...editGalleryForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-semibold"
                  placeholder="Gallery Name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cover Image URL</label>
                <input 
                  type="text" 
                  value={editGalleryForm.coverImage}
                  onChange={(e) => setEditGalleryForm({ ...editGalleryForm, coverImage: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-semibold"
                  placeholder="https://images.unsplash.com/..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Soundtrack Audio Link (Direct MP3)</label>
                <input 
                  type="text" 
                  value={editGalleryForm.musicUrl}
                  onChange={(e) => setEditGalleryForm({ ...editGalleryForm, musicUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-semibold"
                  placeholder="https://domain.com/audio.mp3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Theme Vibe</label>
                  <select 
                    value={editGalleryForm.theme}
                    onChange={(e) => setEditGalleryForm({ ...editGalleryForm, theme: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-bold capitalize"
                  >
                    <option value="sunset">Sunset Gradient</option>
                    <option value="retro">Retro Vintage</option>
                    <option value="cyberpunk">Cyberpunk Neon</option>
                    <option value="pastels">Pastels Sweet</option>
                    <option value="dark">Dark Classic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Privacy Lock</label>
                  <select 
                    value={editGalleryForm.privacy}
                    onChange={(e) => setEditGalleryForm({ ...editGalleryForm, privacy: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-bold capitalize"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PASSWORD">Password Locked</option>
                  </select>
                </div>
              </div>

              {editGalleryForm.privacy === 'PASSWORD' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Passcode Key</label>
                  <input 
                    type="text" 
                    value={editGalleryForm.password}
                    onChange={(e) => setEditGalleryForm({ ...editGalleryForm, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:outline-none focus:border-pink-500 text-sm font-semibold"
                    placeholder="Enter numeric or text password"
                    required
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-white/5 justify-end">
                <button 
                  type="button" 
                  onClick={() => setEditGalleryModal(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg cursor-pointer"
                >
                  Save Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE MEDIA ITEMS DIRECTLY */}
      {mediaManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-slate-950/50 p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-pink-500" />
                <span>Manage Media: {mediaManageModal.name}</span>
              </h3>
              <button onClick={() => setMediaManageModal(null)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {mediaManageModal.media.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No media items uploaded inside this gallery.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {mediaManageModal.media.map((item) => (
                    <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-950 group">
                      {item.type === 'VIDEO' ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.url} alt="Gallery Media" className="w-full h-full object-cover" />
                      )}
                      
                      {/* Delete Overlay */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteMedia(mediaManageModal.id, item.id)}
                          className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <span className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded bg-pink-500 text-white tracking-widest">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setMediaManageModal(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
              >
                Close Media Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MANAGE GUESTBOOK WISHES DIRECTLY */}
      {guestbookManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-slate-950/50 p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                <span>Manage Wishes: {guestbookManageModal.name}</span>
              </h3>
              <button onClick={() => setGuestbookManageModal(null)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {guestbookManageModal.guestbook.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No guestbook comments or wishes found.</div>
              ) : (
                guestbookManageModal.guestbook.map((wish) => (
                  <div key={wish.id} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-start justify-between space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200">{wish.name}</span>
                        {wish.sticker && (
                          <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-400 text-xs rounded border border-pink-500/20">{wish.sticker}</span>
                        )}
                        <span className="text-[10px] text-slate-500">{new Date(wish.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-350 mt-1.5 italic leading-relaxed">"{wish.message}"</p>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteWish(guestbookManageModal.id, wish.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:text-red-300 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setGuestbookManageModal(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
              >
                Close Wishes Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
