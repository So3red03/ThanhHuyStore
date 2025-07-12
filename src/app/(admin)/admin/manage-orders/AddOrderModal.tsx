'use client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus, DeliveryStatus, User, Product } from '@prisma/client';
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
  Autocomplete,
  Chip,
  Grid,
  Avatar,
  Divider,
  Alert
} from '@mui/material';
import { MdClose, MdShoppingCart, MdPerson, MdPayment, MdAdd, MdRemove, MdDelete, MdInventory } from 'react-icons/md';

interface AddOrderModalProps {
  isOpen: boolean;
  toggleOpen: () => void;
  users: User[];
  products: any[];
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({ isOpen, toggleOpen, users, products }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FieldValues>({
    defaultValues: {
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Vietnam'
      },
      paymentMethod: 'cod',
      status: OrderStatus.pending,
      deliveryStatus: DeliveryStatus.not_shipped,
      shippingFee: 0
    }
  });

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    if (!selectedUser) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate total amount
      const totalAmount =
        selectedProducts.reduce((sum, product) => {
          return sum + product.price * product.quantity;
        }, 0) + shippingFee;

      const orderData = {
        userId: selectedUser.id,
        amount: totalAmount,
        originalAmount: totalAmount - shippingFee,
        currency: 'vnd',
        status: data.status,
        deliveryStatus: data.deliveryStatus,
        paymentIntentId: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        products: selectedProducts,
        phoneNumber: data.phoneNumber,
        address: data.address,
        shippingFee: shippingFee,
        paymentMethod: data.paymentMethod,
        discountAmount: 0
      };

      const response = await axios.post('/api/orders/admin-create', orderData);

      if (response.status === 200) {
        toast.success('Tạo đơn hàng thành công!');
        reset();
        setSelectedUser(null);
        setSelectedProducts([]);
        setShippingFee(0);
        toggleOpen();
        router.refresh();
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = (product: any) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);

    if (existingProduct) {
      // Check stock before increasing quantity
      const newQuantity = existingProduct.quantity + 1;
      if (product.inStock !== null && newQuantity > product.inStock) {
        toast.error(`Không đủ tồn kho! Chỉ còn ${product.inStock} sản phẩm`);
        return;
      }
      setSelectedProducts(prev => prev.map(p => (p.id === product.id ? { ...p, quantity: newQuantity } : p)));
    } else {
      // Check stock for new product
      if (product.inStock !== null && product.inStock < 1) {
        toast.error(`Sản phẩm ${product.name} đã hết hàng!`);
        return;
      }
      // Smart image selection for both simple and variant products
      const getProductImage = (product: any) => {
        if (product.variants && product.variants.length > 0) {
          const firstVariant = product.variants[0];
          if (firstVariant.images && firstVariant.images.length > 0) {
            return firstVariant.images[0];
          }
        }
        return product.thumbnail || product.galleryImages?.[0] || '/noavatar.png';
      };

      setSelectedProducts(prev => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          description: product.description || '',
          category: product.category?.name || '',
          brand: product.brand || '',
          selectedImg: getProductImage(product), // Use smart image selection
          quantity: 1,
          price: product.price,
          inStock: product.inStock || 0,
          // Add variant info if it's a variant product
          ...(product.variants &&
            product.variants.length > 0 && {
              variantId: product.variants[0].id,
              attributes: product.variants[0].attributes || {}
            })
        }
      ]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }

    // Find the product in the products list to check stock
    const product = products.find(p => p.id === productId);
    if (product && product.inStock !== null && quantity > product.inStock) {
      toast.error(`Không đủ tồn kho! Chỉ còn ${product.inStock} sản phẩm`);
      return;
    }

    setSelectedProducts(prev => prev.map(p => (p.id === productId ? { ...p, quantity } : p)));
  };

  const calculateTotal = () => {
    const productTotal = selectedProducts.reduce((sum, product) => {
      return sum + product.price * product.quantity;
    }, 0);
    return productTotal + shippingFee;
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedUser(null);
      setSelectedProducts([]);
      setShippingFee(0);
    }
  }, [isOpen, reset]);

  return (
    <Dialog
      open={isOpen}
      onClose={toggleOpen}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '90vh'
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
            <MdShoppingCart size={24} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 700, color: '#1f2937' }}>
            Tạo Đơn Hàng Mới
          </Typography>
        </Box>
        <IconButton onClick={toggleOpen} sx={{ color: '#6b7280' }}>
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Customer Selection */}
            <Card sx={{ p: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MdPerson size={20} color='#3b82f6' />
                <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Thông tin khách hàng
                </Typography>
              </Box>

              <Autocomplete
                options={users}
                getOptionLabel={option => `${option.name} (${option.email})`}
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Chọn khách hàng'
                    fullWidth
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
                disabled={isLoading}
              />
            </Card>

            {/* Product Selection */}
            <Card sx={{ p: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MdInventory size={20} color='#3b82f6' />
                <Typography variant='h6' sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Chọn sản phẩm
                </Typography>
              </Box>

              {/* Product Search */}
              <Autocomplete
                options={products}
                getOptionLabel={option =>
                  `${option.name} - ${option.price?.toLocaleString('vi-VN')}₫ (Tồn: ${option.inStock || 0})`
                }
                onChange={(_, newValue) => {
                  if (newValue) {
                    handleAddProduct(newValue);
                  }
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Tìm và chọn sản phẩm'
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                )}
                renderOption={(props, option) => {
                  // Smart image selection for both simple and variant products
                  const getProductImage = (product: any) => {
                    // For variant products, try to get image from first variant
                    if (product.variants && product.variants.length > 0) {
                      const firstVariant = product.variants[0];
                      if (firstVariant.thumbnail) {
                        return firstVariant.thumbnail;
                      }
                    }
                    // For simple products or fallback
                    const fallbackImage = product.thumbnail || product.galleryImages?.[0] || '/noavatar.png';
                    return fallbackImage;
                  };

                  return (
                    <Box component='li' {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                      <Avatar src={getProductImage(option)} sx={{ width: 40, height: 40 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {option.price?.toLocaleString('vi-VN')}₫ • Tồn kho: {option.inStock || 0}
                        </Typography>
                      </Box>
                      {(option.inStock || 0) <= 5 && (
                        <Chip label='Sắp hết' size='small' color='warning' sx={{ fontSize: '10px' }} />
                      )}
                    </Box>
                  );
                }}
                disabled={isLoading}
              />

              {/* Selected Products */}
              {selectedProducts.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant='body2' sx={{ mb: 2, color: '#374151', fontWeight: 500 }}>
                    Sản phẩm đã chọn ({selectedProducts.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {selectedProducts.map(product => (
                      <Card key={product.id} sx={{ p: 2, border: '1px solid #e5e7eb' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={product.selectedImg} sx={{ width: 50, height: 50 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                              {product.name}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {product.price.toLocaleString('vi-VN')}₫
                            </Typography>
                          </Box>

                          {/* Quantity Controls */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size='small'
                                onClick={() => handleQuantityChange(product.id, product.quantity - 1)}
                                disabled={product.quantity <= 1}
                                sx={{
                                  backgroundColor: '#f3f4f6',
                                  '&:hover': { backgroundColor: '#e5e7eb' }
                                }}
                              >
                                <MdRemove size={16} />
                              </IconButton>

                              <Typography
                                variant='body2'
                                sx={{
                                  minWidth: '40px',
                                  textAlign: 'center',
                                  fontWeight: 600,
                                  px: 1
                                }}
                              >
                                {product.quantity}
                              </Typography>

                              <IconButton
                                size='small'
                                onClick={() => handleQuantityChange(product.id, product.quantity + 1)}
                                disabled={(() => {
                                  const productData = products.find(p => p.id === product.id);
                                  return (
                                    productData &&
                                    productData.inStock !== null &&
                                    product.quantity >= productData.inStock
                                  );
                                })()}
                                sx={{
                                  backgroundColor: '#f3f4f6',
                                  '&:hover': { backgroundColor: '#e5e7eb' }
                                }}
                              >
                                <MdAdd size={16} />
                              </IconButton>
                            </Box>

                            {/* Stock Warning */}
                            {(() => {
                              const productData = products.find(p => p.id === product.id);
                              if (productData && productData.inStock !== null) {
                                const remaining = productData.inStock - product.quantity;
                                if (remaining <= 0) {
                                  return (
                                    <Typography variant='caption' sx={{ color: '#dc2626', fontSize: '10px' }}>
                                      Hết hàng
                                    </Typography>
                                  );
                                } else if (remaining <= 3) {
                                  return (
                                    <Typography variant='caption' sx={{ color: '#f59e0b', fontSize: '10px' }}>
                                      Còn {remaining}
                                    </Typography>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </Box>

                          {/* Subtotal */}
                          <Typography
                            variant='body2'
                            sx={{
                              fontWeight: 600,
                              color: '#059669',
                              minWidth: '80px',
                              textAlign: 'right'
                            }}
                          >
                            {(product.price * product.quantity).toLocaleString('vi-VN')}₫
                          </Typography>

                          {/* Remove Button */}
                          <IconButton
                            size='small'
                            onClick={() => handleRemoveProduct(product.id)}
                            sx={{
                              color: '#dc2626',
                              '&:hover': { backgroundColor: '#fef2f2' }
                            }}
                          >
                            <MdDelete size={16} />
                          </IconButton>
                        </Box>
                      </Card>
                    ))}
                  </Box>

                  {/* Order Summary */}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant='body2'>Tạm tính:</Typography>
                      <Typography variant='body2'>
                        {selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0).toLocaleString('vi-VN')}₫
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant='body2'>Phí vận chuyển:</Typography>
                      <Typography variant='body2'>{shippingFee.toLocaleString('vi-VN')}₫</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant='h6' sx={{ fontWeight: 700 }}>
                        Tổng cộng:
                      </Typography>
                      <Typography variant='h6' sx={{ fontWeight: 700, color: '#059669' }}>
                        {calculateTotal().toLocaleString('vi-VN')}₫
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Empty State */}
              {selectedProducts.length === 0 && (
                <Alert severity='info' sx={{ mt: 2 }}>
                  Vui lòng chọn ít nhất một sản phẩm để tạo đơn hàng
                </Alert>
              )}
            </Card>

            {/* Contact Information */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                label='Số điện thoại'
                {...register('phoneNumber', { required: 'Vui lòng nhập số điện thoại' })}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message as string}
                disabled={isLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />

              <FormControl fullWidth disabled={isLoading}>
                <InputLabel>Phương thức thanh toán</InputLabel>
                <Select {...register('paymentMethod')} label='Phương thức thanh toán' sx={{ borderRadius: '12px' }}>
                  <MenuItem value='cod'>Thanh toán khi nhận hàng (COD)</MenuItem>
                  <MenuItem value='momo'>MoMo</MenuItem>
                  <MenuItem value='stripe'>Thẻ tín dụng</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Shipping Fee */}
            <Box>
              <Typography variant='body2' sx={{ mb: 1, color: '#374151', fontWeight: 500 }}>
                Phí vận chuyển
              </Typography>
              <TextField
                fullWidth
                label='Phí vận chuyển (₫)'
                type='number'
                value={shippingFee}
                onChange={e => setShippingFee(Number(e.target.value) || 0)}
                disabled={isLoading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Box>

            {/* Address */}
            <Box>
              <Typography variant='body2' sx={{ mb: 1, color: '#374151', fontWeight: 500 }}>
                Địa chỉ giao hàng
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  label='Địa chỉ'
                  {...register('address.street', { required: 'Vui lòng nhập địa chỉ' })}
                  error={!!(errors.address as any)?.street}
                  helperText={(errors.address as any)?.street?.message as string}
                  disabled={isLoading}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                <TextField
                  fullWidth
                  label='Thành phố'
                  {...register('address.city', { required: 'Vui lòng nhập thành phố' })}
                  error={!!(errors.address as any)?.city}
                  helperText={(errors.address as any)?.city?.message as string}
                  disabled={isLoading}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                <TextField
                  fullWidth
                  label='Mã bưu điện'
                  {...register('address.postalCode')}
                  disabled={isLoading}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
          <Button
            onClick={toggleOpen}
            variant='outlined'
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            type='submit'
            variant='contained'
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Đang tạo...' : 'Tạo đơn hàng'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddOrderModal;
