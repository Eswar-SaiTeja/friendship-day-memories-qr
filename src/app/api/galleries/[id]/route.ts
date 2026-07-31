import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { getGalleryById, updateGallery, deleteGallery } from '@/lib/db';

const mediaSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1, 'Media URL is required'),
  publicId: z.string(),
  type: z.enum(['IMAGE', 'VIDEO']),
  caption: z.string().optional().nullable()
});

const updateGallerySchema = z.object({
  name: z.string().min(1, 'Gallery name is required').optional(),
  friendNames: z.array(z.string().min(1, 'Friend name cannot be empty')).optional(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional(),
  theme: z.enum(['retro', 'cyberpunk', 'pastels', 'sunset', 'dark', 'default']).optional(),
  musicUrl: z.string().optional().nullable(),
  privacy: z.enum(['PUBLIC', 'PRIVATE', 'PASSWORD']).optional(),
  password: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  isEnabled: z.boolean().optional(),
  media: z.array(mediaSchema).optional()
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gallery = await getGalleryById(id);
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Only the creator can access details by direct ID
    if (gallery.creatorId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ gallery });
  } catch (error) {
    console.error('Fetch Gallery Error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gallery = await getGalleryById(id);
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    if (gallery.creatorId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const result = updateGallerySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const updated = await updateGallery(id, result.data as any);
    return NextResponse.json({ gallery: updated });
  } catch (error) {
    console.error('Update Gallery Error:', error);
    return NextResponse.json({ error: 'Failed to update gallery' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gallery = await getGalleryById(id);
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    if (gallery.creatorId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await deleteGallery(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Delete Gallery Error:', error);
    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 });
  }
}
