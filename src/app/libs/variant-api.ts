/**
 * Variant API Client Library
 *
 * Provides type-safe client functions for variant system API endpoints
 */

import axios from 'axios';

// Types
export interface VariantProduct {
  id: string;
  name: string;
  description: string;
  brand: string;
  productType: 'VARIANT';
  price?: number;
  categoryId: string;
  images: string[];
  productAttributes: ProductAttribute[];
  variants: ProductVariant[];
  category?: {
    id: string;
    name: string;
  };
  _count?: {
    variants: number;
    reviews: number;
  };
}

export interface ProductAttribute {
  id: string;
  productId: string;
  name: string;
  label: string;
  type: 'COLOR' | 'SELECT' | 'TEXT' | 'NUMBER';
  displayType: 'BUTTON' | 'DROPDOWN' | 'COLOR_SWATCH' | 'TEXT_INPUT' | 'RADIO' | 'CHECKBOX';
  isRequired: boolean;
  isVariation: boolean;
  position: number;
  description?: string;
  values: AttributeValue[];
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  label: string;
  description?: string;
  colorCode?: string;
  imageUrl?: string;
  priceAdjustment: number;
  position: number;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  thumbnail?: string | null; // Ảnh đại diện variant
  galleryImages?: string[]; // Mảng URL ảnh gallery variant
  images?: string[]; // Backward compatibility
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantProductData {
  name: string;
  description: string;
  brand?: string;
  price?: number;
  categoryId: string;
  images?: string[];
  attributes: CreateAttributeData[];
  variants?: CreateVariantData[];
}

export interface CreateAttributeData {
  name: string;
  label: string;
  type: 'COLOR' | 'SELECT' | 'TEXT' | 'NUMBER';
  displayType?: 'BUTTON' | 'DROPDOWN' | 'COLOR_SWATCH' | 'TEXT_INPUT' | 'RADIO' | 'CHECKBOX';
  isRequired?: boolean;
  isVariation?: boolean;
  description?: string;
  values: CreateAttributeValueData[];
}

export interface CreateAttributeValueData {
  value: string;
  label: string;
  description?: string;
  colorCode?: string;
  imageUrl?: string;
  priceAdjustment?: number;
}

export interface CreateVariantData {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock?: number;
  images?: string[];
}

export interface BulkVariantAction {
  action: 'updatePrices' | 'updateStock' | 'toggleActive' | 'delete';
  variantIds: string[];
  data?: {
    priceAdjustment?: number;
    newPrice?: number;
    stockAdjustment?: number;
    newStock?: number;
    isActive?: boolean;
  };
}

// API Client Class
export class VariantAPI {
  private baseURL: string;

  constructor(baseURL: string = '/api/product/variant') {
    this.baseURL = baseURL;
  }

  // Product endpoints
  async getVariantProducts(params?: { page?: number; limit?: number; search?: string; categoryId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);

    const response = await axios.get(`${this.baseURL}?${searchParams}`);
    return response.data;
  }

  async getVariantProduct(id: string): Promise<VariantProduct> {
    const response = await axios.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async createVariantProduct(data: CreateVariantProductData) {
    const response = await axios.post(`${this.baseURL}`, data);
    return response.data;
  }

  async updateVariantProduct(id: string, data: Partial<CreateVariantProductData>) {
    const response = await axios.put(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  async deleteVariantProduct(id: string) {
    const response = await axios.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Attribute endpoints
  async getProductAttributes(productId: string): Promise<ProductAttribute[]> {
    const response = await axios.get(`${this.baseURL}/${productId}/attributes`);
    return response.data;
  }

  async createProductAttribute(productId: string, data: CreateAttributeData) {
    const response = await axios.post(`${this.baseURL}/${productId}/attributes`, data);
    return response.data;
  }

  async updateAttribute(attributeId: string, data: Partial<CreateAttributeData>) {
    const response = await axios.put(`/api/product/variant/attributes/${attributeId}`, data);
    return response.data;
  }

  async deleteAttribute(attributeId: string) {
    const response = await axios.delete(`/api/product/variant/attributes/${attributeId}`);
    return response.data;
  }

  async reorderAttributes(productId: string, attributeIds: string[]) {
    const response = await axios.put(`${this.baseURL}/${productId}/attributes`, {
      attributeIds
    });
    return response.data;
  }

  // Variant endpoints
  async getProductVariants(productId: string, includeInactive = false): Promise<ProductVariant[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    const response = await axios.get(`${this.baseURL}/${productId}/variants${params}`);
    return response.data;
  }

  async createVariants(productId: string, variants: CreateVariantData[]) {
    const response = await axios.post(`${this.baseURL}/${productId}/variants`, {
      variants
    });
    return response.data;
  }

  async getVariant(variantId: string): Promise<ProductVariant> {
    const response = await axios.get(`${this.baseURL}/variants/${variantId}`);
    return response.data;
  }

  async updateVariant(variantId: string, data: Partial<CreateVariantData>) {
    const response = await axios.put(`${this.baseURL}/variants/${variantId}`, data);
    return response.data;
  }

  async deleteVariant(variantId: string) {
    const response = await axios.delete(`${this.baseURL}/variants/${variantId}`);
    return response.data;
  }

  async bulkUpdateVariants(productId: string, action: BulkVariantAction) {
    const response = await axios.put(`${this.baseURL}/${productId}/variants`, action);
    return response.data;
  }

  // Generation endpoints
  async generateVariants(productId: string, basePrice: number = 0, skuPrefix?: string) {
    const response = await axios.post(`/api/product/variant/generate`, {
      productId,
      basePrice,
      skuPrefix
    });
    return response.data;
  }

  async previewVariants(productId: string, basePrice: number = 0) {
    const params = new URLSearchParams();
    params.set('productId', productId);
    if (basePrice) params.set('basePrice', basePrice.toString());

    const response = await axios.get(`/api/product/variant/generate?${params}`);
    return response.data;
  }
}

// Default instance
export const variantAPI = new VariantAPI();

// Helper functions
export const formatPrice = (price: number): string => {
  return `${price.toLocaleString()}đ`;
};

export const formatVariantAttributes = (attributes: Record<string, string>): string => {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};

export const calculateVariantPrice = (basePrice: number, attributeValues: AttributeValue[]): number => {
  return attributeValues.reduce((total, value) => total + (value.priceAdjustment || 0), basePrice);
};

export const generateSKU = (prefix: string, attributes: Record<string, string>): string => {
  const parts = [prefix];
  Object.values(attributes).forEach(value => {
    parts.push(value.toUpperCase());
  });
  return parts.filter(Boolean).join('-');
};
