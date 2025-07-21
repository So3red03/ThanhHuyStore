const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedArticleCategories() {
  try {
    console.log('📰 Starting article category seeding...');

    // Xóa dữ liệu cũ nếu có
    await prisma.articleCategory.deleteMany({});
    console.log('🗑️ Cleared existing article categories');

    // Tạo các danh mục bài viết
    console.log('📝 Creating article categories...');
    
    await prisma.articleCategory.create({
      data: {
        name: 'Tin tức Apple',
        slug: 'tin-tuc-apple',
        description: 'Tin tức mới nhất về Apple và các sản phẩm',
        icon: 'MdNewspaper',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Đánh giá sản phẩm',
        slug: 'danh-gia-san-pham',
        description: 'Đánh giá chi tiết các sản phẩm Apple',
        icon: 'MdRateReview',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Hướng dẫn sử dụng',
        slug: 'huong-dan-su-dung',
        description: 'Hướng dẫn sử dụng các sản phẩm Apple',
        icon: 'MdHelp',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Mẹo và thủ thuật',
        slug: 'meo-va-thu-thuat',
        description: 'Các mẹo và thủ thuật hữu ích cho người dùng Apple',
        icon: 'MdTips',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'So sánh sản phẩm',
        slug: 'so-sanh-san-pham',
        description: 'So sánh các sản phẩm Apple với nhau',
        icon: 'MdCompare',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Khuyến mãi',
        slug: 'khuyen-mai',
        description: 'Thông tin về các chương trình khuyến mãi',
        icon: 'MdLocalOffer',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Sự kiện Apple',
        slug: 'su-kien-apple',
        description: 'Thông tin về các sự kiện và keynote của Apple',
        icon: 'MdEvent',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Phụ kiện',
        slug: 'phu-kien',
        description: 'Thông tin về phụ kiện Apple và third-party',
        icon: 'MdExtension',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'iOS & macOS',
        slug: 'ios-macos',
        description: 'Tin tức và hướng dẫn về hệ điều hành Apple',
        icon: 'MdPhoneIphone',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Bảo hành & Sửa chữa',
        slug: 'bao-hanh-sua-chua',
        description: 'Thông tin về bảo hành và dịch vụ sửa chữa',
        icon: 'MdBuild',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Công nghệ',
        slug: 'cong-nghe',
        description: 'Tin tức về công nghệ và đổi mới của Apple',
        icon: 'MdScience',
        isActive: true
      }
    });

    await prisma.articleCategory.create({
      data: {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Cách Apple tích hợp vào cuộc sống hàng ngày',
        icon: 'MdFavorite',
        isActive: true
      }
    });

    console.log('🎉 Article category seeding completed successfully!');
    console.log('📊 Created 12 article categories');

  } catch (error) {
    console.error('❌ Error seeding article categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
if (require.main === module) {
  seedArticleCategories();
}

module.exports = { seedArticleCategories };
