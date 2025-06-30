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
import { ProductTypeSelector, ProductType } from '@/app/components/admin/product-variant';
import SimpleVariantManager from '@/app/components/admin/product-variant/SimpleVariantManager';

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
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string>('');
  const [filteredSubCategories, setFilteredSubCategories] = useState<any[]>([]);
  const [isCheckCalender, setIsCheckCalender] = useState(false);
  const [tabValue, setTabValue] = useState(0);

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
      brand: '',
      category: '',
      inStock: false,
      images: [],
      color: '',
      price: '',
      promotionalPrice: '',
      promotionStart: '',
      promotionEnd: '',
      categoryId: '',
      parentCategories: ''
    }
  });

  const category = watch('category');
  const parentCategory = watch('parentCategories');

  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        const allCategories = response.data;

        const parents = allCategories.filter((cat: any) => !cat.parentId);
        const subs = allCategories.filter((cat: any) => cat.parentId);

        setParentCategories(parents);
        setSubCategories(subs);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Filter subcategories based on selected parent
  useEffect(() => {
    if (selectedParentCategoryId) {
      const filtered = subCategories.filter((subCat: any) => subCat.parentId === selectedParentCategoryId);
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories([]);
    }
  }, [selectedParentCategoryId, subCategories]);

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    try {
      // Handle form submission logic here
      console.log('Form data:', data);
      toast.success('Product created successfully!');
      onClose();
      reset();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
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
          Add New Product
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#6b7280' }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          {/* WordPress-style Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label='General' />
              <Tab label='Inventory' />
              <Tab label='Attributes' />
              <Tab label='Variations' />
            </Tabs>
          </Box>

          {/* WordPress-style Variant Matrix */}
          {productType === ProductType.VARIANT && (
            <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', mb: 3 }}>
              <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                Attributes
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Default Form Values */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
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

                {/* Regenerate Variations Button */}
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

                {/* Variations Matrix */}
                <Typography variant='body2' sx={{ color: '#6b7280', mb: 2 }}>
                  4 variations do not have prices. Variations (and their attributes) that do not have prices will not be
                  shown in your store.
                </Typography>

                {/* Variation Items */}
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
                          <MuiButton size='small' sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fef2f2' } }}>
                            Remove
                          </MuiButton>
                          <MuiButton size='small' sx={{ color: '#3b82f6', '&:hover': { backgroundColor: '#eff6ff' } }}>
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
                              backgroundColor: '#3b82f6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <MdInventory color='white' size={24} />
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
                              <FormControlLabel control={<Switch size='small' />} label='Enabled' />
                            </Grid>
                            <Grid item xs={4}>
                              <FormControlLabel control={<Switch size='small' />} label='Downloadable' />
                            </Grid>
                            <Grid item xs={4}>
                              <FormControlLabel control={<Switch size='small' />} label='Virtual' />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label='Regular price (required)'
                                size='small'
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
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
            </Card>
          )}

          <Grid container spacing={4}>
            {/* Left Column - Product Information */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Product Information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Product Name */}
                  <TextField
                    fullWidth
                    label='Product Name'
                    {...register('name', { required: 'Please enter product name' })}
                    error={!!errors.name}
                    helperText={errors.name?.message as string}
                    disabled={isLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />

                  {/* SKU & Barcode */}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      label='SKU'
                      {...register('sku')}
                      disabled={isLoading}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <TextField
                      fullWidth
                      label='Barcode'
                      {...register('barcode')}
                      disabled={isLoading}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Box>

                  {/* Description */}
                  <Box>
                    <Typography variant='body2' sx={{ mb: 1, color: '#374151', fontWeight: 500 }}>
                      Description (Optional)
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
                    Product Image
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      color: '#3b82f6',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Add Media from URL
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
                    Drag and drop your image here.
                  </Typography>
                  <Typography variant='body2' sx={{ color: '#9ca3af', mb: 2 }}>
                    or
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
                    Browse Images
                  </MuiButton>
                </Box>
              </Card>
            </Grid>

            {/* Right Column - Pricing & Organization */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Pricing
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Product Type Selector */}
                  <FormControl fullWidth>
                    <InputLabel>Product Type</InputLabel>
                    <Select
                      value={productType}
                      onChange={e => handleProductTypeChange(e.target.value as ProductType)}
                      label='Product Type'
                      disabled={isLoading}
                      sx={{ borderRadius: '8px' }}
                    >
                      <MenuItem value={ProductType.SIMPLE}>Simple Product</MenuItem>
                      <MenuItem value={ProductType.VARIANT}>Variable Product</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Base Price */}
                  <TextField
                    fullWidth
                    label='Base Price'
                    type='number'
                    {...register('price', { required: 'Please enter base price' })}
                    error={!!errors.price}
                    helperText={errors.price?.message as string}
                    disabled={isLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />

                  {/* Discounted Price */}
                  <TextField
                    fullWidth
                    label='Discounted Price'
                    type='number'
                    {...register('promotionalPrice')}
                    error={!!errors.promotionalPrice}
                    helperText={errors.promotionalPrice?.message as string}
                    disabled={isLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />

                  {/* Charge Tax Toggle */}
                  <FormControlLabel
                    control={
                      <Switch
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#3b82f6'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#3b82f6'
                          }
                        }}
                      />
                    }
                    label='Charge Tax on this product'
                  />

                  {/* In Stock Toggle */}
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#3b82f6'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#3b82f6'
                          }
                        }}
                      />
                    }
                    label='In stock'
                  />
                </Box>
              </Card>

              {/* Organize Section */}
              <Card sx={{ p: 3, borderRadius: '12px', border: '1px solid #e5e7eb', mt: 3 }}>
                <Typography variant='h6' sx={{ fontWeight: 600, mb: 3, color: '#1f2937' }}>
                  Organize
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Vendor */}
                  <FormControl fullWidth>
                    <InputLabel>Vendor</InputLabel>
                    <Select label='Vendor' disabled={isLoading} sx={{ borderRadius: '8px' }}>
                      <MenuItem value='vendor1'>Vendor 1</MenuItem>
                      <MenuItem value='vendor2'>Vendor 2</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Category - Changed to Select Dropdown */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        {...register('categoryId', { required: 'Please select category' })}
                        label='Category'
                        disabled={isLoading}
                        error={!!errors.categoryId}
                        sx={{ borderRadius: '8px' }}
                      >
                        {parentCategories.map((category: any) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <MuiButton
                      variant='outlined'
                      sx={{
                        minWidth: '40px',
                        width: '40px',
                        height: '56px',
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                        '&:hover': {
                          borderColor: '#2563eb',
                          backgroundColor: '#eff6ff'
                        }
                      }}
                    >
                      +
                    </MuiButton>
                  </Box>

                  {/* Collection */}
                  <FormControl fullWidth>
                    <InputLabel>Collection</InputLabel>
                    <Select label='Collection' disabled={isLoading} sx={{ borderRadius: '8px' }}>
                      <MenuItem value='collection1'>Collection 1</MenuItem>
                      <MenuItem value='collection2'>Collection 2</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Status */}
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select label='Status' disabled={isLoading} sx={{ borderRadius: '8px' }}>
                      <MenuItem value='active'>Active</MenuItem>
                      <MenuItem value='draft'>Draft</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Tags */}
                  <TextField
                    fullWidth
                    label='Tags'
                    placeholder='Enter tags separated by commas'
                    disabled={isLoading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>
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
            Cancel
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
            {isLoading ? 'Creating...' : 'Create Product'}
          </MuiButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddProductModal;
