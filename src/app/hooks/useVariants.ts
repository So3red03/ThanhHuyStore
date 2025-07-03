import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { uploadVariantImages, deleteVariantImages, validateImageFiles } from '@/app/utils/firebase-storage';

export interface VariantData {
  id?: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  attributes: Record<string, any>;
  images: string[];
}

export interface UseVariantsReturn {
  variants: any[];
  isLoading: boolean;
  error: string | null;
  fetchVariants: (productId: string) => Promise<void>;
  createVariant: (data: VariantData, imageFiles?: File[]) => Promise<any>;
  updateVariant: (data: VariantData, imageFiles?: File[]) => Promise<any>;
  deleteVariant: (id: string) => Promise<void>;
  uploadProgress: { [key: string]: number };
}

export const useVariants = (): UseVariantsReturn => {
  const [variants, setVariants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const fetchVariants = useCallback(async (productId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/products/variants?productId=${productId}`);
      setVariants(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Lỗi khi tải danh sách biến thể';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createVariant = useCallback(async (data: VariantData, imageFiles?: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      let imageUrls: string[] = [];

      // Upload images if provided
      if (imageFiles && imageFiles.length > 0) {
        // Validate files first
        validateImageFiles(imageFiles, 5, 10);

        // Generate temporary variant ID for file organization
        const tempVariantId = `temp-${Date.now()}`;

        // Upload images with progress tracking
        imageUrls = await uploadVariantImages(imageFiles, data.productId, tempVariantId, (fileIndex, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [`file-${fileIndex}`]: progress.progress
          }));
        });

        toast.success(`Đã tải lên ${imageUrls.length} hình ảnh thành công!`);
      }

      // Create variant with image URLs
      const variantData = {
        ...data,
        images: imageUrls
      };

      const response = await axios.post('/api/products/variants', variantData);

      // Update variants list
      setVariants(prev => [response.data, ...prev]);

      toast.success('Tạo biến thể thành công!');

      // Clear upload progress
      setUploadProgress({});

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Lỗi khi tạo biến thể';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateVariant = useCallback(async (data: VariantData, imageFiles?: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      let imageUrls = data.images || [];

      // Upload new images if provided
      if (imageFiles && imageFiles.length > 0) {
        // Validate files first
        validateImageFiles(imageFiles, 5, 10);

        // Upload new images
        const newImageUrls = await uploadVariantImages(imageFiles, data.productId, data.id!, (fileIndex, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [`file-${fileIndex}`]: progress.progress
          }));
        });

        // Combine existing and new images
        imageUrls = [...imageUrls, ...newImageUrls];

        toast.success(`Đã tải lên ${newImageUrls.length} hình ảnh mới!`);
      }

      // Update variant with image URLs
      const variantData = {
        ...data,
        images: imageUrls
      };

      const response = await axios.put('/api/products/variants', variantData);

      // Update variants list
      setVariants(prev => prev.map(variant => (variant.id === data.id ? response.data : variant)));

      toast.success('Cập nhật biến thể thành công!');

      // Clear upload progress
      setUploadProgress({});

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Lỗi khi cập nhật biến thể';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteVariant = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Find variant to get image URLs for deletion
        const variant = variants.find(v => v.id === id);

        // Delete from database first
        await axios.delete(`/api/products/variants?id=${id}`);

        // Delete images from Firebase Storage
        if (variant?.images && variant.images.length > 0) {
          try {
            // Extract image URLs from the schema format
            const imageUrls: string[] = [];
            variant.images.forEach((imgGroup: any) => {
              if (imgGroup.images && Array.isArray(imgGroup.images)) {
                imageUrls.push(...imgGroup.images);
              }
            });
            if (imageUrls.length > 0) {
              await deleteVariantImages(imageUrls);
            }
          } catch (imageError) {
            console.error('Error deleting images:', imageError);
            // Don't fail the whole operation if image deletion fails
          }
        }

        // Update variants list
        setVariants(prev => prev.filter(variant => variant.id !== id));

        toast.success('Xóa biến thể thành công!');
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Lỗi khi xóa biến thể';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [variants]
  );

  return {
    variants,
    isLoading,
    error,
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    uploadProgress
  };
};
