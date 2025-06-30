/**
 * Seed Script: Product Variant System
 *
 * Creates sample variant products for testing the new variant system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedVariantSystem() {
  console.log('🌱 Seeding Product Variant System...');

  try {
    // Clear existing variant data first
    console.log('🗑️ Clearing existing variant data...');
    await prisma.productVariant.deleteMany({});
    await prisma.attributeValue.deleteMany({});
    await prisma.productAttribute.deleteMany({});

    // Delete existing variant products
    await prisma.product.deleteMany({
      where: { productType: 'VARIANT' }
    });
    console.log('✅ Cleared existing variant data');
    // Get or create a category for testing
    let category = await prisma.category.findFirst({
      where: { name: 'Laptop' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Laptop',
          slug: 'laptop',
          description: 'Laptop và máy tính xách tay'
        }
      });
      console.log('✅ Created Laptop category');
    }

    // Simplified schema - we'll create attributes per product

    // We'll create attributes directly for each product in simplified schema

    // Create MacBook Pro 16-inch variant product
    console.log('📝 Creating MacBook Pro 16-inch variant product...');

    const macbookPro = await prisma.product.create({
      data: {
        name: 'MacBook Pro 16-inch',
        description:
          'MacBook Pro 16-inch với chip Apple M3 Pro mạnh mẽ, màn hình Liquid Retina XDR tuyệt đẹp và thời lượng pin cả ngày.',
        brand: 'Apple',
        productType: 'VARIANT',
        basePrice: 60000000, // 60M VND base price
        categoryId: category.id,
        images: [
          {
            color: 'Silver',
            colorCode: '#C0C0C0',
            images: [
              'https://example.com/macbook-pro-16-silver-1.jpg',
              'https://example.com/macbook-pro-16-silver-2.jpg'
            ]
          },
          {
            color: 'Space Black',
            colorCode: '#2C2C2C',
            images: ['https://example.com/macbook-pro-16-black-1.jpg', 'https://example.com/macbook-pro-16-black-2.jpg']
          }
        ]
      }
    });

    console.log('✅ Created MacBook Pro 16-inch product');

    // Create product attributes for MacBook Pro (simplified schema)
    const macbookColorAttr = await prisma.productAttribute.create({
      data: {
        productId: macbookPro.id,
        name: 'color',
        label: 'Màu sắc',
        type: 'COLOR',
        displayType: 'COLOR_SWATCH',
        isRequired: true,
        isVariation: true,
        position: 0,
        description: 'Màu sắc MacBook Pro'
      }
    });

    const macbookStorageAttr = await prisma.productAttribute.create({
      data: {
        productId: macbookPro.id,
        name: 'storage',
        label: 'Dung lượng',
        type: 'SELECT',
        displayType: 'BUTTON',
        isRequired: true,
        isVariation: true,
        position: 1,
        description: 'Dung lượng lưu trữ'
      }
    });

    const macbookRamAttr = await prisma.productAttribute.create({
      data: {
        productId: macbookPro.id,
        name: 'ram',
        label: 'RAM',
        type: 'SELECT',
        displayType: 'BUTTON',
        isRequired: true,
        isVariation: true,
        position: 2,
        description: 'Bộ nhớ RAM'
      }
    });

    console.log('✅ Created product attributes for MacBook Pro');

    // Create attribute values for MacBook Pro
    // Color values
    await prisma.attributeValue.create({
      data: {
        attributeId: macbookColorAttr.id,
        value: 'silver',
        label: 'Bạc',
        colorCode: '#C0C0C0',
        priceAdjustment: 0,
        position: 0
      }
    });

    await prisma.attributeValue.create({
      data: {
        attributeId: macbookColorAttr.id,
        value: 'space_black',
        label: 'Đen không gian',
        colorCode: '#2C2C2C',
        priceAdjustment: 0,
        position: 1
      }
    });

    // Storage values
    await prisma.attributeValue.create({
      data: {
        attributeId: macbookStorageAttr.id,
        value: '512gb',
        label: '512GB',
        priceAdjustment: 0,
        position: 0
      }
    });

    await prisma.attributeValue.create({
      data: {
        attributeId: macbookStorageAttr.id,
        value: '1tb',
        label: '1TB',
        priceAdjustment: 10000000,
        position: 1
      }
    });

    // RAM values
    await prisma.attributeValue.create({
      data: {
        attributeId: macbookRamAttr.id,
        value: '16gb',
        label: '16GB',
        priceAdjustment: 0,
        position: 0
      }
    });

    await prisma.attributeValue.create({
      data: {
        attributeId: macbookRamAttr.id,
        value: '32gb',
        label: '32GB',
        priceAdjustment: 8000000,
        position: 1
      }
    });

    // Create variants for MacBook Pro
    const variants = [
      {
        sku: 'MBP16-SLV-512GB-16GB',
        attributes: { color: 'silver', storage: '512gb', ram: '16gb' },
        price: 60000000,
        stock: 10
      },
      {
        sku: 'MBP16-SLV-1TB-16GB',
        attributes: { color: 'silver', storage: '1tb', ram: '16gb' },
        price: 70000000,
        stock: 8
      },
      {
        sku: 'MBP16-SLV-512GB-32GB',
        attributes: { color: 'silver', storage: '512gb', ram: '32gb' },
        price: 68000000,
        stock: 5
      },
      {
        sku: 'MBP16-SLV-1TB-32GB',
        attributes: { color: 'silver', storage: '1tb', ram: '32gb' },
        price: 78000000,
        stock: 3
      },
      {
        sku: 'MBP16-BLK-512GB-16GB',
        attributes: { color: 'space_black', storage: '512gb', ram: '16gb' },
        price: 60000000,
        stock: 12
      },
      {
        sku: 'MBP16-BLK-1TB-16GB',
        attributes: { color: 'space_black', storage: '1tb', ram: '16gb' },
        price: 70000000,
        stock: 7
      },
      {
        sku: 'MBP16-BLK-512GB-32GB',
        attributes: { color: 'space_black', storage: '512gb', ram: '32gb' },
        price: 68000000,
        stock: 4
      },
      {
        sku: 'MBP16-BLK-1TB-32GB',
        attributes: { color: 'space_black', storage: '1tb', ram: '32gb' },
        price: 78000000,
        stock: 2
      }
    ];

    for (const variant of variants) {
      await prisma.productVariant.create({
        data: {
          productId: macbookPro.id,
          sku: variant.sku,
          attributes: variant.attributes,
          price: variant.price,
          stock: variant.stock,
          images: ['https://example.com/macbook-pro-16-variant.jpg']
        }
      });
    }

    console.log(`✅ Created ${variants.length} variants for MacBook Pro`);

    // Create iPhone 15 Pro variant product
    console.log('📝 Creating iPhone 15 Pro variant product...');

    // Get or create smartphone category
    let smartphoneCategory = await prisma.category.findFirst({
      where: { name: 'Smartphone' }
    });

    if (!smartphoneCategory) {
      smartphoneCategory = await prisma.category.create({
        data: {
          name: 'Smartphone',
          slug: 'smartphone',
          description: 'Điện thoại thông minh'
        }
      });
    }

    const iphone15Pro = await prisma.product.create({
      data: {
        name: 'iPhone 15 Pro',
        description: 'iPhone 15 Pro với chip A17 Pro, camera chuyên nghiệp và thiết kế titan cao cấp.',
        brand: 'Apple',
        productType: 'VARIANT',
        basePrice: 28000000, // 28M VND base price
        categoryId: smartphoneCategory.id,
        images: [
          {
            color: 'Natural Titanium',
            colorCode: '#8E8E93',
            images: [
              'https://example.com/iphone-15-pro-natural-1.jpg',
              'https://example.com/iphone-15-pro-natural-2.jpg'
            ]
          }
        ]
      }
    });

    // Create product attributes for iPhone (simplified schema)
    const iphoneColorAttr = await prisma.productAttribute.create({
      data: {
        productId: iphone15Pro.id,
        name: 'color',
        label: 'Màu sắc',
        type: 'COLOR',
        displayType: 'COLOR_SWATCH',
        isRequired: true,
        isVariation: true,
        position: 0,
        description: 'Màu sắc iPhone 15 Pro'
      }
    });

    const iphoneStorageAttr = await prisma.productAttribute.create({
      data: {
        productId: iphone15Pro.id,
        name: 'storage',
        label: 'Dung lượng',
        type: 'SELECT',
        displayType: 'BUTTON',
        isRequired: true,
        isVariation: true,
        position: 1,
        description: 'Dung lượng lưu trữ'
      }
    });

    // Create iPhone attribute values
    // Color values
    await prisma.attributeValue.create({
      data: {
        attributeId: iphoneColorAttr.id,
        value: 'natural_titanium',
        label: 'Titan Tự nhiên',
        colorCode: '#8E8E93',
        priceAdjustment: 0,
        position: 0
      }
    });

    // Storage values
    await prisma.attributeValue.create({
      data: {
        attributeId: iphoneStorageAttr.id,
        value: '128gb',
        label: '128GB',
        priceAdjustment: 0,
        position: 0
      }
    });

    await prisma.attributeValue.create({
      data: {
        attributeId: iphoneStorageAttr.id,
        value: '256gb',
        label: '256GB',
        priceAdjustment: 5000000,
        position: 1
      }
    });

    await prisma.attributeValue.create({
      data: {
        attributeId: iphoneStorageAttr.id,
        value: '512gb',
        label: '512GB',
        priceAdjustment: 10000000,
        position: 2
      }
    });

    // Create iPhone variants
    const iphoneVariants = [
      {
        sku: 'IP15P-NAT-128GB',
        attributes: { color: 'natural_titanium', storage: '128gb' },
        price: 28000000,
        stock: 20
      },
      {
        sku: 'IP15P-NAT-256GB',
        attributes: { color: 'natural_titanium', storage: '256gb' },
        price: 33000000,
        stock: 15
      },
      {
        sku: 'IP15P-NAT-512GB',
        attributes: { color: 'natural_titanium', storage: '512gb' },
        price: 38000000,
        stock: 10
      }
    ];

    for (const variant of iphoneVariants) {
      await prisma.productVariant.create({
        data: {
          productId: iphone15Pro.id,
          sku: variant.sku,
          attributes: variant.attributes,
          price: variant.price,
          stock: variant.stock,
          images: ['https://example.com/iphone-15-pro-variant.jpg']
        }
      });
    }

    console.log(`✅ Created ${iphoneVariants.length} variants for iPhone 15 Pro`);

    // Summary
    const totalVariantProducts = await prisma.product.count({
      where: { productType: 'VARIANT' }
    });
    const totalVariants = await prisma.productVariant.count();
    const totalProductAttributes = await prisma.productAttribute.count();

    console.log('🎉 Variant System Seeding completed!');
    console.log('📊 Summary:');
    console.log(`   Variant Products: ${totalVariantProducts}`);
    console.log(`   Total Variants: ${totalVariants}`);
    console.log(`   Product Attributes: ${totalProductAttributes}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedVariantSystem().catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedVariantSystem };
