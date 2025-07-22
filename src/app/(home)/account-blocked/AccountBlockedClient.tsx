'use client';

import { signOut } from 'next-auth/react';
import { Button, Container, Typography, Box, Alert } from '@mui/material';
import { MdBlock, MdExitToApp } from 'react-icons/md';

export default function AccountBlockedClient() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Container maxWidth='md' sx={{ py: 8 }}>
      <Box textAlign='center'>
        {/* Icon */}
        <Box mb={4}>
          <MdBlock size={120} className='text-red-500 mx-auto' />
        </Box>

        {/* Title */}
        <Typography variant='h3' component='h1' gutterBottom sx={{ fontWeight: 600, color: '#dc2626' }}>
          Tài khoản đã bị khóa
        </Typography>

        {/* Description */}
        <Typography variant='h6' color='text.secondary' paragraph sx={{ mb: 4 }}>
          Tài khoản của bạn đã bị khóa bởi quản trị viên
        </Typography>

        {/* Alert */}
        <Alert severity='error' sx={{ mb: 4, textAlign: 'left' }}>
          <Typography variant='body1' sx={{ fontWeight: 600 }} gutterBottom>
            Lý do khóa tài khoản:
          </Typography>
          <Typography variant='body2'>
            Tài khoản của bạn đã bị tạm khóa do vi phạm điều khoản sử dụng. Vui lòng liên hệ với bộ phận hỗ trợ để biết
            thêm chi tiết.
          </Typography>
        </Alert>

        {/* Contact Info */}
        <Box mb={4} p={3} sx={{ backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <Typography variant='h6' gutterBottom sx={{ fontWeight: 600 }}>
            Liên hệ hỗ trợ
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Email: support@thanhhuystore.com
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Hotline: 1900-xxxx
          </Typography>
        </Box>

        {/* Sign Out Button */}
        <Button
          variant='contained'
          size='large'
          startIcon={<MdExitToApp />}
          onClick={handleSignOut}
          sx={{
            backgroundColor: '#dc2626',
            '&:hover': { backgroundColor: '#b91c1c' },
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5
          }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Container>
  );
}
