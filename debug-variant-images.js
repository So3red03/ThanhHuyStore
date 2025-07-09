// Debug script to check variant images data structure
// Run with: node debug-variant-images.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugVariantImages() {
  try {
    console.log('🔍 Debugging variant images data structure...\n');

    // Find the iPad product
    const ipadProduct = await prisma.product.findFirst({
      where: {
        name: {
          contains: 'iPad',
          mode: 'insensitive'
        },
        productType: 'VARIANT'
      },
      include: {
        variants: true
      }
    });

    if (!ipadProduct) {
      console.log('❌ No iPad variant product found');
      return;
    }

    console.log('📱 Found product:', ipadProduct.name);
    console.log('🆔 Product ID:', ipadProduct.id);
    console.log('🖼️ Product images:', JSON.stringify(ipadProduct.images, null, 2));
    console.log('📊 Number of variants:', ipadProduct.variants.length);
    console.log('\n' + '='.repeat(80) + '\n');

    // Check each variant
    ipadProduct.variants.forEach((variant, index) => {
      console.log(`🔸 Variant ${index + 1}:`);
      console.log(`   SKU: ${variant.sku}`);
      console.log(`   Attributes:`, JSON.stringify(variant.attributes, null, 2));
      console.log(`   Images type:`, typeof variant.images);
      console.log(`   Images isArray:`, Array.isArray(variant.images));
      console.log(`   Images length:`, variant.images?.length || 0);
      console.log(`   Images content:`, JSON.stringify(variant.images, null, 2));
      
      if (variant.images && variant.images.length > 0) {
        console.log(`   First image type:`, typeof variant.images[0]);
        if (typeof variant.images[0] === 'object') {
          console.log(`   First image structure:`, Object.keys(variant.images[0]));
        }
      }
      console.log('\n' + '-'.repeat(40) + '\n');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugVariantImages();
