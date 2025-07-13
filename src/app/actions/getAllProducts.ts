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
        },
        // Include variants for variant products
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        },
        // Include product attributes for variant products
        productAttributes: {
          include: {
            values: {
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return products;
  } catch (error: any) {
    throw new Error(error);
  }
}
