import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '../../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createAt: true,
        updateAt: true,
        lastLogin: true,
        emailVerified: true,
        phoneNumber: true,
        isBlocked: true
      },
      orderBy: {
        createAt: 'desc'
      }
    });

    // Serialize dates
    const serializedUsers = users.map(user => ({
      ...user,
      createAt: user.createAt.toISOString(),
      updateAt: user.updateAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString() || null,
      emailVerified: user.emailVerified?.toString() || null
    }));

    return NextResponse.json(serializedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
