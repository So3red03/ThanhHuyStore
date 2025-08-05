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
  thumbnail?: string; // New thumbnail field
  galleryImages?: string[]; // New gallery images field
  images?: string[]; // Backward compatibility
  attributes?: any[] | Record<string, string>; // Support both array and object formats
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
  // Priority 1: Variant images (new structure)
  if (variant) {
    // Check variant thumbnail first
    if (variant.thumbnail) {
      return variant.thumbnail;
    }
    // Check variant gallery images
    if (variant.galleryImages && variant.galleryImages.length > 0) {
      return variant.galleryImages[0];
    }
    // Backward compatibility: check old images field
    if (variant.images && variant.images.length > 0) {
      return variant.images[0];
    }
  }

  // Priority 2: Product-level images
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

  // Handle both array format (old) and object format (new)
  if (Array.isArray(variant.attributes)) {
    // Old format: [{name: "color", value: "silver"}, ...]
    return variant.attributes.map((attr: any) => `${attr.name}: ${attr.value}`).join(', ');
  } else if (typeof variant.attributes === 'object') {
    // New format: {"color": "silver", "storage": "512gb"}
    return Object.entries(variant.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  return '';
};
