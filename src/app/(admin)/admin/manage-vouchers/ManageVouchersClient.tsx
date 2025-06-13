'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { formatPrice } from '../../../../../utils/formatPrice';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import ActionBtn from '@/app/components/ActionBtn';
import { MdDelete, MdEdit, MdClose, MdCheck } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Status from '@/app/components/Status';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import AddVoucherModal from './AddVoucherModal';
import { SafeUser } from '../../../../../types';

interface ManageVouchersClientProps {
  vouchers: any[];
  users: any[];
  currentUser: SafeUser | null | undefined;
}

const ManageVouchersClient: React.FC<ManageVouchersClientProps> = ({ vouchers, users, currentUser }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isDelete, setIsDelete] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  const toggleEditModal = () => {
    setIsEditModalOpen(!isEditModalOpen);
  };

  const handleOpenEditModal = (voucher: any) => {
    setSelectedVoucher(voucher);
    toggleEditModal();
  };

  const handleDelete = async () => {
    if (!selectedVoucher) return;

    setIsLoading(true);
    try {
      await axios.delete(`/api/voucher/${selectedVoucher.id}`);
      toast.success('Xóa voucher thành công');
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa voucher');
    } finally {
      setIsLoading(false);
      toggleDelete();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      await axios.put(`/api/voucher/${id}`, { isActive: !currentStatus });
      toast.success(`${!currentStatus ? 'Kích hoạt' : 'Tạm dừng'} voucher thành công`);
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái voucher');
    } finally {
      setIsLoading(false);
    }
  };

  let rows: any = [];
  if (vouchers) {
    rows = vouchers.map(voucher => {
      const usageCount = voucher.userVouchers?.length || 0;
      const usagePercentage = voucher.quantity > 0 ? (usageCount / voucher.quantity) * 100 : 0;

      return {
        id: voucher.id,
        code: voucher.code,
        description: voucher.description,
        image: voucher.image,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minOrderValue: voucher.minOrderValue,
        maxDiscount: voucher.maxDiscount,
        quantity: voucher.quantity,
        usedCount: usageCount,
        usagePercentage: usagePercentage.toFixed(1),
        maxUsagePerUser: voucher.maxUsagePerUser,
        startDate: voucher.startDate,
        endDate: voucher.endDate,
        isActive: voucher.isActive,
        voucherType: voucher.voucherType,
        createdAt: voucher.createdAt
      };
    });
  }

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Mã Voucher', width: 120 },
    { field: 'description', headerName: 'Mô tả', width: 200 },
    {
      field: 'discountValue',
      headerName: 'Giá trị',
      width: 100,
      renderCell: params => {
        const isPercentage = params.row.discountType === 'PERCENTAGE';
        return (
          <div className='font-semibold'>
            {isPercentage ? `${params.row.discountValue}%` : formatPrice(params.row.discountValue)}
          </div>
        );
      }
    },
    {
      field: 'minOrderValue',
      headerName: 'Đơn tối thiểu',
      width: 120,
      renderCell: params => {
        return params.row.minOrderValue ? formatPrice(params.row.minOrderValue) : 'Không';
      }
    },
    {
      field: 'usage',
      headerName: 'Sử dụng',
      width: 120,
      renderCell: params => {
        return (
          <div className='text-center'>
            <div className='text-sm font-semibold'>
              {params.row.usedCount}/{params.row.quantity}
            </div>
            <div className='text-xs text-gray-500'>({params.row.usagePercentage}%)</div>
          </div>
        );
      }
    },
    {
      field: 'voucherType',
      headerName: 'Loại',
      width: 100,
      renderCell: params => {
        const typeColors: { [key: string]: { bg: string; color: string } } = {
          NEW_USER: { bg: 'bg-blue-200', color: 'text-blue-700' },
          RETARGETING: { bg: 'bg-purple-200', color: 'text-purple-700' },
          UPSELL: { bg: 'bg-green-200', color: 'text-green-700' },
          LOYALTY: { bg: 'bg-yellow-200', color: 'text-yellow-700' },
          EVENT: { bg: 'bg-red-200', color: 'text-red-700' },
          GENERAL: { bg: 'bg-gray-200', color: 'text-gray-700' }
        };
        const typeColor = typeColors[params.row.voucherType] || typeColors.GENERAL;
        return <Status text={params.row.voucherType} bg={typeColor.bg} color={typeColor.color} />;
      }
    },
    {
      field: 'endDate',
      headerName: 'Hết hạn',
      width: 100,
      renderCell: params => {
        const endDate = new Date(params.row.endDate);
        const now = new Date();
        const isExpired = endDate < now;
        return (
          <div className={`text-sm ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {formatDate(params.row.endDate)}
          </div>
        );
      }
    },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      width: 100,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full'>
            {params.row.isActive ? (
              <Status text='Hoạt động' icon={MdCheck} bg='bg-teal-200' color='text-teal-700' />
            ) : (
              <Status text='Tạm dừng' icon={MdClose} bg='bg-rose-200' color='text-rose-700' />
            )}
          </div>
        );
      }
    },
    {
      field: 'action',
      headerName: 'Thao tác',
      width: 200,
      renderCell: params => {
        return (
          <div className='flex items-center justify-center gap-2 h-full'>
            <ActionBtn icon={MdEdit} onClick={() => handleOpenEditModal(params.row)} />
            <ActionBtn
              icon={params.row.isActive ? MdClose : MdCheck}
              onClick={() => handleToggleStatus(params.row.id, params.row.isActive)}
            />
            <ActionBtn
              icon={MdDelete}
              onClick={() => {
                setSelectedVoucher(params.row);
                toggleDelete();
              }}
            />
          </div>
        );
      }
    }
  ];

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className='flex flex-col gap-4'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Quản lý Voucher</h1>
          <button
            onClick={toggleAddModal}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Thêm Voucher
          </button>
        </div>
        <NullData title='Chưa có voucher nào được tạo' />
        <AddVoucherModal isOpen={isAddModalOpen} toggleOpen={toggleAddModal} users={users} />
      </div>
    );
  }

  return (
    <div className='max-w-[1150px] m-auto text-xl'>
      <div className='mb-4 mt-8 flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Quản lý Voucher</h1>
        <button
          onClick={toggleAddModal}
          className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
        >
          Thêm Voucher
        </button>
      </div>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 9 }
            }
          }}
          pageSizeOptions={[9, 20]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </div>

      <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleDelete}>
        {`Bạn có chắc chắn muốn xóa voucher "${selectedVoucher?.code}"? Hành động này không thể hoàn tác.`}
      </ConfirmDialog>

      <AddVoucherModal isOpen={isAddModalOpen} toggleOpen={toggleAddModal} users={users} />

      {selectedVoucher && (
        <AddVoucherModal
          isOpen={isEditModalOpen}
          toggleOpen={toggleEditModal}
          users={users}
          voucher={selectedVoucher}
          isEdit={true}
        />
      )}
    </div>
  );
};

export default ManageVouchersClient;
