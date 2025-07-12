/**
 * Script to fix variant image fields
 * This script migrates 'image' field to 'thumbnail' field for ProductVariant
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixVariantImages() {
  console.log('🔧 Starting Variant Images Fix...');

  try {
    // Step 1: Check current variant structure
    console.log('📝 Step 1: Checking current variant structure...');
    
    const sampleVariants = await prisma.productVariant.findMany({
      take: 5,
      include: {
        product: {
          select: { id: true, name: true, productType: true }
        }
      }
    });

    console.log('Sample variants structure:');
    sampleVariants.forEach((variant, index) => {
      console.log(`Variant ${index + 1}:`, {
        id: variant.id,
        productName: variant.product.name,
        productType: variant.product.productType,
        sku: variant.sku,
        thumbnail: variant.thumbnail || 'NULL',
        galleryImages: variant.galleryImages || [],
        // Check if there's an 'image' field (shouldn't exist in current schema)
        hasImageField: variant.hasOwnProperty('image')
      });
    });

    // Step 2: Check products with variants
    console.log('\n📝 Step 2: Checking products with variants...');
    
    const variantProducts = await prisma.product.findMany({
      where: {
        productType: 'VARIANT'
      },
      include: {
        variants: {
          where: { isActive: true },
          take: 2 // Just first 2 variants per product
        }
      },
      take: 5
    });

    console.log('Variant products structure:');
    variantProducts.forEach((product, index) => {
      console.log(`Product ${index + 1}:`, {
        id: product.id,
        name: product.name,
        productType: product.productType,
        thumbnail: product.thumbnail || 'NULL',
        galleryImages: product.galleryImages || [],
        variantsCount: product.variants.length,
        firstVariantImages: product.variants[0] ? {
          thumbnail: product.variants[0].thumbnail || 'NULL',
          galleryImages: product.variants[0].galleryImages || []
        } : 'No variants'
      });
    });

    // Step 3: Recommendations
    console.log('\n💡 Recommendations:');
    
    const variantsWithoutImages = await prisma.productVariant.count({
      where: {
        AND: [
          { thumbnail: null },
          { galleryImages: { equals: [] } }
        ]
      }
    });

    const productsWithoutImages = await prisma.product.count({
      where: {
        productType: 'VARIANT',
        AND: [
          { thumbnail: null },
          { galleryImages: { equals: [] } }
        ]
      }
    });

    console.log(`- ${variantsWithoutImages} variants have no images (thumbnail: null, galleryImages: [])`);
    console.log(`- ${productsWithoutImages} variant products have no images`);
    
    if (variantsWithoutImages > 0) {
      console.log('\n🚨 Issue found: Variants without images detected!');
      console.log('This explains why SearchBar shows "No img" placeholder.');
      console.log('\nTo fix this, you need to:');
      console.log('1. Upload images for variant products in admin dashboard');
      console.log('2. Or add sample images to existing variants');
    } else {
      console.log('\n✅ All variants have images - the issue might be elsewhere');
    }

    console.log('\n✅ Variant Images Check completed');

  } catch (error) {
    console.error('❌ Error during variant images check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixVariantImages()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
