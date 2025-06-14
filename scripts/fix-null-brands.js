const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNullBrands() {
  try {
    console.log('🔍 Checking orders with products having null/undefined brand...');

    // Lấy tất cả orders để kiểm tra products
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        products: true
      }
    });

    console.log(`Found ${allOrders.length} total orders`);

    let ordersToUpdate = [];

    // Kiểm tra từng order xem có product nào có brand null/undefined không
    for (const order of allOrders) {
      let hasNullBrand = false;
      const updatedProducts = order.products.map(product => {
        if (!product.brand || product.brand === null || product.brand === undefined) {
          hasNullBrand = true;
          return {
            ...product,
            brand: 'Apple' // Set default brand
          };
        }
        return product;
      });

      if (hasNullBrand) {
        ordersToUpdate.push({
          id: order.id,
          products: updatedProducts
        });
      }
    }

    console.log(`Found ${ordersToUpdate.length} orders with products having null/undefined brand`);

    // Cập nhật từng order
    for (const orderData of ordersToUpdate) {
      await prisma.order.update({
        where: { id: orderData.id },
        data: {
          products: orderData.products
        }
      });
    }

    console.log(`✅ Updated ${ordersToUpdate.length} orders successfully`);

  } catch (error) {
    console.error('❌ Error fixing null brands:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNullBrands();
