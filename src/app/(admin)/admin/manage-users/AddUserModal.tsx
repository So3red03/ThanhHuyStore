'use client';

import { useState, useEffect } from 'react';
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
  InputAdornment
} from '@mui/material';
import { MdClose, MdVisibility, MdVisibilityOff, MdPerson } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  editData?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose, onUserAdded, editData }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!editData;

  // Populate form khi ở edit mode
  useEffect(() => {
    if (editData && open) {
      setFormData({
        name: editData.name,
        email: editData.email,
        password: '', // Không hiển thị password cũ
        role: editData.role
      });
    } else if (!editData && open) {
      // Reset form khi ở add mode
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'USER'
      });
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Chỉ validate password cho add mode hoặc khi có password mới trong edit mode
    if (!isEditMode && !formData.password) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const apiData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ...(formData.password && { password: formData.password }) // Chỉ gửi password nếu có
      };

      if (isEditMode) {
        await axios.put(`/api/admin/users/${editData?.id}`, apiData);
        toast.success('Cập nhật người dùng thành công');
      } else {
        await axios.post('/api/admin/users/create', apiData);
        toast.success('Tạo người dùng thành công');
      }

      onUserAdded();
      handleClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', password: '', role: 'USER' });
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
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
            <MdPerson size={24} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
            {isEditMode ? 'Cập Nhật Người Dùng' : 'Thêm Người Dùng Mới'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: '#6b7280' }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Name Field */}
            <TextField
              fullWidth
              label='Họ và tên'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Email Field */}
            <TextField
              fullWidth
              label='Email'
              type='email'
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label='Mật khẩu'
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              helperText={isEditMode ? 'Để trống nếu không muốn thay đổi mật khẩu' : 'Mật khẩu phải có ít nhất 6 ký tự'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge='end'>
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            {/* Role Field */}
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={formData.role}
                label='Vai trò'
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value='USER'>Khách hàng</MenuItem>
                <MenuItem value='STAFF'>Nhân viên</MenuItem>
                <MenuItem value='ADMIN'>Quản trị viên</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={handleClose}
            variant='outlined'
            sx={{
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Hủy
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={loading}
            sx={{
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {loading
              ? isEditMode
                ? 'Đang cập nhật...'
                : 'Đang tạo...'
              : isEditMode
              ? 'Cập nhật người dùng'
              : 'Tạo người dùng'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddUserModal;
