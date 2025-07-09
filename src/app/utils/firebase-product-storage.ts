import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import firebase from '../libs/firebase';

const storage = getStorage(firebase);

// Types
export interface ProductImageUpload {
  file: File;
  filename?: string; // Optional custom filename
}

export interface VariantImageUpload {
  color: string;
  storage?: string;
  ram?: string;
  images: ProductImageUpload[];
}

export interface ProductImageResult {
  filename: string;
  path: string;
  downloadURL: string;
}

export interface VariantImageResult {
  color: string;
  storage?: string;
  ram?: string;
  images: ProductImageResult[];
}

// Utility functions
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

export const generateVariantFolder = (color: string, storage?: string, ram?: string): string => {
  const parts = [color];
  if (storage) parts.push(storage);
  if (ram) parts.push(ram);
  return parts.join('-').toLowerCase();
};

// New function for attribute-based folder structure
export const generateVariantAttributeFolder = (variantData: VariantImageUpload): string => {
  const attributes: string[] = [];

  if (variantData.color) {
    attributes.push(`color-${variantData.color.toLowerCase().replace(/\s+/g, '-')}`);
  }
  if (variantData.storage) {
    attributes.push(`storage-${variantData.storage.toLowerCase().replace(/\s+/g, '-')}`);
  }
  if (variantData.ram) {
    attributes.push(`ram-${variantData.ram.toLowerCase().replace(/\s+/g, '-')}`);
  }

  // If no attributes, use default
  if (attributes.length === 0) {
    return 'default-variant';
  }

  return attributes.join('_');
};

export const generateUniqueFilename = (originalFilename?: string): string => {
  // Handle undefined or empty filename
  if (!originalFilename || typeof originalFilename !== 'string') {
    const uniqueId = uuidv4().substring(0, 8);
    return `image-${uniqueId}.jpg`; // Default fallback
  }

  const extension = originalFilename.split('.').pop() || 'jpg';
  const nameWithoutExt = originalFilename.replace(`.${extension}`, '');
  const uniqueId = uuidv4().substring(0, 8);
  return `${nameWithoutExt}-${uniqueId}.${extension}`;
};

// Validation
export const validateImageFiles = (files: File[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxFiles = 10;

  if (files.length > maxFiles) {
    errors.push(`Tối đa ${maxFiles} hình ảnh cho mỗi biến thể`);
  }

  files.forEach((file, index) => {
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File ${index + 1}: Định dạng không được hỗ trợ (${file.type})`);
    }
    if (file.size > maxSize) {
      errors.push(`File ${index + 1}: Kích thước quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Upload functions
export const uploadProductImages = async (
  productName: string,
  images: ProductImageUpload[],
  onProgress?: (progress: number) => void
): Promise<ProductImageResult[]> => {
  const slug = generateSlug(productName);
  // Clear folder structure: simple-products/product-name/
  const basePath = `simple-products/${slug}`;

  const results: ProductImageResult[] = [];

  for (let i = 0; i < images.length; i++) {
    const { file, filename } = images[i];
    const finalFilename = filename || generateUniqueFilename(file?.name);
    const imagePath = `${basePath}/${finalFilename}`;
    const imageRef = ref(storage, imagePath);

    try {
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      results.push({
        filename: finalFilename,
        path: imagePath,
        downloadURL
      });

      // Update progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / images.length) * 100));
      }
    } catch (error) {
      console.error(`Error uploading ${finalFilename}:`, error);
      throw new Error(`Failed to upload ${finalFilename}. Firebase upload failed.`);
    }
  }

  return results;
};

export const uploadVariantImages = async (
  productName: string,
  variantData: VariantImageUpload,
  onProgress?: (progress: number) => void
): Promise<VariantImageResult> => {
  const slug = generateSlug(productName);

  // New folder structure: variant-products/product-name/attribute-folders/
  const basePath = `variant-products/${slug}`;

  const results: ProductImageResult[] = [];

  for (let i = 0; i < variantData.images.length; i++) {
    const { file, filename } = variantData.images[i];
    const finalFilename = filename || generateUniqueFilename(file?.name);

    // Create attribute-based folder path
    const attributeFolder = generateVariantAttributeFolder(variantData);
    const imagePath = `${basePath}/${attributeFolder}/${finalFilename}`;
    const imageRef = ref(storage, imagePath);

    try {
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      results.push({
        filename: finalFilename,
        path: imagePath,
        downloadURL
      });

      // Update progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / variantData.images.length) * 100));
      }
    } catch (error) {
      console.error(`Error uploading ${finalFilename}:`, error);
      throw new Error(`Failed to upload ${finalFilename}. Firebase upload failed.`);
    }
  }

  return {
    color: variantData.color,
    storage: variantData.storage,
    ram: variantData.ram,
    images: results
  };
};

// Upload multiple variants
export const uploadMultipleVariants = async (
  productName: string,
  variants: VariantImageUpload[],
  onProgress?: (variantIndex: number, imageProgress: number) => void
): Promise<VariantImageResult[]> => {
  const results: VariantImageResult[] = [];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];

    const variantResult = await uploadVariantImages(productName, variant, (progress: number) => {
      if (onProgress) {
        onProgress(i, progress);
      }
    });

    results.push(variantResult);
  }

  return results;
};

// Delete functions
export const deleteProductImages = async (imagePaths: string[]): Promise<void> => {
  const deletePromises = imagePaths.map(async path => {
    try {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
      console.log(`Deleted: ${path}`);
    } catch (error) {
      console.error(`Error deleting ${path}:`, error);
      // Don't throw error for individual file deletion failures
    }
  });

  await Promise.all(deletePromises);
};

export const deleteVariantImages = async (
  productName: string,
  color: string,
  storageSize?: string,
  ram?: string
): Promise<void> => {
  const slug = generateSlug(productName);
  const variantFolder = generateVariantFolder(color, storageSize, ram);
  const variantPath = `productImages/${slug}/${variantFolder}`;

  try {
    const variantRef = ref(storage, variantPath);
    const listResult = await listAll(variantRef);

    const deletePromises = listResult.items.map(async itemRef => {
      try {
        await deleteObject(itemRef);
        console.log(`Deleted: ${itemRef.fullPath}`);
      } catch (error) {
        console.error(`Error deleting ${itemRef.fullPath}:`, error);
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error(`Error deleting variant folder ${variantPath}:`, error);
  }
};

export const deleteAllProductImages = async (productName: string): Promise<void> => {
  const slug = generateSlug(productName);
  const productPath = `productImages/${slug}`;

  try {
    const productRef = ref(storage, productPath);
    const listResult = await listAll(productRef);

    // Delete all files in root product folder
    const fileDeletePromises = listResult.items.map(async itemRef => {
      try {
        await deleteObject(itemRef);
        console.log(`Deleted: ${itemRef.fullPath}`);
      } catch (error) {
        console.error(`Error deleting ${itemRef.fullPath}:`, error);
      }
    });

    // Delete all variant folders
    const folderDeletePromises = listResult.prefixes.map(async folderRef => {
      const folderListResult = await listAll(folderRef);
      const folderFileDeletePromises = folderListResult.items.map(async itemRef => {
        try {
          await deleteObject(itemRef);
          console.log(`Deleted: ${itemRef.fullPath}`);
        } catch (error) {
          console.error(`Error deleting ${itemRef.fullPath}:`, error);
        }
      });
      await Promise.all(folderFileDeletePromises);
    });

    await Promise.all([...fileDeletePromises, ...folderDeletePromises]);
  } catch (error) {
    console.error(`Error deleting product folder ${productPath}:`, error);
  }
};
