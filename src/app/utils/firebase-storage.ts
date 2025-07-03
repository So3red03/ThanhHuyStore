import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebase from '@/app/libs/firebase';

const storage = getStorage(firebase);

export interface UploadProgress {
  progress: number;
  isComplete: boolean;
  downloadURL?: string;
  error?: string;
}

/**
 * Upload multiple images to Firebase Storage for product variants
 * @param files - Array of image files to upload
 * @param productId - Product ID for organizing files
 * @param variantId - Variant ID for organizing files
 * @param onProgress - Callback for upload progress
 * @returns Promise<string[]> - Array of download URLs
 */
export const uploadVariantImages = async (
  files: File[],
  productId: string,
  variantId: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    return new Promise<string>((resolve, reject) => {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `products/${productId}/variants/${variantId}/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress callback
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(index, {
            progress,
            isComplete: false
          });
        },
        (error) => {
          // Error callback
          console.error(`Error uploading file ${file.name}:`, error);
          onProgress?.(index, {
            progress: 0,
            isComplete: true,
            error: error.message
          });
          reject(error);
        },
        async () => {
          // Success callback
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.(index, {
              progress: 100,
              isComplete: true,
              downloadURL
            });
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  });

  return Promise.all(uploadPromises);
};

/**
 * Upload single image to Firebase Storage
 * @param file - Image file to upload
 * @param productId - Product ID for organizing files
 * @param variantId - Variant ID for organizing files
 * @param onProgress - Callback for upload progress
 * @returns Promise<string> - Download URL
 */
export const uploadSingleVariantImage = async (
  file: File,
  productId: string,
  variantId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const urls = await uploadVariantImages([file], productId, variantId, (_, progress) => {
    onProgress?.(progress);
  });
  return urls[0];
};

/**
 * Delete image from Firebase Storage
 * @param imageUrl - Full URL of the image to delete
 * @returns Promise<void>
 */
export const deleteVariantImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the full URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid image URL format');
    }
    
    const imagePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, imagePath);
    
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Firebase Storage
 * @param imageUrls - Array of image URLs to delete
 * @returns Promise<void>
 */
export const deleteVariantImages = async (imageUrls: string[]): Promise<void> => {
  const deletePromises = imageUrls.map(url => deleteVariantImage(url));
  await Promise.all(deletePromises);
};

/**
 * Validate image file before upload
 * @param file - File to validate
 * @param maxSizeInMB - Maximum file size in MB (default: 5MB)
 * @returns boolean - True if valid
 */
export const validateImageFile = (file: File, maxSizeInMB: number = 5): boolean => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Loại file không được hỗ trợ: ${file.type}. Chỉ chấp nhận: JPG, PNG, GIF, WebP`);
  }

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    throw new Error(`File quá lớn: ${(file.size / 1024 / 1024).toFixed(2)}MB. Tối đa: ${maxSizeInMB}MB`);
  }

  return true;
};

/**
 * Validate multiple image files
 * @param files - Files to validate
 * @param maxSizeInMB - Maximum file size in MB per file
 * @param maxFiles - Maximum number of files allowed
 * @returns boolean - True if all valid
 */
export const validateImageFiles = (
  files: File[], 
  maxSizeInMB: number = 5, 
  maxFiles: number = 10
): boolean => {
  if (files.length > maxFiles) {
    throw new Error(`Quá nhiều file: ${files.length}. Tối đa: ${maxFiles} files`);
  }

  files.forEach((file, index) => {
    try {
      validateImageFile(file, maxSizeInMB);
    } catch (error) {
      throw new Error(`File ${index + 1}: ${error}`);
    }
  });

  return true;
};

/**
 * Get optimized image URL with size parameters
 * @param originalUrl - Original Firebase Storage URL
 * @param width - Desired width
 * @param height - Desired height
 * @returns string - Optimized URL (Note: Firebase doesn't support this natively, 
 *                   you might need to use a service like Cloudinary or implement 
 *                   Cloud Functions for image optimization)
 */
export const getOptimizedImageUrl = (
  originalUrl: string, 
  width?: number, 
  height?: number
): string => {
  // For now, return original URL
  // In production, you might want to integrate with image optimization services
  return originalUrl;
};

/**
 * Firebase Storage organization structure for variants:
 * 
 * products/
 * ├── {productId}/
 * │   ├── main/                    # Main product images
 * │   │   ├── thumbnail.jpg
 * │   │   ├── gallery_1.jpg
 * │   │   └── gallery_2.jpg
 * │   └── variants/
 * │       ├── {variantId_1}/       # Variant 1 images
 * │       │   ├── {timestamp}_image1.jpg
 * │       │   ├── {timestamp}_image2.jpg
 * │       │   └── {timestamp}_image3.jpg
 * │       └── {variantId_2}/       # Variant 2 images
 * │           ├── {timestamp}_image1.jpg
 * │           └── {timestamp}_image2.jpg
 * 
 * Benefits:
 * - Easy to organize and find images
 * - Easy to delete all images for a product/variant
 * - Prevents naming conflicts with timestamps
 * - Scalable structure
 */
