import prisma from '../libs/prismadb';
import { getSession } from './getCurrentUser';

export async function getUsers() {
  try {
    const users = await prisma.user.findMany();
    return users || [];
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return []; // Return empty array instead of throwing error
  }
}

export async function getSessionUsers() {
  const session = await getSession();
  if (!session?.user?.email) {
    return [];
  }
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createAt: 'desc'
      },
      where: {
        // Lấy tất cả user trừ mình trong phiên
        NOT: {
          email: session.user.email
        }
      }
    });
    return users;
  } catch (error: any) {
    return [];
  }
}
