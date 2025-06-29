'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import firebase from '@/app/libs/firebase';
import { useRouter } from 'next/navigation';
import { generateSlug } from '../../../../../utils/Articles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Card,
  CardContent
} from '@mui/material';
import { MdClose, MdCategory, MdSave, MdRefresh, MdTag, MdImage } from 'react-icons/md';

interface AddProductCateModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

const AddProductCateModal: React.FC<AddProductCateModalProps> = ({ isOpen, toggleOpen }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [isCategoryCreated, setIsCategoryCreated] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    formState: { errors }
  } = useForm<FieldValues>();

  const handleOpenModal = () => {
    toggleOpen();
  };

  // Clear lại sau khi tạo danh mục thành công
  useEffect(() => {
    if (isCategoryCreated) {
      reset();
      setIsCategoryCreated(false);
      setImage(null);
    }
  }, [isCategoryCreated, reset]);

  const handleCategoryImageUpload = async (image: File | null) => {
    try {
      if (image) {
        // Tạo tên file để tránh trùng lặp
        const fileName = new Date().getTime() + '-' + image.name;

        // Lấy đối tượng storage
        const storage = getStorage();

        // Tạo tham chiếu đến vị trí lưu trữ trên Firebase
        const storageRef = ref(storage, `category/${fileName}`);

        const uploadTask = uploadBytesResumable(storageRef, image);

        return new Promise<string>((resolve, reject) => {
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
                .then(downloadURL => {
                  resolve(downloadURL); // Trả về URL ảnh
                })
                .catch(error => {
                  console.log('Lỗi lấy download URL', error);
                  reject(error);
                });
            }
          );
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);
    toast('Đang thêm danh mục, xin chờ...');

    try {
      // Kiểm tra và upload ảnh danh mục
      const categoryImageUrl = await handleCategoryImageUpload(image);

      // Cập nhật dữ liệu để gửi lên API
      const categoryData = {
        ...data,
        image: categoryImageUrl // Đường dẫn ảnh từ Firebase
      };

      // Gửi yêu cầu API để lưu danh mục vào database
      await axios.post('/api/category', categoryData);

      toast.success('Thêm danh mục thành công');
      setIsCategoryCreated(true);
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi khi lưu danh mục');
    } finally {
      setIsLoading(false);
      toggleOpen();
    }
  };

  const handleSlugUpdate = () => {
    const nameValue = getValues('name'); // Lấy giá trị của input "name"
    if (nameValue) {
      const generatedSlug = generateSlug(nameValue);
      setValue('slug', generatedSlug); // Cập nhật giá trị trong form
    }
  };

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
            <MdCategory size={24} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
            Thêm Danh Mục Sản Phẩm
          </Typography>
        </Box>
        <IconButton onClick={toggleOpen} sx={{ color: '#6b7280' }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Name Field */}
            <TextField
              fullWidth
              label='Tên danh mục'
              {...register('name', { required: 'Vui lòng nhập tên danh mục' })}
              error={!!errors.name}
              helperText={errors.name?.message as string}
              disabled={isLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Slug Field with Generate Button */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label='Slug'
                {...register('slug', { required: 'Vui lòng nhập slug' })}
                error={!!errors.slug}
                helperText={errors.slug?.message as string}
                disabled={isLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <Button
                variant='outlined'
                onClick={handleSlugUpdate}
                disabled={isLoading}
                startIcon={<MdRefresh />}
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

            {/* Icon Field */}
            <TextField
              fullWidth
              label='Icon'
              {...register('icon', { required: 'Vui lòng nhập icon' })}
              error={!!errors.icon}
              helperText={errors.icon?.message as string}
              disabled={isLoading}
              placeholder='VD: MdHome, FaUser, etc.'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <MdTag color='#6b7280' />
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Description Field */}
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

            {/* Image Upload */}
            <Card sx={{ border: '2px dashed #d1d5db', borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <MdImage size={48} color='#9ca3af' />
                  <Typography variant='h6' sx={{ color: '#374151', fontWeight: 600 }}>
                    Ảnh danh mục
                  </Typography>

                  {image ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Box
                        component='img'
                        src={URL.createObjectURL(image)}
                        alt='Category preview'
                        sx={{
                          width: 120,
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: '12px',
                          border: '2px solid #e5e7eb'
                        }}
                      />
                      <Typography variant='body2' sx={{ color: '#6b7280' }}>
                        {image.name}
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
                    {image ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
                    <input
                      type='file'
                      hidden
                      accept='image/*'
                      {...register('image', { required: 'Vui lòng chọn ảnh danh mục' })}
                      onChange={(e: any) => setImage(e.target.files?.[0] || null)}
                    />
                  </Button>
                </Box>
              </CardContent>
            </Card>
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
            {isLoading ? 'Đang tạo...' : 'Tạo danh mục'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddProductCateModal;
