import fs from 'fs';
import path from 'path';
import { Gallery, User, GuestbookEntry, Scan } from '../types';

const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

// Ensure directory and file exists
function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], galleries: [] }, null, 2), 'utf-8');
  }
}

export function readDb(): { users: User[]; galleries: Gallery[] } {
  try {
    initDb();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON DB, returning empty defaults:', error);
    return { users: [], galleries: [] };
  }
}

export function writeDb(data: { users: User[]; galleries: Gallery[] }) {
  try {
    initDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to JSON DB:', error);
  }
}

// User helper methods
export function dbFindUserByEmail(email: string): User | undefined {
  const db = readDb();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function dbFindUserById(id: string): User | undefined {
  const db = readDb();
  return db.users.find(u => u.id === id);
}

export function dbCreateUser(user: User): User {
  const db = readDb();
  db.users.push(user);
  writeDb(db);
  return user;
}

// Gallery helper methods
export function dbFindGalleryBySlug(slug: string): Gallery | undefined {
  const db = readDb();
  return db.galleries.find(g => g.slug === slug);
}

export function dbFindGalleryById(id: string): Gallery | undefined {
  const db = readDb();
  return db.galleries.find(g => g.id === id);
}

export function dbFindGalleriesByCreator(creatorId: string): Gallery[] {
  const db = readDb();
  return db.galleries.filter(g => g.creatorId === creatorId);
}

export function dbCreateGallery(gallery: Gallery): Gallery {
  const db = readDb();
  db.galleries.push(gallery);
  writeDb(db);
  return gallery;
}

export function dbUpdateGallery(id: string, updatedFields: Partial<Gallery>): Gallery | null {
  const db = readDb();
  const index = db.galleries.findIndex(g => g.id === id);
  if (index === -1) return null;

  db.galleries[index] = {
    ...db.galleries[index],
    ...updatedFields,
    // Ensure nested structures are not accidentally lost or overwritten unless specified
    media: updatedFields.media !== undefined ? updatedFields.media : db.galleries[index].media,
    guestbook: updatedFields.guestbook !== undefined ? updatedFields.guestbook : db.galleries[index].guestbook,
    scans: updatedFields.scans !== undefined ? updatedFields.scans : db.galleries[index].scans,
    updatedAt: new Date().toISOString()
  };

  writeDb(db);
  return db.galleries[index];
}

export function dbDeleteGallery(id: string): boolean {
  const db = readDb();
  const initialLength = db.galleries.length;
  db.galleries = db.galleries.filter(g => g.id !== id);
  writeDb(db);
  return db.galleries.length < initialLength;
}

export function dbAddGuestbookEntry(galleryId: string, entry: GuestbookEntry): GuestbookEntry | null {
  const db = readDb();
  const gallery = db.galleries.find(g => g.id === galleryId);
  if (!gallery) return null;

  if (!gallery.guestbook) gallery.guestbook = [];
  gallery.guestbook.push(entry);
  
  writeDb(db);
  return entry;
}

export function dbAddScan(galleryId: string, scan: Scan): Scan | null {
  const db = readDb();
  const gallery = db.galleries.find(g => g.id === galleryId);
  if (!gallery) return null;

  if (!gallery.scans) gallery.scans = [];
  gallery.scans.push(scan);
  gallery.viewCount = (gallery.viewCount || 0) + 1;
  
  writeDb(db);
  return scan;
}
