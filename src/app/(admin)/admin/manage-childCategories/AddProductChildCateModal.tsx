'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import firebase from '@/app/libs/firebase';
import { Editor } from 'primereact/editor';
import { useRouter } from 'next/navigation';
import { generateSlug } from '../../../utils/Articles';
import { Category } from '@prisma/client';
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
  InputAdornment,
  Card,
  CardContent
} from '@mui/material';
import { MdClose, MdCategory, MdSave, MdRefresh, MdTag, MdImage } from 'react-icons/md';

interface AddProductChildCateProps {
  isOpen: boolean;
  toggleOpen: () => void;
  parentCategory: Category[];
  editData?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    parentId: string;
  } | null;
}

const AddProductChildCate: React.FC<AddProductChildCateProps> = ({ isOpen, toggleOpen, parentCategory, editData }) => {
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

  // Clear lại sau khi tạo danh mục thành công
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
      setValue('description', editData.description);
      setValue('parentId', editData.parentId);
    } else if (!editData && isOpen) {
      // Reset form khi ở add mode
      reset();
    }
  }, [editData, isOpen, setValue, reset]);

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    const apiCall = isEditMode ? axios.put(`/api/category/${editData?.id}`, data) : axios.post('/api/category', data);

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

  const handleSlugUpdate = () => {
    const nameValue = getValues('name'); // Lấy giá trị của input "name"
    if (nameValue) {
      const generatedSlug = generateSlug(nameValue);
      setValue('slug', generatedSlug); // Cập nhật giá trị trong form
    }
  };

  const cateOptions = parentCategory?.map(cate => ({
    label: cate.name,
    value: cate.id // Gửi id khi chọn
  }));

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
            {isEditMode ? 'Cập Nhật Danh Mục Con' : 'Thêm Danh Mục Con'}
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
              label='Tên danh mục con'
              {...register('name', { required: 'Vui lòng nhập tên danh mục con' })}
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

            {/* Parent Category Field */}
            <FormControl fullWidth>
              <InputLabel>Danh mục cha</InputLabel>
              <Select
                {...register('parentId', { required: 'Vui lòng chọn danh mục cha' })}
                label='Danh mục cha'
                disabled={isLoading}
                error={!!errors.parentId}
                sx={{ borderRadius: '12px' }}
              >
                {cateOptions?.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

export default AddProductChildCate;
