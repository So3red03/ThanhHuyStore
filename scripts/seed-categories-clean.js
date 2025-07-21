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
        image: null,
        icon: 'MdPhoneIphone'
      }
    });

    const ipad = await prisma.category.create({
      data: {
        name: 'iPad',
        slug: 'ipad',
        description: 'Máy tính bảng iPad chính hãng',
        image: null,
        icon: 'MdTablet'
      }
    });

    const mac = await prisma.category.create({
      data: {
        name: 'Mac',
        slug: 'mac',
        description: 'Máy tính Mac chính hãng',
        image: null,
        icon: 'MdLaptopMac'
      }
    });

    const appleWatch = await prisma.category.create({
      data: {
        name: 'Apple Watch',
        slug: 'apple-watch',
        description: 'Đồng hồ thông minh Apple Watch',
        image: null,
        icon: 'MdWatch'
      }
    });

    const airpods = await prisma.category.create({
      data: {
        name: 'AirPods',
        slug: 'airpods',
        description: 'Tai nghe không dây AirPods',
        image: null,
        icon: 'MdHeadphones'
      }
    });

    const phuKien = await prisma.category.create({
      data: {
        name: 'Phụ kiện',
        slug: 'phu-kien',
        description: 'Phụ kiện Apple chính hãng',
        image: null,
        icon: 'MdCable'
      }
    });

    console.log('✅ Created all parent categories');

    // Tạo danh mục con cho iPhone
    console.log('📂 Creating iPhone subcategories...');
    
    await prisma.category.create({
      data: {
        name: 'iPhone 15 Series',
        slug: 'iphone-15-series',
        description: 'iPhone 15, 15 Plus, 15 Pro, 15 Pro Max',
        image: null,
        parentId: iphone.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'iPhone 14 Series',
        slug: 'iphone-14-series',
        description: 'iPhone 14, 14 Plus, 14 Pro, 14 Pro Max',
        image: null,
        parentId: iphone.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'iPhone 13 Series',
        slug: 'iphone-13-series',
        description: 'iPhone 13, 13 Mini, 13 Pro, 13 Pro Max',
        image: null,
        parentId: iphone.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'iPhone 12 Series',
        slug: 'iphone-12-series',
        description: 'iPhone 12, 12 Mini, 12 Pro, 12 Pro Max',
        image: null,
        parentId: iphone.id
      }
    });

    // Tạo danh mục con cho iPad
    console.log('📂 Creating iPad subcategories...');
    
    await prisma.category.create({
      data: {
        name: 'iPad Pro',
        slug: 'ipad-pro',
        description: 'iPad Pro 11 inch và 12.9 inch',
        image: null,
        parentId: ipad.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'iPad Air',
        slug: 'ipad-air',
        description: 'iPad Air thế hệ mới',
        image: null,
        parentId: ipad.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'iPad',
        slug: 'ipad-gen',
        description: 'iPad thế hệ 9, 10',
        image: null,
        parentId: ipad.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'iPad Mini',
        slug: 'ipad-mini',
        description: 'iPad Mini thế hệ 6',
        image: null,
        parentId: ipad.id
      }
    });

    // Tạo danh mục con cho Mac
    console.log('📂 Creating Mac subcategories...');
    
    await prisma.category.create({
      data: {
        name: 'MacBook Air',
        slug: 'macbook-air',
        description: 'MacBook Air M1, M2, M3',
        image: null,
        parentId: mac.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'MacBook Pro',
        slug: 'macbook-pro',
        description: 'MacBook Pro 13, 14, 16 inch',
        image: null,
        parentId: mac.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'iMac',
        slug: 'imac',
        description: 'iMac 24 inch M1, M3',
        image: null,
        parentId: mac.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'Mac Mini',
        slug: 'mac-mini',
        description: 'Mac Mini M1, M2',
        image: null,
        parentId: mac.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'Mac Studio',
        slug: 'mac-studio',
        description: 'Mac Studio M1 Max, M2 Max',
        image: null,
        parentId: mac.id
      }
    });

    // Tạo danh mục con cho Apple Watch
    console.log('📂 Creating Apple Watch subcategories...');
    
    await prisma.category.create({
      data: {
        name: 'Apple Watch Series 9',
        slug: 'apple-watch-series-9',
        description: 'Apple Watch Series 9 mới nhất',
        image: null,
        parentId: appleWatch.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'Apple Watch Ultra 2',
        slug: 'apple-watch-ultra-2',
        description: 'Apple Watch Ultra 2 cho thể thao',
        image: null,
        parentId: appleWatch.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'Apple Watch SE',
        slug: 'apple-watch-se',
        description: 'Apple Watch SE thế hệ 2',
        image: null,
        parentId: appleWatch.id
      }
    });

    // Tạo danh mục con cho AirPods
    console.log('📂 Creating AirPods subcategories...');
    
    await prisma.category.create({
      data: {
        name: 'AirPods Pro 2',
        slug: 'airpods-pro-2',
        description: 'AirPods Pro thế hệ 2 với USB-C',
        image: null,
        parentId: airpods.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'AirPods 3',
        slug: 'airpods-3',
        description: 'AirPods thế hệ 3',
        image: null,
        parentId: airpods.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'AirPods Max',
        slug: 'airpods-max',
        description: 'Tai nghe over-ear AirPods Max',
        image: null,
        parentId: airpods.id
      }
    });

    // Tạo danh mục con cho Phụ kiện
    console.log('📂 Creating Accessories subcategories...');
    
    await prisma.category.create({
      data: {
        name: 'Sạc & Cáp',
        slug: 'sac-cap',
        description: 'Sạc và cáp chính hãng Apple',
        image: null,
        parentId: phuKien.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'Ốp lưng',
        slug: 'op-lung',
        description: 'Ốp lưng iPhone chính hãng',
        image: null,
        parentId: phuKien.id
      }
    });

    await prisma.category.create({
      data: {
        name: 'Dán cường lực',
        slug: 'dan-cuong-luc',
        description: 'Dán cường lực bảo vệ màn hình',
        image: null,
        parentId: phuKien.id
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
