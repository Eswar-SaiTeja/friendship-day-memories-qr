import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Configure Cloudinary only if credentials are set
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

const isCloudinaryActive = () =>
  !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type.startsWith('video/') ? 'video' : 'image';

    // 1. Cloudinary upload path
    if (isCloudinaryActive()) {
      try {
        const uploadResponse = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: fileType,
              folder: 'friendship_qr_galleries'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });

        return NextResponse.json({
          url: uploadResponse.secure_url,
          publicId: uploadResponse.public_id,
          type: fileType === 'video' ? 'VIDEO' : 'IMAGE'
        });
      } catch (cloudinaryError) {
        console.error('Cloudinary Upload Failed, falling back to local storage:', cloudinaryError);
        // Fallback to local if Cloudinary fails
      }
    }

    // 2. Local File System fallback path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = file.name.split('.').pop() || (fileType === 'video' ? 'mp4' : 'jpg');
    const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const filePath = path.join(uploadDir, safeFileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeFileName}`;
    return NextResponse.json({
      url: fileUrl,
      publicId: `local-${safeFileName}`,
      type: fileType === 'video' ? 'VIDEO' : 'IMAGE'
    });

  } catch (error) {
    console.error('Upload Route Error:', error);
    return NextResponse.json({ error: 'Failed to upload media file' }, { status: 500 });
  }
}
