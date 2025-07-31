// Event Triggers - Real-time Business Event Detection
import { EventTrigger, MonitoringThresholds } from './types';

export const monitoringThresholds: MonitoringThresholds = {
  inventory: {
    low: 10,
    critical: 5,
    outOfStock: 0
  },
  sales: {
    dropPercentage: 20,
    spikePercentage: 200,
    timeWindow: 60 // 1 hour
  },
  payments: {
    failureRate: 10, // 10% failure rate
    timeWindow: 30 // 30 minutes
  },
  reviews: {
    ratingThreshold: 3.0,
    negativeCount: 3 // 3 negative reviews in short time
  },
  // New thresholds for advanced scenarios
  customer: {
    highValueThreshold: 10000000, // 10M VND
    inactivityDays: 30, // 30 days without purchase
    cartAbandonmentRate: 70 // 70% abandonment rate
  },
  order: {
    averageValueDropPercentage: 25, // 25% drop in AOV
    timeWindow: 7 // 7 days comparison
  },
  competitor: {
    priceAdvantagePercentage: 10, // 10% cheaper than us
    monitoringProducts: ['iPhone', 'Samsung', 'MacBook'] // Key products to monitor
  }
};

export const eventTriggers: EventTrigger[] = [
  // INVENTORY TRIGGERS
  {
    name: 'inventory_low',
    condition: data =>
      data.quantity <= monitoringThresholds.inventory.low && data.quantity > monitoringThresholds.inventory.critical,
    eventType: 'INVENTORY_LOW',
    priority: 'WARNING',
    businessImpact: 'MEDIUM',
    message: data =>
      `Sản phẩm "${data.productName}" còn ${data.quantity} cái. Dự kiến hết trong ${data.estimatedDays} ngày.`,
    suggestedActions: ['Kiểm tra nhà cung cấp', 'Đặt hàng bổ sung', 'Tạm dừng quảng cáo nếu cần']
  },

  {
    name: 'inventory_critical',
    condition: data => data.quantity <= monitoringThresholds.inventory.critical && data.quantity > 0,
    eventType: 'INVENTORY_CRITICAL',
    priority: 'URGENT',
    businessImpact: 'HIGH',
    message: data =>
      `🚨 SẮP HẾT HÀNG! "${data.productName}" chỉ còn ${data.quantity} cái. Có ${data.pendingOrders} đơn đang chờ.`,
    suggestedActions: ['Nhập hàng NGAY', 'Liên hệ nhà cung cấp khẩn cấp', 'Thông báo khách hàng về tình trạng']
  },

  {
    name: 'inventory_out',
    condition: data => data.quantity === 0,
    eventType: 'INVENTORY_OUT',
    priority: 'CRITICAL',
    businessImpact: 'SEVERE',
    message: data =>
      `💀 HẾT HÀNG! "${data.productName}" đã hết. Đã từ chối ${data.rejectedOrders} đơn hàng (${data.lostRevenue}đ).`,
    suggestedActions: [
      'Nhập hàng khẩn cấp',
      'Ẩn sản phẩm khỏi website',
      'Liên hệ khách hàng đã đặt',
      'Tìm sản phẩm thay thế'
    ]
  },

  // SALES TRIGGERS
  {
    name: 'sales_spike',
    condition: data => data.salesIncrease >= monitoringThresholds.sales.spikePercentage,
    eventType: 'SALES_SPIKE',
    priority: 'INFO',
    businessImpact: 'HIGH',
    message: data =>
      `🔥 SALES SPIKE! "${data.productName}" tăng ${data.salesIncrease}% trong ${data.timeWindow}h. Cần chuẩn bị inventory!`,
    suggestedActions: ['Kiểm tra tồn kho', 'Tăng quảng cáo', 'Chuẩn bị nhập thêm hàng', 'Phân tích nguyên nhân spike']
  },

  {
    name: 'sales_drop',
    condition: data => data.salesDecrease >= monitoringThresholds.sales.dropPercentage,
    eventType: 'SALES_DROP',
    priority: 'WARNING',
    businessImpact: 'MEDIUM',
    message: data =>
      `📉 Sales giảm ${data.salesDecrease}% cho "${data.productName}". Có thể do competitor hoặc vấn đề sản phẩm.`,
    suggestedActions: [
      'Kiểm tra giá competitor',
      'Review feedback khách hàng',
      'Xem xét chạy promotion',
      'Phân tích nguyên nhân'
    ]
  },

  // PAYMENT TRIGGERS
  {
    name: 'payment_failures',
    condition: data => data.failureRate >= monitoringThresholds.payments.failureRate,
    eventType: 'PAYMENT_FAILURES',
    priority: 'URGENT',
    businessImpact: 'HIGH',
    message: data => `💳 Payment failures cao! ${data.failureRate}% đơn hàng thất bại trong ${data.timeWindow} phút.`,
    suggestedActions: [
      'Kiểm tra payment gateway',
      'Liên hệ ngân hàng',
      'Thông báo khách hàng',
      'Kích hoạt backup payment'
    ]
  },

  // REVIEW TRIGGERS
  {
    name: 'negative_reviews',
    condition: data => data.averageRating <= monitoringThresholds.reviews.ratingThreshold,
    eventType: 'REVIEW_NEGATIVE',
    priority: 'WARNING',
    businessImpact: 'MEDIUM',
    message: data =>
      `⭐ Rating giảm! "${data.productName}" xuống ${data.averageRating}/5. Có ${data.negativeCount} review tiêu cực.`,
    suggestedActions: [
      'Đọc chi tiết reviews',
      'Liên hệ khách hàng không hài lòng',
      'Cải thiện sản phẩm/dịch vụ',
      'Tạm dừng quảng cáo nếu cần'
    ]
  },

  // SYSTEM TRIGGERS
  {
    name: 'system_error',
    condition: data => data.errorRate > 5, // 5% error rate
    eventType: 'SYSTEM_ERROR',
    priority: 'CRITICAL',
    businessImpact: 'SEVERE',
    message: data => `🚨 System Error! ${data.errorType} xảy ra ${data.errorCount} lần trong ${data.timeWindow} phút.`,
    suggestedActions: [
      'Kiểm tra server logs',
      'Restart services nếu cần',
      'Thông báo technical team',
      'Monitor system health'
    ]
  },

  // ADVANCED E-COMMERCE TRIGGERS

  // Cart Abandonment Spike
  {
    name: 'cart_abandonment_spike',
    condition: data => data.abandonmentRate >= monitoringThresholds.customer.cartAbandonmentRate,
    eventType: 'CART_ABANDONMENT_SPIKE',
    priority: 'URGENT',
    businessImpact: 'HIGH',
    message: data =>
      `🛒 CART ABANDONMENT SPIKE! ${data.abandonmentRate}% khách bỏ giỏ hàng trong ${data.timeWindow}h. Mất ${data.potentialRevenue}đ!`,
    suggestedActions: [
      'Gửi email nhắc nhở giỏ hàng',
      'Kiểm tra quy trình checkout',
      'Xem xét giảm phí ship',
      'Tối ưu UX thanh toán',
      'Chạy popup discount'
    ]
  },

  // High-Value Customer Lost
  {
    name: 'high_value_customer_lost',
    condition: data =>
      data.customerValue >= monitoringThresholds.customer.highValueThreshold &&
      data.daysSinceLastPurchase >= monitoringThresholds.customer.inactivityDays,
    eventType: 'HIGH_VALUE_CUSTOMER_LOST',
    priority: 'URGENT',
    businessImpact: 'HIGH',
    message: data =>
      `💎 KHÁCH VIP BIẾN MẤT! ${data.customerName} (${data.customerValue}đ) không mua ${data.daysSinceLastPurchase} ngày. Nguy cơ mất khách!`,
    suggestedActions: [
      'Gọi điện chăm sóc khách hàng',
      'Gửi offer đặc biệt',
      'Tặng voucher VIP',
      'Mời tham gia chương trình loyalty',
      'Survey lý do không mua'
    ]
  },

  // 🚫 DISABLED: Average Order Value Drop (Too noisy)
  // {
  //   name: 'average_order_value_drop',
  //   condition: data => data.aovDropPercentage >= monitoringThresholds.order.averageValueDropPercentage,
  //   eventType: 'AVERAGE_ORDER_VALUE_DROP',
  //   priority: 'WARNING',
  //   businessImpact: 'MEDIUM',
  //   message: data =>
  //     `📉 AOV GIẢM MẠNH! Giá trị đơn hàng trung bình giảm ${data.aovDropPercentage}% (từ ${data.previousAOV}đ xuống ${data.currentAOV}đ).`,
  //   suggestedActions: [
  //     'Chạy campaign upsell',
  //     'Tăng minimum order cho free ship',
  //     'Bundle products với giá tốt',
  //     'Cross-sell recommendations',
  //     'Review pricing strategy'
  //   ]
  // },

  // 🎯 NEW BUSINESS INTELLIGENCE EVENTS

  // Seasonal Marketing Opportunities
  {
    name: 'seasonal_marketing_opportunity',
    condition: data => data.daysUntilHoliday <= 14 && data.daysUntilHoliday >= 7,
    eventType: 'SEASONAL_MARKETING',
    priority: 'INFO',
    businessImpact: 'HIGH',
    message: data =>
      `🎉 CƠ HỘI MARKETING! ${data.holidayName} còn ${data.daysUntilHoliday} ngày. Đã đến lúc tung voucher và campaign đặc biệt!`,
    suggestedActions: [
      'Tạo voucher giảm giá đặc biệt',
      'Thiết kế banner/poster chủ đề lễ',
      'Lên kế hoạch email marketing',
      'Chuẩn bị sản phẩm hot trend',
      'Tăng cường social media'
    ]
  },

  // Low Conversion Rate Alert
  {
    name: 'low_conversion_rate',
    condition: data => data.conversionRate < 2.0 && data.visitors > 100,
    eventType: 'CONVERSION_OPTIMIZATION',
    priority: 'WARNING',
    businessImpact: 'HIGH',
    message: data =>
      `📊 CONVERSION THẤP! Tỷ lệ chuyển đổi chỉ ${data.conversionRate}% với ${data.visitors} lượt truy cập. Cần tối ưu ngay!`,
    suggestedActions: [
      'Gửi email ưu đãi cho visitors',
      'Tạo popup discount cho first-time visitors',
      'Review UX/UI trang sản phẩm',
      'A/B test call-to-action buttons',
      'Thêm social proof và reviews'
    ]
  },

  // Pending Orders Alert
  {
    name: 'pending_orders_alert',
    condition: data => data.pendingDays >= 3,
    eventType: 'ORDER_MANAGEMENT',
    priority: 'URGENT',
    businessImpact: 'HIGH',
    message: data =>
      `⏰ ĐỠN HÀNG PENDING! Đơn #${data.orderId} đã pending ${data.pendingDays} ngày. Khách hàng có thể hủy đơn!`,
    suggestedActions: [
      'Liên hệ khách hàng ngay lập tức',
      'Kiểm tra tình trạng thanh toán',
      'Xác nhận thông tin giao hàng',
      'Cung cấp tracking number',
      'Offer compensation nếu cần'
    ]
  },

  // High Return Rate Warning
  {
    name: 'high_return_rate',
    condition: data => data.returnRate >= 15 && data.totalOrders >= 10,
    eventType: 'RETURN_ANALYSIS',
    priority: 'WARNING',
    businessImpact: 'HIGH',
    message: data =>
      `🔄 TỶ LỆ HOÀN HÀNG CAO! ${data.productName} có ${data.returnRate}% đơn bị hoàn (${data.returnCount}/${data.totalOrders}). Cần kiểm tra ngay!`,
    suggestedActions: [
      'Phân tích lý do hoàn hàng',
      'Kiểm tra chất lượng sản phẩm',
      'Review mô tả và hình ảnh',
      'Cải thiện quy trình đóng gói',
      'Training team customer service'
    ]
  },

  // Birthday Campaign Opportunity
  {
    name: 'birthday_campaign_opportunity',
    condition: data => data.upcomingBirthdays >= 5,
    eventType: 'CUSTOMER_ENGAGEMENT',
    priority: 'INFO',
    businessImpact: 'MEDIUM',
    message: data =>
      `🎂 CƠ HỘI SINH NHẬT! Có ${data.upcomingBirthdays} khách hàng sắp sinh nhật trong 7 ngày tới. Gửi quà tặng đặc biệt!`,
    suggestedActions: [
      'Tạo voucher sinh nhật cá nhân hóa',
      'Gửi email chúc mừng sinh nhật',
      'Tặng free shipping cho đơn sinh nhật',
      'Tạo combo quà tặng đặc biệt',
      'Follow up sau khi gửi voucher'
    ]
  }

  // 🚫 DISABLED: Competitor Price Advantage (Too noisy)
  // {
  //   name: 'competitor_price_advantage',
  //   condition: data => data.priceAdvantagePercentage >= monitoringThresholds.competitor.priceAdvantagePercentage,
  //   eventType: 'COMPETITOR_PRICE_ADVANTAGE',
  //   priority: 'WARNING',
  //   businessImpact: 'MEDIUM',
  //   message: data =>
  //     `⚔️ ĐỐI THỦ CÓ LỢI THẾ GIÁ! ${data.competitorName} bán ${data.productName} rẻ hơn ${data.priceAdvantagePercentage}% (${data.ourPrice}đ vs ${data.competitorPrice}đ).`,
  //   suggestedActions: [
  //     'Xem xét điều chỉnh giá',
  //     'Tăng value proposition',
  //     'Chạy promotion đặc biệt',
  //     'Highlight unique selling points',
  //     'Monitor competitor moves'
  //   ]
  // }
];

// Business Context Detection
export const detectBusinessContext = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  return {
    timeOfDay:
      (hour >= 9 && hour <= 11) || (hour >= 19 && hour <= 21) ? 'PEAK' : hour >= 2 && hour <= 6 ? 'OFF' : 'NORMAL',
    dayOfWeek: day === 0 || day === 6 ? 'WEEKEND' : 'WEEKDAY',
    season: 'NORMAL', // TODO: Implement seasonal detection
    competitorActivity: 'MEDIUM', // TODO: Implement competitor monitoring
    marketTrend: 'STABLE' // TODO: Implement market trend analysis
  };
};

// Event Processing Logic
export const processBusinessEvent = (eventData: any): EventTrigger | null => {
  for (const trigger of eventTriggers) {
    if (trigger.condition(eventData)) {
      return trigger;
    }
  }
  return null;
};
