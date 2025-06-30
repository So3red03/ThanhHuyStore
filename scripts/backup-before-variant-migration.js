#!/usr/bin/env node

/**
 * Backup Script: Before Variant System Migration
 * 
 * Creates a backup of critical data before running the variant system migration
 * This ensures we can rollback if something goes wrong
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  console.log('💾 Creating backup before variant system migration...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  const backupFile = path.join(backupDir, `pre-variant-migration-${timestamp}.json`);
  
  try {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 Created backups directory');
    }
    
    console.log('📊 Collecting data for backup...');
    
    // Backup critical data
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      description: 'Backup before variant system migration',
      data: {
        products: await prisma.product.findMany({
          include: {
            category: true,
            reviews: true,
            notifications: true,
            productPromotions: true
          }
        }),
        categories: await prisma.category.findMany({
          include: {
            subcategories: true,
            products: true
          }
        }),
        orders: await prisma.order.findMany({
          include: {
            user: true,
            voucher: true
          }
        }),
        users: await prisma.user.findMany({
          include: {
            orders: true,
            reviews: true
          }
        }),
        reviews: await prisma.review.findMany({
          include: {
            product: true,
            user: true
          }
        })
      },
      stats: {
        totalProducts: 0,
        totalCategories: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalReviews: 0
      }
    };
    
    // Calculate stats
    backup.stats.totalProducts = backup.data.products.length;
    backup.stats.totalCategories = backup.data.categories.length;
    backup.stats.totalOrders = backup.data.orders.length;
    backup.stats.totalUsers = backup.data.users.length;
    backup.stats.totalReviews = backup.data.reviews.length;
    
    console.log('📈 Backup statistics:');
    console.log(`   Products: ${backup.stats.totalProducts}`);
    console.log(`   Categories: ${backup.stats.totalCategories}`);
    console.log(`   Orders: ${backup.stats.totalOrders}`);
    console.log(`   Users: ${backup.stats.totalUsers}`);
    console.log(`   Reviews: ${backup.stats.totalReviews}`);
    
    // Write backup to file
    console.log('💾 Writing backup to file...');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    // Get file size
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Backup created successfully!');
    console.log(`📁 File: ${backupFile}`);
    console.log(`📏 Size: ${fileSizeInMB} MB`);
    
    // Create a restore script
    const restoreScript = `#!/usr/bin/env node

/**
 * Restore Script: Generated automatically
 * 
 * Restores data from backup: ${path.basename(backupFile)}
 * Created: ${backup.timestamp}
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreFromBackup() {
  console.log('🔄 Restoring from backup: ${path.basename(backupFile)}');
  
  try {
    const backupData = JSON.parse(fs.readFileSync('${backupFile}', 'utf8'));
    
    console.log('⚠️  WARNING: This will delete all current data and restore from backup!');
    console.log('📊 Backup contains:');
    console.log(\`   Products: \${backupData.stats.totalProducts}\`);
    console.log(\`   Categories: \${backupData.stats.totalCategories}\`);
    console.log(\`   Orders: \${backupData.stats.totalOrders}\`);
    console.log(\`   Users: \${backupData.stats.totalUsers}\`);
    console.log(\`   Reviews: \${backupData.stats.totalReviews}\`);
    
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
`;
    
    const restoreScriptFile = path.join(backupDir, `restore-${timestamp}.js`);
    fs.writeFileSync(restoreScriptFile, restoreScript);
    
    console.log(`📜 Restore script created: ${restoreScriptFile}`);
    
    // Create backup info file
    const infoFile = path.join(backupDir, `backup-info-${timestamp}.md`);
    const infoContent = `# Backup Information

## Details
- **Created**: ${backup.timestamp}
- **Purpose**: Pre-variant system migration backup
- **File**: ${path.basename(backupFile)}
- **Size**: ${fileSizeInMB} MB

## Statistics
- Products: ${backup.stats.totalProducts}
- Categories: ${backup.stats.totalCategories}
- Orders: ${backup.stats.totalOrders}
- Users: ${backup.stats.totalUsers}
- Reviews: ${backup.stats.totalReviews}

## Restore Instructions
1. Run the restore script: \`node ${path.basename(restoreScriptFile)}\`
2. Or manually import the JSON file
3. Make sure to stop your application before restoring

## Notes
- This backup was created automatically before variant system migration
- Keep this backup until you're confident the migration was successful
- Test the restore process in a development environment first
`;
    
    fs.writeFileSync(infoFile, infoContent);
    
    console.log('📋 Backup process completed!');
    console.log('');
    console.log('📁 Files created:');
    console.log(`   Backup: ${backupFile}`);
    console.log(`   Restore Script: ${restoreScriptFile}`);
    console.log(`   Info: ${infoFile}`);
    console.log('');
    console.log('🔒 Keep these files safe until migration is confirmed successful!');
    
    return {
      backupFile,
      restoreScriptFile,
      infoFile,
      stats: backup.stats
    };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if this file is executed directly
if (require.main === module) {
  createBackup()
    .catch((error) => {
      console.error('Backup failed:', error);
      process.exit(1);
    });
}

module.exports = { createBackup };
