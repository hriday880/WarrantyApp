import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, name } = await req.json();

    if (!phoneNumber || !name) {
      return NextResponse.json({ error: 'Phone number and name are required' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          name,
          role: 'CUSTOMER',
        },
      });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Your account has been banned. Please contact support.' }, { status: 403 });
    }

    const token = await signToken({ id: user.id, role: user.role });

    const response = NextResponse.json({ success: true });
    
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && !req.headers.get('host')?.match(/^(localhost|192\.168|10\.|172\.1[6-9]|172\.2[0-9]|172\.3[0-1])/),
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    };

    response.cookies.set('auth_token', token, cookieOptions);

    return response;
  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
