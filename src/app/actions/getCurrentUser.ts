import { getServerSession } from 'next-auth';
import prisma from '../libs/prismadb';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser(options?: { skipBlockedCheck?: boolean }) {
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

    // Kiểm tra tài khoản có bị khóa không (trừ admin hoặc khi skipBlockedCheck = true)
    if (!options?.skipBlockedCheck && currentUser.isBlocked && currentUser.role !== 'ADMIN') {
      // Return special object để frontend biết user bị blocked
      return {
        ...currentUser,
        createAt: currentUser?.createAt.toISOString(),
        updateAt: currentUser?.updateAt.toISOString(),
        emailVerified: currentUser?.emailVerified?.toString() || null,
        lastLogin: currentUser?.lastLogin?.toISOString() || null,
        blockedAt: currentUser?.blockedAt?.toISOString() || null,
        isBlocked: true,
        shouldRedirectToBlocked: true
      };
    }

    return {
      ...currentUser,
      createAt: currentUser?.createAt.toISOString(),
      updateAt: currentUser?.updateAt.toISOString(),
      emailVerified: currentUser?.emailVerified?.toString() || null,
      lastLogin: currentUser?.lastLogin?.toISOString() || null,
      blockedAt: currentUser?.blockedAt?.toISOString() || null
    };
  } catch (error: any) {
    return null;
  }
}

// Alias cho admin operations - giờ chỉ là wrapper
export async function getCurrentUserForAdmin() {
  return getCurrentUser({ skipBlockedCheck: true });
}
