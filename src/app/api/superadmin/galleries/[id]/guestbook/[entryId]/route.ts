import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteGuestbookEntryAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id: galleryId, entryId } = await params;
    const session = getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const success = await deleteGuestbookEntryAdmin(galleryId, entryId);
    if (!success) {
      return NextResponse.json({ error: 'Guestbook entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Guestbook wish deleted successfully' });
  } catch (error) {
    console.error('Superadmin Delete Guestbook Wish API Error:', error);
    return NextResponse.json({ error: 'Failed to delete guestbook wish' }, { status: 500 });
  }
}
