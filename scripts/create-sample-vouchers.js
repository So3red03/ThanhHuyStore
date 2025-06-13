const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleVouchers() {
  try {
    const sampleVouchers = [
      {
        code: '3T1000K',
        description: 'Code giảm giá cho đơn hàng trên 1 triệu vnđ.',
        image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderValue: 1000000,
        maxDiscount: 100000,
        quantity: 100,
        maxUsagePerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        voucherType: 'GENERAL'
      },
      {
        code: '3T500K',
        description: 'Code giảm giá cho đơn hàng trên 500 nghìn vnđ.',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
        discountType: 'PERCENTAGE',
        discountValue: 5,
        minOrderValue: 500000,
        maxDiscount: 50000,
        quantity: 200,
        maxUsagePerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        voucherType: 'UPSELL'
      },
      {
        code: '3TFREESHIP',
        description: 'Code miễn phí vận chuyển cho đơn hàng tối thiểu 600 nghìn vnđ',
        image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop',
        discountType: 'FIXED',
        discountValue: 40000,
        minOrderValue: 600000,
        quantity: 150,
        maxUsagePerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        voucherType: 'GENERAL'
      },
      {
        code: 'NEWUSER50',
        description: 'Voucher chào mừng khách hàng mới - Giảm 50K',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
        discountType: 'FIXED',
        discountValue: 50000,
        minOrderValue: 200000,
        quantity: 500,
        maxUsagePerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
        voucherType: 'NEW_USER'
      },
      {
        code: 'LOYALTY100',
        description: 'Voucher khách hàng thân thiết - Giảm 100K',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
        discountType: 'FIXED',
        discountValue: 100000,
        minOrderValue: 800000,
        quantity: 50,
        maxUsagePerUser: 2,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        isActive: true,
        voucherType: 'LOYALTY'
      }
    ];

    for (const voucherData of sampleVouchers) {
      await prisma.voucher.create({
        data: voucherData
      });
      console.log(`Created voucher: ${voucherData.code}`);
    }

    console.log('All sample vouchers created successfully!');
  } catch (error) {
    console.error('Error creating sample vouchers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleVouchers();
