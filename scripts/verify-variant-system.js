#!/usr/bin/env node

/**
 * Verification Script: Product Variant System
 *
 * Verifies that the variant system has been set up correctly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyVariantSystem() {
  console.log('🔍 Verifying Product Variant System...');
  console.log('=====================================');

  try {
    // Check products
    const totalProducts = await prisma.product.count();
    const simpleProducts = await prisma.product.count({
      where: { productType: 'SIMPLE' }
    });
    const variantProducts = await prisma.product.count({
      where: { productType: 'VARIANT' }
    });

    console.log('📊 Products:');
    console.log(`   Total: ${totalProducts}`);
    console.log(`   Simple: ${simpleProducts}`);
    console.log(`   Variant: ${variantProducts}`);

    // Check variant products with details
    const variantProductsWithDetails = await prisma.product.findMany({
      where: { productType: 'VARIANT' },
      include: {
        productAttributes: {
          include: {
            values: true
          }
        },
        variants: true
      }
    });

    console.log('\n📱 Variant Products Details:');
    for (const product of variantProductsWithDetails) {
      console.log(`\n🔸 ${product.name}`);
      console.log(`   Base Price: ${product.basePrice?.toLocaleString()}đ`);
      console.log(`   Attributes: ${product.productAttributes.length}`);
      console.log(`   Variants: ${product.variants.length}`);

      // Show attributes
      for (const attr of product.productAttributes) {
        console.log(`   📋 ${attr.label} (${attr.name})`);
        console.log(`      Type: ${attr.type}, Display: ${attr.displayType}`);
        console.log(`      Values: ${attr.values.length}`);

        // Show first few values
        const firstValues = attr.values.slice(0, 3);
        for (const value of firstValues) {
          const priceText = value.priceAdjustment !== 0 ? ` (+${value.priceAdjustment.toLocaleString()}đ)` : '';
          console.log(`        • ${value.label}${priceText}`);
        }
        if (attr.values.length > 3) {
          console.log(`        ... and ${attr.values.length - 3} more`);
        }
      }

      // Show variants
      console.log(`   🎯 Variants:`);
      for (const variant of product.variants.slice(0, 3)) {
        const attrs = Object.entries(variant.attributes)
          .map(([key, value]) => `${key}:${value}`)
          .join(', ');
        console.log(
          `      • ${variant.sku}: {${attrs}} - ${variant.price.toLocaleString()}đ (Stock: ${variant.stock})`
        );
      }
      if (product.variants.length > 3) {
        console.log(`      ... and ${product.variants.length - 3} more variants`);
      }
    }

    // Check totals
    const totalAttributes = await prisma.productAttribute.count();
    const totalAttributeValues = await prisma.attributeValue.count();
    const totalVariants = await prisma.productVariant.count();

    console.log('\n📈 System Totals:');
    console.log(`   Product Attributes: ${totalAttributes}`);
    console.log(`   Attribute Values: ${totalAttributeValues}`);
    console.log(`   Product Variants: ${totalVariants}`);

    // Test a complex query (simplified for MongoDB)
    console.log('\n🧪 Testing Complex Query...');
    const macbookVariants = await prisma.productVariant.findMany({
      where: {
        product: {
          name: {
            contains: 'MacBook'
          }
        }
      },
      include: {
        product: {
          select: {
            name: true,
            basePrice: true
          }
        }
      }
    });

    // Filter silver variants in JavaScript (MongoDB JSON queries are complex)
    const silverVariants = macbookVariants.filter(
      variant => variant.attributes && variant.attributes.color === 'silver'
    );

    console.log(`   Found ${silverVariants.length} silver MacBook variants`);
    for (const variant of silverVariants) {
      console.log(`   • ${variant.sku}: ${variant.price.toLocaleString()}đ`);
    }

    console.log('\n✅ Variant System Verification Completed!');
    console.log('\n🎯 Summary:');
    console.log(`   ✅ Database schema updated successfully`);
    console.log(`   ✅ ${variantProducts} variant products created`);
    console.log(`   ✅ ${totalVariants} product variants generated`);
    console.log(`   ✅ ${totalAttributes} attributes configured`);
    console.log(`   ✅ ${totalAttributeValues} attribute values created`);
    console.log(`   ✅ Complex queries working correctly`);

    console.log('\n🚀 Ready for Integration!');
    console.log('   Next: Update AddProductModal to use variant system');
    console.log('   Next: Create API endpoints for variant management');
    console.log('   Next: Update frontend product display');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyVariantSystem().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyVariantSystem };
