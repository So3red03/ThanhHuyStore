'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import firebase from '@/app/libs/firebase';
import { useRouter } from 'next/navigation';
import { Editor } from 'primereact/editor';
import { ArticleCategory } from '@prisma/client';
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
  Avatar
} from '@mui/material';
import { MdClose, MdArticle, MdImage, MdEdit } from 'react-icons/md';

export type UploadedBannerType = {
  image: string;
};

interface AddArticleModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  articleCategory: ArticleCategory[];
}

const AddArticleModal: React.FC<AddArticleModalProps> = ({ isOpen, toggleOpen, articleCategory }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isArticleCreated, setIsArticleCreated] = useState(false);
  const [articleImage, setArticleImage] = useState<File | null>(null);
  const [text, setText] = useState('');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FieldValues>();

  // Clear lại sau khi tạo bài viết thành công
  useEffect(() => {
    if (isArticleCreated) {
      reset();
      setArticleImage(null);
      setText('');
      setIsArticleCreated(false);
    }
  }, [isArticleCreated, reset]);

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);
    const handleArticleImageUpload = async () => {
      if (!articleImage) {
        toast.error('Chưa chọn ảnh bài viết');
        return null;
      }

      toast('Đang thêm bài viết, xin chờ...');
      try {
        // Tạo tên file để tránh trùng lặp
        const fileName = new Date().getTime() + '-' + articleImage.name;
        // Lấy đối tượng storage
        const storage = getStorage(firebase);
        // Tạo tham chiếu đến vị trí lưu trữ
        const storageRef = ref(storage, `articles/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, articleImage);

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
                .then((downloadURL: string) => {
                  resolve(downloadURL);
                })
                .catch((error: any) => {
                  console.log('Lỗi lấy download URL', error);
                  reject(error);
                });
            }
          );
        });
      } catch (error) {
        setIsLoading(false);
        toast.error('Lỗi upload ảnh bài viết');
        return null;
      }
    };

    const downloadURLImgArticle = await handleArticleImageUpload();

    if (!downloadURLImgArticle) {
      setIsLoading(false);
      return;
    }

    const articleData = {
      ...data,
      image: downloadURLImgArticle,
      content: text
    };
    axios
      .post('/api/article', articleData)
      .then(() => {
        toast.success('Thêm bài viết thành công');
        setIsArticleCreated(true);
        router.refresh();
      })
      .catch(() => {
        toast.error('Có lỗi khi lưu bài viết');
      })
      .finally(() => {
        setIsLoading(false);
        toggleOpen();
      });
  };
  const cateOptions = articleCategory
    .map(cate => {
      if (cate.name === 'Trang chủ') {
        return null; // Nếu cate.name là "Trang chủ", trả về null
      }
      return {
        label: cate.name, // Hiển thị tên trong combobox
        value: cate.id // Gửi id khi chọn
      };
    })
    .filter((option): option is { label: string; value: string } => option !== null); // Loại bỏ giá trị null

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
            <MdArticle size={24} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
            Thêm Bài Viết Mới
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
              label='Tên bài viết'
              {...register('title', { required: 'Vui lòng nhập tên bài viết' })}
              error={!!errors.title}
              helperText={errors.title?.message as string}
              disabled={isLoading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Content Editor */}
            <Box>
              <Typography variant='body2' sx={{ mb: 1, color: '#374151', fontWeight: 500 }}>
                Nội dung bài viết
              </Typography>
              <Editor
                value={text}
                onTextChange={(e: any) => setText(e.htmlValue)}
                style={{ height: '320px' }}
                className='border border-gray-300 rounded-lg'
              />
            </Box>

            {/* Category Field */}
            <FormControl fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                {...register('categoryId', { required: 'Vui lòng chọn danh mục' })}
                label='Danh mục'
                disabled={isLoading}
                error={!!errors.categoryId}
                sx={{ borderRadius: '12px' }}
              >
                {cateOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Image Upload */}
            <Card sx={{ border: '2px dashed #d1d5db', borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <MdImage size={48} color='#9ca3af' />
                  <Typography variant='h6' sx={{ color: '#374151', fontWeight: 600 }}>
                    Ảnh bài viết
                  </Typography>

                  {articleImage ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Box
                        component='img'
                        src={URL.createObjectURL(articleImage)}
                        alt='Article preview'
                        sx={{
                          width: 120,
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: '12px',
                          border: '2px solid #e5e7eb'
                        }}
                      />
                      <Typography variant='body2' sx={{ color: '#6b7280' }}>
                        {articleImage.name}
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
                    {articleImage ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
                    <input
                      type='file'
                      hidden
                      accept='image/*'
                      {...register('image')}
                      onChange={(e: any) => setArticleImage(e.target.files?.[0] || null)}
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
            startIcon={<MdEdit />}
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
            {isLoading ? 'Đang tạo...' : 'Tạo bài viết'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddArticleModal;
