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
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import { MdClose, MdInventory, MdSave, MdUpload } from 'react-icons/md';

// Import variant system components
import { ProductType } from '@/app/components/admin/product-variant';
import DynamicAttributeManager, {
  ProductAttribute,
  VariationCombination
} from '@/app/components/admin/product-variant/DynamicAttributeManager';

export type ImageType = {
  color: string;
  colorCode: string;
  image: File[] | null;
};

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Icons = {
  SlScreenSmartphone: SlIcons.SlScreenSmartphone,
  SlScreenDesktop: SlIcons.SlScreenDesktop,
  SlScreenTablet: SlIcons.SlScreenTablet,
  AiOutlineAudio: AiIcons.AiOutlineAudio,
  TbDeviceWatch: TbIcons.TbDeviceWatch,
  MdOutlinePhoneIphone: MdIcons.MdOutlinePhoneIphone
};

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ImageType[] | null>(null);
  const [isProductCreated, setIsProductCreated] = useState(false);
  const [text, setText] = useState('');
  const [productType, setProductType] = useState<ProductType>(ProductType.SIMPLE);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variations, setVariations] = useState<VariationCombination[]>([]);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      description: '',
      brand: 'Apple',
      categoryId: '',
      price: '',
      basePrice: '',
      inStock: 0,
      images: []
    }
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        const allCategories = response.data;

        // Chỉ lấy subcategories (có parentId)
        const subs = allCategories.filter((cat: any) => cat.parentId);
        setSubCategories(subs);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    try {
      // Prepare data based on product type
      const productData = {
        name: data.name,
        description: text || data.description,
        brand: data.brand || 'Apple',
        categoryId: data.categoryId,
        images: [], // TODO: Handle image upload
        ...(productType === ProductType.SIMPLE
          ? {
              price: parseFloat(data.price),
              inStock: parseInt(data.inStock)
            }
          : {
              basePrice: parseFloat(data.basePrice),
              productType: 'VARIANT'
            })
      };

      const endpoint = productType === ProductType.SIMPLE ? '/api/product' : '/api/variants/products';

      const response = await axios.post(endpoint, productData);

      if (response.status === 200) {
        toast.success('Tạo sản phẩm thành công!');
        onClose();
        reset();
        // Refresh page to show new product
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Có lỗi xảy ra khi tạo sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth='xl'
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
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          pb: 2
        }}
      >
        <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
          Thêm sản phẩm mới
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#6b7280' }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          {/* Product Type Selector */}
          <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' sx={{ color: '#374151', fontWeight: 500, minWidth: '120px' }}>
                Dữ liệu sản phẩm
              </Typography>
              <FormControl sx={{ minWidth: 200 }}>
                <Select
                  value={productType}
                  onChange={e => handleProductTypeChange(e.target.value as ProductType)}
                  size='small'
                  sx={{ borderRadius: '6px' }}
                >
                  <MenuItem value={ProductType.SIMPLE}>Sản phẩm đơn giản</MenuItem>
                  <MenuItem value={ProductType.VARIANT}>Sản phẩm biến thể</MenuItem>
                </Select>
              </FormControl>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'help'
                }}
              >
                <Typography variant='caption' sx={{ color: '#6b7280', fontSize: '12px' }}>
                  ?
                </Typography>
              </Box>
            </Box>
          </Card>

          <Grid container spacing={4}>
            {/* Left Column - Product Information */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
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

                  {/* Brand */}
                  <TextField
                    fullWidth
                    label='Thương hiệu'
                    {...register('brand')}
                    disabled={isLoading}
                    defaultValue='Apple'
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
                      onTextChange={(e: any) => setText(e.htmlValue)}
                      style={{ height: '200px' }}
                      className='bg-white border outline-none peer border-slate-300 rounded-md focus:border-slate-500'
                    />
                  </Box>
                </Box>
              </Card>

              {/* Product Image Section */}
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', mt: 3 }}>
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
                  sx={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '12px',
                    p: 6,
                    textAlign: 'center',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    <MdUpload size={48} color='#9ca3af' />
                  </Box>
                  <Typography variant='h6' sx={{ color: '#374151', mb: 1 }}>
                    Kéo thả hình ảnh vào đây
                  </Typography>
                  <Typography variant='body2' sx={{ color: '#9ca3af', mb: 2 }}>
                    hoặc
                  </Typography>
                  <MuiButton
                    variant='outlined'
                    sx={{
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      '&:hover': {
                        borderColor: '#2563eb',
                        backgroundColor: '#eff6ff'
                      }
                    }}
                  >
                    Chọn hình ảnh
                  </MuiButton>
                </Box>
              </Card>
            </Grid>

            {/* Right Column - Pricing & Organization */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Giá cả & Loại sản phẩm
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Product Type Selector */}
                  <FormControl fullWidth>
                    <InputLabel>Loại sản phẩm</InputLabel>
                    <Select
                      value={productType}
                      onChange={e => handleProductTypeChange(e.target.value as ProductType)}
                      label='Loại sản phẩm'
                      disabled={isLoading}
                      sx={{ borderRadius: '8px' }}
                    >
                      <MenuItem value={ProductType.SIMPLE}>Sản phẩm đơn giản</MenuItem>
                      <MenuItem value={ProductType.VARIANT}>Sản phẩm biến thể</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Price Fields based on Product Type */}
                  {productType === ProductType.SIMPLE ? (
                    <>
                      <TextField
                        fullWidth
                        label='Giá bán (VNĐ)'
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
                    </>
                  ) : (
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
                  )}
                </Box>
              </Card>

              {/* Organize Section */}
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', mt: 3 }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Phân loại
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Category */}
                  <FormControl fullWidth>
                    <InputLabel>Danh mục sản phẩm</InputLabel>
                    <Select
                      {...register('categoryId', { required: 'Vui lòng chọn danh mục' })}
                      label='Danh mục sản phẩm'
                      disabled={isLoading}
                      error={!!errors.categoryId}
                      sx={{ borderRadius: '8px' }}
                    >
                      {subCategories.map((category: any) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
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

          {/* WordPress-style Variant Matrix - Positioned at bottom */}
          {productType === ProductType.VARIANT && (
            <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', mt: 3 }}>
              {/* Tabs Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <MuiButton
                    variant={tabValue === 0 ? 'contained' : 'text'}
                    size='small'
                    onClick={() => setTabValue(0)}
                    sx={{
                      backgroundColor: tabValue === 0 ? '#3b82f6' : 'transparent',
                      color: tabValue === 0 ? 'white' : '#6b7280',
                      '&:hover': {
                        backgroundColor: tabValue === 0 ? '#2563eb' : '#f3f4f6'
                      }
                    }}
                  >
                    Kho hàng
                  </MuiButton>
                  <MuiButton
                    variant={tabValue === 1 ? 'contained' : 'text'}
                    size='small'
                    onClick={() => setTabValue(1)}
                    sx={{
                      backgroundColor: tabValue === 1 ? '#3b82f6' : 'transparent',
                      color: tabValue === 1 ? 'white' : '#6b7280',
                      '&:hover': {
                        backgroundColor: tabValue === 1 ? '#2563eb' : '#f3f4f6'
                      }
                    }}
                  >
                    Thuộc tính
                  </MuiButton>
                  <MuiButton
                    variant={tabValue === 2 ? 'contained' : 'text'}
                    size='small'
                    onClick={() => setTabValue(2)}
                    sx={{
                      backgroundColor: tabValue === 2 ? '#3b82f6' : 'transparent',
                      color: tabValue === 2 ? 'white' : '#6b7280',
                      '&:hover': {
                        backgroundColor: tabValue === 2 ? '#2563eb' : '#f3f4f6'
                      }
                    }}
                  >
                    Biến thể
                  </MuiButton>
                </Box>
              </Box>

              {/* Tab Content */}
              {tabValue === 0 && (
                <Box>
                  <Typography variant='body2' sx={{ color: '#6b7280', mb: 2 }}>
                    Quản lý kho hàng cho sản phẩm biến thể
                  </Typography>
                  {/* Inventory management content */}
                </Box>
              )}

              {tabValue === 1 && (
                <DynamicAttributeManager
                  attributes={attributes}
                  variations={variations}
                  onAttributesChange={setAttributes}
                  onVariationsChange={setVariations}
                />
              )}

              {tabValue === 2 && (
                <Box>
                  {/* Default Form Values */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                    <Typography variant='body2' sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Default Form Values:
                    </Typography>
                    <FormControl size='small' sx={{ minWidth: 120 }}>
                      <Select defaultValue='no-default' sx={{ borderRadius: '6px' }}>
                        <MenuItem value='no-default'>No default Color...</MenuItem>
                        <MenuItem value='blue'>Blue</MenuItem>
                        <MenuItem value='black'>Black</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size='small' sx={{ minWidth: 120 }}>
                      <Select defaultValue='no-default-storage' sx={{ borderRadius: '6px' }}>
                        <MenuItem value='no-default-storage'>No default Storage...</MenuItem>
                        <MenuItem value='256gb'>256GB</MenuItem>
                        <MenuItem value='512gb'>512GB</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <MuiButton
                      variant='outlined'
                      size='small'
                      sx={{
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                        '&:hover': { borderColor: '#2563eb', backgroundColor: '#eff6ff' }
                      }}
                    >
                      Regenerate variations
                    </MuiButton>
                    <MuiButton
                      variant='outlined'
                      size='small'
                      sx={{
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                        '&:hover': { borderColor: '#2563eb', backgroundColor: '#eff6ff' }
                      }}
                    >
                      Add manually
                    </MuiButton>
                    <FormControl size='small' sx={{ minWidth: 120 }}>
                      <Select defaultValue='bulk-actions' sx={{ borderRadius: '6px' }}>
                        <MenuItem value='bulk-actions'>Bulk actions</MenuItem>
                        <MenuItem value='set-prices'>Set prices</MenuItem>
                        <MenuItem value='set-stock'>Set stock</MenuItem>
                      </Select>
                    </FormControl>
                    <MuiButton
                      variant='contained'
                      size='small'
                      sx={{
                        backgroundColor: '#3b82f6',
                        '&:hover': { backgroundColor: '#2563eb' }
                      }}
                    >
                      Add price
                    </MuiButton>
                  </Box>

                  {/* Variations Info */}
                  <Typography variant='body2' sx={{ color: '#6b7280', mb: 2 }}>
                    4 variations do not have prices. Variations (and their attributes) that do not have prices will not
                    be shown in your store.
                  </Typography>

                  {/* Variation Matrix */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { id: '#348', color: 'Blue', storage: '256GB' },
                      { id: '#349', color: 'Blue', storage: '512GB' },
                      { id: '#350', color: 'Black', storage: '256GB' },
                      { id: '#351', color: 'Black', storage: '512GB' }
                    ].map(variation => (
                      <Card key={variation.id} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                              {variation.id}
                            </Typography>
                            <FormControl size='small' sx={{ minWidth: 80 }}>
                              <Select value={variation.color.toLowerCase()} sx={{ borderRadius: '6px' }}>
                                <MenuItem value='blue'>Blue</MenuItem>
                                <MenuItem value='black'>Black</MenuItem>
                              </Select>
                            </FormControl>
                            <FormControl size='small' sx={{ minWidth: 80 }}>
                              <Select value={variation.storage.toLowerCase()} sx={{ borderRadius: '6px' }}>
                                <MenuItem value='256gb'>256GB</MenuItem>
                                <MenuItem value='512gb'>512GB</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <MuiButton
                              size='small'
                              sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fef2f2' } }}
                            >
                              Remove
                            </MuiButton>
                            <MuiButton
                              size='small'
                              sx={{ color: '#3b82f6', '&:hover': { backgroundColor: '#eff6ff' } }}
                            >
                              Edit
                            </MuiButton>
                          </Box>
                        </Box>

                        {/* Expanded Variation Details */}
                        <Grid container spacing={2}>
                          <Grid item xs={2}>
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                backgroundColor: '#f3f4f6',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed #d1d5db'
                              }}
                            >
                              <MdUpload color='#9ca3af' size={24} />
                            </Box>
                          </Grid>
                          <Grid item xs={10}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label='SKU'
                                  size='small'
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label='GTIN, UPC, EAN, or ISBN'
                                  size='small'
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <FormControlLabel control={<Switch size='small' defaultChecked />} label='Enabled' />
                              </Grid>
                              <Grid item xs={4}>
                                <FormControlLabel control={<Switch size='small' />} label='Manage stock?' />
                              </Grid>
                              <Grid item xs={4}>
                                <FormControlLabel control={<Switch size='small' />} label='Virtual' />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label='Regular price (required)'
                                  size='small'
                                  placeholder='Variation price (required)'
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label='Sale price'
                                  size='small'
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                />
                              </Grid>
                              <Grid item xs={12}>
                                <FormControl fullWidth size='small'>
                                  <InputLabel>Stock status</InputLabel>
                                  <Select defaultValue='in-stock' label='Stock status' sx={{ borderRadius: '6px' }}>
                                    <MenuItem value='in-stock'>In stock</MenuItem>
                                    <MenuItem value='out-of-stock'>Out of stock</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  fullWidth
                                  label='Weight (kg)'
                                  size='small'
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                />
                              </Grid>
                              <Grid item xs={8}>
                                <Typography variant='body2' sx={{ color: '#6b7280', mb: 1 }}>
                                  Dimensions (L×W×H) (cm)
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <TextField
                                    label='Length'
                                    size='small'
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                  />
                                  <TextField
                                    label='Width'
                                    size='small'
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                  />
                                  <TextField
                                    label='Height'
                                    size='small'
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={12}>
                                <FormControl fullWidth size='small'>
                                  <InputLabel>Shipping class</InputLabel>
                                  <Select
                                    defaultValue='same-as-parent'
                                    label='Shipping class'
                                    sx={{ borderRadius: '6px' }}
                                  >
                                    <MenuItem value='same-as-parent'>Same as parent</MenuItem>
                                    <MenuItem value='standard'>Standard</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12}>
                                <TextField
                                  fullWidth
                                  label='Description'
                                  multiline
                                  rows={3}
                                  size='small'
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </Box>

                  {/* Save Changes Button */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
                    <MuiButton
                      variant='contained'
                      sx={{
                        backgroundColor: '#3b82f6',
                        '&:hover': { backgroundColor: '#2563eb' }
                      }}
                    >
                      Save changes
                    </MuiButton>
                    <MuiButton variant='outlined' sx={{ ml: 2, borderColor: '#d1d5db', color: '#6b7280' }}>
                      Cancel
                    </MuiButton>
                  </Box>
                </Box>
              )}
            </Card>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <MuiButton
            onClick={onClose}
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
            disabled={isLoading}
            startIcon={<MdSave />}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
          >
            {isLoading ? 'Đang tạo...' : 'Tạo sản phẩm'}
          </MuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddProductModal;
