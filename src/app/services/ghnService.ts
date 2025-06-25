// GHN (Giao Hàng Nhanh) API Service
// Tích hợp API vận chuyển cho ThanhHuyStore

interface GHNConfig {
  apiUrl: string;
  token: string;
  shopId: string;
}

interface GHNAddress {
  province_id: number;
  district_id: number;
  ward_code: string;
  detail: string;
}

interface GHNItem {
  name: string;
  quantity: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
}

interface GHNShippingFeeRequest {
  from_district_id: number;
  to_district_id: number;
  to_ward_code: string;
  weight: number;
  service_type_id: number;
  insurance_value?: number;
}

interface GHNCreateOrderRequest {
  payment_type_id: number; // 1: Người gửi trả phí, 2: Người nhận trả phí
  note?: string;
  required_note: string; // CHOTHUHANG, CHOXEMHANGKHONGTHU, KHONGCHOXEMHANG
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  service_type_id: number;
  items: GHNItem[];
  insurance_value?: number;
}

interface GHNOrderResponse {
  code: number;
  message: string;
  data: {
    order_code: string;
    sort_code: string;
    trans_type: string;
    ward_encode: string;
    district_encode: string;
    fee: {
      main_service: number;
      insurance: number;
      cod_fee: number;
      station_do: number;
      station_pu: number;
      return: number;
      r2s: number;
      coupon: number;
      total: number;
    };
    total_fee: number;
    expected_delivery_time: string;
  };
}

interface GHNTrackingResponse {
  code: number;
  message: string;
  data: {
    order_code: string;
    status: string;
    status_text: string;
    created_date: string;
    updated_date: string;
    log: Array<{
      status: string;
      updated_date: string;
      description: string;
    }>;
  };
}

class GHNService {
  private config: GHNConfig;

  constructor() {
    this.config = {
      apiUrl: process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api',
      token: process.env.GHN_TOKEN || '',
      shopId: process.env.GHN_SHOP_ID || '',
    };
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST', data?: any) {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Token': this.config.token,
    };

    if (this.config.shopId) {
      headers['ShopId'] = this.config.shopId;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`GHN API Error: ${result.message || 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      console.error('GHN API Request failed:', error);
      throw error;
    }
  }

  /**
   * Tính phí vận chuyển
   */
  async calculateShippingFee(request: GHNShippingFeeRequest) {
    return this.makeRequest('/v2/shipping-order/fee', 'POST', request);
  }

  /**
   * Tạo đơn hàng vận chuyển
   */
  async createShippingOrder(request: GHNCreateOrderRequest): Promise<GHNOrderResponse> {
    return this.makeRequest('/v2/shipping-order/create', 'POST', request);
  }

  /**
   * Tracking đơn hàng
   */
  async trackOrder(orderCode: string): Promise<GHNTrackingResponse> {
    return this.makeRequest('/v2/shipping-order/detail', 'POST', {
      order_code: orderCode,
    });
  }

  /**
   * Lấy danh sách tỉnh/thành phố
   */
  async getProvinces() {
    return this.makeRequest('/master-data/province', 'GET');
  }

  /**
   * Lấy danh sách quận/huyện theo tỉnh
   */
  async getDistricts(provinceId: number) {
    return this.makeRequest('/master-data/district', 'GET', {
      province_id: provinceId,
    });
  }

  /**
   * Lấy danh sách phường/xã theo quận
   */
  async getWards(districtId: number) {
    return this.makeRequest('/master-data/ward', 'GET', {
      district_id: districtId,
    });
  }

  /**
   * Lấy thông tin dịch vụ vận chuyển
   */
  async getServices(fromDistrict: number, toDistrict: number) {
    return this.makeRequest('/v2/shipping-order/available-services', 'POST', {
      shop_id: parseInt(this.config.shopId),
      from_district: fromDistrict,
      to_district: toDistrict,
    });
  }

  /**
   * Helper: Tính tổng trọng lượng từ sản phẩm
   */
  calculateTotalWeight(products: Array<{ quantity: number; weight?: number }>) {
    return products.reduce((total, product) => {
      const weight = product.weight || 500; // Default 500g nếu không có weight
      return total + (product.quantity * weight);
    }, 0);
  }

  /**
   * Helper: Format địa chỉ cho GHN
   */
  formatAddress(address: {
    line1: string;
    line2?: string;
    city: string;
    postal_code: string;
  }) {
    const parts = [address.line1];
    if (address.line2) parts.push(address.line2);
    parts.push(address.city);
    return parts.join(', ');
  }

  /**
   * Helper: Chuyển đổi trạng thái GHN sang trạng thái hệ thống
   */
  mapGHNStatusToSystem(ghnStatus: string): string {
    const statusMap: Record<string, string> = {
      'ready_to_pick': 'not_shipped',
      'picking': 'not_shipped', 
      'picked': 'in_transit',
      'storing': 'in_transit',
      'transporting': 'in_transit',
      'sorting': 'in_transit',
      'delivering': 'in_transit',
      'delivered': 'delivered',
      'delivery_fail': 'in_transit',
      'waiting_to_return': 'returning',
      'return': 'returning',
      'returned': 'returned',
      'exception': 'in_transit',
      'damage': 'in_transit',
      'lost': 'in_transit',
    };

    return statusMap[ghnStatus] || 'in_transit';
  }
}

export default new GHNService();
