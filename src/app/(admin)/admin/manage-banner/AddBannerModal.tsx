'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
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
  Grid
} from '@mui/material';
import { MdClose, MdImage, MdSave, MdDesktopMac, MdPhoneIphone, MdViewCarousel } from 'react-icons/md';

export type UploadedBannerType = {
  image: string;
};

interface AddBannerModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  editData?: {
    id: string;
    title: string;
    description: string;
    link: string;
    image: string;
    resImage: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null;
}

const AddBannerModal: React.FC<AddBannerModalProps> = ({ isOpen, toggleOpen, editData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isBannerCreated, setIsBannerCreated] = useState(false);
  const [bannerImage, setBannerImage] = useState<File | string | null>(null);
  const [bannerResImage, setBannerResImage] = useState<File | string | null>(null);
  const router = useRouter();

  const isEditMode = !!editData;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: {
      name: '',
      description: '',
      image: null,
      imageResponsive: null,
      startDate: '',
      endDate: '',
      status: 'active'
    }
  });

  // Clear lại sau khi tạo banner thành công
  useEffect(() => {
    if (isBannerCreated) {
      reset();
      setBannerImage(null);
      setBannerResImage(null);
      setIsBannerCreated(false);
    }
  }, [isBannerCreated, reset]);

  // Populate form khi ở edit mode
  useEffect(() => {
    if (editData && isOpen) {
      reset({
        title: editData.title,
        description: editData.description,
        link: editData.link,
        startDate: editData.startDate,
        endDate: editData.endDate,
        status: editData.isActive ? 'active' : 'inactive'
      });
      setBannerImage(editData.image);
      setBannerResImage(editData.resImage);
    } else if (!editData && isOpen) {
      // Reset form khi ở add mode
      reset({
        title: '',
        description: '',
        link: '',
        startDate: '',
        endDate: '',
        status: 'active'
      });
      setBannerImage(null);
      setBannerResImage(null);
    }
  }, [editData, isOpen, reset]);

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);
    const { startDate, endDate } = data;

    const currentDate = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Kiểm tra ngày
    if (start < currentDate) {
      toast.error('Ngày bắt đầu không được nhỏ hơn ngày hiện tại!');
      setIsLoading(false);
      return;
    }

    if (end < start) {
      toast.error('Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
      setIsLoading(false);
      return;
    }

    const handleBannerImageUploads = async () => {
      toast('Đang thêm banner, xin chờ...');
      try {
        const bannerImages = [bannerImage, bannerResImage];
        let downloadURLBanner = '';
        let downloadURLBannerRes = '';

        for (const [index, image] of bannerImages.entries()) {
          if (image) {
            // Nếu là string (URL), sử dụng trực tiếp
            if (typeof image === 'string') {
              if (index === 0) {
                downloadURLBanner = image;
              } else {
                downloadURLBannerRes = image;
              }
              continue;
            }

            // Tạo tên file để tránh trùng lặp
            const fileName = new Date().getTime() + '-' + image.name;
            // Lấy đối tượng storage
            const storage = getStorage(firebase);
            // Tạo tham chiếu đến vị trí lưu trữ
            const storageRef = ref(storage, `banner/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, image);

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
                  // Upload thành công, lấy URL download
                  getDownloadURL(uploadTask.snapshot.ref)
                    .then((downloadURL: any) => {
                      if (index === 0) {
                        downloadURLBanner = downloadURL;
                      } else {
                        downloadURLBannerRes = downloadURL;
                      }
                      resolve();
                    })
                    .catch((error: any) => {
                      console.log('Lỗi lấy download URL', error);
                      reject(error);
                    });
                }
              );
            });
          }
        }

        return { downloadURLBanner, downloadURLBannerRes }; // Trả về URL sau khi upload thành công
      } catch (error: any) {
        setIsLoading(false);
        toast.error('Lỗi upload ảnh banner');
        return null;
      }
    };

    const uploadResult = await handleBannerImageUploads();

    if (!uploadResult) {
      setIsLoading(false);
      return;
    }

    const { downloadURLBanner, downloadURLBannerRes } = uploadResult;

    const bannerData = {
      ...data,
      image: downloadURLBanner, // Đường dẫn ảnh từ Firebase
      imageResponsive: downloadURLBannerRes, // Đường dẫn ảnh responsive từ Firebase
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };

    // Gửi yêu cầu API để lưu/cập nhật banner vào database
    const apiCall = isEditMode
      ? axios.put(`/api/banner/${editData?.id}`, bannerData)
      : axios.post('/api/banner', bannerData);

    apiCall
      .then(() => {
        toast.success(isEditMode ? 'Cập nhật banner thành công' : 'Thêm banner thành công');
        setIsBannerCreated(true);
        router.refresh();
      })
      .catch(() => {
        toast.error(isEditMode ? 'Có lỗi khi cập nhật banner' : 'Có lỗi khi lưu banner vào db');
      })
      .finally(() => {
        setIsLoading(false);
        toggleOpen();
      });
  };

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
            <MdViewCarousel size={24} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
            {isEditMode ? 'Cập Nhật Banner' : 'Thêm Banner Mới'}
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Tên banner'
                  {...register('name', { required: 'Vui lòng nhập tên banner' })}
                  error={!!errors.name}
                  helperText={errors.name?.message as string}
                  disabled={isLoading}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    {...register('status', { required: 'Vui lòng chọn trạng thái' })}
                    label='Trạng thái'
                    disabled={isLoading}
                    error={!!errors.status}
                    sx={{ borderRadius: '12px' }}
                    defaultValue='active'
                  >
                    <MenuItem value='active'>Hoạt động</MenuItem>
                    <MenuItem value='inactive'>Tạm dừng</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Description */}
            <TextField
              fullWidth
              label='Mô tả'
              multiline
              rows={3}
              {...register('description', { required: 'Vui lòng nhập mô tả' })}
              error={!!errors.description}
              helperText={errors.description?.message as string}
              disabled={isLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Date Range */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Từ ngày'
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
                  label='Tới ngày'
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

            {/* Image Uploads */}
            <Grid container spacing={3}>
              {/* Desktop Banner */}
              <Grid item xs={12} md={6}>
                <Card sx={{ border: '2px dashed #d1d5db', borderRadius: '12px' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <MdDesktopMac size={48} color='#3b82f6' />
                      <Typography variant='h6' sx={{ color: '#374151', fontWeight: 600 }}>
                        Banner Desktop
                      </Typography>

                      {bannerImage ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <Box
                            component='img'
                            src={typeof bannerImage === 'string' ? bannerImage : URL.createObjectURL(bannerImage)}
                            alt='Desktop banner preview'
                            sx={{
                              width: '100%',
                              maxWidth: 200,
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: '12px',
                              border: '2px solid #e5e7eb'
                            }}
                          />
                          <Typography variant='body2' sx={{ color: '#6b7280' }}>
                            {typeof bannerImage === 'string' ? 'Ảnh desktop hiện tại' : bannerImage.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant='body2' sx={{ color: '#6b7280' }}>
                          Chưa có file nào được chọn
                        </Typography>
                      )}

                      <Button
                        component='label'
                        variant='contained'
                        startIcon={<MdImage />}
                        disabled={isLoading}
                        sx={{
                          backgroundColor: '#3b82f6',
                          '&:hover': { backgroundColor: '#2563eb' },
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        {bannerImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
                        <input
                          type='file'
                          hidden
                          accept='image/*'
                          {...register('image')}
                          onChange={(e: any) => setBannerImage(e.target.files?.[0] || null)}
                        />
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Mobile Banner */}
              <Grid item xs={12} md={6}>
                <Card sx={{ border: '2px dashed #d1d5db', borderRadius: '12px' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <MdPhoneIphone size={48} color='#10b981' />
                      <Typography variant='h6' sx={{ color: '#374151', fontWeight: 600 }}>
                        Banner Mobile
                      </Typography>

                      {bannerResImage ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <Box
                            component='img'
                            src={
                              typeof bannerResImage === 'string' ? bannerResImage : URL.createObjectURL(bannerResImage)
                            }
                            alt='Mobile banner preview'
                            sx={{
                              width: '100%',
                              maxWidth: 120,
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: '12px',
                              border: '2px solid #e5e7eb'
                            }}
                          />
                          <Typography variant='body2' sx={{ color: '#6b7280' }}>
                            {typeof bannerResImage === 'string' ? 'Ảnh mobile hiện tại' : bannerResImage.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant='body2' sx={{ color: '#6b7280' }}>
                          Chưa có file nào được chọn
                        </Typography>
                      )}

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
                          fontWeight: 600
                        }}
                      >
                        {bannerResImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
                        <input
                          type='file'
                          hidden
                          accept='image/*'
                          {...register('imageResponsive')}
                          onChange={(e: any) => setBannerResImage(e.target.files?.[0] || null)}
                        />
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
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
            {isLoading
              ? isEditMode
                ? 'Đang cập nhật...'
                : 'Đang tạo...'
              : isEditMode
              ? 'Cập nhật banner'
              : 'Tạo banner'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddBannerModal;
