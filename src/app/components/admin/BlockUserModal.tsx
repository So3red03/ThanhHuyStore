'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { MdBlock, MdLockOpen } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';

interface BlockUserModalProps {
  open: boolean;
  onClose: () => void;
  user: any; // Accept any user type (SafeUser or User)
  onSuccess: () => void;
}

const BlockUserModal: React.FC<BlockUserModalProps> = ({ open, onClose, user, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const isBlocking = !user?.isBlocked;

  const handleSubmit = async () => {
    if (!user) return;

    if (isBlocking && (!reason || reason.trim().length === 0)) {
      toast.error('Vui lòng nhập lý do khóa tài khoản');
      return;
    }

    try {
      setLoading(true);

      if (isBlocking) {
        // Khóa tài khoản
        await axios.post(`/api/admin/users/${user.id}/block`, {
          reason: reason.trim()
        });
        toast.success('Đã khóa tài khoản thành công');
      } else {
        // Mở khóa tài khoản
        await axios.delete(`/api/admin/users/${user.id}/block`);
        toast.success('Đã mở khóa tài khoản thành công');
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error blocking/unblocking user:', error);

      if (error.response?.status === 403) {
        toast.error('Bạn không có quyền thực hiện hành động này');
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy người dùng');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box display='flex' alignItems='center' gap={2}>
          {isBlocking ? (
            <MdBlock className='text-red-500' size={24} />
          ) : (
            <MdLockOpen className='text-green-500' size={24} />
          )}
          <Typography variant='h6' component='span' sx={{ fontWeight: 600 }}>
            {isBlocking ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* User Info */}
        <Box mb={3} p={2} sx={{ backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            Thông tin người dùng:
          </Typography>
          <Typography variant='body1' sx={{ fontWeight: 600 }}>
            {user.name || 'Chưa có tên'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {user.email}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Vai trò: {user.role}
          </Typography>
        </Box>

        {/* Current Block Status */}
        {user.isBlocked && (
          <Alert severity='warning' sx={{ mb: 3 }}>
            <Typography variant='body2'>
              <strong>Tài khoản đã bị khóa</strong>
            </Typography>
            {user.blockReason && (
              <Typography variant='body2' sx={{ mt: 1 }}>
                Lý do: {user.blockReason}
              </Typography>
            )}
            {user.blockedAt && (
              <Typography variant='body2' sx={{ mt: 1 }}>
                Thời gian: {new Date(user.blockedAt).toLocaleString('vi-VN')}
              </Typography>
            )}
          </Alert>
        )}

        {/* Action Confirmation */}
        <Typography variant='body1' gutterBottom>
          {isBlocking
            ? `Bạn có chắc chắn muốn khóa tài khoản của ${user.email}?`
            : `Bạn có chắc chắn muốn mở khóa tài khoản của ${user.email}?`}
        </Typography>

        {/* Reason Input (only for blocking) */}
        {isBlocking && (
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Lý do khóa tài khoản *'
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder='Nhập lý do khóa tài khoản (bắt buộc)'
            sx={{ mt: 2 }}
            error={reason.trim().length === 0}
            helperText={reason.trim().length === 0 ? 'Vui lòng nhập lý do khóa tài khoản' : ''}
          />
        )}

        {/* Warning */}
        <Alert severity={isBlocking ? 'error' : 'info'} sx={{ mt: 2 }}>
          <Typography variant='body2'>
            {isBlocking
              ? 'Sau khi khóa, người dùng sẽ không thể đăng nhập vào hệ thống.'
              : 'Sau khi mở khóa, người dùng sẽ có thể đăng nhập bình thường.'}
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px'
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || (isBlocking && reason.trim().length === 0)}
          variant='contained'
          color={isBlocking ? 'error' : 'success'}
          startIcon={loading ? <CircularProgress size={16} /> : isBlocking ? <MdBlock /> : <MdLockOpen />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            minWidth: '120px'
          }}
        >
          {loading ? 'Đang xử lý...' : isBlocking ? 'Khóa tài khoản' : 'Mở khóa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlockUserModal;
