#!/usr/bin/env node

/**
 * Test Cron Reports
 * Usage: node scripts/test-cron-reports.js
 * 
 * This script tests the cron reports functionality
 */

const axios = require('axios');

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function testCronReports() {
  try {
    console.log('🧪 Testing Cron Reports...');
    console.log(`📍 Base URL: ${BASE_URL}`);
    
    // Test 1: Manual trigger với force
    console.log('\n🔥 Test 1: Manual trigger (force)...');
    try {
      const response = await axios.post(`${BASE_URL}/api/cron/reports`, {
        force: true
      });
      
      console.log('✅ Manual trigger response:', response.data);
    } catch (error) {
      console.error('❌ Manual trigger failed:', error.response?.data || error.message);
    }
    
    // Test 2: Normal cron check
    console.log('\n📋 Test 2: Normal cron check...');
    try {
      const response = await axios.get(`${BASE_URL}/api/cron/reports`);
      console.log('✅ Cron check response:', response.data);
    } catch (error) {
      console.error('❌ Cron check failed:', error.response?.data || error.message);
    }
    
    // Test 3: Wait 1 minute and check again
    console.log('\n⏰ Test 3: Waiting 65 seconds then checking again...');
    console.log('⏳ Waiting...');
    
    await new Promise(resolve => setTimeout(resolve, 65000)); // 65 seconds
    
    try {
      const response = await axios.get(`${BASE_URL}/api/cron/reports`);
      console.log('✅ Second cron check response:', response.data);
    } catch (error) {
      console.error('❌ Second cron check failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Cron reports test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check Discord channel for reports');
    console.log('2. Monitor server logs for cron activity');
    console.log('3. Set up actual cron job or webhook to call the endpoint every minute');
    
  } catch (error) {
    console.error('❌ Error testing cron reports:', error);
    process.exit(1);
  }
}

async function setupCronJob() {
  console.log('\n🔧 Setting up cron job simulation...');
  console.log('📝 To set up actual cron job, add this to your crontab:');
  console.log(`* * * * * curl -X GET "${BASE_URL}/api/cron/reports"`);
  console.log('\nOr use this PowerShell script for Windows:');
  console.log(`
# Save as cron-reports.ps1
while ($true) {
    try {
        $response = Invoke-RestMethod -Uri "${BASE_URL}/api/cron/reports" -Method GET
        Write-Host "$(Get-Date): $($response.message)"
    } catch {
        Write-Host "$(Get-Date): Error - $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 60
}
  `);
}

// Run the test
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--setup')) {
    setupCronJob();
  } else {
    testCronReports();
  }
}

module.exports = { testCronReports, setupCronJob };
