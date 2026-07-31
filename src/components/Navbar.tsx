'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { Heart, Home, LayoutDashboard, PlusCircle, LogOut, Menu, X, LogIn, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, checkSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    checkSession();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleUnimpersonate = async () => {
    try {
      const res = await fetch('/api/auth/unimpersonate', { method: 'POST' });
      if (res.ok) {
        toast.success('Returned to Super Admin panel! 🛡️');
        await checkSession();
        router.push('/superadmin');
      } else {
        toast.error('Failed to exit impersonation');
      }
    } catch (e) {
      toast.error('Something went wrong');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home, show: true },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: !!user },
    { href: '/dashboard/create', label: 'Create Gallery', icon: PlusCircle, show: !!user },
    { href: '/superadmin', label: 'Superadmin', icon: ShieldAlert, show: !!(user && user.role === 'SUPERADMIN') },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-lg py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white/20 animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent tracking-wide">
              Memories QR
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map(
              (link) =>
                link.show && (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-pink-400 bg-pink-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                )
            )}

            {user ? (
              <div className="flex items-center space-x-4 border-l border-white/10 pl-6">
                {user.isImpersonating && (
                  <button
                    onClick={handleUnimpersonate}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold animate-pulse transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Exit Impersonation</span>
                  </button>
                )}
                <span className="text-sm text-slate-400">
                  Hi, <span className="text-pink-400 font-medium">{user.name || 'Friend'}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-lg text-sm font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-white/10 pl-6">
                <Link
                  href="/login"
                  className="flex items-center space-x-1.5 px-3 py-2 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-white/10 px-4 pt-2 pb-6 space-y-3 shadow-xl">
          {navLinks.map(
            (link) =>
              link.show && (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-pink-400 bg-pink-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
          )}

          {user ? (
            <div className="pt-4 border-t border-white/10 space-y-3 px-4">
              <p className="text-sm text-slate-400">
                Logged in as <span className="text-pink-400 font-semibold">{user.name || user.email}</span>
              </p>
              {user.isImpersonating && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleUnimpersonate();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-base font-semibold animate-pulse transition-all"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>Exit Impersonation</span>
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-base font-medium transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-white/10 space-y-3 px-4 flex flex-col">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-base font-medium transition-all"
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-base font-semibold shadow-md transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
