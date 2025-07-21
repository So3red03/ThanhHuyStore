const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCategories() {
  try {
    console.log('🌱 Starting category seeding...');

    // Xóa dữ liệu cũ nếu có
    await prisma.category.deleteMany({});
    console.log('🗑️ Cleared existing categories');

    // Tạo danh mục cha
    const parentCategories = [
      {
        id: 'iphone',
        name: 'iPhone',
        slug: 'iphone',
        description: 'Điện thoại iPhone chính hãng',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone.jpg?alt=media',
        icon: '📱'
      },
      {
        id: 'ipad',
        name: 'iPad',
        slug: 'ipad',
        description: 'Máy tính bảng iPad chính hãng',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad.jpg?alt=media',
        icon: '📱'
      },
      {
        id: 'mac',
        name: 'Mac',
        slug: 'mac',
        description: 'Máy tính Mac chính hãng',
        image: 'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmac.jpg?alt=media',
        icon: '💻'
      },
      {
        id: 'apple-watch',
        name: 'Apple Watch',
        slug: 'apple-watch',
        description: 'Đồng hồ thông minh Apple Watch',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fapple-watch.jpg?alt=media',
        icon: '⌚'
      },
      {
        id: 'airpods',
        name: 'AirPods',
        slug: 'airpods',
        description: 'Tai nghe không dây AirPods',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fairpods.jpg?alt=media',
        icon: '🎧'
      },
      {
        id: 'phu-kien',
        name: 'Phụ kiện',
        slug: 'phu-kien',
        description: 'Phụ kiện Apple chính hãng',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fphu-kien.jpg?alt=media',
        icon: '🔌'
      }
    ];

    console.log('📱 Creating parent categories...');
    for (const category of parentCategories) {
      await prisma.category.create({
        data: category
      });
      console.log(`✅ Created parent category: ${category.name}`);
    }

    // Tạo danh mục con cho iPhone
    const iPhoneSubCategories = [
      {
        id: 'iphone-15-series',
        name: 'iPhone 15 Series',
        slug: 'iphone-15-series',
        description: 'iPhone 15, 15 Plus, 15 Pro, 15 Pro Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone-15.jpg?alt=media',
        parentId: 'iphone'
      },
      {
        id: 'iphone-14-series',
        name: 'iPhone 14 Series',
        slug: 'iphone-14-series',
        description: 'iPhone 14, 14 Plus, 14 Pro, 14 Pro Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone-14.jpg?alt=media',
        parentId: 'iphone'
      },
      {
        id: 'iphone-13-series',
        name: 'iPhone 13 Series',
        slug: 'iphone-13-series',
        description: 'iPhone 13, 13 Mini, 13 Pro, 13 Pro Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone-13.jpg?alt=media',
        isParent: false,
        parentId: 'iphone',
        displayOrder: 3
      },
      {
        id: 'iphone-12-series',
        name: 'iPhone 12 Series',
        slug: 'iphone-12-series',
        description: 'iPhone 12, 12 Mini, 12 Pro, 12 Pro Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fiphone-12.jpg?alt=media',
        isParent: false,
        parentId: 'iphone',
        displayOrder: 4
      }
    ];

    // Tạo danh mục con cho iPad
    const iPadSubCategories = [
      {
        id: 'ipad-pro',
        name: 'iPad Pro',
        slug: 'ipad-pro',
        description: 'iPad Pro 11 inch và 12.9 inch',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad-pro.jpg?alt=media',
        isParent: false,
        parentId: 'ipad',
        displayOrder: 1
      },
      {
        id: 'ipad-air',
        name: 'iPad Air',
        slug: 'ipad-air',
        description: 'iPad Air thế hệ mới',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad-air.jpg?alt=media',
        isParent: false,
        parentId: 'ipad',
        displayOrder: 2
      },
      {
        id: 'ipad-gen',
        name: 'iPad',
        slug: 'ipad-gen',
        description: 'iPad thế hệ 9, 10',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad-gen.jpg?alt=media',
        isParent: false,
        parentId: 'ipad',
        displayOrder: 3
      },
      {
        id: 'ipad-mini',
        name: 'iPad Mini',
        slug: 'ipad-mini',
        description: 'iPad Mini thế hệ 6',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fipad-mini.jpg?alt=media',
        isParent: false,
        parentId: 'ipad',
        displayOrder: 4
      }
    ];

    // Tạo danh mục con cho Mac
    const macSubCategories = [
      {
        id: 'macbook-air',
        name: 'MacBook Air',
        slug: 'macbook-air',
        description: 'MacBook Air M1, M2, M3',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmacbook-air.jpg?alt=media',
        isParent: false,
        parentId: 'mac',
        displayOrder: 1
      },
      {
        id: 'macbook-pro',
        name: 'MacBook Pro',
        slug: 'macbook-pro',
        description: 'MacBook Pro 13, 14, 16 inch',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmacbook-pro.jpg?alt=media',
        isParent: false,
        parentId: 'mac',
        displayOrder: 2
      },
      {
        id: 'imac',
        name: 'iMac',
        slug: 'imac',
        description: 'iMac 24 inch M1, M3',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fimac.jpg?alt=media',
        isParent: false,
        parentId: 'mac',
        displayOrder: 3
      },
      {
        id: 'mac-mini',
        name: 'Mac Mini',
        slug: 'mac-mini',
        description: 'Mac Mini M1, M2',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmac-mini.jpg?alt=media',
        isParent: false,
        parentId: 'mac',
        displayOrder: 4
      },
      {
        id: 'mac-studio',
        name: 'Mac Studio',
        slug: 'mac-studio',
        description: 'Mac Studio M1 Max, M2 Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmac-studio.jpg?alt=media',
        isParent: false,
        parentId: 'mac',
        displayOrder: 5
      }
    ];

    // Tạo danh mục con cho Apple Watch
    const appleWatchSubCategories = [
      {
        id: 'apple-watch-series-9',
        name: 'Apple Watch Series 9',
        slug: 'apple-watch-series-9',
        description: 'Apple Watch Series 9 mới nhất',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fwatch-series-9.jpg?alt=media',
        isParent: false,
        parentId: 'apple-watch',
        displayOrder: 1
      },
      {
        id: 'apple-watch-ultra-2',
        name: 'Apple Watch Ultra 2',
        slug: 'apple-watch-ultra-2',
        description: 'Apple Watch Ultra 2 cho thể thao',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fwatch-ultra-2.jpg?alt=media',
        isParent: false,
        parentId: 'apple-watch',
        displayOrder: 2
      },
      {
        id: 'apple-watch-se',
        name: 'Apple Watch SE',
        slug: 'apple-watch-se',
        description: 'Apple Watch SE thế hệ 2',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fwatch-se.jpg?alt=media',
        isParent: false,
        parentId: 'apple-watch',
        displayOrder: 3
      }
    ];

    // Tạo danh mục con cho AirPods
    const airPodsSubCategories = [
      {
        id: 'airpods-pro-2',
        name: 'AirPods Pro 2',
        slug: 'airpods-pro-2',
        description: 'AirPods Pro thế hệ 2 với USB-C',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fairpods-pro-2.jpg?alt=media',
        isParent: false,
        parentId: 'airpods',
        displayOrder: 1
      },
      {
        id: 'airpods-3',
        name: 'AirPods 3',
        slug: 'airpods-3',
        description: 'AirPods thế hệ 3',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fairpods-3.jpg?alt=media',
        isParent: false,
        parentId: 'airpods',
        displayOrder: 2
      },
      {
        id: 'airpods-max',
        name: 'AirPods Max',
        slug: 'airpods-max',
        description: 'Tai nghe over-ear AirPods Max',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fairpods-max.jpg?alt=media',
        isParent: false,
        parentId: 'airpods',
        displayOrder: 3
      }
    ];

    // Tạo danh mục con cho Phụ kiện
    const accessorySubCategories = [
      {
        id: 'sac-cap',
        name: 'Sạc & Cáp',
        slug: 'sac-cap',
        description: 'Sạc và cáp chính hãng Apple',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fsac-cap.jpg?alt=media',
        isParent: false,
        parentId: 'phu-kien',
        displayOrder: 1
      },
      {
        id: 'op-lung',
        name: 'Ốp lưng',
        slug: 'op-lung',
        description: 'Ốp lưng iPhone chính hãng',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fop-lung.jpg?alt=media',
        isParent: false,
        parentId: 'phu-kien',
        displayOrder: 2
      },
      {
        id: 'dan-cuong-luc',
        name: 'Dán cường lực',
        slug: 'dan-cuong-luc',
        description: 'Dán cường lực bảo vệ màn hình',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fdan-cuong-luc.jpg?alt=media',
        isParent: false,
        parentId: 'phu-kien',
        displayOrder: 3
      },
      {
        id: 'apple-pencil',
        name: 'Apple Pencil',
        slug: 'apple-pencil',
        description: 'Apple Pencil thế hệ 1 và 2',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fapple-pencil.jpg?alt=media',
        isParent: false,
        parentId: 'phu-kien',
        displayOrder: 4
      },
      {
        id: 'magic-keyboard',
        name: 'Magic Keyboard',
        slug: 'magic-keyboard',
        description: 'Bàn phím Magic Keyboard',
        image:
          'https://firebasestorage.googleapis.com/v0/b/thanhhuystore.appspot.com/o/categories%2Fmagic-keyboard.jpg?alt=media',
        isParent: false,
        parentId: 'phu-kien',
        displayOrder: 5
      }
    ];

    // Tạo tất cả danh mục con
    const allSubCategories = [
      ...iPhoneSubCategories,
      ...iPadSubCategories,
      ...macSubCategories,
      ...appleWatchSubCategories,
      ...airPodsSubCategories,
      ...accessorySubCategories
    ];

    console.log('📂 Creating sub categories...');
    for (const category of allSubCategories) {
      await prisma.category.create({
        data: category
      });
      console.log(`✅ Created sub category: ${category.name}`);
    }

    console.log('🎉 Category seeding completed successfully!');
    console.log(
      `📊 Created ${parentCategories.length} parent categories and ${allSubCategories.length} sub categories`
    );
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
