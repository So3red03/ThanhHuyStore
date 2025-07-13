'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
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
  InputAdornment
} from '@mui/material';
import { MdClose, MdCategory, MdSave, MdRefresh, MdTag } from 'react-icons/md';

interface AddArticleCateModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  editData?: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
    isActive: boolean;
  } | null;
}

const AddArticleCateModal: React.FC<AddArticleCateModalProps> = ({ isOpen, toggleOpen, editData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryCreated, setIsCategoryCreated] = useState(false);
  const router = useRouter();

  const isEditMode = !!editData;
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

  // Clear lại sau khi tạo bài viết thành công
  useEffect(() => {
    if (isCategoryCreated) {
      reset();
      setIsCategoryCreated(false);
    }
  }, [isCategoryCreated, reset]);

  // Populate form khi ở edit mode
  useEffect(() => {
    if (editData && isOpen) {
      setValue('name', editData.name);
      setValue('slug', editData.slug);
      setValue('icon', editData.icon);
      setValue('description', editData.description);
      setValue('isActive', editData.isActive.toString());
    } else if (!editData && isOpen) {
      // Reset form khi ở add mode
      reset();
    }
  }, [editData, isOpen, setValue, reset]);

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    const formattedData = {
      ...data,
      isActive: data.isActive === 'true'
    };
    setIsLoading(true);

    const apiCall = isEditMode
      ? axios.put(`/api/articleCategory/${editData?.id}`, formattedData)
      : axios.post('/api/articleCategory', formattedData);

    toast(isEditMode ? 'Đang cập nhật danh mục, xin chờ...' : 'Đang thêm danh mục, xin chờ...');

    apiCall
      .then(() => {
        toast.success(isEditMode ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công');
        setIsCategoryCreated(true);
        router.refresh();
      })
      .catch(error => {
        toast.error(isEditMode ? 'Có lỗi khi cập nhật danh mục' : 'Có lỗi khi lưu danh mục');
      })
      .finally(() => {
        setIsLoading(false);
        toggleOpen();
      });
  };

  const cateOptions = [
    { label: 'Hoạt động', value: 'true' },
    { label: 'Tạm dừng', value: 'false' }
  ];

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
      maxWidth='sm'
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
            {isEditMode ? 'Cập Nhật Danh Mục Bài Viết' : 'Thêm Danh Mục Bài Viết'}
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

            {/* Status Field */}
            <TextField
              fullWidth
              select
              label='Trạng thái'
              {...register('isActive', { required: 'Vui lòng chọn trạng thái' })}
              error={!!errors.isActive}
              helperText={errors.isActive?.message as string}
              disabled={isLoading}
              SelectProps={{ native: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              <option value=''>Chọn trạng thái</option>
              {cateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
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
              ? 'Cập nhật danh mục'
              : 'Tạo danh mục'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddArticleCateModal;
