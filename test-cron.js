// Test script để gọi cron job mỗi 5 phút
const axios = require('axios');

const CRON_URL = 'http://localhost:3000/api/cron/reports';
const INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

console.log('🚀 Starting cron job test...');
console.log(`📅 Will call ${CRON_URL} every 5 minutes`);
console.log(`⏰ Started at: ${new Date().toLocaleString('vi-VN')}`);
console.log('🔗 Discord webhook should receive reports if configured correctly');
console.log('📊 Check your Discord channel for automated reports');

let callCount = 0;

const callCronJob = async () => {
  try {
    callCount++;
    console.log(`\n🔄 [${callCount}] Calling cron job at: ${new Date().toLocaleString('vi-VN')}`);

    const response = await axios.get(CRON_URL);

    if (response.data.success) {
      console.log('✅ Cron job successful:', response.data.message);
      if (response.data.sentAt) {
        console.log('📤 Report sent at:', response.data.sentAt);
        console.log('💬 Check Discord for the report message!');
      }
      if (response.data.reportInterval) {
        console.log('⏱️  Report interval:', response.data.reportInterval, 'hours');
      }
    } else {
      console.log('⏰ Cron job response:', response.data.message);
      if (response.data.nextReportIn) {
        const nextReportMinutes = Math.round(response.data.nextReportIn / 1000 / 60);
        console.log(`⏳ Next report in: ${nextReportMinutes} minutes`);
      }
    }
  } catch (error) {
    console.error('❌ Cron job failed:', error.response?.data || error.message);
  }
};

// Call immediately first time
callCronJob();

// Then call every 5 minutes
const intervalId = setInterval(callCronJob, INTERVAL);

console.log('\n📝 Press Ctrl+C to stop the test');
console.log('🎯 This will help you verify if cron jobs work automatically');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping cron job test...');
  clearInterval(intervalId);
  console.log('✅ Test stopped. Total calls made:', callCount);
  process.exit(0);
});
