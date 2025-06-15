import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    // Chỉ admin mới có thể chạy migration
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting data migration...');

    // 1. Cập nhật brand cho products chưa có brand
    const productsWithoutBrand = await prisma.product.findMany({
      where: {
        OR: [
          { brand: { equals: undefined } },
          { brand: { equals: '' } }
        ]
      }
    });

    console.log(`Found ${productsWithoutBrand.length} products without brand`);

    for (const product of productsWithoutBrand) {
      let brand = 'Apple'; // Default brand
      
      // Xác định brand dựa trên tên sản phẩm
      const productName = product.name.toLowerCase();
      if (productName.includes('samsung')) {
        brand = 'Samsung';
      } else if (productName.includes('xiaomi') || productName.includes('redmi')) {
        brand = 'Xiaomi';
      } else if (productName.includes('oppo')) {
        brand = 'Oppo';
      } else if (productName.includes('vivo')) {
        brand = 'Vivo';
      } else if (productName.includes('huawei')) {
        brand = 'Huawei';
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { brand }
      });
    }

    // 2. Cập nhật createDate cho products chưa có createDate
    const productsWithoutCreateDate = await prisma.product.findMany({
      where: {
        createDate: null
      }
    });

    console.log(`Found ${productsWithoutCreateDate.length} products without createDate`);

    for (const product of productsWithoutCreateDate) {
      await prisma.product.update({
        where: { id: product.id },
        data: { 
          createDate: product.createdAt || new Date()
        }
      });
    }

    // 3. Cập nhật brand cho CartProductType trong orders
    const orders = await prisma.order.findMany();
    
    console.log(`Found ${orders.length} orders to check`);

    for (const order of orders) {
      let needsUpdate = false;
      const updatedProducts = order.products.map((product: any) => {
        if (!product.brand) {
          needsUpdate = true;
          let brand = 'Apple';
          
          const productName = product.name.toLowerCase();
          if (productName.includes('samsung')) {
            brand = 'Samsung';
          } else if (productName.includes('xiaomi') || productName.includes('redmi')) {
            brand = 'Xiaomi';
          } else if (productName.includes('oppo')) {
            brand = 'Oppo';
          } else if (productName.includes('vivo')) {
            brand = 'Vivo';
          } else if (productName.includes('huawei')) {
            brand = 'Huawei';
          }

          return { ...product, brand };
        }
        return product;
      });

      if (needsUpdate) {
        await prisma.order.update({
          where: { id: order.id },
          data: { products: updatedProducts }
        });
      }
    }

    console.log('Data migration completed successfully');

    return NextResponse.json({
      message: 'Data migration completed successfully',
      stats: {
        productsUpdatedBrand: productsWithoutBrand.length,
        productsUpdatedCreateDate: productsWithoutCreateDate.length,
        ordersChecked: orders.length
      }
    });

  } catch (error) {
    console.error('Error during data migration:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error },
      { status: 500 }
    );
  }
}
