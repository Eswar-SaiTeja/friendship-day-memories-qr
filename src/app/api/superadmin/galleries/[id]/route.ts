import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateGallery, deleteGallery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updatedGallery = await updateGallery(id, body);
    if (!updatedGallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    return NextResponse.json({ gallery: updatedGallery });
  } catch (error) {
    console.error('Superadmin Update Gallery API Error:', error);
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
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const success = await deleteGallery(id);
    if (!success) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Gallery deleted successfully' });
  } catch (error) {
    console.error('Superadmin Delete Gallery API Error:', error);
    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 });
  }
}
