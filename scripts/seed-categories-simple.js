const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCategories() {
  try {
    console.log('🌱 Starting category seeding...');

    // Xóa dữ liệu cũ nếu có
    await prisma.category.deleteMany({});
    console.log('🗑️ Cleared existing categories');

    // Tạo danh mục cha
    console.log('📱 Creating parent categories...');

    const iphone = await prisma.category.create({
      data: {
        name: 'iPhone',
        slug: 'iphone',
        description: 'Điện thoại iPhone chính hãng',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone.jpg?alt=media',
        icon: '📱'
      }
    });

    const ipad = await prisma.category.create({
      data: {
        id: 'ipad',
        name: 'iPad',
        slug: 'ipad',
        description: 'Máy tính bảng iPad chính hãng',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad.jpg?alt=media',
        icon: '📱'
      }
    });

    const mac = await prisma.category.create({
      data: {
        id: 'mac',
        name: 'Mac',
        slug: 'mac',
        description: 'Máy tính Mac chính hãng',
        image: 'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmac.jpg?alt=media',
        icon: '💻'
      }
    });

    const appleWatch = await prisma.category.create({
      data: {
        id: 'apple-watch',
        name: 'Apple Watch',
        slug: 'apple-watch',
        description: 'Đồng hồ thông minh Apple Watch',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fapple-watch.jpg?alt=media',
        icon: '⌚'
      }
    });

    const airpods = await prisma.category.create({
      data: {
        id: 'airpods',
        name: 'AirPods',
        slug: 'airpods',
        description: 'Tai nghe không dây AirPods',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fairpods.jpg?alt=media',
        icon: '🎧'
      }
    });

    const phuKien = await prisma.category.create({
      data: {
        id: 'phu-kien',
        name: 'Phụ kiện',
        slug: 'phu-kien',
        description: 'Phụ kiện Apple chính hãng',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fphu-kien.jpg?alt=media',
        icon: '🔌'
      }
    });

    console.log('✅ Created all parent categories');

    // Tạo danh mục con cho iPhone
    console.log('📂 Creating iPhone subcategories...');

    await prisma.category.create({
      data: {
        id: 'iphone-15-series',
        name: 'iPhone 15 Series',
        slug: 'iphone-15-series',
        description: 'iPhone 15, 15 Plus, 15 Pro, 15 Pro Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone-15.jpg?alt=media',
        parentId: 'iphone'
      }
    });

    await prisma.category.create({
      data: {
        id: 'iphone-14-series',
        name: 'iPhone 14 Series',
        slug: 'iphone-14-series',
        description: 'iPhone 14, 14 Plus, 14 Pro, 14 Pro Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone-14.jpg?alt=media',
        parentId: 'iphone'
      }
    });

    await prisma.category.create({
      data: {
        id: 'iphone-13-series',
        name: 'iPhone 13 Series',
        slug: 'iphone-13-series',
        description: 'iPhone 13, 13 Mini, 13 Pro, 13 Pro Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone-13.jpg?alt=media',
        parentId: 'iphone'
      }
    });

    await prisma.category.create({
      data: {
        id: 'iphone-12-series',
        name: 'iPhone 12 Series',
        slug: 'iphone-12-series',
        description: 'iPhone 12, 12 Mini, 12 Pro, 12 Pro Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone-12.jpg?alt=media',
        parentId: 'iphone'
      }
    });

    // Tạo danh mục con cho iPad
    console.log('📂 Creating iPad subcategories...');

    await prisma.category.create({
      data: {
        id: 'ipad-pro',
        name: 'iPad Pro',
        slug: 'ipad-pro',
        description: 'iPad Pro 11 inch và 12.9 inch',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad-pro.jpg?alt=media',
        parentId: 'ipad'
      }
    });

    await prisma.category.create({
      data: {
        id: 'ipad-air',
        name: 'iPad Air',
        slug: 'ipad-air',
        description: 'iPad Air thế hệ mới',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad-air.jpg?alt=media',
        parentId: 'ipad'
      }
    });

    await prisma.category.create({
      data: {
        id: 'ipad-gen',
        name: 'iPad',
        slug: 'ipad-gen',
        description: 'iPad thế hệ 9, 10',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad-gen.jpg?alt=media',
        parentId: 'ipad'
      }
    });

    await prisma.category.create({
      data: {
        id: 'ipad-mini',
        name: 'iPad Mini',
        slug: 'ipad-mini',
        description: 'iPad Mini thế hệ 6',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad-mini.jpg?alt=media',
        parentId: 'ipad'
      }
    });

    // Tạo danh mục con cho Mac
    console.log('📂 Creating Mac subcategories...');

    await prisma.category.create({
      data: {
        id: 'macbook-air',
        name: 'MacBook Air',
        slug: 'macbook-air',
        description: 'MacBook Air M1, M2, M3',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmacbook-air.jpg?alt=media',
        parentId: 'mac'
      }
    });

    await prisma.category.create({
      data: {
        id: 'macbook-pro',
        name: 'MacBook Pro',
        slug: 'macbook-pro',
        description: 'MacBook Pro 13, 14, 16 inch',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmacbook-pro.jpg?alt=media',
        parentId: 'mac'
      }
    });

    await prisma.category.create({
      data: {
        id: 'imac',
        name: 'iMac',
        slug: 'imac',
        description: 'iMac 24 inch M1, M3',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fimac.jpg?alt=media',
        parentId: 'mac'
      }
    });

    await prisma.category.create({
      data: {
        id: 'mac-mini',
        name: 'Mac Mini',
        slug: 'mac-mini',
        description: 'Mac Mini M1, M2',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmac-mini.jpg?alt=media',
        parentId: 'mac'
      }
    });

    await prisma.category.create({
      data: {
        id: 'mac-studio',
        name: 'Mac Studio',
        slug: 'mac-studio',
        description: 'Mac Studio M1 Max, M2 Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmac-studio.jpg?alt=media',
        parentId: 'mac'
      }
    });

    console.log('🎉 Category seeding completed successfully!');
    console.log('📊 Created 6 parent categories and multiple subcategories');
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
if (require.main === module) {
  seedCategories();
}

module.exports = { seedCategories };
