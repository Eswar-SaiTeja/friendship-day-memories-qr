import { PrismaClient } from '@prisma/client';
import * as jsonDb from '../utils/db';
import { Gallery, User, GuestbookEntry, Scan, ThemeType, PrivacyType } from '../types';

// Global Prisma instantiation for Next.js to prevent multiple instances
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL ? new PrismaClient() : undefined);

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export const isPostgresActive = () => !!prisma;

// Helper to convert Prisma objects to our application types
function mapPrismaUser(user: any): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password || undefined,
    image: user.image,
    role: user.role as 'USER' | 'SUPERADMIN',
    createdAt: user.createdAt.toISOString()
  };
}

function mapPrismaGallery(gallery: any): Gallery {
  return {
    id: gallery.id,
    slug: gallery.slug,
    name: gallery.name,
    friendNames: gallery.friendNames,
    description: gallery.description,
    coverImage: gallery.coverImage,
    theme: gallery.theme as ThemeType,
    musicUrl: gallery.musicUrl,
    privacy: gallery.privacy as PrivacyType,
    password: gallery.password,
    expirationDate: gallery.expirationDate ? gallery.expirationDate.toISOString() : null,
    isEnabled: gallery.isEnabled,
    viewCount: gallery.viewCount,
    createdAt: gallery.createdAt.toISOString(),
    creatorId: gallery.creatorId,
    media: (gallery.media || []).map((m: any) => ({
      id: m.id,
      url: m.url,
      publicId: m.publicId,
      type: m.type as 'IMAGE' | 'VIDEO',
      caption: m.caption,
      createdAt: m.createdAt.toISOString()
    })),
    guestbook: (gallery.guestbook || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      message: g.message,
      sticker: g.sticker,
      createdAt: g.createdAt.toISOString()
    })),
    scans: (gallery.scans || []).map((s: any) => ({
      id: s.id,
      device: s.device,
      browser: s.browser,
      os: s.os,
      country: s.country,
      city: s.city,
      createdAt: s.createdAt.toISOString()
    }))
  };
}

// Database Layer Implementation
export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (prisma) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      return user ? mapPrismaUser(user) : undefined;
    } catch (error) {
      console.error('Prisma getUserByEmail error, falling back to JSON:', error);
    }
  }
  return jsonDb.dbFindUserByEmail(email);
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (prisma) {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      return user ? mapPrismaUser(user) : undefined;
    } catch (error) {
      console.error('Prisma getUserById error, falling back to JSON:', error);
    }
  }
  return jsonDb.dbFindUserById(id);
}

export async function createUser(userData: Omit<User, 'createdAt'>): Promise<User> {
  if (prisma) {
    try {
      const user = await prisma.user.create({
        data: {
          id: userData.id,
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: userData.password,
          image: userData.image,
          role: userData.role || 'USER'
        }
      });
      return mapPrismaUser(user);
    } catch (error) {
      console.error('Prisma createUser error, falling back to JSON:', error);
    }
  }
  
  const user: User = {
    ...userData,
    createdAt: new Date().toISOString()
  };
  return jsonDb.dbCreateUser(user);
}

export async function getGalleryBySlug(slug: string): Promise<Gallery | undefined> {
  if (prisma) {
    try {
      const gallery = await prisma.gallery.findUnique({
        where: { slug },
        include: {
          media: true,
          guestbook: { orderBy: { createdAt: 'desc' } },
          scans: true
        }
      });
      return gallery ? mapPrismaGallery(gallery) : undefined;
    } catch (error) {
      console.error('Prisma getGalleryBySlug error, falling back to JSON:', error);
    }
  }
  return jsonDb.dbFindGalleryBySlug(slug);
}

export async function getGalleryById(id: string): Promise<Gallery | undefined> {
  if (prisma) {
    try {
      const gallery = await prisma.gallery.findUnique({
        where: { id },
        include: {
          media: true,
          guestbook: { orderBy: { createdAt: 'desc' } },
          scans: true
        }
      });
      return gallery ? mapPrismaGallery(gallery) : undefined;
    } catch (error) {
      console.error('Prisma getGalleryById error, falling back to JSON:', error);
    }
  }
  return jsonDb.dbFindGalleryById(id);
}

export async function getGalleriesByCreator(creatorId: string): Promise<Gallery[]> {
  if (prisma) {
    try {
      const galleries = await prisma.gallery.findMany({
        where: { creatorId },
        include: {
          media: true,
          guestbook: true,
          scans: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return galleries.map(mapPrismaGallery);
    } catch (error) {
      console.error('Prisma getGalleriesByCreator error, falling back to JSON:', error);
    }
  }
  return jsonDb.dbFindGalleriesByCreator(creatorId);
}

export async function createGallery(galleryData: Omit<Gallery, 'createdAt' | 'viewCount' | 'media' | 'guestbook' | 'scans'> & {
  media: Omit<Media, 'id' | 'createdAt'>[];
}): Promise<Gallery> {
  const now = new Date().toISOString();
  
  if (prisma) {
    try {
      const gallery = await prisma.gallery.create({
        data: {
          id: galleryData.id,
          slug: galleryData.slug,
          name: galleryData.name,
          friendNames: galleryData.friendNames,
          description: galleryData.description,
          coverImage: galleryData.coverImage,
          theme: galleryData.theme,
          musicUrl: galleryData.musicUrl,
          privacy: galleryData.privacy,
          password: galleryData.password,
          expirationDate: galleryData.expirationDate ? new Date(galleryData.expirationDate) : null,
          isEnabled: galleryData.isEnabled,
          creatorId: galleryData.creatorId,
          media: {
            create: galleryData.media.map(m => ({
              url: m.url,
              publicId: m.publicId,
              type: m.type,
              caption: m.caption
            }))
          }
        },
        include: {
          media: true,
          guestbook: true,
          scans: true
        }
      });
      return mapPrismaGallery(gallery);
    } catch (error) {
      console.error('Prisma createGallery error, falling back to JSON:', error);
    }
  }

  // Local JSON Database flow
  const mediaWithIds: Media[] = galleryData.media.map((m, idx) => ({
    id: `media-${Date.now()}-${idx}`,
    url: m.url,
    publicId: m.publicId,
    type: m.type,
    caption: m.caption,
    createdAt: now
  }));

  const newGallery: Gallery = {
    ...galleryData,
    viewCount: 0,
    createdAt: now,
    media: mediaWithIds,
    guestbook: [],
    scans: []
  };

  return jsonDb.dbCreateGallery(newGallery);
}

export async function updateGallery(id: string, updatedFields: Partial<Gallery> & {
  media?: Omit<Media, 'createdAt'>[];
}): Promise<Gallery | null> {
  if (prisma) {
    try {
      // For Prisma, we might need to handle resetting media
      const updateData: any = {
        name: updatedFields.name,
        friendNames: updatedFields.friendNames,
        description: updatedFields.description,
        coverImage: updatedFields.coverImage,
        theme: updatedFields.theme,
        musicUrl: updatedFields.musicUrl,
        privacy: updatedFields.privacy,
        password: updatedFields.password,
        expirationDate: updatedFields.expirationDate ? new Date(updatedFields.expirationDate) : null,
        isEnabled: updatedFields.isEnabled
      };

      if (updatedFields.media) {
        // Delete all old media first, and create new ones
        await prisma.media.deleteMany({ where: { galleryId: id } });
        updateData.media = {
          create: updatedFields.media.map(m => ({
            url: m.url,
            publicId: m.publicId,
            type: m.type,
            caption: m.caption
          }))
        };
      }

      const gallery = await prisma.gallery.update({
        where: { id },
        data: updateData,
        include: {
          media: true,
          guestbook: true,
          scans: true
        }
      });
      return mapPrismaGallery(gallery);
    } catch (error) {
      console.error('Prisma updateGallery error, falling back to JSON:', error);
    }
  }

  // Local JSON Database flow
  const existing = jsonDb.dbFindGalleryById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  let mediaUpdate: Media[] | undefined = undefined;
  
  if (updatedFields.media) {
    mediaUpdate = updatedFields.media.map(m => ({
      ...m,
      id: m.id || `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: (m as any).createdAt || now
    }));
  }

  return jsonDb.dbUpdateGallery(id, {
    ...updatedFields,
    media: mediaUpdate
  } as any);
}

export async function deleteGallery(id: string): Promise<boolean> {
  if (prisma) {
    try {
      await prisma.gallery.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Prisma deleteGallery error, falling back to JSON:', error);
    }
  }
  return jsonDb.dbDeleteGallery(id);
}

export async function addGuestbookEntry(galleryId: string, entryData: Omit<GuestbookEntry, 'id' | 'createdAt'>): Promise<GuestbookEntry | null> {
  const now = new Date().toISOString();
  const entryId = `gb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (prisma) {
    try {
      const entry = await prisma.guestbookEntry.create({
        data: {
          id: entryId,
          name: entryData.name,
          message: entryData.message,
          sticker: entryData.sticker,
          galleryId
        }
      });
      return {
        id: entry.id,
        name: entry.name,
        message: entry.message,
        sticker: entry.sticker,
        createdAt: entry.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Prisma addGuestbookEntry error, falling back to JSON:', error);
    }
  }

  const entry: GuestbookEntry = {
    ...entryData,
    id: entryId,
    createdAt: now
  };
  return jsonDb.dbAddGuestbookEntry(galleryId, entry);
}

export async function addScan(galleryId: string, scanData: Omit<Scan, 'id' | 'createdAt'>): Promise<Scan | null> {
  const now = new Date().toISOString();
  const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  if (prisma) {
    try {
      const scan = await prisma.scan.create({
        data: {
          id: scanId,
          device: scanData.device,
          browser: scanData.browser,
          os: scanData.os,
          country: scanData.country,
          city: scanData.city,
          galleryId
        }
      });
      // Also increment view count
      await prisma.gallery.update({
        where: { id: galleryId },
        data: { viewCount: { increment: 1 } }
      });

      return {
        id: scan.id,
        device: scan.device,
        browser: scan.browser,
        os: scan.os,
        country: scan.country,
        city: scan.city,
        createdAt: scan.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Prisma addScan error, falling back to JSON:', error);
    }
  }

  const scan: Scan = {
    ...scanData,
    id: scanId,
    createdAt: now
  };
  return jsonDb.dbAddScan(galleryId, scan);
}

export async function getAllUsers(): Promise<(User & { galleryCount: number })[]> {
  if (prisma) {
    try {
      const users = await prisma.user.findMany({
        include: {
          galleries: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return users.map(u => ({
        ...mapPrismaUser(u),
        galleryCount: u.galleries.length
      }));
    } catch (error) {
      console.error('Prisma getAllUsers error, falling back to JSON:', error);
    }
  }
  
  const db = jsonDb.readDb();
  return db.users.map(u => {
    const galleryCount = db.galleries.filter(g => g.creatorId === u.id).length;
    return {
      ...u,
      galleryCount
    };
  });
}
