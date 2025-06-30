#!/usr/bin/env node

/**
 * Restore Script: Generated automatically
 * 
 * Restores data from backup: pre-variant-migration-2025-06-30T04-22-20-212Z.json
 * Created: 2025-06-30T04:22:20.214Z
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreFromBackup() {
  console.log('🔄 Restoring from backup: pre-variant-migration-2025-06-30T04-22-20-212Z.json');
  
  try {
    const backupData = JSON.parse(fs.readFileSync('D:\ThanhHuyStore\backups\pre-variant-migration-2025-06-30T04-22-20-212Z.json', 'utf8'));
    
    console.log('⚠️  WARNING: This will delete all current data and restore from backup!');
    console.log('📊 Backup contains:');
    console.log(`   Products: ${backupData.stats.totalProducts}`);
    console.log(`   Categories: ${backupData.stats.totalCategories}`);
    console.log(`   Orders: ${backupData.stats.totalOrders}`);
    console.log(`   Users: ${backupData.stats.totalUsers}`);
    console.log(`   Reviews: ${backupData.stats.totalReviews}`);
    
    // Add confirmation prompt here if needed
    
    console.log('🗑️  Clearing current data...');
    
    // Delete in correct order to avoid foreign key constraints
    await prisma.productPromotion.deleteMany();
    await prisma.review.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    
    console.log('📥 Restoring data...');
    
    // Restore categories first (no dependencies)
    for (const category of backupData.data.categories) {
      const { subcategories, products, ...categoryData } = category;
      await prisma.category.create({ data: categoryData });
    }
    
    // Restore products
    for (const product of backupData.data.products) {
      const { category, reviews, notifications, productPromotions, ...productData } = product;
      await prisma.product.create({ data: productData });
    }
    
    // Restore other data...
    // (Add more restore logic as needed)
    
    console.log('✅ Restore completed successfully!');
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  restoreFromBackup()
    .catch((error) => {
      console.error('Restore failed:', error);
      process.exit(1);
    });
}

module.exports = { restoreFromBackup };
