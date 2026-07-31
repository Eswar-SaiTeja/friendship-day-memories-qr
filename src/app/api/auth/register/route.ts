import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserByEmail, createUser } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newUser = await createUser({
      id: userId,
      name,
      email,
      password: hashedPassword,
      image: null
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
