#!/usr/bin/env node

/**
 * Clear Activity Data Script
 * Usage: node scripts/clear-activity-data.js
 * 
 * This script clears all Activity model data to prepare for migration to AuditLog
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearActivityData() {
  try {
    console.log('🚀 Starting Activity data cleanup...');
    
    // Get current count
    const currentCount = await prisma.activity.count();
    console.log(`📊 Current Activity records: ${currentCount}`);
    
    if (currentCount === 0) {
      console.log('✅ No Activity data to clear');
      return;
    }
    
    // Confirm deletion
    console.log('⚠️  This will DELETE ALL Activity data permanently!');
    console.log('🔄 Proceeding in 3 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Clear all Activity data
    const result = await prisma.activity.deleteMany({});
    
    console.log(`✅ Successfully cleared ${result.count} Activity records`);
    console.log('🎯 Activity data migration preparation complete!');
    
    // Verify deletion
    const remainingCount = await prisma.activity.count();
    console.log(`📊 Remaining Activity records: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 Activity table is now empty and ready for migration!');
    } else {
      console.log('⚠️  Warning: Some Activity records may still exist');
    }
    
  } catch (error) {
    console.error('❌ Error clearing Activity data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearActivityData();
