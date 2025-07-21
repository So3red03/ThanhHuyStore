'use client';
import { useState, useEffect, useCallback } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Editor } from 'primereact/editor';
import axios from 'axios';

import {
  uploadSimpleProductThumbnail,
  uploadSimpleProductGallery,
  uploadVariantProductThumbnail,
  uploadVariantProductGallery
} from '@/app/utils/firebase-product-storage';
import { triggerNewProductEmail } from '@/app/utils/autoEmailMarketing';
import * as SlIcons from 'react-icons/sl';
import * as AiIcons from 'react-icons/ai';
import * as TbIcons from 'react-icons/tb';
import * as MdIcons from 'react-icons/md';

// Import MUI components for new design
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button as MuiButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Card,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import { MdClose, MdSave } from 'react-icons/md';

// Import variant system components
import { ProductType } from '@/app/components/admin/product-variant';
import DynamicAttributeManager, {
  ProductAttribute,
  VariationCombination
} from '@/app/components/admin/product-variant/DynamicAttributeManager';
import ExpandableVariant from '@/app/components/admin/product-variant/ExpandableVariant';
import ThumbnailGalleryUpload from '@/app/components/inputs/ThumbnailGalleryUpload';

export type ImageType = {
  image: File[] | null;
};

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  subCategories?: any[];
  parentCategories?: any[];
  initialData?: any;
  onSuccess?: () => void;
  mode?: 'add' | 'edit';
}

// Custom TabPanel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  subCategories: propSubCategories = [],
  parentCategories: propParentCategories = [],
  initialData = null,
  onSuccess,
  mode = 'add'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState<ImageType[]>([]);
  const [productType, setProductType] = useState<ProductType>(ProductType.SIMPLE);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  // New image states
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  // Existing images for edit mode
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);
  const [parentCategories, setParentCategories] = useState<any[]>(propParentCategories);
  const [subCategories, setSubCategories] = useState<any[]>(propSubCategories);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');
  const [filteredSubCategories, setFilteredSubCategories] = useState<any[]>([]);

  // Icons object for categories
  const Icons = { ...SlIcons, ...AiIcons, ...MdIcons, ...TbIcons };
  const [tabValue, setTabValue] = useState(0);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [variations, setVariations] = useState<VariationCombination[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.categoryId || '',
      price: initialData?.price || '',
      inStock: initialData?.inStock || '',
      images: null
    }
  });

  const setCustomValue = useCallback(
    (id: string, value: any) => {
      setValue(id, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    },
    [setValue]
  );

  // Initialize categories from props or fetch from API as fallback
  useEffect(() => {
    if (propParentCategories && propParentCategories.length > 0) {
      setParentCategories(propParentCategories);
    }
    if (propSubCategories && propSubCategories.length > 0) {
      setSubCategories(propSubCategories);
    }

    // Fallback: fetch from API if props are empty
    if (
      (!propParentCategories || propParentCategories.length === 0) &&
      (!propSubCategories || propSubCategories.length === 0) &&
      isOpen
    ) {
      const fetchCategories = async () => {
        try {
          const response = await axios.get('/api/category');
          const allCategories = response.data;

          // Tách parent và sub categories
          const parents = allCategories.filter((cat: any) => !cat.parentId);
          const subs = allCategories.filter((cat: any) => cat.parentId);

          setParentCategories(parents);
          setSubCategories(subs);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
      fetchCategories();
    }
  }, [propParentCategories, propSubCategories, isOpen]);

  // Initialize form with initialData
  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Reset all states first
      setUploadProgress(0);
      setIsUploading(false);
      setThumbnail(null);
      setGalleryImages([]);
      setExistingThumbnail(null);
      setExistingGalleryImages([]);
      setExistingImages([]);
      setImages([]);

      // Set form values
      setValue('name', initialData.name);
      setValue('description', initialData.description);
      setValue('price', initialData.price);
      setValue('inStock', initialData.inStock);
      setValue('categoryId', initialData.categoryId);

      // Set description text for Editor
      setText(initialData.description || '');

      // Set product type
      setProductType(initialData.productType || ProductType.SIMPLE);

      // Find parent category from subcategory
      const subCategory = subCategories.find((sub: any) => sub.id === initialData.categoryId);
      const parentCategoryId = subCategory?.parentId || '';

      // Set parent and subcategory
      setSelectedParentId(parentCategoryId);
      setSelectedSubCategoryId(initialData.categoryId || '');
      setValue('parentCategories', parentCategoryId);

      // Set existing images for edit mode - prioritize new structure
      // NEW STRUCTURE: thumbnail + galleryImages (preferred)
      if (initialData.thumbnail || (initialData.galleryImages && initialData.galleryImages.length > 0)) {
        ('📸 Using NEW structure (thumbnail + galleryImages)');
        if (initialData.thumbnail) {
          setExistingThumbnail(initialData.thumbnail);
        }

        if (initialData.galleryImages && initialData.galleryImages.length > 0) {
          setExistingGalleryImages(initialData.galleryImages);
        }
      }
      // OLD STRUCTURE: images (fallback for backward compatibility)
      else if (initialData.images && initialData.images.length > 0) {
        ('📸 Using OLD structure (images) as fallback');
        setExistingImages(initialData.images);
      }

      // Load variants and attributes for variant products
      if (initialData.productType === 'VARIANT') {
        // Load variants
        if (initialData.variants && initialData.variants.length > 0) {
          const loadedVariations = initialData.variants.map((variant: any) => {
            return {
              id: variant.id, // Keep original ID for display
              databaseId: variant.id, // Real database ObjectID for API calls
              name: variant.name || `Variant ${variant.id}`,
              attributes: variant.attributes || {},
              price: variant.price || 0,
              stock: variant.stock || 0,
              sku: variant.sku || '',
              // Map thumbnail and galleryImages correctly
              thumbnail: variant.thumbnail || null,
              galleryImages: variant.galleryImages || [],
              // Keep images for backward compatibility
              images: variant.images || [],
              enabled: variant.isActive !== false,
              isActive: variant.isActive !== false
            };
          });
          setVariations(loadedVariations);
        }

        // Load product attributes
        if (initialData.productAttributes && initialData.productAttributes.length > 0) {
          const loadedAttributes = initialData.productAttributes.map((attr: any) => ({
            id: attr.id,
            name: attr.name,
            slug: attr.name.toLowerCase().replace(/\s+/g, '-'), // Proper slug generation
            label: attr.label || attr.name,
            type: attr.type || 'SELECT',
            isUsedForVariations: attr.isVariation !== false, // Add this required field
            values: (attr.values || []).map((val: any) => ({
              id: val.id,
              value: val.value,
              label: val.label || val.value,
              position: val.position || 0
            }))
          }));
          setAttributes(loadedAttributes);
        }
      }
    }
  }, [initialData, mode, setValue, subCategories]);

  // Filter subcategories based on selected parent
  useEffect(() => {
    if (selectedParentId) {
      const filtered = subCategories.filter((subCat: any) => subCat.parentId === selectedParentId);
      setFilteredSubCategories(filtered);
      // Reset subcategory selection when parent changes (only for add mode)
      if (mode === 'add') {
        setSelectedSubCategoryId('');
      }
    } else {
      setFilteredSubCategories([]);
      if (mode === 'add') {
        setSelectedSubCategoryId('');
      }
    }
  }, [selectedParentId, subCategories, mode]);

  // Initialize filtered subcategories on mount for edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData && subCategories.length > 0) {
      const subCategory = subCategories.find((sub: any) => sub.id === initialData.categoryId);
      if (subCategory && subCategory.parentId) {
        const filtered = subCategories.filter((subCat: any) => subCat.parentId === subCategory.parentId);
        setFilteredSubCategories(filtered);
      }
    }
  }, [mode, initialData, subCategories]);

  const handleProductTypeChange = (newType: ProductType) => {
    setProductType(newType);
    setTabValue(0); // Reset to first tab when changing product type
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);
    try {
      // Prepare submit data
      const submitData: any = {
        name: data.name,
        description: data.description,
        categoryId: selectedSubCategoryId,
        productType: productType
      };

      // Handle image uploads
      if (mode === 'edit') {
        // For edit mode, handle both new uploads and existing images
        let finalThumbnail = existingThumbnail; // Start with existing
        let finalGalleryImages = [...existingGalleryImages]; // Start with existing

        // Upload new images if provided
        if (thumbnail || galleryImages.length > 0) {
          try {
            const uploadedImages = await uploadImagesToFirebase(data.name);
            if (uploadedImages.thumbnail) {
              finalThumbnail = uploadedImages.thumbnail;
            }
            if (uploadedImages.galleryImages.length > 0) {
              finalGalleryImages = [...finalGalleryImages, ...uploadedImages.galleryImages];
            }
          } catch (error) {
            console.error('Firebase upload failed during edit:', error);
            toast.error('Lỗi upload ảnh Firebase. Không thể cập nhật sản phẩm.');
            setIsLoading(false);
            return; // Stop execution if Firebase upload fails
          }
        }

        submitData.thumbnail = finalThumbnail;
        submitData.galleryImages = finalGalleryImages;
      } else {
        // For add mode, upload new images
        if (thumbnail || galleryImages.length > 0) {
          try {
            const uploadedImages = await uploadImagesToFirebase(data.name);
            submitData.thumbnail = uploadedImages.thumbnail;
            submitData.galleryImages = uploadedImages.galleryImages;
          } catch (error) {
            console.error('Firebase upload failed for simple product:', error);
            toast.error('Lỗi upload ảnh Firebase. Không thể tạo sản phẩm.');
            setIsLoading(false);
            return; // Stop execution if Firebase upload fails
          }
        } else {
          submitData.thumbnail = null;
          submitData.galleryImages = [];
        }
      }

      // Validation: Check required fields
      if (!selectedSubCategoryId || selectedSubCategoryId.trim() === '') {
        toast.error('Vui lòng chọn danh mục con cho sản phẩm');
        setIsLoading(false);
        return;
      }

      // Name validation - required for both Simple and Variant products
      if (!data.name || data.name.trim() === '') {
        toast.error('Vui lòng nhập tên sản phẩm');
        setIsLoading(false);
        return;
      }

      // Different validation for Simple vs Variant products
      if (productType === ProductType.SIMPLE) {
        // Simple products need price, stock, and images
        if (!data.price || data.price.toString().trim() === '' || parseFloat(data.price) <= 0) {
          toast.error('Vui lòng nhập giá sản phẩm hợp lệ (> 0)');
          setIsLoading(false);
          return;
        }

        if (
          data.inStock === undefined ||
          data.inStock === null ||
          data.inStock.toString().trim() === '' ||
          parseInt(data.inStock) < 0
        ) {
          toast.error('Vui lòng nhập số lượng tồn kho hợp lệ (>= 0)');
          setIsLoading(false);
          return;
        }

        // For simple products, images are recommended but not required
        if (!thumbnail && galleryImages.length === 0 && mode === 'add') {
          const confirmWithoutImages = window.confirm(
            'Bạn chưa thêm hình ảnh cho sản phẩm. Bạn có muốn tiếp tục không?'
          );
          if (!confirmWithoutImages) {
            setIsLoading(false);
            return;
          }
        }
      } else if (productType === ProductType.VARIANT) {
        // Variant products only need basic info, price/stock/images will be set in variants
        if (variations.length === 0) {
          toast.error('Vui lòng tạo ít nhất một biến thể cho sản phẩm');
          setIsLoading(false);
          return;
        }

        // Check if all variations have required data
        const invalidVariations = variations.filter(v => {
          return (
            !v.price ||
            v.price <= 0 ||
            v.stock === undefined ||
            v.stock === null ||
            v.stock < 0 ||
            !v.attributes ||
            Object.keys(v.attributes).length === 0
          );
        });

        if (invalidVariations.length > 0) {
          toast.error('Vui lòng điền đầy đủ giá (> 0), số lượng (>= 0) và thuộc tính cho tất cả biến thể');
          setIsLoading(false);
          return;
        }

        // Check for duplicate SKUs
        const skus = variations.map((v, index) => v.sku || `VAR-${index + 1}`);
        const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index);
        if (duplicateSkus.length > 0) {
          toast.error(`SKU trùng lặp trong biến thể: ${duplicateSkus.join(', ')}`);
          setIsLoading(false);
          return;
        }
      }

      // Add product type specific data
      if (productType === ProductType.SIMPLE) {
        // Simple products include price, stock, and images in main product
        submitData.price = parseFloat(data.price);
        submitData.inStock = parseInt(data.inStock);
      } else if (productType === ProductType.VARIANT) {
        // For variant products, upload images to Firebase with proper folder structure
        try {
          const uploadedVariations = await uploadVariantImagesToFirebase(submitData.name, variations);

          // For variant products, main product doesn't have price/stock
          // Price will be calculated from variants on the server side
          submitData.variants = uploadedVariations;

          // Transform attributes to match backend expected format
          submitData.attributes = attributes.map((attr: any) => ({
            name: attr.name,
            label: attr.name, // Use name as label
            type: 'SELECT', // Default type
            displayType: 'BUTTON', // Default display type
            isRequired: true,
            isVariation: attr.isUsedForVariations ?? true,
            description: attr.description || '',
            values: attr.values.map((value: any) => ({
              value: value.value,
              label: value.label,
              description: value.description || '',
              colorCode: value.colorCode || null,
              imageUrl: value.imageUrl || null,
              priceAdjustment: parseFloat(value.priceAdjustment || '0')
            }))
          }));
        } catch (error) {
          console.error('Firebase upload failed for variant products:', error);
          toast.error('Lỗi upload ảnh Firebase. Không thể tạo sản phẩm biến thể.');
          setIsLoading(false);
          return; // Stop execution if Firebase upload fails
        }
      }

      if (mode === 'edit' && initialData?.id) {
        // Update product - use the correct API endpoint based on product type
        if (productType === ProductType.VARIANT) {
          await axios.put(`/api/product/variant/${initialData.id}`, submitData);
        } else {
          await axios.put(`/api/product/simple/${initialData.id}`, submitData);
        }
        toast.success('Sản phẩm đã được cập nhật thành công!');
      } else {
        // Create product - use the correct API endpoint based on product type
        let createdProductResponse;
        if (productType === ProductType.VARIANT) {
          createdProductResponse = await axios.post('/api/product/variant', submitData);
        } else {
          createdProductResponse = await axios.post('/api/product/simple', submitData);
        }

        toast.success('Sản phẩm đã được tạo thành công!');

        // Gửi email tự động nếu được cấu hình
        const productId =
          productType === ProductType.VARIANT
            ? createdProductResponse?.data?.product?.id // Variant API trả về result.product.id
            : createdProductResponse?.data?.id; // Simple API trả về product.id trực tiếp

        console.log('🔍 [AddProduct] Product created:', {
          productType,
          productId,
          productName: data.name,
          responseData: createdProductResponse?.data
        });

        if (productId) {
          console.log('🚀 [AddProduct] Triggering auto email for product:', productId);
          triggerNewProductEmail(productId, data.name);
        } else {
          console.warn('⚠️ [AddProduct] No product ID found, cannot send auto email');
        }
      }

      reset();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);

      // Display specific error message from API
      let errorMessage = mode === 'edit' ? 'Có lỗi xảy ra khi cập nhật sản phẩm' : 'Có lỗi xảy ra khi tạo sản phẩm';

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Validation function for images
  const validateImageFiles = (files: File[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Định dạng không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WEBP.`);
      }
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: Kích thước quá lớn. Tối đa 5MB.`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  // Upload images to Firebase using new structure
  const uploadImagesToFirebase = async (
    productName: string
  ): Promise<{ thumbnail: string | null; galleryImages: string[] }> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let thumbnailUrl: string | null = null;
      let galleryUrls: string[] = [];

      // Upload thumbnail if exists
      if (thumbnail) {
        thumbnailUrl = await uploadSimpleProductThumbnail(
          thumbnail,
          productName,
          progress => setUploadProgress(Math.min(progress.progress * 0.3, 30)) // 30% for thumbnail, max 30
        );
      }

      // Upload gallery images if exist
      if (galleryImages.length > 0) {
        galleryUrls = await uploadSimpleProductGallery(galleryImages, productName, (_, progress) => {
          const baseProgress = thumbnailUrl ? 30 : 0;
          const galleryProgress = (progress.progress / galleryImages.length) * (100 - baseProgress);
          setUploadProgress(Math.min(baseProgress + galleryProgress, 100)); // Ensure max 100%
        });
      }

      return { thumbnail: thumbnailUrl, galleryImages: galleryUrls };
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Lỗi khi tải lên hình ảnh');
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Generate variant folder name based on attributes
  const generateVariantFolderName = (attributes: Record<string, string>): string => {
    const attributeValues = Object.values(attributes).filter(Boolean);
    if (attributeValues.length === 0) {
      return `variant-${Date.now()}`;
    }
    return attributeValues.join('-').toLowerCase().replace(/\s+/g, '-');
  };

  // Upload variant images to Firebase with proper folder structure
  const uploadVariantImagesToFirebase = async (productName: string, variations: any[]): Promise<any[]> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedVariations = [];

      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];

        // Create variant folder name based on attributes
        const variantId = generateVariantFolderName(variation.attributes);
        let thumbnailUrl: string | null = null;
        let galleryUrls: string[] = [];

        // Check if variation has new thumbnail to upload
        if (variation.thumbnail instanceof File) {
          thumbnailUrl = await uploadVariantProductThumbnail(variation.thumbnail, productName, variantId, progress => {
            const overallProgress = (i / variations.length + progress.progress / 100 / variations.length) * 100;
            setUploadProgress(Math.min(Math.round(overallProgress), 100)); // Ensure max 100%
          });
        }

        // Check if variation has new gallery images to upload
        if (variation.galleryImages && Array.isArray(variation.galleryImages) && variation.galleryImages.length > 0) {
          const fileImages = variation.galleryImages.filter((img: any) => img instanceof File);
          if (fileImages.length > 0) {
            galleryUrls = await uploadVariantProductGallery(fileImages, productName, variantId, (_, progress) => {
              const baseProgress = (i / variations.length) * 100;
              const galleryProgress = (progress.progress / 100 / variations.length) * 0.7;
              setUploadProgress(Math.min(Math.round(baseProgress + galleryProgress), 100)); // Ensure max 100%
            });
          }
        }

        uploadedVariations.push({
          attributes: variation.attributes,
          price: variation.price,
          stock: variation.stock,
          sku: variation.sku || '',
          thumbnail: thumbnailUrl || variation.thumbnail || null,
          galleryImages: galleryUrls.length > 0 ? galleryUrls : variation.galleryImages || []
        });
      }

      return uploadedVariations;
    } catch (error) {
      console.error('Error uploading variant images:', error);
      toast.error('Có lỗi xảy ra khi tải lên hình ảnh biến thể. Không thể tạo sản phẩm.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Handlers for thumbnail and gallery changes
  const handleThumbnailChange = useCallback((file: File | null) => {
    setThumbnail(file);
  }, []);

  const handleGalleryChange = useCallback((files: File[]) => {
    setGalleryImages(files);
  }, []);

  // Handlers for existing image removal
  const handleExistingThumbnailRemove = useCallback(() => {
    setExistingThumbnail(null);
  }, []);

  const handleExistingGalleryImageRemove = useCallback((index: number) => {
    setExistingGalleryImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleExistingGalleryImagesReorder = useCallback((reorderedImages: string[]) => {
    setExistingGalleryImages(reorderedImages);
  }, []);

  const handleClose = async () => {
    reset();
    setThumbnail(null);
    setGalleryImages([]);
    setExistingThumbnail(null);
    setExistingGalleryImages([]);
    setExistingImages([]);
    setImages([]);
    setVariations([]);
    setAttributes([]);
    setSelectedParentId('');
    setSelectedSubCategoryId('');
    setUploadProgress(0);
    setIsUploading(false);
    setProductType(ProductType.SIMPLE);
    setText('');
    setTabValue(0);
    onClose();
  };

  // Reset component when modal opens/closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      // Reset all states when modal closes
      setUploadProgress(0);
      setIsUploading(false);
      setThumbnail(null);
      setGalleryImages([]);
      setExistingThumbnail(null);
      setExistingGalleryImages([]);
      setExistingImages([]);
      setImages([]);
      setText('');
      setTabValue(0);
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth='xl'
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '12px',
          maxHeight: '90vh',
          width: '90vw',
          maxWidth: '1300px'
        }
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle
          sx={{
            p: 3,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
            {mode === 'edit' ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#6b7280' }}>
            <MdClose size={24} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Product Type Selector - Enhanced */}
          <Box sx={{ p: 4, borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc', mt: 3 }}>
            <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
              Loại sản phẩm
            </Typography>
            <FormControl fullWidth>
              <Select
                value={productType}
                onChange={e => handleProductTypeChange(e.target.value as ProductType)}
                disabled={isLoading}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 2
                  },
                  '&:hover': {
                    borderColor: '#3b82f6'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                <MenuItem value={ProductType.SIMPLE} sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box
                      sx={{
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#dbeafe',
                        borderRadius: '8px',
                        p: 1,
                        minWidth: '48px',
                        justifyContent: 'center'
                      }}
                    >
                      📦
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#1f2937' }}>
                        Sản phẩm đơn giản
                      </Typography>
                      <Typography variant='body2' sx={{ color: '#6b7280', mt: 0.5 }}>
                        Sản phẩm không có biến thể như màu sắc, kích thước
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
                <MenuItem value={ProductType.VARIANT} sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box
                      sx={{
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#fef3c7',
                        borderRadius: '8px',
                        p: 1,
                        minWidth: '48px',
                        justifyContent: 'center'
                      }}
                    >
                      🎨
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#1f2937' }}>
                        Sản phẩm biến thể
                      </Typography>
                      <Typography variant='body2' sx={{ color: '#6b7280', mt: 0.5 }}>
                        Sản phẩm có nhiều lựa chọn: màu sắc, dung lượng, kích thước...
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Grid container sx={{ minHeight: '600px' }}>
            {/* Left Column - Product Information */}
            <Grid
              item
              xs={12}
              md={productType === ProductType.SIMPLE ? 6 : 12}
              sx={{ p: 3, borderRight: productType === ProductType.SIMPLE ? 'none' : 'none' }}
            >
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Thông tin sản phẩm
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Product Name - Required for both Simple and Variant products */}
                  <TextField
                    fullWidth
                    label='Tên sản phẩm *'
                    {...register('name', { required: 'Vui lòng nhập tên sản phẩm' })}
                    error={!!errors.name}
                    helperText={errors.name?.message as string}
                    disabled={isLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />

                  {/* Description */}
                  <Box>
                    <Typography variant='body2' sx={{ mb: 1, color: '#374151', fontWeight: 500 }}>
                      Mô tả sản phẩm
                    </Typography>
                    <Editor
                      value={text}
                      onTextChange={e => {
                        const newText = e.htmlValue || '';
                        setText(newText);
                        setValue('description', newText); // Sync with form state
                      }}
                      style={{ height: '200px' }}
                      className='bg-white border outline-none peer border-slate-300 rounded-md focus:border-slate-500'
                    />
                  </Box>
                </Box>
              </Card>

              {/* Organize Section - Always visible for both product types */}
              <Card sx={{ p: 3, mt: 3 }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Phân loại
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Parent Categories - Select with Icons */}
                  <FormControl fullWidth>
                    <InputLabel>Chọn danh mục sản phẩm</InputLabel>
                    <Select
                      value={selectedParentId}
                      onChange={e => {
                        const value = e.target.value;
                        setSelectedParentId(value);
                        setCustomValue('parentCategories', value);
                      }}
                      label='Chọn danh mục sản phẩm'
                      disabled={isLoading}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiSelect-select': {
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }
                      }}
                    >
                      {parentCategories.map((item: any) => {
                        const IconComponent = Icons[item.icon as keyof typeof Icons];
                        return (
                          <MenuItem key={item.id} value={item.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              {IconComponent && (
                                <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '18px', color: '#3b82f6' }}>
                                  <IconComponent size={18} />
                                </Box>
                              )}
                              <Typography>{item.name}</Typography>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>

                  {/* Sub Category */}
                  <FormControl fullWidth disabled={!selectedParentId} required>
                    <InputLabel>Danh mục con *</InputLabel>
                    <Select
                      value={selectedSubCategoryId}
                      onChange={e => {
                        const value = e.target.value;
                        setSelectedSubCategoryId(value);
                        setCustomValue('categoryId', value);
                      }}
                      label='Danh mục con *'
                      disabled={isLoading || !selectedParentId}
                      error={!!errors.categoryId || (!selectedSubCategoryId && !!selectedParentId)}
                      sx={{
                        borderRadius: '8px',
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-error': {
                            '& fieldset': {
                              borderColor: '#ef4444'
                            }
                          }
                        }
                      }}
                    >
                      {filteredSubCategories.length > 0 ? (
                        filteredSubCategories.map((category: any) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value=''>
                          {selectedParentId ? 'Không có danh mục con' : 'Vui lòng chọn danh mục chính trước'}
                        </MenuItem>
                      )}
                    </Select>
                    {(errors.categoryId || (!selectedSubCategoryId && selectedParentId)) && (
                      <Typography variant='caption' sx={{ color: '#ef4444', mt: 1 }}>
                        {(errors.categoryId?.message as string) || 'Vui lòng chọn danh mục con'}
                      </Typography>
                    )}
                    {!selectedParentId && (
                      <Typography variant='caption' sx={{ color: '#6b7280', mt: 1 }}>
                        Chọn danh mục chính trước để hiển thị danh mục con
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              </Card>
            </Grid>

            {/* Right Column - Product Image (Only for SIMPLE products) */}
            {productType === ProductType.SIMPLE && (
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
                  <ThumbnailGalleryUpload
                    thumbnail={thumbnail}
                    galleryImages={galleryImages}
                    onThumbnailChange={handleThumbnailChange}
                    onGalleryChange={handleGalleryChange}
                    disabled={isLoading || isUploading}
                    existingThumbnail={existingThumbnail}
                    existingGalleryImages={existingGalleryImages}
                    onExistingThumbnailRemove={handleExistingThumbnailRemove}
                    onExistingGalleryImageRemove={handleExistingGalleryImageRemove}
                    onExistingGalleryImagesReorder={handleExistingGalleryImagesReorder}
                  />

                  {/* Display existing images (for edit mode) */}
                  {mode === 'edit' && existingImages.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant='body2' sx={{ mb: 2, color: '#374151', fontWeight: 500 }}>
                        Hình ảnh hiện có ({existingImages.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {existingImages.map((imgGroup: any, groupIndex: number) =>
                          imgGroup.images?.map((imgUrl: string, imgIndex: number) => (
                            <Box
                              key={`existing-${groupIndex}-${imgIndex}`}
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #e5e7eb',
                                position: 'relative'
                              }}
                            >
                              <img
                                src={imgUrl}
                                alt={`Existing ${groupIndex + 1}-${imgIndex + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                              <IconButton
                                size='small'
                                onClick={() => {
                                  // Remove image from existing images
                                  setExistingImages(prev => {
                                    const newImages = [...prev];
                                    newImages[groupIndex].images = newImages[groupIndex].images.filter(
                                      (_: string, i: number) => i !== imgIndex
                                    );
                                    // Remove group if no images left
                                    return newImages.filter(group => group.images.length > 0);
                                  });
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.7)'
                                  }
                                }}
                              >
                                <MdClose size={16} />
                              </IconButton>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Display new uploaded images */}
                  {images.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant='body2' sx={{ mb: 2, color: '#374151', fontWeight: 500 }}>
                        Hình ảnh mới ({images.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {images.map((img, index) => (
                          <Box
                            key={`new-${index}`}
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid #e5e7eb',
                              position: 'relative'
                            }}
                          >
                            <img
                              src={img.image?.[0] ? URL.createObjectURL(img.image[0]) : ''}
                              alt={`New Upload ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            <IconButton
                              size='small'
                              onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0,0,0,0.7)'
                                }
                              }}
                            >
                              <MdClose size={16} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Card>
              </Grid>
            )}
          </Grid>

          {/* WordPress-style Product Data Tabs */}
          <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
              Dữ liệu sản phẩm
            </Typography>

            {/* Tabs Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#6b7280',
                    '&.Mui-selected': {
                      color: '#3b82f6'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#3b82f6'
                  }
                }}
              >
                <Tab label='Tổng quan' />
                {productType === ProductType.VARIANT && <Tab label='Thuộc tính' />}
                {productType === ProductType.VARIANT && <Tab label='Biến thể' />}
              </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={tabValue} index={0}>
              {productType === ProductType.SIMPLE ? (
                // General tab for Simple Product
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937', mb: 2 }}>
                    Thông tin chung
                  </Typography>

                  <TextField
                    fullWidth
                    label='Giá thường (VNĐ)'
                    type='number'
                    {...register('price', { required: 'Vui lòng nhập giá bán' })}
                    error={!!errors.price}
                    helperText={errors.price?.message as string}
                    disabled={isLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />

                  <TextField
                    fullWidth
                    label='Số lượng tồn kho'
                    type='number'
                    {...register('inStock', { required: 'Vui lòng nhập số lượng' })}
                    error={!!errors.inStock}
                    helperText={errors.inStock?.message as string}
                    disabled={isLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Box>
              ) : (
                // General tab for Variant Product
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937', mb: 2 }}>
                    Thông tin chung
                  </Typography>

                  <Box
                    sx={{
                      p: 3,
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      borderRadius: '8px'
                    }}
                  >
                    <Typography variant='h6' sx={{ color: '#0369a1', fontWeight: 600, mb: 1 }}>
                      📊 Sản phẩm biến thể
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#0369a1' }}>
                      • Giá và số lượng sẽ được thiết lập riêng cho từng biến thể
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#0369a1' }}>
                      • Chuyển sang tab &quot;Thuộc tính&quot; để tạo các thuộc tính sản phẩm
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#0369a1' }}>
                      • Sau đó chuyển sang tab &quot;Biến thể&quot; để thiết lập giá và số lượng
                    </Typography>
                  </Box>
                </Box>
              )}
            </TabPanel>

            {productType === ProductType.VARIANT && (
              <TabPanel value={tabValue} index={1}>
                <DynamicAttributeManager
                  attributes={attributes}
                  variations={variations}
                  onAttributesChange={setAttributes}
                  onVariationsChange={setVariations}
                />
              </TabPanel>
            )}

            {productType === ProductType.VARIANT && (
              <TabPanel value={tabValue} index={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                      Quản lý biến thể
                    </Typography>

                    {/* Essential Action Buttons Only */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <MuiButton
                        variant='outlined'
                        size='small'
                        onClick={() => {
                          // Regenerate variations from attributes
                          if (attributes.length > 0) {
                            const selectedAttrs = attributes.filter(attr => attr.values.length > 0);
                            if (selectedAttrs.length > 0) {
                              // Generate new variations
                              const combinations: any[] = [];
                              const generateCombinations = (
                                attrIndex: number,
                                currentCombination: Record<string, string>
                              ) => {
                                if (attrIndex === selectedAttrs.length) {
                                  const id = Object.values(currentCombination).join('-');
                                  combinations.push({
                                    id,
                                    attributes: { ...currentCombination },
                                    isActive: true,
                                    price: 0,
                                    stock: 0,
                                    sku: `SKU-${Object.values(currentCombination).join('-').toUpperCase()}`,
                                    images: []
                                  });
                                  return;
                                }
                                const currentAttr = selectedAttrs[attrIndex];
                                currentAttr.values.forEach(value => {
                                  generateCombinations(attrIndex + 1, {
                                    ...currentCombination,
                                    [currentAttr.slug]: value.value
                                  });
                                });
                              };
                              generateCombinations(0, {});
                              setVariations(combinations);
                              toast.success(`Đã tạo lại ${combinations.length} biến thể!`);
                            } else {
                              toast.error('Vui lòng tạo thuộc tính trước khi tạo biến thể');
                            }
                          } else {
                            toast.error('Vui lòng tạo thuộc tính trước khi tạo biến thể');
                          }
                        }}
                        sx={{
                          borderColor: '#3b82f6',
                          color: '#3b82f6',
                          '&:hover': { borderColor: '#2563eb', backgroundColor: '#eff6ff' }
                        }}
                      >
                        Tạo lại biến thể
                      </MuiButton>
                      <MuiButton
                        variant='contained'
                        size='small'
                        onClick={() => {
                          // Add a new manual variant
                          const newVariant = {
                            id: `manual-${Date.now()}`,
                            attributes: { manual: 'Biến thể thủ công' },
                            isActive: true,
                            price: 0,
                            stock: 0,
                            sku: `SKU-MANUAL-${Date.now()}`,
                            thumbnail: null,
                            galleryImages: [],
                            images: []
                          };
                          setVariations([...variations, newVariant]);
                          toast.success('Đã thêm biến thể thủ công!');
                        }}
                        sx={{
                          backgroundColor: '#10b981',
                          '&:hover': { backgroundColor: '#059669' }
                        }}
                      >
                        Thêm biến thể
                      </MuiButton>
                    </Box>
                  </Box>

                  {/* Variations Info */}
                  <Typography variant='body2' sx={{ color: '#6b7280', mb: 3 }}>
                    {variations.length > 0
                      ? `${variations.length} biến thể sản phẩm được tạo từ thuộc tính. Nhấp vào từng biến thể để chỉnh sửa chi tiết.`
                      : 'Chưa có biến thể nào. Vui lòng tạo thuộc tính trong tab "Thuộc tính" trước.'}
                  </Typography>

                  {/* Variation Matrix using ExpandableVariant */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {variations.length > 0 ? (
                      variations.map((variation, index) => {
                        // Create meaningful variant name based on attributes
                        const attributeValues = Object.entries(variation.attributes)
                          .map(([key, value]) => {
                            // Capitalize first letter and format nicely
                            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                            return `${formattedKey}: ${value}`;
                          })
                          .join(' | ');

                        // Convert variation to variant format for ExpandableVariant
                        const displayId = `${Object.values(variation.attributes).join('-').toLowerCase()}`;

                        // Only set databaseId if variation.id is a valid ObjectID (24 char hex)
                        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
                        const databaseId = variation.id && objectIdRegex.test(variation.id) ? variation.id : undefined;

                        const variant = {
                          id: displayId,
                          databaseId: databaseId, // Only set if valid ObjectID
                          name: attributeValues || `Biến thể ${index + 1}`,
                          attributes: variation.attributes,
                          price: variation.price || 0,
                          salePrice: undefined,
                          stock: variation.stock || 0,
                          sku: variation.sku || `SKU-${Object.values(variation.attributes).join('-').toUpperCase()}`,
                          // Map image fields correctly
                          thumbnail: variation.thumbnail || null,
                          galleryImages: variation.galleryImages || [],
                          images: variation.images || [], // Keep for backward compatibility
                          enabled: variation.isActive
                        };

                        return (
                          <ExpandableVariant
                            key={variant.id}
                            variant={variant}
                            onUpdate={(_, updates) => {
                              // Update the variation in the variations array
                              const updatedVariations = variations.map((v, i) =>
                                i === index ? { ...v, ...updates } : v
                              );
                              setVariations(updatedVariations);
                            }}
                            onDelete={() => {
                              // Remove the variation from the variations array
                              const updatedVariations = variations.filter((_, i) => i !== index);
                              setVariations(updatedVariations);
                            }}
                          />
                        );
                      })
                    ) : (
                      <Box
                        sx={{
                          p: 4,
                          textAlign: 'center',
                          border: '2px dashed #d1d5db',
                          borderRadius: '8px',
                          backgroundColor: '#f9fafb'
                        }}
                      >
                        <Typography variant='body1' sx={{ color: '#6b7280', mb: 2 }}>
                          Không có biến thể nào
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#9ca3af' }}>
                          Hãy chuyển sang tab &quot;Thuộc tính&quot; để tạo các thuộc tính và biến thể cho sản phẩm.
                        </Typography>
                      </Box>
                    )}{' '}
                  </Box>
                </Box>
              </TabPanel>
            )}
          </Card>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <MuiButton
            onClick={handleClose}
            variant='outlined'
            sx={{
              borderColor: '#d1d5db',
              color: '#6b7280',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb'
              }
            }}
          >
            Hủy
          </MuiButton>
          <MuiButton
            type='submit'
            variant='contained'
            disabled={isLoading || isUploading}
            startIcon={<MdSave />}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
          >
            {isUploading
              ? `Đang tải ảnh... ${Math.round(uploadProgress)}%`
              : isLoading
              ? mode === 'edit'
                ? 'Đang cập nhật...'
                : 'Đang tạo...'
              : mode === 'edit'
              ? 'Cập nhật sản phẩm'
              : 'Tạo sản phẩm'}
          </MuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddProductModal;
