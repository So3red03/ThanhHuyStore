# Simplified Shipping Fee & Return Management System

## 📋 Current System Analysis

### 🔍 Current Issues Identified

1. **Hardcoded Shipping Fees**

   - Fixed rates: 40,000₫ (fast) và 25,000₫ (standard) in CartInfoClient.tsx
   - No distance-based calculation
   - No shop address configuration
   - No consideration of package weight/size

2. **Return/Exchange Shipping Logic**

   - Basic return calculation in return-request API
   - No differentiated shipping fee handling based on return reason
   - Missing inventory restoration rules
   - No partial shipping fee calculations

3. **Address System Limitations**
   - Basic Address type: `{city, country, line1, line2?, postal_code}`
   - No detailed location data for shipping calculation
   - No shop location configuration in AdminSettings

## 🎯 Simplified Solution (Using Existing Structure)

### 1. Extend AdminSettings Model (No New Models)

```typescript
// Add to existing AdminSettings model in schema.prisma
model AdminSettings {
  // ... existing fields ...

  // Shipping Configuration
  shopAddress         String?   // "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
  shopProvince        String?   @default("TP. Hồ Chí Minh")
  shopDistrict        String?   @default("Quận 1")
  shopWard            String?   @default("Phường Bến Nghé")

  // Shipping Settings
  freeShippingThreshold Float?  @default(500000) // Free ship over 500k
  baseShippingFee       Float?  @default(25000)  // Base shipping fee
  fastShippingFee       Float?  @default(40000)  // Fast shipping fee
  shippingPerKm         Float?  @default(2000)   // Additional fee per km
  maxShippingDistance   Float?  @default(50)     // Max shipping distance (km)

  // Return Policy Settings
  returnShippingPolicy  Json?    @default("{}") // Return shipping policies
}
```

### 2. Simple Distance-Based Calculation

```typescript
// Simple shipping calculation without external APIs
interface ShippingCalculationRequest {
  customerAddress: {
    province: string;
    district: string;
    ward: string;
  };
  orderValue: number;
  totalWeight?: number; // Optional, can estimate from product count
}

interface ShippingOption {
  type: 'standard' | 'fast';
  fee: number;
  estimatedDays: number;
  description: string;
  isFree: boolean;
}

// Simple calculation service
class SimpleShippingCalculator {
  static calculate(request: ShippingCalculationRequest, settings: AdminSettings): ShippingOption[] {
    const { customerAddress, orderValue } = request;

    // Check free shipping threshold
    const isFreeShipping = orderValue >= (settings.freeShippingThreshold || 500000);

    // Simple distance estimation based on province/district
    const distance = this.estimateDistance(customerAddress, settings);

    // Calculate fees
    const baseShipping = settings.baseShippingFee || 25000;
    const fastShipping = settings.fastShippingFee || 40000;
    const distanceFee = distance > 10 ? (distance - 10) * (settings.shippingPerKm || 2000) : 0;

    const standardFee = isFreeShipping ? 0 : baseShipping + distanceFee;
    const fastFee = isFreeShipping ? 0 : fastShipping + distanceFee;

    return [
      {
        type: 'standard',
        fee: standardFee,
        estimatedDays: 3,
        description: 'Giao hàng tiêu chuẩn (2-3 ngày)',
        isFree: isFreeShipping
      },
      {
        type: 'fast',
        fee: fastFee,
        estimatedDays: 1,
        description: 'Giao hàng nhanh (1-2 ngày)',
        isFree: false // Fast shipping never free
      }
    ];
  }

  private static estimateDistance(customerAddress: any, settings: AdminSettings): number {
    // Simple distance estimation based on province/district matching
    const shopProvince = settings.shopProvince || 'TP. Hồ Chí Minh';
    const shopDistrict = settings.shopDistrict || 'Quận 1';

    if (customerAddress.province !== shopProvince) {
      return 50; // Inter-province: 50km
    } else if (customerAddress.district !== shopDistrict) {
      return 20; // Different district: 20km
    } else {
      return 5; // Same district: 5km
    }
  }
}
```

### 3. Simplified Return/Exchange Policies

```typescript
// Simplified return reasons (remove NOT_AS_DESCRIBED, WRONG_SIZE)
enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE', // Hàng lỗi
  WRONG_ITEM = 'WRONG_ITEM', // Giao sai hàng (includes wrong size, not as described)
  DAMAGED_SHIPPING = 'DAMAGED_SHIPPING', // Hư hỏng trong vận chuyển
  CHANGE_MIND = 'CHANGE_MIND' // Đổi ý
}

// Simple return policies stored in AdminSettings.returnShippingPolicy
const DEFAULT_RETURN_POLICIES = {
  DEFECTIVE: {
    customerPaysShipping: false, // Shop trả phí ship
    shippingFeePercentage: 0,
    restoreInventory: false, // Không restore vì hàng lỗi
    refundPercentage: 100,
    requiresApproval: false
  },
  WRONG_ITEM: {
    customerPaysShipping: false, // Shop trả phí ship
    shippingFeePercentage: 0,
    restoreInventory: true, // Restore vì hàng vẫn tốt
    refundPercentage: 100,
    requiresApproval: false
  },
  DAMAGED_SHIPPING: {
    customerPaysShipping: false, // Shop trả phí ship
    shippingFeePercentage: 0,
    restoreInventory: false, // Không restore vì hàng hỏng
    refundPercentage: 100,
    requiresApproval: false
  },
  CHANGE_MIND: {
    customerPaysShipping: true, // Khách trả phí ship
    shippingFeePercentage: 100,
    restoreInventory: true, // Restore vì hàng vẫn tốt
    refundPercentage: 90, // Trừ 10% phí xử lý
    requiresApproval: true
  }
};
```

### 3. Return/Exchange Shipping Fee Management

#### 3.1 Return Shipping Policy

```typescript
enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE', // Hàng lỗi
  WRONG_ITEM = 'WRONG_ITEM', // Giao sai hàng
  DAMAGED_SHIPPING = 'DAMAGED_SHIPPING', // Hư hỏng trong vận chuyển
  CHANGE_MIND = 'CHANGE_MIND', // Đổi ý
  WRONG_SIZE = 'WRONG_SIZE', // Sai size
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED' // Không đúng mô tả
}

interface ReturnShippingPolicy {
  reason: ReturnReason;
  customerPaysShipping: boolean;
  shippingFeePercentage: number; // 0-100%
  restoreInventory: boolean;
  refundPercentage: number; // 0-100%
  requiresApproval: boolean;
}

const RETURN_SHIPPING_POLICIES: Record<ReturnReason, ReturnShippingPolicy> = {
  DEFECTIVE: {
    reason: 'DEFECTIVE',
    customerPaysShipping: false, // Shop trả phí ship
    shippingFeePercentage: 0,
    restoreInventory: false, // Không restore vì hàng lỗi
    refundPercentage: 100,
    requiresApproval: false
  },
  WRONG_ITEM: {
    reason: 'WRONG_ITEM',
    customerPaysShipping: false, // Shop trả phí ship
    shippingFeePercentage: 0,
    restoreInventory: true, // Restore vì hàng vẫn tốt
    refundPercentage: 100,
    requiresApproval: false
  },
  DAMAGED_SHIPPING: {
    reason: 'DAMAGED_SHIPPING',
    customerPaysShipping: false, // Shop trả phí ship
    shippingFeePercentage: 0,
    restoreInventory: false, // Không restore vì hàng hỏng
    refundPercentage: 100,
    requiresApproval: false
  },
  CHANGE_MIND: {
    reason: 'CHANGE_MIND',
    customerPaysShipping: true, // Khách trả phí ship
    shippingFeePercentage: 100,
    restoreInventory: true, // Restore vì hàng vẫn tốt
    refundPercentage: 90, // Trừ 10% phí xử lý
    requiresApproval: true
  }
  // WRONG_SIZE và NOT_AS_DESCRIBED được gộp vào WRONG_ITEM
};
```

### 4. Add Shipping Section to AdminSettings UI

```typescript
// Add to AdminSettingsClient.tsx menuItems
const menuItems = [
  { id: 'notifications', label: 'Thông báo', icon: MdNotifications },
  { id: 'system', label: 'Hệ thống', icon: MdStorage },
  { id: 'automation', label: 'Tự động hóa', icon: MdSmartToy },
  { id: 'reports', label: 'Báo cáo', icon: MdAssessment },
  { id: 'shipping', label: 'Vận chuyển', icon: MdLocalShipping } // NEW
];

// Add shipping fields to SettingsData interface
interface SettingsData {
  // ... existing fields ...

  // Shipping settings
  shopAddress?: string;
  shopProvince?: string;
  shopDistrict?: string;
  shopWard?: string;
  freeShippingThreshold?: number;
  baseShippingFee?: number;
  fastShippingFee?: number;
  shippingPerKm?: number;
  maxShippingDistance?: number;
}
```

### 5. Simple Return Calculation Service

```typescript
// Simple return calculation without complex models
class SimpleReturnCalculator {
  static calculate(returnRequest: any, originalOrder: any, settings: AdminSettings) {
    const policy = this.getReturnPolicy(returnRequest.reason, settings);

    // Calculate base refund
    const itemsTotal = returnRequest.items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);

    const refundAmount = itemsTotal * (policy.refundPercentage / 100);

    // Calculate shipping fees
    const originalShippingFee = originalOrder.shippingFee || 0;
    const returnShippingFee = this.calculateReturnShippingFee(originalOrder.address, settings);

    const customerShippingFee = policy.customerPaysShipping
      ? returnShippingFee * (policy.shippingFeePercentage / 100)
      : 0;

    const shopShippingFee = returnShippingFee - customerShippingFee;

    // Calculate processing fee
    const processingFee = policy.refundPercentage < 100 ? itemsTotal * ((100 - policy.refundPercentage) / 100) : 0;

    // Calculate total refund
    const totalRefund = refundAmount - customerShippingFee - processingFee;

    return {
      refundAmount,
      originalShippingFee,
      returnShippingFee,
      customerShippingFee,
      shopShippingFee,
      processingFee,
      totalRefund,
      restoreInventory: policy.restoreInventory,
      requiresApproval: policy.requiresApproval
    };
  }

  private static getReturnPolicy(reason: string, settings: AdminSettings) {
    const policies = settings.returnShippingPolicy || DEFAULT_RETURN_POLICIES;
    return policies[reason] || DEFAULT_RETURN_POLICIES.CHANGE_MIND;
  }

  private static calculateReturnShippingFee(address: any, settings: AdminSettings): number {
    // Use same logic as forward shipping
    const request = {
      customerAddress: {
        province: address.city, // Assuming city contains province
        district: address.line1?.split(',')[1]?.trim() || '',
        ward: address.line1?.split(',')[0]?.trim() || ''
      },
      orderValue: 0 // Return shipping is never free
    };

    const options = SimpleShippingCalculator.calculate(request, settings);
    return options[0]?.fee || settings.baseShippingFee || 25000;
  }
}
```

### 6. Update Existing Files (Minimal Changes)

#### 6.1 Update CartInfoClient.tsx

```typescript
// Replace hardcoded shipping with dynamic calculation
const handleDeliveryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const shippingType = parseInt(e.target.value, 10) === 0 ? 'fast' : 'standard';

  // Get shipping options from API
  const response = await fetch('/api/shipping/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerAddress: {
        province: provinceName,
        district: districtName,
        ward: wardName
      },
      orderValue: cartTotalAmount,
      shippingType
    })
  });

  const { shippingOptions } = await response.json();
  const selectedOption = shippingOptions.find((opt: any) => opt.type === shippingType);

  const shippingFee = selectedOption?.fee || (shippingType === 'fast' ? 40000 : 25000);
  shippingFeeClient(shippingFee);
  setShippingFeeCheck(shippingFee);
};
```

#### 6.2 Create New API Route: /api/shipping/calculate

```typescript
// src/app/api/shipping/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prismadb';
import { SimpleShippingCalculator } from '@/utils/shipping/calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerAddress, orderValue, shippingType } = body;

    // Get admin settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 500 });
    }

    // Calculate shipping options
    const shippingOptions = SimpleShippingCalculator.calculate(
      {
        customerAddress,
        orderValue
      },
      settings
    );

    return NextResponse.json({
      success: true,
      shippingOptions,
      selectedOption: shippingOptions.find(opt => opt.type === shippingType)
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
  }
}
```

## 🚀 Simplified Implementation Plan (3 Phases)

### Phase 1: AdminSettings Extension (Week 1)

**Objective**: Add shipping configuration to existing AdminSettings

#### Tasks:

- [ ] **Extend AdminSettings Model**

  - Add shipping fields to schema.prisma
  - Update AdminSettings API routes
  - Add default values for new fields

- [ ] **Add Shipping Section to Admin UI**

  - Add 'Vận chuyển' tab to AdminSettingsClient.tsx
  - Create shipping configuration form
  - Add validation for shipping settings

- [ ] **Create SimpleShippingCalculator**
  - Implement distance-based calculation
  - Add free shipping threshold logic
  - Create utility functions

#### Deliverables:

- Updated AdminSettings model with shipping fields
- Shipping configuration UI in admin panel
- Basic shipping calculation service

### Phase 2: Dynamic Shipping in Cart (Week 2)

**Objective**: Replace hardcoded shipping with dynamic calculation

#### Tasks:

- [ ] **Create Shipping API Route**

  - /api/shipping/calculate endpoint
  - Integration with AdminSettings
  - Error handling and fallbacks

- [ ] **Update CartInfoClient.tsx**

  - Replace hardcoded values with API calls
  - Add loading states
  - Maintain backward compatibility

- [ ] **Test & Validate**
  - Test different address combinations
  - Verify free shipping threshold
  - Check mobile responsiveness

#### Deliverables:

- Dynamic shipping calculation API
- Updated cart with real-time shipping fees
- Comprehensive testing

### Phase 3: Enhanced Return Management (Week 3)

**Objective**: Implement smart return shipping policies

#### Tasks:

- [ ] **Add Return Policies to AdminSettings**

  - Store return policies in JSON field
  - Create default policies
  - Add admin interface for policy management

- [ ] **Create SimpleReturnCalculator**

  - Implement return calculation logic
  - Handle different return reasons
  - Calculate shipping fee breakdown

- [ ] **Update Return Request Flow**
  - Enhance return request API
  - Add shipping fee breakdown to UI
  - Update admin return management

#### Deliverables:

- Return policy management in admin
- Smart return calculation service
- Enhanced return request flow

## 📊 Expected Benefits

### 1. **Accurate Shipping Costs**

- Distance-based calculation instead of fixed rates
- Free shipping threshold automation
- Transparent pricing for customers

### 2. **Simplified Management**

- All shipping settings in one place (AdminSettings)
- No new complex models or APIs
- Easy to configure and maintain

### 3. **Better Return Handling**

- Automated shipping fee calculation for returns
- Clear policies based on return reason
- Reduced manual work for admin

### 4. **Minimal Code Changes**

- Reuse existing AdminSettings structure
- Simple API additions
- Backward compatibility maintained

## 🔧 Technical Notes

### No External API Dependencies

- Simple distance estimation based on province/district
- Fallback to hardcoded values if calculation fails
- Can be enhanced later with real APIs if needed

### Minimal Database Changes

- Only extend existing AdminSettings model
- No new complex relationships
- Easy to rollback if needed

### Performance Considerations

- Cache shipping calculations in localStorage
- Debounce API calls during address input
- Fallback to default values for fast response

This simplified approach focuses on the core requirements while maintaining the existing clean codebase structure and avoiding over-engineering.
