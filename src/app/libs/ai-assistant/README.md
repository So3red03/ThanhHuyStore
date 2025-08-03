# 🤖 AI Assistant System

## 🎯 Overview

Intelligent business monitoring system with emergency alerts and strategic recommendations.

## 🏗️ Architecture

### Core Components

- **autoStart.ts**: Entry point, auto-starts monitoring
- **reactiveMonitor.ts**: Emergency alerts (30s interval)
- **proactiveAnalyzer.ts**: Strategic analysis (2min interval)
- **memoryService.ts**: Anti-spam & escalation logic
- **types.ts**: Type definitions

### Flow

```
Server Start → autoStart.ts → [reactiveMonitor + proactiveAnalyzer] → memoryService → NotificationService → UI
```

## 🚨 ReactiveMonitor - Emergency Response (30s)

| Method                  | Function            | Trigger             | Cooldown | Output                     |
| ----------------------- | ------------------- | ------------------- | -------- | -------------------------- |
| `checkFailedPayments()` | Thanh toán thất bại | ≥10% failure rate   | **NONE** | 🚨 "X% đơn hàng thất bại"  |
| `checkNewOrders()`      | **Đơn hàng mới**    | Created in last 30s | **NONE** | 🛒 "Đơn hàng mới #ABC123"  |
| `checkNewComments()`    | **Comment mới**     | Created in last 30s | **NONE** | 💬 "Đánh giá sản phẩm mới" |
| `checkSystemErrors()`   | Lỗi hệ thống        | TODO                | **NONE** | 🔧 Placeholder             |

**🎯 Total: 4 real-time checks (NO anti-spam cooldown)**

## 🤖 ProactiveAnalyzer - Strategic Analysis (2min)

| Method                         | Function             | Trigger                      | Cooldown | Output                           |
| ------------------------------ | -------------------- | ---------------------------- | -------- | -------------------------------- |
| `analyzeCriticalInventory()`   | **Sản phẩm sắp hết** | stock ≤ 5                    | **2min** | 📦 "Phân tích tồn kho nguy hiểm" |
| `analyzeUrgentOrders()`        | **Đơn hàng quá hạn** | >7 days pending              | **2min** | ⏰ "Phân tích đơn hàng quá hạn"  |
| `analyzeProductOptimization()` | Sản phẩm bán kém     | 2-5 orders/30d               | **2min** | 💡 "Giảm giá 10-15%"             |
| `analyzeCustomerRetention()`   | VIP không mua lại    | VIP inactive 30+ days        | **2min** | 💎 "Gửi email khuyến mãi"        |
| `analyzeInventoryPlanning()`   | **Tồn kho thấp**     | stock ≤ 10 OR run out 10-20d | **2min** | ⚠️ "Nhập hàng ngay/sớm"          |
| `analyzePricingStrategy()`     | Chiến lược giá       | TODO                         | **2min** | 💰 Placeholder                   |

**🎯 Total: 6 strategic analyses (ALL with 2min cooldown + memory check)**

## 🧠 Memory Management

### Current Implementation

**ReactiveMonitor & ProactiveAnalyzer** use **simplified memory logic**:

✅ **What's working:**

- Anti-spam protection via direct `prisma.aIMemory` queries
- Cooldown-based alert throttling
- Admin action respect (RESOLVED/DISMISSED status)
- Enhanced context storage (productId, productName, businessImpact)

❌ **What's NOT used:**

- AIMemoryService class (performance reasons)
- Escalation rules (WARNING → URGENT → CRITICAL)
- Admin action tracking
- Business impact analysis

### Memory Flow

```
shouldSendEmergencyAlert(key, cooldown) → Check AIMemory DB → Cooldown OK? → Send Alert → markEmergencyAlertSent(key, context)
```

## 🎯 Key Features

### Anti-spam Protection

- **Emergency alerts**: 30s-24h cooldowns per alert type
- **Strategic recommendations**: 2min-2h cooldowns per analysis
- **Admin respect**: Won't resend RESOLVED/DISMISSED alerts

### Context Preservation

- Product details (ID, name, stock levels)
- Order information (ID, customer, value)
- Business metrics (failure rates, sales data)
- Timestamps and alert history

### UI Integration

- **3 UI components** support AI_ASSISTANT notifications
- Real-time delivery via NotificationService
- Rich context data for admin actions

## 🚀 Usage

System auto-starts when server boots. No manual intervention needed.

**Test scenarios:**

1. Create order → ReactiveMonitor detects in 30s
2. Add product/article review → ReactiveMonitor detects in 30s
3. Set product stock ≤ 10 → ProactiveAnalyzer detects in 2min
4. Set product stock ≤ 5 → Both monitors detect (emergency + strategic)

ProativeAnalyzer Memory Flow:

1. shouldRunAnalysis() → Check existing memory
2. runSpecificAnalysis() → Generate recommendations
3. sendStrategicRecommendation() → Send to UI (with productId in data)
4. markRecommendationSent() → UPSERT memory (no duplicate)
5. markAnalysisCompleted() → UPSERT analysis tracking (no duplicate)

ReactiveMonitor Memory Flow:

1. shouldSendEmergencyAlert() → Check existing memory
2. sendEmergencyAlert() → Send to UI
3. markEmergencyAlertSent() → UPSERT memory (no duplicate)
