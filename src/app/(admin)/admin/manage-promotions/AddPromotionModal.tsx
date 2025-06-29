'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
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
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { MdClose, MdLocalOffer, MdSave, MdPercent, MdAttachMoney, MdCalendarToday } from 'react-icons/md';

interface AddPromotionModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  products: any[];
  categories: any[];
  editData?: any;
}

const AddPromotionModal: React.FC<AddPromotionModalProps> = ({
  isOpen,
  toggleOpen,
  products,
  categories,
  editData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPromotionCreated, setIsPromotionCreated] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const router = useRouter();

  const isEditMode = !!editData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: {}
  });

  // Clear form sau khi tạo thành công
  useEffect(() => {
    if (isPromotionCreated) {
      reset();
      setSelectedProducts([]);
      setSelectedCategories([]);
      setIsPromotionCreated(false);
    }
  }, [isPromotionCreated, reset]);

  // Populate form khi ở edit mode
  useEffect(() => {
    if (editData && isOpen) {
      reset({
        title: editData.title,
        description: editData.description,
        discountType: editData.discountType,
        discountValue: editData.discountValue,
        startDate: editData.startDate ? new Date(editData.startDate).toISOString().slice(0, 16) : '',
        endDate: editData.endDate ? new Date(editData.endDate).toISOString().slice(0, 16) : '',
        applyToAll: editData.applyToAll,
        isActive: editData.isActive
      });
      setSelectedProducts(editData.productIds || []);
      setSelectedCategories(editData.categoryIds || []);
    } else if (!editData && isOpen) {
      // Reset form khi ở add mode
      reset({});
      setSelectedProducts([]);
      setSelectedCategories([]);
    }
  }, [editData, isOpen, reset]);

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    try {
      const promotionData = {
        ...data,
        discountValue: parseFloat(data.discountValue),
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        applyToAll: data.applyToAll || false,
        productIds: data.applyToAll ? [] : selectedProducts,
        categoryIds: data.applyToAll ? [] : selectedCategories
      };

      if (isEditMode && editData) {
        await axios.put(`/api/promotion/${editData.id}`, promotionData);
        toast.success('Cập nhật promotion thành công');
      } else {
        await axios.post('/api/promotion', promotionData);
        toast.success('Thêm promotion thành công');
        setIsPromotionCreated(true);
      }

      router.refresh();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      toggleOpen();
    }
  };

  const discountTypeOptions = [
    { label: 'Phần trăm (%)', value: 'PERCENTAGE' },
    { label: 'Số tiền cố định (VNĐ)', value: 'FIXED' }
  ];

  const productOptions = products?.map(product => ({
    label: product.name,
    value: product.id
  }));

  const categoryOptions = categories?.map(category => ({
    label: category.name,
    value: category.id
  }));

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const applyToAll = watch('applyToAll');

  return (
    <Dialog
      open={isOpen}
      onClose={toggleOpen}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxHeight: '95vh'
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
            <MdLocalOffer size={24} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
            {isEditMode ? 'Cập Nhật Promotion' : 'Thêm Promotion Mới'}
          </Typography>
        </Box>
        <IconButton onClick={toggleOpen} sx={{ color: '#6b7280' }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Title Field */}
            <TextField
              fullWidth
              label='Tên chiến dịch'
              placeholder='VD: Black Friday 2024'
              disabled={isLoading}
              error={!!errors.title}
              helperText={errors.title?.message as string}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              {...register('title', { required: 'Tên chiến dịch là bắt buộc' })}
            />

            {/* Description Field */}
            <TextField
              fullWidth
              label='Mô tả'
              placeholder='VD: Giảm giá sốc cuối năm'
              disabled={isLoading}
              error={!!errors.description}
              helperText={errors.description?.message as string}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              {...register('description')}
            />

            {/* Discount Type and Value */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.discountType}>
                  <InputLabel>Loại giảm giá</InputLabel>
                  <Select
                    label='Loại giảm giá'
                    disabled={isLoading}
                    sx={{ borderRadius: '12px' }}
                    {...register('discountType', { required: 'Loại giảm giá là bắt buộc' })}
                  >
                    {discountTypeOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.discountType && (
                    <Typography variant='caption' color='error' sx={{ mt: 1 }}>
                      {errors.discountType.message as string}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Giá trị giảm'
                  type='number'
                  placeholder='VD: 20 (cho 20% hoặc 20000 VNĐ)'
                  disabled={isLoading}
                  error={!!errors.discountValue}
                  helperText={errors.discountValue?.message as string}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  {...register('discountValue', { required: 'Giá trị giảm là bắt buộc' })}
                />
              </Grid>
            </Grid>

            {/* Date Range */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Ngày bắt đầu'
                  type='datetime-local'
                  disabled={isLoading}
                  error={!!errors.startDate}
                  helperText={errors.startDate?.message as string}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  InputLabelProps={{ shrink: true }}
                  {...register('startDate', { required: 'Ngày bắt đầu là bắt buộc' })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Ngày kết thúc'
                  type='datetime-local'
                  disabled={isLoading}
                  error={!!errors.endDate}
                  helperText={errors.endDate?.message as string}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  InputLabelProps={{ shrink: true }}
                  {...register('endDate', { required: 'Ngày kết thúc là bắt buộc' })}
                />
              </Grid>
            </Grid>

            {/* Apply to All Switch */}
            <Card sx={{ p: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <FormControlLabel
                control={<Switch disabled={isLoading} {...register('applyToAll')} />}
                label='Áp dụng cho toàn bộ website'
                sx={{ '& .MuiFormControlLabel-label': { fontWeight: 500 } }}
              />
            </Card>

            {!applyToAll && (
              <>
                {/* Product Selection */}
                <Card sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                  <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Chọn sản phẩm
                    <Chip
                      label={`${selectedProducts.length} đã chọn`}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </Typography>
                  <Box
                    sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', p: 1 }}
                  >
                    {products?.map(product => (
                      <FormControlLabel
                        key={product.id}
                        control={
                          <input
                            type='checkbox'
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductSelect(product.id)}
                            style={{ marginRight: 8 }}
                          />
                        }
                        label={product.name}
                        sx={{
                          display: 'flex',
                          width: '100%',
                          m: 0,
                          p: 0.5,
                          '&:hover': { backgroundColor: '#f8fafc' }
                        }}
                      />
                    ))}
                  </Box>
                </Card>

                {/* Category Selection */}
                <Card sx={{ p: 3, border: '1px solid #e2e8f0' }}>
                  <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    Chọn danh mục
                    <Chip
                      label={`${selectedCategories.length} đã chọn`}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </Typography>
                  <Box
                    sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', p: 1 }}
                  >
                    {categories?.map(category => (
                      <FormControlLabel
                        key={category.id}
                        control={
                          <input
                            type='checkbox'
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => handleCategorySelect(category.id)}
                            style={{ marginRight: 8 }}
                          />
                        }
                        label={category.name}
                        sx={{
                          display: 'flex',
                          width: '100%',
                          m: 0,
                          p: 0.5,
                          '&:hover': { backgroundColor: '#f8fafc' }
                        }}
                      />
                    ))}
                  </Box>
                </Card>
              </>
            )}

            {/* Active Status for Edit Mode */}
            {isEditMode && (
              <Card sx={{ p: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <FormControlLabel
                  control={<Switch disabled={isLoading} {...register('isActive')} />}
                  label='Kích hoạt promotion'
                  sx={{ '& .MuiFormControlLabel-label': { fontWeight: 500 } }}
                />
              </Card>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button
            onClick={toggleOpen}
            variant='outlined'
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Hủy
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isLoading}
            startIcon={<MdSave />}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              ml: 2
            }}
          >
            {isLoading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật Promotion' : 'Tạo Promotion'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddPromotionModal;
