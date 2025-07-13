'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import firebase from '@/app/libs/firebase';
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
import {
  MdClose,
  MdLocalOffer,
  MdSave,
  MdImage,
  MdPercent,
  MdAttachMoney,
  MdCalendarToday,
  MdShuffle
} from 'react-icons/md';

interface AddVoucherModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  users: any[];
  editData?: any;
}

const AddVoucherModal: React.FC<AddVoucherModalProps> = ({ isOpen, toggleOpen, users, editData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVoucherCreated, setIsVoucherCreated] = useState(false);
  const [voucherImage, setVoucherImage] = useState<File | string | null>(null);
  const router = useRouter();
  const storage = getStorage(firebase);

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
    if (isVoucherCreated) {
      reset();
      setVoucherImage(null);
      setIsVoucherCreated(false);
    }
  }, [isVoucherCreated, reset]);

  // Populate form khi ở edit mode
  useEffect(() => {
    if (editData && isOpen) {
      reset({
        code: editData.code,
        description: editData.description,
        discountType: editData.discountType,
        discountValue: editData.discountValue,
        minOrderValue: editData.minOrderValue,
        quantity: editData.quantity,
        maxUsagePerUser: editData.maxUsagePerUser,
        startDate: editData.startDate ? new Date(editData.startDate).toISOString().slice(0, 16) : '',
        endDate: editData.endDate ? new Date(editData.endDate).toISOString().slice(0, 16) : '',
        voucherType: editData.voucherType,
        isActive: editData.isActive
      });
      setVoucherImage(editData.image);
    } else if (!editData && isOpen) {
      // Reset form khi ở add mode
      reset({});
      setVoucherImage(null);
    }
  }, [editData, isOpen, reset]);

  // Auto generate voucher code
  const generateVoucherCode = () => {
    const prefix = watch('voucherType') || 'GENERAL';
    const randomNum = Math.floor(Math.random() * 10000);
    const code = `${prefix.substring(0, 3)}${randomNum}`;
    setValue('code', code);
  };

  // Upload image to Firebase
  const uploadImageToFirebase = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileName = new Date().getTime() + '-' + imageFile.name;
      const storageRef = ref(storage, `vouchers/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        error => {
          console.error('Error uploading image:', error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then(downloadURL => {
              resolve(downloadURL);
            })
            .catch(error => {
              reject(error);
            });
        }
      );
    });
  };

  // Delete old image from Firebase
  const deleteOldImageFromFirebase = async (imageUrl: string) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    try {
      let imageUrl = voucherImage || data.image;

      // Handle image upload if there's a new image
      if (voucherImage && voucherImage !== data.image && voucherImage instanceof File) {
        // Delete old image if editing
        if (isEditMode && data.image) {
          await deleteOldImageFromFirebase(data.image);
        }

        // Upload new image
        imageUrl = await uploadImageToFirebase(voucherImage);
      }

      const voucherData = {
        ...data,
        image: imageUrl,
        discountValue: parseFloat(data.discountValue),
        minOrderValue: data.minOrderValue ? parseFloat(data.minOrderValue) : null,
        quantity: parseInt(data.quantity),
        maxUsagePerUser: data.maxUsagePerUser ? parseInt(data.maxUsagePerUser) : 1,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        targetUserIds: data.targetUserIds || []
      };

      if (isEditMode && editData) {
        await axios.put(`/api/voucher/${editData.id}`, voucherData);
        toast.success('Cập nhật voucher thành công');
      } else {
        await axios.post('/api/voucher', voucherData);
        toast.success('Thêm voucher thành công');
        setIsVoucherCreated(true);
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

  const voucherTypeOptions = [
    { label: 'Khách hàng mới', value: 'NEW_USER' },
    { label: 'Khuyến khích quay lại', value: 'RETARGETING' },
    { label: 'Tăng giá trị đơn hàng', value: 'UPSELL' },
    { label: 'Khách hàng thân thiết', value: 'LOYALTY' },
    { label: 'Sự kiện đặc biệt', value: 'EVENT' },
    { label: 'Chung', value: 'GENERAL' }
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={toggleOpen}
      maxWidth='lg'
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
            {isEditMode ? 'Cập Nhật Voucher' : 'Thêm Voucher Mới'}
          </Typography>
        </Box>
        <IconButton onClick={toggleOpen} sx={{ color: '#6b7280' }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Info */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    label='Mã Voucher'
                    {...register('code', { required: 'Vui lòng nhập mã voucher' })}
                    error={!!errors.code}
                    helperText={errors.code?.message as string}
                    disabled={isLoading}
                    placeholder='VD: SALE50'
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                  <Button
                    variant='outlined'
                    onClick={generateVoucherCode}
                    disabled={isLoading}
                    startIcon={<MdShuffle />}
                    sx={{
                      minWidth: 'auto',
                      height: '56px',
                      px: 2,
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      '&:hover': { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Tạo
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Loại Voucher</InputLabel>
                  <Select
                    {...register('voucherType', { required: 'Vui lòng chọn loại voucher' })}
                    label='Loại Voucher'
                    disabled={isLoading}
                    error={!!errors.voucherType}
                    sx={{ borderRadius: '12px' }}
                  >
                    {voucherTypeOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label='Mô tả'
              multiline
              rows={2}
              {...register('description')}
              error={!!errors.description}
              helperText={(errors.description?.message as string) || 'VD: Giảm 50K cho đơn hàng từ 300K'}
              disabled={isLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Voucher Image Upload */}
            <Card sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px' }}>
              <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MdImage color='#3b82f6' />
                Ảnh Voucher
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {voucherImage && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box
                      component='img'
                      src={typeof voucherImage === 'string' ? voucherImage : URL.createObjectURL(voucherImage)}
                      alt='Voucher preview'
                      sx={{
                        width: '100%',
                        maxWidth: 200,
                        height: 'auto',
                        maxHeight: 150,
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Typography variant='body2' sx={{ color: '#6b7280', textAlign: 'center' }}>
                      {typeof voucherImage === 'string' ? 'Ảnh voucher hiện tại' : voucherImage.name}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    component='label'
                    variant='contained'
                    startIcon={<MdImage />}
                    disabled={isLoading}
                    sx={{
                      backgroundColor: '#10b981',
                      '&:hover': { backgroundColor: '#059669' },
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5
                    }}
                  >
                    {voucherImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
                    <input
                      type='file'
                      hidden
                      accept='image/*'
                      disabled={isLoading}
                      onChange={(e: any) => setVoucherImage(e.target.files?.[0] || null)}
                    />
                  </Button>
                </Box>

                {!voucherImage && (
                  <Typography variant='body2' sx={{ color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' }}>
                    Chưa có ảnh nào được chọn
                  </Typography>
                )}
              </Box>
            </Card>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại giảm giá</InputLabel>
                  <Select
                    {...register('discountType', { required: 'Vui lòng chọn loại giảm giá' })}
                    label='Loại giảm giá'
                    disabled={isLoading}
                    error={!!errors.discountType}
                    sx={{ borderRadius: '12px' }}
                  >
                    {discountTypeOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Giá trị giảm'
                  type='number'
                  {...register('discountValue', { required: 'Vui lòng nhập giá trị giảm' })}
                  error={!!errors.discountValue}
                  helperText={errors.discountValue?.message as string}
                  disabled={isLoading}
                  placeholder='VD: 50 (cho 50% hoặc 50000 VNĐ)'
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label='Giá trị đơn tối thiểu (VNĐ)'
              type='number'
              {...register('minOrderValue')}
              error={!!errors.minOrderValue}
              helperText={errors.minOrderValue?.message as string}
              disabled={isLoading}
              placeholder='VD: 300000'
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Số lượng voucher'
                  type='number'
                  {...register('quantity', { required: 'Vui lòng nhập số lượng voucher' })}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message as string}
                  disabled={isLoading}
                  placeholder='VD: 100'
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Số lần dùng/người'
                  type='number'
                  {...register('maxUsagePerUser')}
                  error={!!errors.maxUsagePerUser}
                  helperText={(errors.maxUsagePerUser?.message as string) || 'VD: 1 (mặc định)'}
                  disabled={isLoading}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Ngày bắt đầu'
                  type='datetime-local'
                  {...register('startDate', { required: 'Vui lòng chọn ngày bắt đầu' })}
                  error={!!errors.startDate}
                  helperText={errors.startDate?.message as string}
                  disabled={isLoading}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Ngày kết thúc'
                  type='datetime-local'
                  {...register('endDate', { required: 'Vui lòng chọn ngày kết thúc' })}
                  error={!!errors.endDate}
                  helperText={errors.endDate?.message as string}
                  disabled={isLoading}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
            </Grid>

            {isEditMode && (
              <div className='flex items-center gap-2'>
                <input
                  id='isActive'
                  type='checkbox'
                  {...register('isActive')}
                  disabled={isLoading}
                  className='w-4 h-4'
                />
                <label htmlFor='isActive' className='text-sm'>
                  Kích hoạt voucher
                </label>
              </div>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button
            onClick={toggleOpen}
            disabled={isLoading}
            sx={{
              color: '#6b7280',
              borderColor: '#d1d5db',
              '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
            variant='outlined'
          >
            Hủy
          </Button>
          <Button
            type='submit'
            disabled={isLoading}
            variant='contained'
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
            {isLoading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật Voucher' : 'Tạo Voucher'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddVoucherModal;
