import prisma from '../libs/prismadb';

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        reviews: {
          include: {
            user: true
          },
          orderBy: {
            createdDate: 'desc'
          }
        },
        category: true,
        productPromotions: {
          where: {
            isActive: true
          },
          include: {
            promotion: true
          }
        }
      },
      orderBy: {
        createDate: 'desc'
      }
    });
    return products;
  } catch (error) {
    console.log('Error fetching all products:', error);
    return [];
  }
}
