const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

async function seed() {
  console.log('Seeding local JSON database with Super Admin...');
  
  const hashedPassword = await bcrypt.hash('bestie123', 10);
  const superadminHash = await bcrypt.hash('superadmin123', 10);
  
  const defaultUser = {
    id: 'user-default-123',
    name: 'Bestie Creator',
    email: 'bestie@memories.com',
    password: hashedPassword,
    image: null,
    role: 'USER',
    createdAt: new Date().toISOString()
  };

  const superAdminUser = {
    id: 'user-superadmin-123',
    name: 'Platform Super Admin',
    email: 'superadmin@memories.com',
    password: superadminHash,
    image: null,
    role: 'SUPERADMIN',
    createdAt: new Date().toISOString()
  };

  const richMeta = {
    description: 'Rachel, we have shared so many laughs, coffees, and late-night talks. Here is to our wonderful journey together!',
    secretMessage: 'Rachel, you are the Monica to my Rachel! I love you so much! Happy Friendship Day! 💖',
    trivia: {
      question: 'Which TV show did we binge-watch together last summer?',
      options: ['Friends', 'Stranger Things', 'The Office', 'Brooklyn Nine-Nine'],
      correctAnswer: 'Friends'
    }
  };

  const defaultGallery = {
    id: 'gallery-default-123',
    slug: 'friendship-2026-DEMO',
    name: 'Rachel & Bestie Memories ❤️',
    friendNames: ['Rachel'],
    description: JSON.stringify(richMeta),
    coverImage: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop',
    theme: 'sunset',
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    privacy: 'PUBLIC',
    password: null,
    expirationDate: null,
    isEnabled: true,
    viewCount: 15,
    createdAt: new Date().toISOString(),
    creatorId: 'user-default-123',
    media: [
      {
        id: 'media-1',
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
        publicId: 'local-demo-1',
        type: 'IMAGE',
        caption: 'Working together on our projects!',
        createdAt: new Date().toISOString()
      },
      {
        id: 'media-2',
        url: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?q=80&w=800&auto=format&fit=crop',
        publicId: 'local-demo-2',
        type: 'IMAGE',
        caption: 'Sunset beach walk - best day ever.',
        createdAt: new Date().toISOString()
      }
    ],
    guestbook: [
      {
        id: 'gb-1',
        name: 'Rachel',
        message: 'This is the most beautiful card I have ever received! You made me cry, thank you so much! ❤️',
        sticker: '❤️',
        createdAt: new Date().toISOString()
      }
    ],
    scans: [
      {
        id: 'scan-1',
        device: 'Mobile',
        browser: 'Chrome',
        os: 'Android',
        country: 'US',
        city: 'New York',
        createdAt: new Date().toISOString()
      }
    ]
  };

  const data = {
    users: [defaultUser, superAdminUser],
    galleries: [defaultGallery]
  };

  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Seed completed successfully!');
  console.log('User Account Login Details:');
  console.log('  Email: bestie@memories.com');
  console.log('  Password: bestie123');
  console.log('Super Admin Login Details:');
  console.log('  Email: superadmin@memories.com');
  console.log('  Password: superadmin123');
}

seed().catch(console.error);
