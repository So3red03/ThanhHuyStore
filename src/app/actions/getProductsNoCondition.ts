import prisma from '../libs/prismadb';

export async function getProductsNoCondition() {
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
      }
    });
    // products.forEach(async (product) => {
    // 	if (product.inStock < 6) {
    // 		await prisma.notification.create({
    // 			data: {
    // 				productId: product.id,
    // 				type: 'LOW_STOCK',
    // 				message: `Sản phẩm ${product.name} có tồn kho dưới 2. Vui lòng kiểm tra lại.`,
    // 			},
    // 		});
    // 	}
    // });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}
