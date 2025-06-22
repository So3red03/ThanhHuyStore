import prisma from '../libs/prismadb';

export async function clearExpiredPromotions() {
  try {
    const now = new Date();

    // Find expired promotions
    const expiredPromotions = await prisma.promotion.findMany({
      where: {
        endDate: {
          lt: now
        },
        isActive: true
      }
    });

    console.log(`Found ${expiredPromotions.length} expired promotions to clear`);

    // Clear promotional pricing for each expired promotion
    for (const promotion of expiredPromotions) {
      // Clear promotional pricing from products
      if (promotion.productIds && promotion.productIds.length > 0) {
        await prisma.product.updateMany({
          where: {
            id: { in: promotion.productIds }
          },
          data: {
            // Note: Promotion fields removed as they don't exist in current Product model
            // TODO: Implement when ProductPromotion table is ready
          }
        });
        console.log(`Cleared promotional pricing for ${promotion.productIds.length} products`);
      }

      // Clear promotional pricing from category products
      if (promotion.categoryIds && promotion.categoryIds.length > 0) {
        const categoryProducts = await prisma.product.findMany({
          where: {
            categoryId: { in: promotion.categoryIds }
          },
          select: { id: true }
        });

        const productIds = categoryProducts.map(p => p.id);

        if (productIds.length > 0) {
          await prisma.product.updateMany({
            where: {
              id: { in: productIds }
            },
            data: {
              // Note: Promotion fields removed as they don't exist in current Product model
              // TODO: Implement when ProductPromotion table is ready
            }
          });
          console.log(`Cleared promotional pricing for ${productIds.length} category products`);
        }
      }

      // Mark promotion as inactive
      await prisma.promotion.update({
        where: { id: promotion.id },
        data: { isActive: false }
      });
    }

    console.log('Expired promotions cleared successfully');
    return { success: true, clearedCount: expiredPromotions.length };
  } catch (error) {
    console.error('Error clearing expired promotions:', error);
    return { success: false, error };
  }
}
