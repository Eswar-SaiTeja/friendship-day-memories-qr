import { NextRequest, NextResponse } from 'next/server';
import { addScan } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userAgentStr = req.headers.get('user-agent') || '';
    
    // Simple User-Agent Parsing
    let os = 'Unknown OS';
    if (userAgentStr.includes('Windows')) os = 'Windows';
    else if (userAgentStr.includes('Macintosh') || userAgentStr.includes('Mac OS X')) os = 'macOS';
    else if (userAgentStr.includes('iPhone') || userAgentStr.includes('iPad')) os = 'iOS';
    else if (userAgentStr.includes('Android')) os = 'Android';
    else if (userAgentStr.includes('Linux')) os = 'Linux';

    let browser = 'Unknown Browser';
    if (userAgentStr.includes('Firefox')) browser = 'Firefox';
    else if (userAgentStr.includes('Chrome')) browser = 'Chrome';
    else if (userAgentStr.includes('Safari') && !userAgentStr.includes('Chrome')) browser = 'Safari';
    else if (userAgentStr.includes('Edge')) browser = 'Edge';
    else if (userAgentStr.includes('OPR') || userAgentStr.includes('Opera')) browser = 'Opera';

    let device = 'Desktop';
    if (userAgentStr.includes('Mobi') || userAgentStr.includes('Android') || userAgentStr.includes('iPhone')) {
      device = 'Mobile';
    } else if (userAgentStr.includes('Tablet') || userAgentStr.includes('iPad')) {
      device = 'Tablet';
    }

    // Vercel Geo Headers
    const country = req.headers.get('x-vercel-ip-country') || 'Local Dev';
    const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') || 'Local Dev');

    const scan = await addScan(id, {
      device,
      browser,
      os,
      country,
      city
    });

    return NextResponse.json({ success: true, scan });
  } catch (error) {
    console.error('Scan Track API Error:', error);
    return NextResponse.json({ error: 'Failed to log scan' }, { status: 500 });
  }
}
