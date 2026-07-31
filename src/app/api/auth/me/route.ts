import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await getUserById(session.id);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const isImpersonating = req.cookies.has('admin_session_token');

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        isImpersonating
      }
    });
  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
