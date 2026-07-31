export interface User {
  id: string;
  name?: string | null;
  email: string;
  password?: string;
  image?: string | null;
  role?: 'USER' | 'SUPERADMIN';
  createdAt: string;
}

export type ThemeType = 'retro' | 'cyberpunk' | 'pastels' | 'sunset' | 'dark' | 'default';
export type PrivacyType = 'PUBLIC' | 'PRIVATE' | 'PASSWORD';

export interface Media {
  id: string;
  url: string;
  publicId: string;
  type: 'IMAGE' | 'VIDEO';
  caption?: string | null;
  createdAt: string;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  sticker?: string | null;
  createdAt: string;
}

export interface Scan {
  id: string;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  country?: string | null;
  city?: string | null;
  createdAt: string;
}

export interface Gallery {
  id: string;
  slug: string;
  name: string;
  friendNames: string[];
  description?: string | null;
  coverImage: string;
  theme: ThemeType;
  musicUrl?: string | null;
  privacy: PrivacyType;
  password?: string | null;
  expirationDate?: string | null;
  isEnabled: boolean;
  viewCount: number;
  createdAt: string;
  creatorId: string;
  media: Media[];
  guestbook: GuestbookEntry[];
  scans: Scan[];
}

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role?: 'USER' | 'SUPERADMIN';
  isImpersonating?: boolean;
}
