'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../../../types';
import KanbanBoard from '@/app/components/admin/kanban/KanbanBoard';
import { Button, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Chip, Box } from '@mui/material';
import { MdRefresh, MdViewList, MdClear, MdAdd } from 'react-icons/md';
import Link from 'next/link';
import AddOrderModal from '../AddOrderModal';
import { canTransitionOrderStatus, canTransitionDeliveryStatus } from '@/app/utils/orderStatusValidation';

interface KanbanOrdersClientProps {
  orders: any[];
  currentUser: SafeUser | null | undefined;
  users?: any[];
  products?: any[];
}

const KanbanOrdersClient: React.FC<KanbanOrdersClientProps> = ({
  orders: initialOrders,
  currentUser,
  users = [],
  products = []
}) => {
  const [orders, setOrders] = useState(initialOrders);
  const [filteredOrders, setFilteredOrders] = useState(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Advanced search states
  const [searchType, setSearchType] = useState('orderCode');
  const [searchValues, setSearchValues] = useState<string[]>([]);
  const [currentSearchInput, setCurrentSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [salesStaff, setSalesStaff] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);

  // Helper function for consistent shipping method
  const getShippingMethod = (orderId: string) => {
    const hash = orderId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash) % 2 === 0 ? 'Giao hàng tiết kiệm' : 'Giao hàng nhanh';
  };

  // Cập nhật orders khi prop thay đổi
  useEffect(() => {
    setOrders(initialOrders);
    setFilteredOrders(initialOrders);
  }, [initialOrders]);

  // Advanced filter logic
  useEffect(() => {
    let filtered = [...orders];

    // Filter by search values
    if (searchValues.length > 0) {
      filtered = filtered.filter(order => {
        return searchValues.some(searchValue => {
          const value = searchValue.toLowerCase();
          switch (searchType) {
            case 'orderCode':
              return order.id.toLowerCase().includes(value);
            case 'productName':
              return order.products?.some((product: any) => product.name?.toLowerCase().includes(value));
            case 'customerName':
              return order.user?.name?.toLowerCase().includes(value);
            case 'salesStaff':
              return 'admin'.toLowerCase().includes(value); // Fixed as admin
            default:
              return false;
          }
        });
      });
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
        return true;
      });
    }

    // Filter by sales staff
    if (salesStaff) {
      // Since we only have admin, filter accordingly
      filtered = salesStaff.toLowerCase() === 'admin' ? filtered : [];
    }

    // Filter by payment method
    if (paymentMethod) {
      filtered = filtered.filter(order => (order.paymentMethod || 'cod').toLowerCase() === paymentMethod.toLowerCase());
    }

    // Filter by shipping method
    if (shippingMethod) {
      filtered = filtered.filter(order => {
        const orderShipping = getShippingMethod(order.id);
        return orderShipping.toLowerCase().includes(shippingMethod.toLowerCase());
      });
    }

    setFilteredOrders(filtered);
  }, [orders, searchValues, searchType, dateFrom, dateTo, salesStaff, paymentMethod, shippingMethod]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [currentUser, router]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Fetch fresh data
      const response = await fetch('/api/orders');
      if (response.ok) {
        const freshOrders = await response.json();
        setOrders(freshOrders);
        // Filter will be applied automatically via useEffect
      } else {
        // Fallback to router refresh
        router.refresh();
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  // Add search value
  const handleAddSearchValue = () => {
    if (currentSearchInput.trim() && !searchValues.includes(currentSearchInput.trim())) {
      setSearchValues([...searchValues, currentSearchInput.trim()]);
      setCurrentSearchInput('');
    }
  };

  // Remove search value
  const handleRemoveSearchValue = (valueToRemove: string) => {
    setSearchValues(searchValues.filter(value => value !== valueToRemove));
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchValues([]);
    setCurrentSearchInput('');
    setDateFrom('');
    setDateTo('');
    setSalesStaff('');
    setPaymentMethod('');
    setShippingMethod('');
  };

  // Handle Enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSearchValue();
    }
  };

  const handleOrderUpdate = async () => {
    // Tự động refresh sau khi update
    await handleRefresh();
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div>Không có quyền truy cập</div>;
  }

  return (
    <div className='w-[78.5vw] m-auto text-xl mt-6'>
      {/* Advanced Search Form */}
      <div>
        <div className='px-6 py-5'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'></div>
            <div className='flex items-center gap-3'>
              <Link href='/admin/manage-orders'>
                <Button
                  variant='outlined'
                  startIcon={<MdViewList />}
                  className='text-blue-600 border-blue-600 hover:bg-blue-50'
                >
                  Xem danh sách
                </Button>
              </Link>
              {/* Add Order Button */}
              <Button
                variant='contained'
                startIcon={<MdAdd />}
                onClick={() => setIsAddOrderModalOpen(true)}
                size='medium'
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                }}
              >
                Thêm đơn hàng
              </Button>
              <Button
                variant='contained'
                startIcon={<MdRefresh />}
                onClick={handleRefresh}
                size='medium'
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': { backgroundColor: '#2563eb' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                }}
              >
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </div>
          </div>

          {/* Search Form */}
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6'>
              {/* Search Type & Input */}
              <div className='lg:col-span-2'>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>Tìm kiếm</label>
                <div className='flex gap-3'>
                  <FormControl size='medium' sx={{ minWidth: 160 }}>
                    <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#3b82f6' } }}>Tìm theo</InputLabel>
                    <Select
                      value={searchType}
                      onChange={e => setSearchType(e.target.value)}
                      label='Tìm theo'
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          '& fieldset': {
                            borderColor: '#e5e7eb'
                          },
                          '&:hover fieldset': {
                            borderColor: '#d1d5db'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6'
                          }
                        }
                      }}
                    >
                      <MenuItem value='orderCode'>Mã đơn hàng</MenuItem>
                      <MenuItem value='productName'>Tên sản phẩm</MenuItem>
                      <MenuItem value='customerName'>Tên khách hàng</MenuItem>
                      <MenuItem value='salesStaff'>Tên người bán</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size='medium'
                    placeholder='Nhập từ khóa tìm kiếm...'
                    value={currentSearchInput}
                    onChange={e => setCurrentSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        color: '#111827', // ✅ màu chữ mặc định
                        '& fieldset': {
                          borderColor: '#e5e7eb'
                        },
                        '&:hover fieldset': {
                          borderColor: '#d1d5db'
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#ffffff',
                          color: '#111827', // ✅ màu chữ khi focus
                          '& fieldset': {
                            borderColor: '#3b82f6'
                          }
                        },
                        '& input::placeholder': {
                          color: '#9ca3af', // ✅ placeholder màu xám (text-gray-400)
                          opacity: 1 // ✅ hiển thị rõ ràng
                        }
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <Button
                            size='medium'
                            onClick={handleAddSearchValue}
                            disabled={!currentSearchInput.trim()}
                            startIcon={<MdAdd />}
                            variant='contained'
                            sx={{
                              minWidth: 'auto',
                              px: 2,
                              backgroundColor: '#10b981',
                              '&:hover': {
                                backgroundColor: '#059669'
                              },
                              borderRadius: '6px',
                              boxShadow: '0 2px 4px -1px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            Thêm
                          </Button>
                        </InputAdornment>
                      )
                    }}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>Từ ngày</label>
                <input
                  type='date'
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>Đến ngày</label>
                <input
                  type='date'
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200'
                />
              </div>
            </div>

            {/* Additional Filters */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>Người bán</label>
                <FormControl fullWidth size='medium'>
                  <Select
                    value={salesStaff}
                    onChange={e => setSalesStaff(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e5e7eb'
                        },
                        '&:hover fieldset': {
                          borderColor: '#d1d5db'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3b82f6',
                          backgroundColor: '#ffffff'
                        }
                      }
                    }}
                  >
                    <MenuItem value=''>Tất cả</MenuItem>
                    <MenuItem value='admin'>👨‍💼 Admin</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>Thanh toán</label>
                <FormControl fullWidth size='medium'>
                  <Select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e5e7eb'
                        },
                        '&:hover fieldset': {
                          borderColor: '#d1d5db'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3b82f6',
                          backgroundColor: '#ffffff'
                        }
                      }
                    }}
                  >
                    <MenuItem value=''>Tất cả</MenuItem>
                    <MenuItem value='cod'>💵 COD</MenuItem>
                    <MenuItem value='momo'>📱 MoMo</MenuItem>
                    <MenuItem value='stripe'>💳 Stripe</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>Vận chuyển</label>
                <FormControl fullWidth size='medium'>
                  <Select
                    value={shippingMethod}
                    onChange={e => setShippingMethod(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: '#f9fafb',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#e5e7eb'
                        },
                        '&:hover fieldset': {
                          borderColor: '#d1d5db'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#3b82f6',
                          backgroundColor: '#ffffff'
                        }
                      }
                    }}
                  >
                    <MenuItem value=''>Tất cả</MenuItem>
                    <MenuItem value='tiết kiệm'>🐌 Giao hàng tiết kiệm</MenuItem>
                    <MenuItem value='nhanh'>⚡ Giao hàng nhanh</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Search Values Display */}
            {searchValues.length > 0 && (
              <div className='mb-6'>
                <label className='block text-sm font-semibold text-gray-700 mb-3'>Từ khóa tìm kiếm:</label>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {searchValues.map((value, index) => (
                    <Chip
                      key={index}
                      label={value}
                      onDelete={() => handleRemoveSearchValue(value)}
                      size='medium'
                      sx={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderColor: '#3b82f6',
                        '& .MuiChip-deleteIcon': {
                          color: '#1e40af',
                          '&:hover': {
                            color: '#dc2626'
                          }
                        },
                        '&:hover': {
                          backgroundColor: '#bfdbfe'
                        }
                      }}
                      variant='outlined'
                    />
                  ))}
                </Box>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex justify-between items-center'>
              {/* Clear All Button */}
              {(searchValues.length > 0 || dateFrom || dateTo || salesStaff || paymentMethod || shippingMethod) && (
                <Button
                  variant='outlined'
                  onClick={handleClearAllFilters}
                  size='medium'
                  startIcon={<MdClear />}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626'
                    }
                  }}
                >
                  Xóa tất cả bộ lọc
                </Button>
              )}

              {/* Search Results Info */}
              {(searchValues.length > 0 || dateFrom || dateTo || salesStaff || paymentMethod || shippingMethod) && (
                <div className='px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg'>
                  <div className='text-sm font-medium text-green-800'>
                    🎯 <strong>Kết quả</strong> {filteredOrders.length} đơn hàng
                    {filteredOrders.length === 0 && (
                      <span className='text-red-600 ml-2'>- Không tìm thấy đơn hàng nào phù hợp</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        orders={filteredOrders}
        onOrderUpdate={handleOrderUpdate}
        canTransitionOrderStatus={canTransitionOrderStatus}
        canTransitionDeliveryStatus={canTransitionDeliveryStatus}
      />

      {/* Add Order Modal */}
      <AddOrderModal
        isOpen={isAddOrderModalOpen}
        toggleOpen={() => setIsAddOrderModalOpen(false)}
        users={users}
        products={products}
      />
    </div>
  );
};

export default KanbanOrdersClient;
