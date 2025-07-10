'use client';

import { useState } from 'react';
import { Product } from '@prisma/client';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Box,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import { MdEmail, MdSend, MdCheckCircle, MdInfo, MdWarning, MdTrendingUp, MdPeople, MdPercent } from 'react-icons/md';

interface SendNewProductEmailProps {
  products: Product[];
}

const SendNewProductEmail: React.FC<SendNewProductEmailProps> = ({ products }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSendEmails = async () => {
    if (!selectedProductId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/send-new-product-emails', {
        productId: selectedProductId
      });

      const result = response.data;
      setLastResult(result);

      toast.success(`Đã gửi email thành công cho ${result.sentCount}/${result.totalUsers} người dùng`);
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi gửi email');
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc sản phẩm mới (trong 30 ngày gần đây)
  const recentProducts = products
    ?.filter(product => {
      const productDate = new Date(product.createdAt || Date.now());
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return productDate >= thirtyDaysAgo;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || Date.now());
      const dateB = new Date(b.createdAt || Date.now());
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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
            <MdEmail size={24} />
          </Box>
          <Box>
            <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
              Email Marketing
            </Typography>
            <Typography variant='body2' sx={{ color: '#6b7280' }}>
              Gửi thông báo sản phẩm mới đến khách hàng tiềm năng
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Product Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Chọn sản phẩm mới</InputLabel>
          <Select
            value={selectedProductId}
            label='Chọn sản phẩm mới'
            onChange={e => setSelectedProductId(e.target.value)}
            disabled={isLoading}
            sx={{ borderRadius: '12px' }}
          >
            <MenuItem value=''>
              <em>-- Chọn sản phẩm --</em>
            </MenuItem>
            {recentProducts?.map(product => (
              <MenuItem key={product.id} value={product.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 500 }}>{product.name}</Typography>
                  <Chip
                    label={new Date(product.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Info Alert */}
        {selectedProductId && (
          <Alert icon={<MdInfo />} severity='info' sx={{ mb: 3, borderRadius: '12px' }}>
            <Typography variant='body2'>
              <strong>Lưu ý:</strong> Email sẽ được gửi đến những khách hàng đã từng mua sản phẩm trong cùng danh mục
              với sản phẩm được chọn.
            </Typography>
          </Alert>
        )}

        {/* Send Button */}
        <Button
          fullWidth
          variant='contained'
          size='large'
          startIcon={isLoading ? null : <MdSend />}
          onClick={handleSendEmails}
          disabled={isLoading || !selectedProductId}
          sx={{
            py: 2,
            borderRadius: '12px',
            backgroundColor: '#3b82f6',
            '&:hover': { backgroundColor: '#2563eb' },
            '&:disabled': { backgroundColor: '#e5e7eb', color: '#9ca3af' },
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '16px'
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress sx={{ width: 20, height: 2 }} />
              Đang gửi email...
            </Box>
          ) : (
            'Gửi Email Marketing'
          )}
        </Button>

        {/* Results */}
        {lastResult && (
          <Card sx={{ mt: 3, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MdCheckCircle color='#16a34a' size={20} />
                <Typography variant='h6' sx={{ color: '#16a34a', fontWeight: 600 }}>
                  Kết quả gửi email
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <MdTrendingUp color='#3b82f6' size={16} />
                    <Typography variant='body2' sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Sản phẩm
                    </Typography>
                  </Box>
                  <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937' }}>
                    {lastResult.product.name}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <MdPeople color='#10b981' size={16} />
                    <Typography variant='body2' sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Đã gửi
                    </Typography>
                  </Box>
                  <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937' }}>
                    {lastResult.sentCount}/{lastResult.totalUsers}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <MdPercent color='#8b5cf6' size={16} />
                    <Typography variant='body2' sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Tỷ lệ thành công
                    </Typography>
                  </Box>
                  <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937' }}>
                    {((lastResult.sentCount / lastResult.totalUsers) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* No Products Warning */}
        {recentProducts?.length === 0 && (
          <Alert icon={<MdWarning />} severity='warning' sx={{ mt: 3, borderRadius: '12px' }}>
            <Typography variant='body2'>
              Không có sản phẩm mới nào trong 30 ngày gần đây để gửi email marketing.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SendNewProductEmail;
