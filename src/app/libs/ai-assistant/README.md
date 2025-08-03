1. KHỞI ĐỘNG HỆ THỐNG
   📁 autoStart.ts - Điểm bắt đầu
   Vai trò: Auto-start AI Assistant khi server khởi động
   Xử lý:
   Kiểm tra adminSettings.aiAssistantEnabled trong DB
   Nếu enabled → gọi eventMonitor.startMonitoring()
   Delay 5 giây để đảm bảo DB ready
   Chỉ cho phép 1 lần start để tránh duplicate
2. GIÁM SÁT SỰ KIỆN
   📁 eventMonitor.ts - Trung tâm điều khiển
   Vai trò: Monitor các business events theo interval
   Xử lý:
   Fixed interval: 2 phút/lần check
   Các loại events được monitor:
   checkInventoryEvents() - Kiểm tra tồn kho
   checkSalesEvents() - Kiểm tra doanh số
   checkSeasonalMarketingOpportunities() - Cơ hội marketing theo mùa
   checkPendingOrdersAlert() - Đơn hàng pending
   checkBirthdayCampaignOpportunities() - Chiến dịch sinh nhật
   🎯 runAIRecommendations() - Chạy AI recommendations
   🔄 Luồng xử lý event:
   Thu thập data từ DB (products, orders, customers...)
   Áp dụng business rules từ eventTriggers.ts
   Tạo/cập nhật AI Memory qua memoryService.ts
   Gửi notification nếu cần thiết
3. BUSINESS RULES ENGINE
   📁 eventTriggers.ts - Định nghĩa rules
   Vai trò: Định nghĩa các điều kiện trigger events
   Các loại triggers:
   Inventory: INVENTORY_LOW, INVENTORY_CRITICAL
   Sales: SALES_SPIKE, SALES_DROP
   Customer: CART_ABANDONMENT_SPIKE, HIGH_VALUE_CUSTOMER
   Payment: PAYMENT_FAILURE_SPIKE
   Review: NEGATIVE_REVIEW_SPIKE
   🎯 Ví dụ trigger:
4. AI RECOMMENDATION ENGINE
   📁 aiRecommendationService.ts - AI Brain
   Vai trò: Phân tích data và tạo intelligent recommendations
   Các loại phân tích:
   🔍 Product Performance Analysis:
   Phân tích 30 ngày gần nhất
   Tính conversion rate, view count, sales count
   Đề xuất khuyến mãi cho sản phẩm hiệu suất thấp
   ⏰ Pending Orders Analysis:
   Tìm đơn hàng pending > 3 ngày
   Tính urgency dựa trên số ngày pending
   Đề xuất action: PROCESS_ORDER
   💎 Customer Retention Analysis:
   Tìm VIP customers không mua hàng > 30 ngày
   Đề xuất retention campaigns
   📦 Inventory Critical Analysis:
   Sản phẩm có stock < 10
   Đề xuất restock ngay lập tức
   🚀 Main Function: runAIRecommendations()
   Analyze tất cả data sources
   Generate recommendations với confidence score
   Sort theo urgency và confidence
   Send top 8 recommendations cho admin
   Anti-spam: Không gửi duplicate trong 24h
5. MEMORY MANAGEMENT
   📁 memoryService.ts - AI Memory
   Vai trò: Lưu trữ và quản lý AI memories
   Xử lý:
   Tạo unique alertId cho mỗi event
   Track reminderCount để tránh spam
   Lưu contextData cho analysis
   Quản lý lifecycle: ACTIVE → RESOLVED/DISMISSED
6. LUỒNG HOÀN CHỈNH
   graph TD
   A[autoStart.ts] --> B[eventMonitor.ts]
   B --> C[checkBusinessEvents - 2 phút/lần]
   C --> D[runAIRecommendations]
   D --> E[aiRecommendationService.ts]
   E --> F[Analyze Products/Orders/Customers]
   F --> G[Generate AI Recommendations]
   G --> H[Sort by Urgency + Confidence]
   H --> I[Send Top 8 to Admin]
   I --> J[Create Notifications]

   C --> K[checkInventoryEvents]
   K --> L[eventTriggers.ts - Apply Rules]
   L --> M[memoryService.ts - Create Memory]
   M --> N[Send Business Event Notification]

7. CẤU HÌNH VÀ SETTINGS
   ⚙️ Interval Settings:
   Business Events: 2 phút (fixed)
   AI Recommendations: Configurable qua adminSettings.aiRecommendationInterval (default: 2 phút)
   🎛️ Control Settings:
   aiAssistantEnabled: Bật/tắt toàn bộ system
   aiRecommendationInterval: Tần suất chạy AI recommendations
   Anti-spam: 24h cooldown cho duplicate notifications
