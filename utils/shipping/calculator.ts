// Simple shipping calculation utility
// No external API dependencies - uses distance estimation

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

interface AdminSettings {
  shopProvince?: string | null;
  shopDistrict?: string | null;
  shopWard?: string | null;
  freeShippingThreshold?: number | null;
  baseShippingFee?: number | null;
  shippingPerKm?: number | null;
  returnShippingPolicy?: any;
}

// Default return shipping policies
export const DEFAULT_RETURN_POLICIES = {
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

export class SimpleShippingCalculator {
  /**
   * Calculate shipping options based on customer address and order value
   */
  static calculate(request: ShippingCalculationRequest, settings: AdminSettings): ShippingOption[] {
    const { customerAddress, orderValue } = request;

    // Check free shipping threshold
    const isFreeShipping = orderValue >= (settings.freeShippingThreshold || 5000000);

    // Simple distance estimation based on province/district
    const distance = this.estimateDistance(customerAddress, settings);

    // Calculate standard shipping fee only - use consistent baseShippingFee
    const baseShipping = settings.baseShippingFee || 25000;
    const distanceFee = distance > 10 ? (distance - 10) * (settings.shippingPerKm || 2000) : 0;

    // Standard shipping fee
    const standardFee = isFreeShipping ? 0 : baseShipping + distanceFee;

    return [
      {
        type: 'standard',
        fee: standardFee,
        estimatedDays: 3,
        description: 'Giao hàng tiêu chuẩn (2-3 ngày)',
        isFree: isFreeShipping
      }
    ];
  }

  /**
   * Simple distance estimation based on province/district matching
   * This is a fallback method - can be enhanced with real geocoding later
   */
  private static estimateDistance(customerAddress: any, settings: AdminSettings): number {
    const shopProvince = settings.shopProvince || 'TP. Hồ Chí Minh';
    const shopDistrict = settings.shopDistrict || 'Quận 1';

    // Normalize strings for comparison (remove accents, lowercase)
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '');
    };

    const customerProvinceNorm = normalizeString(customerAddress.province);
    const customerDistrictNorm = normalizeString(customerAddress.district);
    const shopProvinceNorm = normalizeString(shopProvince);
    const shopDistrictNorm = normalizeString(shopDistrict);

    if (customerProvinceNorm !== shopProvinceNorm) {
      return 50; // Inter-province: 50km
    } else if (customerDistrictNorm !== shopDistrictNorm) {
      return 20; // Different district: 20km
    } else {
      return 5; // Same district: 5km
    }
  }

  /**
   * Get shipping fee breakdown for display
   */
  static getShippingBreakdown(request: ShippingCalculationRequest, settings: AdminSettings) {
    const { customerAddress, orderValue } = request;
    const distance = this.estimateDistance(customerAddress, settings);
    const isFreeShipping = orderValue >= (settings.freeShippingThreshold || 5000000);

    const baseShipping = settings.baseShippingFee || 25000;
    const distanceFee = distance > 10 ? (distance - 10) * (settings.shippingPerKm || 2000) : 0;

    return {
      distance,
      baseShipping,
      distanceFee,
      totalFee: isFreeShipping ? 0 : baseShipping + distanceFee,
      isFreeShipping,
      freeShippingThreshold: settings.freeShippingThreshold || 5000000
    };
  }
}

// Simple return calculation service
export class SimpleReturnCalculator {
  /**
   * Calculate return refund and shipping fees
   */
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
