#!/usr/bin/env node

/**
 * Setup Script: Product Variant System
 * 
 * This script sets up the complete variant system:
 * 1. Generates Prisma client with new schema
 * 2. Runs migration to update existing data
 * 3. Seeds sample variant products
 */

const { execSync } = require('child_process');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function setupVariantSystem() {
  console.log('🚀 Setting up Product Variant System...');
  console.log('=====================================');
  
  try {
    // Step 1: Generate Prisma client
    runCommand(
      'npx prisma generate',
      'Generating Prisma client with new schema'
    );
    
    // Step 2: Push schema to database (for development)
    // Note: In production, use proper migrations
    runCommand(
      'npx prisma db push',
      'Pushing schema changes to database'
    );
    
    // Step 3: Run migration script
    runCommand(
      'node prisma/migrations/add-variant-system.js',
      'Running variant system migration'
    );
    
    // Step 4: Seed sample data
    console.log('\n❓ Do you want to seed sample variant products? (y/n)');
    
    // For automated setup, we'll skip the prompt
    // In interactive mode, you can uncomment the readline code below
    const shouldSeed = true; // Change to false if you don't want sample data
    
    if (shouldSeed) {
      runCommand(
        'node prisma/seed-variant-system.js',
        'Seeding sample variant products'
      );
    }
    
    console.log('\n🎉 Product Variant System setup completed successfully!');
    console.log('=====================================');
    console.log('\n📋 What was done:');
    console.log('✅ Updated Prisma schema with variant system models');
    console.log('✅ Generated new Prisma client');
    console.log('✅ Migrated existing products to support variants');
    console.log('✅ Created global attributes library');
    console.log('✅ Seeded sample variant products');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Restart your development server');
    console.log('2. Test the variant system in admin panel');
    console.log('3. Create API endpoints for variant management');
    console.log('4. Update frontend components to handle variants');
    
    console.log('\n📚 Documentation:');
    console.log('- Variant Components: src/app/components/admin/product-variant/');
    console.log('- README: src/app/components/admin/product-variant/README.md');
    console.log('- Demo: Import VariantProductDemo component');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your database is running');
    console.log('2. Check your DATABASE_URL in .env file');
    console.log('3. Ensure you have proper permissions');
    console.log('4. Try running steps manually:');
    console.log('   - npx prisma generate');
    console.log('   - npx prisma db push');
    console.log('   - node prisma/migrations/add-variant-system.js');
    
    process.exit(1);
  }
}

// Interactive prompt helper (optional)
function askQuestion(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupVariantSystem()
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupVariantSystem };
