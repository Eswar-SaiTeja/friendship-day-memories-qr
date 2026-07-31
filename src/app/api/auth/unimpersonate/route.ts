import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.cookies.get('admin_session_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'No admin session found' }, { status: 400 });
    }

    const adminUser = verifyToken(adminToken);
    if (!adminUser || adminUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 400 });
    }

    const response = NextResponse.json({
      message: 'Returned to Super Admin panel successfully',
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email
      }
    });

    // Restore superadmin token into session_token
    response.cookies.set('session_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    // Delete backup cookie
    response.cookies.set('admin_session_token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Unimpersonate API Error:', error);
    return NextResponse.json({ error: 'Failed to return to admin session' }, { status: 500 });
  }
}
