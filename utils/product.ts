/**
 * Utility functions for product-related operations
 */

/**
 * Get the first available image from a product (supports both Simple and Variant products)
 * @param product - Product object (Simple or Variant)
 * @returns string - Image URL or fallback image
 */
export const getDefaultImage = (product: any): string => {
  // Handle Simple products - use new thumbnail + galleryImages structure
  if (product.productType === 'SIMPLE') {
    if (product.thumbnail) {
      return product.thumbnail;
    } else if (product.galleryImages && product.galleryImages.length > 0) {
      return product.galleryImages[0];
    }
  }

  // Handle Variant products - get image from first variant with images
  else if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
    const variantWithImage = product.variants.find((variant: any) => {
      return variant.thumbnail || variant.image || (variant.galleryImages && variant.galleryImages.length > 0);
    });

    if (variantWithImage) {
      if (variantWithImage.thumbnail) {
        return variantWithImage.thumbnail;
      } else if (variantWithImage.image) {
        return variantWithImage.image;
      } else if (variantWithImage.galleryImages && variantWithImage.galleryImages.length > 0) {
        return variantWithImage.galleryImages[0];
      }
    }
  }

  // Fallback image
  return '/noavatar.png';
};
