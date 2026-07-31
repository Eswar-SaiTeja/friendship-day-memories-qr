import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createGallery, getGalleriesByCreator, getGalleryBySlug } from '@/lib/db';

export const dynamic = 'force-dynamic';

const mediaSchema = z.object({
  url: z.string().min(1, 'Media URL is required'),
  publicId: z.string(),
  type: z.enum(['IMAGE', 'VIDEO']),
  caption: z.string().optional()
});

const createGallerySchema = z.object({
  name: z.string().min(1, 'Gallery name is required'),
  friendNames: z.array(z.string().min(1, 'Friend name cannot be empty')).min(1, 'At least one friend is required'),
  description: z.string().optional(),
  coverImage: z.string(),
  theme: z.enum(['retro', 'cyberpunk', 'pastels', 'sunset', 'dark', 'default']),
  musicUrl: z.string().optional().nullable(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'PASSWORD']),
  password: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  media: z.array(mediaSchema).default([])
});

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const galleries = await getGalleriesByCreator(session.id);
    return NextResponse.json({ galleries });
  } catch (error) {
    console.error('List Galleries API Error:', error);
    return NextResponse.json({ error: 'Failed to list galleries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = createGallerySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;
    
    // Generate a unique slug: e.g. friendship-2026-AB123
    let slug = '';
    let unique = false;
    let attempts = 0;
    
    while (!unique && attempts < 10) {
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      slug = `friendship-2026-${rand}`;
      
      const existing = await getGalleryBySlug(slug);
      if (!existing) {
        unique = true;
      }
      attempts++;
    }

    if (!unique) {
      return NextResponse.json(
        { error: 'Failed to generate unique link. Please try again.' },
        { status: 500 }
      );
    }

    const galleryId = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newGallery = await createGallery({
      id: galleryId,
      slug,
      name: data.name,
      friendNames: data.friendNames,
      description: data.description || '',
      coverImage: data.coverImage,
      theme: data.theme,
      musicUrl: data.musicUrl || null,
      privacy: data.privacy,
      password: data.password || null,
      expirationDate: data.expirationDate || null,
      isEnabled: true,
      creatorId: session.id,
      media: data.media
    });

    return NextResponse.json({ gallery: newGallery }, { status: 201 });
  } catch (error) {
    console.error('Create Gallery API Error:', error);
    return NextResponse.json({ error: 'Failed to create gallery' }, { status: 500 });
  }
}
