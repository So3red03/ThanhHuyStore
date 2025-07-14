import prisma from '../libs/prismadb';

export async function getStaffUsers() {
  try {
    const staffUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['STAFF', 'ADMIN']
        }
      },
      orderBy: {
        createAt: 'desc'
      },
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
        phoneNumber: true
      }
    });

    return staffUsers;
  } catch (error: any) {
    console.error('Error fetching staff users:', error);
    return [];
  }
}
