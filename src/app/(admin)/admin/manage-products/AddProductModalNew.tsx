'use client';
import { useState, useEffect, useCallback } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Editor } from 'primereact/editor';
import axios from 'axios';
import { useVariants } from '@/app/hooks/useVariants';
import {
  uploadProductImages,
  validateImageFiles,
  deleteProductImages,
  ProductImageUpload,
  ProductImageResult
} from '@/app/utils/firebase-product-storage';
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
import { MdClose, MdSave, MdUpload } from 'react-icons/md';

// Import variant system components
import { ProductType } from '@/app/components/admin/product-variant';
import DynamicAttributeManager, {
  ProductAttribute,
  VariationCombination
} from '@/app/components/admin/product-variant/DynamicAttributeManager';
import ExpandableVariant from '@/app/components/admin/product-variant/ExpandableVariant';

export type ImageType = {
  color: string;
  colorCode: string;
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
  const [uploadedImageResults, setUploadedImageResults] = useState<ProductImageResult[]>([]);
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
      basePrice: initialData?.basePrice || '',
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
      console.log('Initializing edit form with data:', initialData);
      console.log('Available subCategories:', subCategories);

      // Set form values
      setValue('name', initialData.name);
      setValue('description', initialData.description);
      setValue('price', initialData.price);
      setValue('basePrice', initialData.basePrice);
      setValue('inStock', initialData.inStock);
      setValue('categoryId', initialData.categoryId);

      // Set product type
      setProductType(initialData.productType || ProductType.SIMPLE);

      // Find parent category from subcategory
      const subCategory = subCategories.find((sub: any) => sub.id === initialData.categoryId);
      const parentCategoryId = subCategory?.parentId || '';

      console.log('Found subcategory:', subCategory);
      console.log('Parent category ID:', parentCategoryId);

      // Set parent and subcategory
      setSelectedParentId(parentCategoryId);
      setSelectedSubCategoryId(initialData.categoryId || '');
      setValue('parentCategories', parentCategoryId);

      // Set existing images for edit mode
      if (initialData.images && initialData.images.length > 0) {
        console.log('Setting existing images:', initialData.images);
        setExistingImages(initialData.images);
        // Clear new images state for edit mode
        setImages([]);
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
      console.log('Submitting form data:', data);
      console.log('Current images:', images);
      console.log('Mode:', mode);

      let finalImages = [];

      if (mode === 'edit') {
        // For edit mode, handle both existing and new images

        // Check if user has added new images (File objects in images state)
        const hasNewImages = images.some(img => img.image && img.image.length > 0);

        if (hasNewImages) {
          // Upload new images to Firebase
          const uploadedImages = await uploadImagesToFirebase(data.name);
          const newImageObjects = uploadedImages.map(result => ({
            color: 'default',
            colorCode: '#000000',
            images: [result.downloadURL]
          }));

          // Combine existing images with new uploaded images
          finalImages = [...existingImages, ...newImageObjects];
        } else {
          // No new images, keep existing images
          finalImages = existingImages;
        }
      } else {
        // For add mode, upload new images to Firebase
        if (images.length > 0) {
          const uploadedImages = await uploadImagesToFirebase(data.name);
          finalImages = uploadedImages.map(result => ({
            color: 'default',
            colorCode: '#000000',
            images: [result.downloadURL]
          }));
        }
      }

      const submitData = {
        ...data,
        productType,
        categoryId: selectedSubCategoryId, // Use the selected subcategory
        images: finalImages
      };

      if (mode === 'edit' && initialData?.id) {
        // Update product - use the correct API endpoint
        await axios.put(`/api/product/${initialData.id}`, submitData);
        toast.success('Sản phẩm đã được cập nhật thành công!');
      } else {
        // Create product
        await axios.post('/api/product', submitData);
        toast.success('Sản phẩm đã được tạo thành công!');
      }

      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(mode === 'edit' ? 'Có lỗi xảy ra khi cập nhật sản phẩm' : 'Có lỗi xảy ra khi tạo sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  // Image upload handlers
  const handleImageUpload = useCallback((files: FileList) => {
    const fileArray = Array.from(files);

    // Validate files
    const validation = validateImageFiles(fileArray);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    const newImages: ImageType[] = fileArray
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        color: 'default',
        colorCode: '#000000',
        image: [file]
      }));

    setImages(prev => [...prev, ...newImages]);
  }, []);

  // Upload images to Firebase
  const uploadImagesToFirebase = async (productName: string): Promise<ProductImageResult[]> => {
    if (images.length === 0) return [];

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const imageUploads: ProductImageUpload[] = [];

      images.forEach((img, index) => {
        if (img.image && img.image.length > 0) {
          img.image.forEach((file, fileIndex) => {
            imageUploads.push({
              file,
              filename: `image-${index}-${fileIndex}.${file.name.split('.').pop()}`
            });
          });
        }
      });

      const results = await uploadProductImages(productName, imageUploads, (progress: number) =>
        setUploadProgress(progress)
      );

      setUploadedImageResults(results);
      return results;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Có lỗi xảy ra khi tải lên hình ảnh');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleImageUpload(files);
      }
    },
    [handleImageUpload]
  );

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleImageUpload(files);
      }
    },
    [handleImageUpload]
  );

  // Delete uploaded images from Firebase
  const deleteUploadedImages = async () => {
    if (uploadedImageResults.length > 0) {
      try {
        const imagePaths = uploadedImageResults.map(result => result.path);
        await deleteProductImages(imagePaths);
        setUploadedImageResults([]);
      } catch (error) {
        console.error('Error deleting uploaded images:', error);
      }
    }
  };

  const handleClose = async () => {
    // Clean up uploaded images if user cancels
    if (mode === 'add' && uploadedImageResults.length > 0) {
      await deleteUploadedImages();
    }

    reset();
    setImages([]);
    setExistingImages([]);
    setUploadedImageResults([]);
    setSelectedParentId('');
    setSelectedSubCategoryId('');
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

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
          <Grid container sx={{ minHeight: '600px' }}>
            {/* Left Column - Product Information */}
            <Grid item xs={12} md={6} sx={{ p: 3, borderRight: '1px solid #e5e7eb' }}>
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Thông tin sản phẩm
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Product Name */}
                  <TextField
                    fullWidth
                    label='Tên sản phẩm'
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
                      {...register('description')}
                      value={text}
                      onTextChange={e => setText(e.htmlValue || '')}
                      style={{ height: '200px' }}
                      className='bg-white border outline-none peer border-slate-300 rounded-md focus:border-slate-500'
                    />
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Right Column - Product Image */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                    Hình ảnh sản phẩm
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      color: '#3b82f6',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Thêm từ URL
                  </Typography>
                </Box>

                <Box
                  component='label'
                  htmlFor='image-upload'
                  sx={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '12px',
                    p: 6,
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      backgroundColor: '#f8fafc',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
                    }
                  }}
                  onDrop={handleImageDrop}
                  onDragOver={e => e.preventDefault()}
                  onDragEnter={e => e.preventDefault()}
                >
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                    id='image-upload'
                  />

                  {/* Centered Upload Icon */}
                  <Box
                    sx={{
                      mb: 3,
                      p: 3,
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MdUpload size={32} color='#6b7280' />
                  </Box>

                  <Typography variant='h6' sx={{ color: '#374151', mb: 1, fontWeight: 600 }}>
                    Kéo thả hình ảnh vào đây
                  </Typography>
                  <Typography variant='body2' sx={{ color: '#9ca3af', mb: 3 }}>
                    hoặc nhấp để chọn tệp
                  </Typography>

                  <Typography variant='caption' sx={{ color: '#9ca3af' }}>
                    Hỗ trợ: JPG, PNG, GIF (tối đa 5MB mỗi file)
                  </Typography>
                </Box>

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

              {/* Organize Section */}
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', mt: 3 }}>
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
                  <FormControl fullWidth disabled={!selectedParentId}>
                    <InputLabel>Danh mục con</InputLabel>
                    <Select
                      value={selectedSubCategoryId}
                      onChange={e => {
                        const value = e.target.value;
                        setSelectedSubCategoryId(value);
                        setCustomValue('categoryId', value);
                      }}
                      label='Danh mục con'
                      disabled={isLoading || !selectedParentId}
                      error={!!errors.categoryId}
                      sx={{ borderRadius: '8px' }}
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
                    {errors.categoryId && (
                      <Typography variant='caption' sx={{ color: '#ef4444', mt: 1 }}>
                        {errors.categoryId?.message as string}
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              </Card>
            </Grid>
          </Grid>

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
                    label='Giá khuyến mãi (VNĐ)'
                    type='number'
                    {...register('salePrice')}
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

                  <TextField
                    fullWidth
                    label='Giá cơ sở (VNĐ)'
                    type='number'
                    {...register('basePrice', { required: 'Vui lòng nhập giá cơ sở' })}
                    error={!!errors.basePrice}
                    helperText={(errors.basePrice?.message as string) || 'Giá cơ sở cho các biến thể'}
                    disabled={isLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
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
                        const variant = {
                          id: `${Object.values(variation.attributes).join('-').toLowerCase()}`,
                          name: attributeValues || `Biến thể ${index + 1}`,
                          attributes: variation.attributes,
                          price: variation.price || 0,
                          salePrice: undefined,
                          stock: variation.stock || 0,
                          sku: variation.sku || `SKU-${Object.values(variation.attributes).join('-').toUpperCase()}`,
                          images: variation.images || [],
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
              ? `Đang tải ảnh... ${uploadProgress}%`
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
