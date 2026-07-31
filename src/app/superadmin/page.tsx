'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import { ShieldAlert, Users, FolderHeart, Eye, LogIn, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'SUPERADMIN';
  createdAt: string;
  galleryCount: number;
}

export default function SuperadminPanel() {
  const router = useRouter();
  const { user, loading: authLoading, checkSession } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        toast.error('Failed to load user records');
      }
    } catch (e) {
      toast.error('An error occurred loading records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'SUPERADMIN') {
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [user, authLoading]);

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
        toast.success(`Logged in as ${targetName}! 👤`, { id: toastId });
        await checkSession(); // update Zustand auth state
        router.push('/dashboard'); // go to creator dashboard
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to impersonate user', { id: toastId });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsersCount = users.length;
  const totalGalleriesCount = users.reduce((acc, curr) => acc + curr.galleryCount, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center space-x-2.5">
              <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
              <span>Super Admin Control Panel</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Impersonate creators, inspect directories, and manage platform resources.
            </p>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 shadow-md flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
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
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security Access</p>
              <h3 className="text-sm font-bold text-emerald-400 mt-1.5 uppercase tracking-widest">Active session</h3>
            </div>
          </div>
        </div>

        {/* Search filter bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search creators by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm font-medium"
            />
          </div>
        </div>

        {/* Users impersontation list table */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold text-slate-450 uppercase tracking-wider bg-slate-950/40">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Security Role</th>
                  <th className="px-6 py-4">Galleries Count</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No user accounts found matching search search parameters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userRecord) => (
                    <tr 
                      key={userRecord.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-200">{userRecord.name || 'No Name Provided'}</p>
                          <p className="text-xs text-slate-400">{userRecord.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                          userRecord.role === 'SUPERADMIN' 
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                            : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                        }`}>
                          {userRecord.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-350">
                        {userRecord.galleryCount} galleries
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          {new Date(userRecord.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleImpersonate(userRecord.id, userRecord.name || userRecord.email)}
                          className="inline-flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-transform hover:scale-[1.03] cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Login As User</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
