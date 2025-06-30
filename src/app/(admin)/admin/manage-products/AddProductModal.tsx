'use client';
import { useState, useEffect, useCallback } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Editor } from 'primereact/editor';
import { colors } from '../../../../../utils/Color';
import SelectColor from '@/app/components/inputs/SelectColor';
import CategoryInput from '@/app/components/inputs/CategoryInput';
import { categories } from '../../../../../utils/Categories';
import CheckBox from '@/app/components/inputs/CheckBox';
import Input from '@/app/components/inputs/Input';
import axios from 'axios';
import firebase from '@/app/libs/firebase';
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
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { MdClose, MdInventory, MdSave } from 'react-icons/md';

// Import variant system components
import {
  ProductTypeSelector,
  AttributeManager,
  VariantMatrix,
  ProductType,
  ProductAttribute,
  ProductVariant,
  VariantProduct
} from '@/app/components/admin/product-variant';

export type ImageType = {
  color: string;
  colorCode: string;
  image: File[] | null;
};

interface AddProductModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  subCategories: any;
  parentCategories: any;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, toggleOpen, subCategories, parentCategories }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState<ImageType[]>([]);
  const [isProductCreated, setIsProductCreated] = useState(false);
  const [isCheckCalender, setIsCheckCalender] = useState(false);

  // Variant system state
  const [productType, setProductType] = useState<ProductType>(ProductType.SIMPLE);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FieldValues>();
  const router = useRouter();
  const Icons = { ...SlIcons, ...AiIcons, ...MdIcons, ...TbIcons };
  const parentCategory = watch('parentCategories');
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | null>(null);

  // Sync selectedParentCategoryId với form value
  useEffect(() => {
    if (parentCategory) {
      setSelectedParentCategoryId(parentCategory);
    }
  }, [parentCategory]);

  // Lọc danh mục con dựa trên ID danh mục cha đã chọn
  const filteredSubCategories = selectedParentCategoryId
    ? subCategories.filter((subCategory: any) => subCategory.parentId === selectedParentCategoryId)
    : [];

  // Debug logging
  useEffect(() => {
    console.log('Debug AddProductModal:');
    console.log('selectedParentCategoryId:', selectedParentCategoryId);
    console.log('subCategories:', subCategories);
    console.log('filteredSubCategories:', filteredSubCategories);
  }, [selectedParentCategoryId, subCategories, filteredSubCategories]);

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

  useEffect(() => {
    if (isProductCreated) {
      reset();
      setImages([]);
      setText('');
      setIsProductCreated(false);
    }
  }, [isProductCreated, reset, toggleOpen]);

  useEffect(() => {
    setCustomValue('images', images);
  }, [images, setCustomValue]);

  const addImageToState = useCallback((value: ImageType) => {
    setImages(prev => {
      if (!prev) return [value];

      // Kiểm tra xem màu sắc đã tồn tại trong mảng chưa
      const existingImageIndex = prev.findIndex(item => item.color === value.color);
      if (existingImageIndex !== -1) {
        // Cập nhật hình ảnh cho màu sắc đã tồn tại
        const updatedImages = [...prev];
        updatedImages[existingImageIndex] = {
          ...updatedImages[existingImageIndex],
          image: [...(updatedImages[existingImageIndex].image || []), ...(value.image || [])]
        };
        return updatedImages;
      } else {
        // Thêm phần tử mới nếu màu sắc chưa tồn tại
        return [...prev, value];
      }
    });
  }, []);

  const removeImageToState = useCallback((value: ImageType) => {
    setImages(prev => {
      if (!prev) return [];

      const existingImageIndex = prev.findIndex(item => item.color === value.color);
      if (existingImageIndex !== -1) {
        const updatedImages = [...prev];
        const remainingImages =
          updatedImages[existingImageIndex].image?.filter(image => !value.image?.includes(image)) || [];

        // Nếu không còn hình ảnh nào cho màu sắc đó, xóa phần tử
        if (remainingImages.length === 0) {
          return updatedImages.filter((_, i) => i !== existingImageIndex);
        } else {
          updatedImages[existingImageIndex] = {
            ...updatedImages[existingImageIndex],
            image: remainingImages
          };
          return updatedImages;
        }
      }
      return prev;
    });
  }, []);

  // Reset variant data when switching product types
  const handleProductTypeChange = useCallback((newType: ProductType) => {
    setProductType(newType);
    if (newType === ProductType.SIMPLE) {
      setAttributes([]);
      setVariants([]);
    }
  }, []);

  // Reset all form data when modal closes
  const handleModalClose = useCallback(() => {
    reset();
    setText('');
    setImages([]);
    setProductType(ProductType.SIMPLE);
    setAttributes([]);
    setVariants([]);
    setIsProductCreated(false);
    setIsCheckCalender(false);
    toggleOpen();
  }, [reset, toggleOpen]);

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    console.log(data);

    setIsLoading(true);
    const { promotionStart, promotionEnd, promotionalPrice, price } = data;
    const currentDate = new Date();
    const startDate = new Date(promotionStart);
    const endDate = new Date(promotionEnd);

    if (Number(promotionalPrice) > Number(price)) {
      toast.error('Giá khuyến mãi không thể lớn hơn giá bán');
      setIsLoading(false);
      return;
    }

    if (promotionStart && startDate < currentDate) {
      toast.error('Ngày bắt đầu không được nhỏ hơn ngày hiện tại!');
      setIsLoading(false);
      return;
    }

    if (promotionEnd && endDate < startDate) {
      toast.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
      setIsLoading(false);
      return;
    }

    if (!data.categoryId || !selectedParentCategoryId) {
      toast.error('Danh mục chưa được chọn');
      setIsLoading(false);
      return;
    }

    // Variant-specific validation
    if (productType === ProductType.VARIANT) {
      if (attributes.length === 0) {
        toast.error('Sản phẩm biến thể cần có ít nhất một thuộc tính');
        setIsLoading(false);
        return;
      }

      if (variants.length === 0) {
        toast.error('Sản phẩm biến thể cần có ít nhất một biến thể');
        setIsLoading(false);
        return;
      }

      // Validate that all variants have valid data
      const invalidVariants = variants.filter(v => !v.sku || v.price <= 0);
      if (invalidVariants.length > 0) {
        toast.error('Tất cả biến thể phải có SKU và giá hợp lệ');
        setIsLoading(false);
        return;
      }
    }

    if (!data.images || data.images.length === 0) {
      toast.error('Chưa có hình ảnh cho sản phẩm');
      setIsLoading(false);
      return;
    }

    const uploadedImages: Array<{ color: string; colorCode: string; images: string[] }> = [];
    // Hàm xử lý upload ảnh lên firebase
    const handleImageUploads = async () => {
      toast('Đang thêm sản phẩm, xin chờ...');

      try {
        // Duyệt qua từng item trong danh sách images
        for (const item of data.images) {
          const imageUrls: string[] = [];

          if (item.image && Array.isArray(item.image)) {
            for (const file of item.image) {
              const fileName = new Date().getTime() + '-' + file.name;
              const storage = getStorage(firebase);
              const storageRef = ref(storage, `productImages/${fileName}`);
              const uploadTask = uploadBytesResumable(storageRef, file);

              await new Promise<void>((resolve, reject) => {
                uploadTask.on(
                  'state_changed',
                  snapshot => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                  },
                  error => {
                    console.log('Lỗi upload ảnh', error);
                    reject(error);
                  },
                  () => {
                    getDownloadURL(uploadTask.snapshot.ref)
                      .then((downloadURL: string) => {
                        imageUrls.push(downloadURL); // Lưu URL vào mảng imageUrls
                        resolve();
                      })
                      .catch(error => {
                        console.log('Lỗi download URL', error);
                        reject(error);
                      });
                  }
                );
              });
            }
          }

          uploadedImages.push({ color: item.color, colorCode: item.colorCode, images: imageUrls });
        }
      } catch (error: any) {
        setIsLoading(false);
        return toast.error('Lỗi upload ảnh');
      }
    };

    // Gọi hàm upload ảnh
    await handleImageUploads();

    // Prepare data based on product type
    if (productType === ProductType.SIMPLE) {
      // Simple product - use existing logic
      const productData = {
        ...data,
        images: uploadedImages,
        promotionalPrice: data.promotionalPrice,
        promotionStart: new Date(data.promotionStart),
        promotionEnd: new Date(data.promotionEnd),
        description: text
      };

      axios
        .post('/api/product', productData)
        .then(() => {
          toast.success('Thêm sản phẩm thành công');
          setIsProductCreated(true);
          router.refresh();
        })
        .catch(error => {
          toast.error('Có lỗi khi lưu product vào db');
        })
        .finally(() => {
          setIsLoading(false);
          handleModalClose();
        });
    } else {
      // Variant product - use variant API
      const variantProductData = {
        name: data.name,
        description: text,
        basePrice: parseFloat(data.price || '0'),
        categoryId: data.categoryId,
        images: uploadedImages.map(img => img.images).flat(), // Flatten all images
        attributes: attributes.map(attr => ({
          name: attr.name,
          label: attr.label,
          type: attr.type,
          displayType: attr.displayType,
          isRequired: attr.isRequired,
          isVariation: attr.isVariation,
          description: attr.description,
          values: attr.values.map(val => ({
            value: val.value,
            label: val.label,
            description: val.description,
            colorCode: val.colorCode,
            imageUrl: val.imageUrl,
            priceAdjustment: val.priceAdjustment
          }))
        })),
        variants: variants.map(variant => ({
          sku: variant.sku,
          attributes: variant.attributes,
          price: variant.price,
          stock: variant.stock,
          images: variant.images
        }))
      };

      axios
        .post('/api/variants/products', variantProductData)
        .then(() => {
          toast.success('Thêm sản phẩm biến thể thành công');
          setIsProductCreated(true);
          router.refresh();
        })
        .catch(error => {
          console.error('Variant product creation error:', error);
          toast.error('Có lỗi khi tạo sản phẩm biến thể');
        })
        .finally(() => {
          setIsLoading(false);
          handleModalClose();
        });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleModalClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MdInventory size={24} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
            Thêm Sản Phẩm Mới
          </Typography>
        </Box>
        <IconButton onClick={handleModalClose} sx={{ color: '#6b7280' }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          {/* Product Type Selector */}
          <Box sx={{ mb: 3 }}>
            <ProductTypeSelector selectedType={productType} onChange={handleProductTypeChange} disabled={isLoading} />
          </Box>

          <Grid container spacing={3}>
            {/* Left Column - Product Details */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Chi tiết sản phẩm
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Product Name */}
                  <Input
                    id='name'
                    label='Tên sản phẩm'
                    disabled={isLoading}
                    register={register}
                    errors={errors}
                    defaultValue={watch('name')}
                    required
                  />

                  {/* Simple Product Fields */}
                  {productType === ProductType.SIMPLE && (
                    <>
                      <Input
                        id='price'
                        label='Giá bán'
                        type='number'
                        disabled={isLoading}
                        register={register}
                        errors={errors}
                        defaultValue={watch('price')}
                        required
                      />
                      <Input
                        id='inStock'
                        label='Tồn kho'
                        type='number'
                        disabled={isLoading}
                        register={register}
                        errors={errors}
                        defaultValue={watch('inStock')}
                        required
                      />
                    </>
                  )}

                  {/* Variant Product Fields */}
                  {productType === ProductType.VARIANT && (
                    <Box>
                      <Input
                        id='price'
                        label='Giá cơ sở (đ)'
                        type='number'
                        disabled={isLoading}
                        register={register}
                        errors={errors}
                        defaultValue={watch('price')}
                        required
                      />
                      <Typography variant='body2' sx={{ mt: 1, color: '#6b7280', fontSize: '0.875rem' }}>
                        Giá cơ sở sẽ được điều chỉnh theo từng biến thể
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* Right Column - Pricing & Categories */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Giá cả & Danh mục
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Promotional Pricing */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                    <Input
                      id='promotionalPrice'
                      label='Giá khuyến mãi'
                      type='number'
                      disabled={isLoading}
                      register={register}
                      errors={errors}
                      defaultValue={watch('promotionalPrice')}
                    />
                    <Typography
                      variant='body2'
                      sx={{
                        color: '#6b7280',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        mb: 1,
                        '&:hover': {
                          color: '#3b82f6'
                        }
                      }}
                      onClick={() => {
                        setIsCheckCalender(!isCheckCalender);
                      }}
                    >
                      {!isCheckCalender ? 'Đặt lịch' : 'Hủy'}
                    </Typography>
                  </Box>
                  {isCheckCalender && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Input
                        id='promotionStart'
                        label='Từ ngày'
                        type='date'
                        disabled={isLoading}
                        register={register}
                        errors={errors}
                        defaultValue={watch('promotionStart') || ' '}
                      />
                      <Input
                        id='promotionEnd'
                        label='Tới ngày'
                        type='date'
                        disabled={isLoading}
                        register={register}
                        errors={errors}
                        defaultValue={watch('promotionEnd') || ' '}
                      />
                    </Box>
                  )}

                  {/* Description */}
                  <Box>
                    <Typography variant='body2' sx={{ mb: 1, color: '#374151', fontWeight: 500 }}>
                      Mô tả sản phẩm
                    </Typography>
                    <Editor
                      {...register('description')}
                      value={text}
                      onTextChange={(e: any) => setText(e.htmlValue)}
                      style={{ height: '200px' }}
                      className='bg-white border outline-none peer border-slate-300 rounded-md focus:border-slate-500'
                    />
                  </Box>

                  {/* Parent Categories */}
                  <Box>
                    <Typography variant='body2' sx={{ mb: 2, color: '#374151', fontWeight: 500 }}>
                      Chọn danh mục sản phẩm
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 2,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                    >
                      {parentCategories.map((item: any) => (
                        <Box key={item.id}>
                          <CategoryInput
                            onClick={() => {
                              setSelectedParentCategoryId(item.id);
                              setCustomValue('parentCategories', item.id);
                            }}
                            selected={parentCategory === item.id}
                            label={item.name}
                            icon={Icons[item.icon as keyof typeof Icons]}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Sub Categories */}
                  <Input
                    id='categoryId'
                    label='Danh mục con'
                    disabled={isLoading}
                    type='combobox'
                    register={register}
                    errors={errors}
                    defaultValue={watch('categoryId') || ''}
                    options={filteredSubCategories.map((subCategory: any) => ({
                      label: subCategory.name,
                      value: subCategory.id
                    }))}
                    required
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
          {/* Image Selection Section */}
          <Box sx={{ mt: 4 }}>
            <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 2, color: '#1f2937' }}>
                Chọn màu và hình ảnh của sản phẩm
              </Typography>
              <Typography variant='body2' sx={{ mb: 3, color: '#6b7280' }}>
                Cần có hình ảnh thích hợp dựa trên màu đã chọn nếu không lựa chọn không hợp lệ
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2
                }}
              >
                {colors.map(item => (
                  <SelectColor
                    key={item.color}
                    item={item}
                    addImageToState={addImageToState}
                    removeImageToState={removeImageToState}
                    isProductCreated={isProductCreated}
                  />
                ))}
              </Box>
            </Card>
          </Box>

          {/* Variant System Components */}
          {productType === ProductType.VARIANT && (
            <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Attribute Manager */}
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Cấu hình thuộc tính
                </Typography>
                <AttributeManager productId={undefined} attributes={attributes} onAttributesChange={setAttributes} />
              </Card>

              {/* Variant Matrix */}
              {attributes.length > 0 && (
                <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                    Quản lý biến thể
                  </Typography>
                  <VariantMatrix
                    productId={''}
                    attributes={attributes}
                    variants={variants}
                    onVariantsChange={setVariants}
                    basePrice={parseFloat(watch('price') || '0')}
                  />
                </Card>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <MuiButton
            variant='outlined'
            onClick={handleModalClose}
            disabled={isLoading}
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
            disabled={isLoading}
            startIcon={<MdSave />}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
          >
            {isLoading ? 'Đang lưu...' : productType === ProductType.VARIANT ? 'Lưu sản phẩm biến thể' : 'Lưu sản phẩm'}
          </MuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddProductModal;
