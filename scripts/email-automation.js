const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
};

// Main email automation function
const runEmailAutomation = async () => {
  try {
    console.log('🚀 Starting email automation...');

    // 1. Find new products created in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newProducts = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: yesterday
        },
        isDeleted: false
      },
      include: {
        category: true
      }
    });

    console.log(`📦 Found ${newProducts.length} new products`);

    if (newProducts.length === 0) {
      console.log('✅ No new products to send emails for');
      return;
    }

    // 2. Process each new product
    for (const product of newProducts) {
      await processProductEmailCampaign(product);
    }

    console.log('✅ Email automation completed successfully');
  } catch (error) {
    console.error('❌ Email automation failed:', error);
  }
};

// Process email campaign for a specific product
const processProductEmailCampaign = async product => {
  try {
    console.log(`📧 Processing email campaign for product: ${product.name}`);

    // 1. Check if campaign already exists for this product
    const existingCampaign = await prisma.emailCampaign.findFirst({
      where: {
        productId: product.id,
        status: 'sent'
      }
    });

    if (existingCampaign) {
      console.log(`⏭️ Campaign already sent for product: ${product.name}`);
      return;
    }

    // 2. Find users who bought products in the same category
    const interestedUsers = await prisma.user.findMany({
      where: {
        purchasedCategories: {
          has: product.categoryId
        },
        emailMarketingEnabled: true,
        role: 'USER' // Only send to regular users, not admin/staff
      }
    });

    console.log(`👥 Found ${interestedUsers.length} interested users for category: ${product.category.name}`);

    if (interestedUsers.length === 0) {
      console.log(`⏭️ No interested users for product: ${product.name}`);
      return;
    }

    // 3. Create email campaign record
    const campaign = await prisma.emailCampaign.create({
      data: {
        productId: product.id,
        status: 'scheduled'
      }
    });

    // 4. Send emails to interested users
    let sentCount = 0;
    const transporter = createTransporter();

    for (const user of interestedUsers) {
      try {
        await sendNewProductEmail(transporter, user, product, campaign.id);
        sentCount++;

        // Update user's lastEmailSent
        await prisma.user.update({
          where: { id: user.id },
          data: { lastEmailSent: new Date() }
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    }

    // 5. Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: sentCount > 0 ? 'sent' : 'failed'
      }
    });

    console.log(`✅ Campaign completed for ${product.name}: ${sentCount}/${interestedUsers.length} emails sent`);
  } catch (error) {
    console.error(`❌ Failed to process campaign for product ${product.name}:`, error);
  }
};

// Send email to individual user
const sendNewProductEmail = async (transporter, user, product, campaignId) => {
  const productUrl = `${process.env.NEXT_PUBLIC_API_URL}/product/${product.name.toLowerCase().replace(/\s+/g, '-')}-${
    product.id
  }`;

  // Create tracked URL for click tracking
  const trackedUrl = `${
    process.env.NEXT_PUBLIC_API_URL
  }/api/email-tracking/click/${campaignId}?redirect=${encodeURIComponent(productUrl)}`;
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_API_URL}/unsubscribe?email=${encodeURIComponent(user.email)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sản phẩm mới - ThanhHuy Store</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; }
        .product-card { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
        .footer a { color: #60a5fa; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Sản phẩm mới đã có mặt!</h1>
        </div>
        
        <div class="content">
          <p>Xin chào <strong>${user.name || 'Khách hàng'}</strong>,</p>
          <p>Chúng tôi vừa ra mắt một sản phẩm mới trong danh mục mà bạn quan tâm:</p>
          
          <div class="product-card">
            <h2 style="color: #3b82f6; margin-top: 0;">${product.name}</h2>
            <p><strong>Danh mục:</strong> ${product.category.name}</p>
            <p><strong>Mô tả:</strong> ${product.description}</p>
            ${
              product.price
                ? `<p style="font-size: 18px; color: #059669; font-weight: bold;">Giá: ${new Intl.NumberFormat(
                    'vi-VN',
                    { style: 'currency', currency: 'VND' }
                  ).format(product.price)}</p>`
                : ''
            }
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${trackedUrl}" class="btn">Xem sản phẩm ngay</a>
            </div>
          </div>
          
          <p>Đừng bỏ lỡ cơ hội sở hữu sản phẩm mới nhất từ ThanhHuy Store!</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_API_URL}" class="btn">Khám phá thêm sản phẩm</a>
          </div>
        </div>
        
        <div class="footer">
          <p>ThanhHuy Store - Apple Store chính hãng</p>
          <p>Email này được gửi vì bạn đã từng mua sản phẩm trong danh mục ${product.category.name}</p>
          <p><a href="${unsubscribeUrl}">Hủy đăng ký nhận email</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: user.email,
    subject: `🎉 Sản phẩm mới: ${product.name} - ThanhHuy Store`,
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
};

// Setup cron job - runs daily at 9:00 AM Vietnam time
const setupCronJob = () => {
  console.log('⏰ Setting up email automation cron job...');

  // Run daily at 9:00 AM Vietnam time
  cron.schedule(
    '0 9 * * *',
    async () => {
      console.log('🕘 Cron job triggered at 9:00 AM');
      await runEmailAutomation();
    },
    {
      timezone: 'Asia/Ho_Chi_Minh'
    }
  );

  console.log('✅ Cron job scheduled successfully');
  console.log('📅 Will run daily at 9:00 AM Vietnam time');
};

// Manual trigger function for testing
const runManualTest = async () => {
  console.log('🧪 Running manual test...');
  await runEmailAutomation();
  process.exit(0);
};

// Main execution
if (require.main === module) {
  // Check if running in test mode
  if (process.argv.includes('--test')) {
    runManualTest();
  } else {
    setupCronJob();
    console.log('🚀 Email automation service started');
    console.log('💡 Use "node scripts/email-automation.js --test" to run manual test');
  }
}

module.exports = {
  runEmailAutomation,
  setupCronJob
};
