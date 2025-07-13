import { getServerSession } from 'next-auth';
import prisma from '../libs/prismadb';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session?.user?.email) return null;

    const currentUser = await prisma.user.findUnique({
      where: {
        email: session?.user?.email
      },
      include: {
        orders: true
      }
    });
    if (!currentUser) return null;

    return {
      ...currentUser,
      createAt: currentUser?.createAt.toISOString(),
      updateAt: currentUser?.updateAt.toISOString(),
      emailVerified: currentUser?.emailVerified?.toString() || null,
      lastLogin: currentUser?.lastLogin?.toISOString() || null
    };
  } catch (error: any) {
    throw new Error(error);
  }
}
