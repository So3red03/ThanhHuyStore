// Modern shipping calculation utility with zone-based pricing
// Follows Vietnam market standards (GHTK/GHN compatible)
// Zone-based pricing: SAME_DISTRICT -> SAME_PROVINCE -> SAME_REGION -> CROSS_REGION

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
  // New zone-based pricing fields
  sameDistrictFee?: number | null;
  sameProvinceFee?: number | null;
  sameRegionFee?: number | null;
  crossRegionFee?: number | null;
}

// Vietnam geographical regions for shipping calculation
export const VIETNAM_REGIONS = {
  NORTH: [
    'Hà Nội',
    'Hải Phòng',
    'Quảng Ninh',
    'Thái Nguyên',
    'Lạng Sơn',
    'Cao Bằng',
    'Bắc Kạn',
    'Tuyên Quang',
    'Lào Cai',
    'Yên Bái',
    'Phú Thọ',
    'Vĩnh Phúc',
    'Bắc Ninh',
    'Bắc Giang',
    'Hải Dương',
    'Hưng Yên',
    'Thái Bình',
    'Hà Nam',
    'Nam Định',
    'Ninh Bình',
    'Hòa Bình',
    'Sơn La',
    'Điện Biên',
    'Lai Châu'
  ],
  CENTRAL: [
    'Thanh Hóa',
    'Nghệ An',
    'Hà Tĩnh',
    'Quảng Bình',
    'Quảng Trị',
    'Thừa Thiên Huế',
    'Đà Nẵng',
    'Quảng Nam',
    'Quảng Ngãi',
    'Bình Định',
    'Phú Yên',
    'Khánh Hòa',
    'Ninh Thuận',
    'Bình Thuận',
    'Kon Tum',
    'Gia Lai',
    'Đắk Lắk',
    'Đắk Nông',
    'Lâm Đồng'
  ],
  SOUTH: [
    'TP. Hồ Chí Minh',
    'Bình Dương',
    'Đồng Nai',
    'Bà Rịa - Vũng Tàu',
    'Tây Ninh',
    'Bình Phước',
    'Long An',
    'Tiền Giang',
    'Bến Tre',
    'Trà Vinh',
    'Vĩnh Long',
    'Đồng Tháp',
    'An Giang',
    'Kiên Giang',
    'Cần Thơ',
    'Hậu Giang',
    'Sóc Trăng',
    'Bạc Liêu',
    'Cà Mau'
  ]
};

// Market-standard shipping fees (VND) - competitive with GHTK/GHN
export const MARKET_STANDARD_SHIPPING = {
  SAME_DISTRICT: 18000, // Cùng quận/huyện: 18k
  SAME_PROVINCE: 22000, // Cùng tỉnh/thành: 22k
  SAME_REGION: 28000, // Cùng miền: 28k
  CROSS_REGION: 38000 // Khác miền: 38k
};

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
   * Uses zone-based pricing for market competitiveness
   */
  static calculate(request: ShippingCalculationRequest, settings: AdminSettings): ShippingOption[] {
    const { customerAddress, orderValue } = request;

    // Check free shipping threshold
    const isFreeShipping = orderValue >= (settings.freeShippingThreshold || 5000000);

    // Determine shipping zone
    const shippingZone = this.determineShippingZone(customerAddress, settings);

    // Get shipping fee based on zone
    const standardFee = isFreeShipping ? 0 : this.getShippingFeeByZone(shippingZone, settings);

    return [
      {
        type: 'standard',
        fee: standardFee,
        estimatedDays: this.getEstimatedDays(shippingZone),
        description: this.getShippingDescription(shippingZone),
        isFree: isFreeShipping
      }
    ];
  }

  /**
   * Determine shipping zone based on geographical regions
   */
  private static determineShippingZone(customerAddress: any, settings: AdminSettings): string {
    const shopProvince = settings.shopProvince || 'TP. Hồ Chí Minh';
    const shopDistrict = settings.shopDistrict || 'Quận 1';
    const customerProvince = customerAddress.province;
    const customerDistrict = customerAddress.district;

    // Normalize strings for comparison (remove accents, lowercase)
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '');
    };

    const shopProvinceNorm = normalizeString(shopProvince);
    const shopDistrictNorm = normalizeString(shopDistrict);
    const customerProvinceNorm = normalizeString(customerProvince);
    const customerDistrictNorm = normalizeString(customerDistrict);

    // Same district
    if (shopProvinceNorm === customerProvinceNorm && shopDistrictNorm === customerDistrictNorm) {
      return 'SAME_DISTRICT';
    }

    // Same province
    if (shopProvinceNorm === customerProvinceNorm) {
      return 'SAME_PROVINCE';
    }

    // Check regions
    const shopRegion = this.getRegion(shopProvince);
    const customerRegion = this.getRegion(customerProvince);

    if (shopRegion === customerRegion) {
      return 'SAME_REGION';
    }

    return 'CROSS_REGION';
  }

  /**
   * Get region for a province
   */
  private static getRegion(province: string): string {
    const normalizedProvince = province
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');

    for (const [region, provinces] of Object.entries(VIETNAM_REGIONS)) {
      const found = provinces.some(p => {
        const normalizedP = p
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd');
        return normalizedProvince.includes(normalizedP) || normalizedP.includes(normalizedProvince);
      });
      if (found) return region;
    }

    return 'SOUTH'; // Default to South if not found
  }

  /**
   * Get shipping fee based on zone
   */
  private static getShippingFeeByZone(zone: string, settings: AdminSettings): number {
    switch (zone) {
      case 'SAME_DISTRICT':
        return settings.sameDistrictFee || MARKET_STANDARD_SHIPPING.SAME_DISTRICT;
      case 'SAME_PROVINCE':
        return settings.sameProvinceFee || MARKET_STANDARD_SHIPPING.SAME_PROVINCE;
      case 'SAME_REGION':
        return settings.sameRegionFee || MARKET_STANDARD_SHIPPING.SAME_REGION;
      case 'CROSS_REGION':
        return settings.crossRegionFee || MARKET_STANDARD_SHIPPING.CROSS_REGION;
      default:
        return settings.baseShippingFee || MARKET_STANDARD_SHIPPING.SAME_DISTRICT;
    }
  }

  /**
   * Get estimated delivery days based on zone
   */
  private static getEstimatedDays(zone: string): number {
    switch (zone) {
      case 'SAME_DISTRICT':
        return 1;
      case 'SAME_PROVINCE':
        return 2;
      case 'SAME_REGION':
        return 3;
      case 'CROSS_REGION':
        return 4;
      default:
        return 3;
    }
  }

  /**
   * Get shipping description based on zone
   */
  private static getShippingDescription(zone: string): string {
    switch (zone) {
      case 'SAME_DISTRICT':
        return 'Giao hàng nội thành (1 ngày)';
      case 'SAME_PROVINCE':
        return 'Giao hàng nội tỉnh (2 ngày)';
      case 'SAME_REGION':
        return 'Giao hàng nội miền (3 ngày)';
      case 'CROSS_REGION':
        return 'Giao hàng liên miền (4 ngày)';
      default:
        return 'Giao hàng tiêu chuẩn (2-3 ngày)';
    }
  }

  /**
   * Get shipping fee breakdown for display
   */
  static getShippingBreakdown(request: ShippingCalculationRequest, settings: AdminSettings) {
    const { customerAddress, orderValue } = request;
    const shippingZone = this.determineShippingZone(customerAddress, settings);
    const isFreeShipping = orderValue >= (settings.freeShippingThreshold || 5000000);

    const zoneFee = this.getShippingFeeByZone(shippingZone, settings);
    const totalFee = isFreeShipping ? 0 : zoneFee;

    return {
      zone: shippingZone,
      zoneFee,
      totalFee,
      isFreeShipping,
      freeShippingThreshold: settings.freeShippingThreshold || 5000000,
      estimatedDays: this.getEstimatedDays(shippingZone),
      description: this.getShippingDescription(shippingZone),
      // Legacy fields for backward compatibility
      distance: this.getLegacyDistance(shippingZone),
      baseShipping: zoneFee,
      distanceFee: 0
    };
  }

  /**
   * Get legacy distance for backward compatibility
   */
  private static getLegacyDistance(zone: string): number {
    switch (zone) {
      case 'SAME_DISTRICT':
        return 5;
      case 'SAME_PROVINCE':
        return 20;
      case 'SAME_REGION':
        return 35;
      case 'CROSS_REGION':
        return 50;
      default:
        return 20;
    }
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
      requiresApproval: policy.requiresApproval,
      policy // Include policy details for UI display
    };
  }

  /**
   * Get return shipping breakdown for display
   */
  static getReturnShippingBreakdown(returnRequest: any, originalOrder: any, settings: AdminSettings) {
    const policy = this.getReturnPolicy(returnRequest.reason, settings);
    const calculation = this.calculate(returnRequest, originalOrder, settings);

    return {
      reason: returnRequest.reason,
      reasonText: this.getReasonText(returnRequest.reason),
      customerPaysShipping: policy.customerPaysShipping,
      shippingResponsibility: policy.customerPaysShipping ? 'Khách hàng' : 'Cửa hàng',
      returnShippingFee: calculation.returnShippingFee,
      customerShippingFee: calculation.customerShippingFee,
      shopShippingFee: calculation.shopShippingFee,
      refundAmount: calculation.refundAmount,
      processingFee: calculation.processingFee,
      totalRefund: calculation.totalRefund,
      requiresApproval: policy.requiresApproval
    };
  }

  private static getReturnPolicy(reason: string, settings: AdminSettings) {
    let policies = DEFAULT_RETURN_POLICIES;

    // Parse JSON policy if exists
    if (settings.returnShippingPolicy) {
      try {
        const customPolicies =
          typeof settings.returnShippingPolicy === 'string'
            ? JSON.parse(settings.returnShippingPolicy)
            : settings.returnShippingPolicy;
        policies = { ...DEFAULT_RETURN_POLICIES, ...customPolicies };
      } catch (error) {
        console.error('Error parsing return shipping policy:', error);
      }
    }

    return policies[reason as keyof typeof policies] || DEFAULT_RETURN_POLICIES.CHANGE_MIND;
  }

  private static getReasonText(reason: string): string {
    const reasonTexts: Record<string, string> = {
      DEFECTIVE: 'Hàng lỗi/hư hỏng',
      WRONG_ITEM: 'Giao sai hàng',
      DAMAGED_SHIPPING: 'Hư hỏng trong vận chuyển',
      CHANGE_MIND: 'Đổi ý không muốn mua',
      WRONG_SIZE: 'Sai kích thước',
      NOT_AS_DESCRIBED: 'Không đúng mô tả'
    };
    return reasonTexts[reason] || reason;
  }

  private static calculateReturnShippingFee(address: any, settings: AdminSettings): number {
    // Fallback to base shipping fee if no address
    if (!address || !address.city) {
      return settings.sameDistrictFee || MARKET_STANDARD_SHIPPING.SAME_DISTRICT;
    }

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
    return options[0]?.fee || settings.sameDistrictFee || MARKET_STANDARD_SHIPPING.SAME_DISTRICT;
  }
}
