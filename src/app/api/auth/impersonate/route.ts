import { NextRequest, NextResponse } from 'next/server';
import { getSession, signToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Keep the current superadmin session token in a backup cookie
    const currentAdminToken = req.cookies.get('session_token')?.value;

    const targetToken = signToken({
      id: targetUser.id,
      name: targetUser.name || null,
      email: targetUser.email,
      role: targetUser.role
    });

    const response = NextResponse.json({
      message: `Now impersonating ${targetUser.name}`,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email
      }
    });

    // Save super admin session in separate cookie
    if (currentAdminToken) {
      response.cookies.set('admin_session_token', currentAdminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 2, // 2 hours
        path: '/'
      });
    }

    // Replace main session with target user
    response.cookies.set('session_token', targetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Impersonate API Error:', error);
    return NextResponse.json({ error: 'Failed to impersonate user' }, { status: 500 });
  }
}
