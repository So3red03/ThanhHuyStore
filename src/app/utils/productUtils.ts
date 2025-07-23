import axios from 'axios';

export interface ProductInfo {
  id: string;
  name: string;
  thumbnail?: string;
  galleryImages?: string[];
  price?: number;
  productType: 'SIMPLE' | 'VARIANT';
  variants?: any[];
}

export interface VariantInfo {
  id: string;
  name: string;
  price: number;
  images?: string[];
  attributes?: any[];
  product: ProductInfo;
}

/**
 * Fetch product information by ID
 */
export const fetchProductInfo = async (productId: string): Promise<ProductInfo | null> => {
  try {
    // First try to fetch as simple product
    try {
      const response = await axios.get(`/api/product/simple/${productId}`);
      return response.data;
    } catch (error) {
      // If not found as simple, try as variant product
      const response = await axios.get(`/api/product/variant/${productId}`);
      return response.data;
    }
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
};

/**
 * Fetch variant information by ID
 */
export const fetchVariantInfo = async (variantId: string): Promise<VariantInfo | null> => {
  try {
    const response = await axios.get(`/api/product/variant/variants/${variantId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching variant ${variantId}:`, error);
    return null;
  }
};

/**
 * Get display name for product/variant
 */
export const getDisplayName = (product: ProductInfo, variant?: VariantInfo): string => {
  if (variant) {
    return `${product.name} - ${variant.name}`;
  }
  return product.name;
};

/**
 * Get display price for product/variant
 */
export const getDisplayPrice = (product: ProductInfo, variant?: VariantInfo): number => {
  if (variant) {
    return variant.price;
  }
  return product.price || 0;
};

/**
 * Get display image for product/variant
 */
export const getDisplayImage = (product: ProductInfo, variant?: VariantInfo): string => {
  if (variant && variant.images && variant.images.length > 0) {
    return variant.images[0];
  }
  
  if (product.thumbnail) {
    return product.thumbnail;
  }
  
  if (product.galleryImages && product.galleryImages.length > 0) {
    return product.galleryImages[0];
  }
  
  return '/images/placeholder.jpg'; // Fallback image
};

/**
 * Format variant attributes for display
 */
export const formatVariantAttributes = (variant?: VariantInfo): string => {
  if (!variant || !variant.attributes) {
    return '';
  }
  
  return variant.attributes
    .map((attr: any) => `${attr.name}: ${attr.value}`)
    .join(', ');
};
