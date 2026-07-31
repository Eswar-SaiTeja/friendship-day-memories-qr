import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGalleryById, addGuestbookEntry } from '@/lib/db';

const guestbookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  message: z.string().min(1, 'Message is required').max(500, 'Message is too long'),
  sticker: z.string().optional().nullable()
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if gallery exists and is enabled
    const gallery = await getGalleryById(id);
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    if (!gallery.isEnabled) {
      return NextResponse.json({ error: 'Gallery is disabled' }, { status: 400 });
    }

    const body = await req.json();
    const result = guestbookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, message, sticker } = result.data;
    
    const entry = await addGuestbookEntry(id, {
      name,
      message,
      sticker: sticker || null
    });

    if (!entry) {
      return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Guestbook API Error:', error);
    return NextResponse.json({ error: 'Failed to add guestbook entry' }, { status: 500 });
  }
}
