import axios from 'axios';

/**
 * Utility function để gửi email tự động khi có sản phẩm mới
 * Tái sử dụng logic từ SendNewProductEmail.tsx
 */
export const sendNewProductEmailAutomatically = async (productId: string): Promise<boolean> => {
  try {
    console.log(`🚀 [Auto Email] Checking if auto email is enabled for new product: ${productId}`);

    // 1. Kiểm tra xem auto email marketing có được bật không và có phải là mode "newProduct"
    const settingsResponse = await axios.get('/api/admin/settings');
    const settings = settingsResponse.data.settings;

    if (!settings.autoEmailMarketing) {
      console.log('📧 [Auto Email] Auto email marketing is disabled');
      return false;
    }

    if (settings.emailMarketingSchedule !== 'newProduct') {
      console.log(`📧 [Auto Email] Email schedule is "${settings.emailMarketingSchedule}", not "newProduct"`);
      return false;
    }

    console.log('✅ [Auto Email] Auto email marketing is enabled for new products');

    // 2. Gửi email tự động (sử dụng API endpoint giống như SendNewProductEmail.tsx)
    console.log('📧 [Auto Email] Sending email request to API...');
    const emailResponse = await axios.post('/api/send-new-product-emails', {
      productId: productId,
      timeframe: 'all', // Gửi cho tất cả khách hàng đã mua cùng category
      manualMode: false, // Không phải manual mode
      selectedUserIds: undefined
    });

    console.log('📧 [Auto Email] API Response:', emailResponse.data);

    const result = emailResponse.data;
    console.log(`📧 [Auto Email] Successfully sent emails to ${result.sentCount}/${result.totalUsers} users`);

    return true;
  } catch (error: any) {
    console.error('❌ [Auto Email] Error sending automatic emails:', error);

    // Log chi tiết lỗi nhưng không throw để không ảnh hưởng đến việc tạo sản phẩm
    if (error.response?.data?.error) {
      console.error('❌ [Auto Email] API Error:', error.response.data.error);
    }

    return false;
  }
};

/**
 * Wrapper function để gọi từ component với error handling
 */
export const triggerNewProductEmail = async (productId: string, productName: string) => {
  try {
    const success = await sendNewProductEmailAutomatically(productId);

    if (success) {
      // Có thể hiển thị toast success nếu cần
      console.log(`✅ [Auto Email] Auto email sent for product: ${productName}`);
    }
  } catch (error) {
    // Silent fail - không ảnh hưởng đến UX của việc tạo sản phẩm
    console.error(`❌ [Auto Email] Failed to send auto email for product: ${productName}`, error);
  }
};
