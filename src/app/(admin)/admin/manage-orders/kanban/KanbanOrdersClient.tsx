'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../../../types';
import KanbanBoard from '@/app/components/admin/kanban/KanbanBoard';
import { Button } from '@mui/material';
import { MdRefresh, MdViewList } from 'react-icons/md';
import Link from 'next/link';

interface KanbanOrdersClientProps {
  orders: any[];
  currentUser: SafeUser | null | undefined;
}

const KanbanOrdersClient: React.FC<KanbanOrdersClientProps> = ({ orders: initialOrders, currentUser }) => {
  const [orders, setOrders] = useState(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Cập nhật orders khi prop thay đổi
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

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

  const handleOrderUpdate = async () => {
    // Tự động refresh sau khi update
    await handleRefresh();
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div>Không có quyền truy cập</div>;
  }

  return (
    <div className='w-[78.5vw] m-auto text-xl mt-6'>
      {/* Header */}
      <div className='px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div></div>
          <div className='flex items-center gap-3'>
            <Link href='/admin/manage-orders'>
              <Button variant='outlined' startIcon={<MdViewList />} size='small'>
                Xem danh sách
              </Button>
            </Link>

            <Button
              variant='contained'
              startIcon={<MdRefresh />}
              onClick={handleRefresh}
              disabled={isLoading}
              size='small'
            >
              {isLoading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard orders={orders} onOrderUpdate={handleOrderUpdate} />
    </div>
  );
};

export default KanbanOrdersClient;
