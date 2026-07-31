import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllGalleries } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const galleries = await getAllGalleries();
    return NextResponse.json({ galleries });
  } catch (error) {
    console.error('Superadmin List Galleries API Error:', error);
    return NextResponse.json({ error: 'Failed to list galleries' }, { status: 500 });
  }
}
