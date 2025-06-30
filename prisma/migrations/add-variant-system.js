/**
 * Migration Script: Add Product Variant System
 *
 * This script safely migrates existing products to support the new variant system
 * while maintaining backward compatibility.
 *
 * IMPORTANT: Run this script AFTER updating the Prisma schema
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToVariantSystem() {
  console.log('🚀 Starting Product Variant System Migration...');

  try {
    // Step 1: Update existing products to SIMPLE type
    console.log('📝 Step 1: Updating existing products to SIMPLE type...');

    const existingProducts = await prisma.product.findMany({
      where: {
        productType: undefined // Products without productType
      }
    });

    console.log(`Found ${existingProducts.length} existing products to update`);

    for (const product of existingProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          productType: 'SIMPLE'
          // Keep existing price as the main price for simple products
          // basePrice will be null for simple products
        }
      });
    }

    console.log('✅ Step 1 completed: All existing products set to SIMPLE type');

    // Step 2: Migration completed for simplified schema
    console.log('✅ Step 2: Simplified schema - no global attributes needed');

    // Step 3: Simplified schema - attributes will be created per product
    console.log('✅ Step 3: Simplified schema - attributes created per product as needed');

    // Step 4: Verify migration
    console.log('📝 Step 4: Verifying migration...');

    const totalProducts = await prisma.product.count();
    const simpleProducts = await prisma.product.count({
      where: { productType: 'SIMPLE' }
    });
    const variantProducts = await prisma.product.count({
      where: { productType: 'VARIANT' }
    });
    const productAttributes = await prisma.productAttribute.count();
    const attributeValues = await prisma.attributeValue.count();

    console.log('📊 Migration Summary:');
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Simple Products: ${simpleProducts}`);
    console.log(`   Variant Products: ${variantProducts}`);
    console.log(`   Product Attributes: ${productAttributes}`);
    console.log(`   Attribute Values: ${attributeValues}`);

    console.log('🎉 Product Variant System Migration completed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Test the admin interface with new variant system');
    console.log('2. Create some variant products to test functionality');
    console.log('3. Update frontend components to handle variants');
    console.log('4. Test cart and order functionality with variants');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToVariantSystem().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateToVariantSystem };
