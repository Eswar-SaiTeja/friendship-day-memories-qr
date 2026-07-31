import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteMediaAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { id: galleryId, mediaId } = await params;
    const session = getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const success = await deleteMediaAdmin(galleryId, mediaId);
    if (!success) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Media item deleted successfully' });
  } catch (error) {
    console.error('Superadmin Delete Media API Error:', error);
    return NextResponse.json({ error: 'Failed to delete media item' }, { status: 500 });
  }
}
