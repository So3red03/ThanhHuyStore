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
import AddPromotionModal from './AddPromotionModal';
import { SafeUser } from '../../../../../types';

interface ManagePromotionsClientProps {
  promotions: any[];
  products: any[];
  categories: any[];
  currentUser: SafeUser | null | undefined;
}

const ManagePromotionsClient: React.FC<ManagePromotionsClientProps> = ({
  promotions,
  products,
  categories,
  currentUser
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
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

  const handleOpenEditModal = (promotion: any) => {
    setSelectedPromotion(promotion);
    toggleEditModal();
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;

    setIsLoading(true);
    try {
      await axios.delete(`/api/promotion/${selectedPromotion.id}`);
      toast.success('Xóa promotion thành công');
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa promotion');
    } finally {
      setIsLoading(false);
      toggleDelete();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      await axios.put(`/api/promotion/${id}`, { isActive: !currentStatus });
      toast.success(`${!currentStatus ? 'Kích hoạt' : 'Tạm dừng'} promotion thành công`);
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái promotion');
    } finally {
      setIsLoading(false);
    }
  };

  let rows: any = [];
  if (promotions) {
    rows = promotions.map(promotion => {
      return {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscount: promotion.maxDiscount,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive,
        applyToAll: promotion.applyToAll,
        productCount: promotion.products?.length || 0,
        categoryCount: promotion.categories?.length || 0,
        createdAt: promotion.createdAt
      };
    });
  }

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Tên chiến dịch', width: 200 },
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
      field: 'scope',
      headerName: 'Phạm vi',
      width: 150,
      renderCell: params => {
        if (params.row.applyToAll) {
          return <Status text='Toàn bộ' bg='bg-blue-200' color='text-blue-700' />;
        }
        return (
          <div className='text-sm'>
            <div>{params.row.productCount} sản phẩm</div>
            <div>{params.row.categoryCount} danh mục</div>
          </div>
        );
      }
    },
    {
      field: 'startDate',
      headerName: 'Bắt đầu',
      width: 100,
      renderCell: params => {
        return <div className='text-sm'>{formatDate(params.row.startDate)}</div>;
      }
    },
    {
      field: 'endDate',
      headerName: 'Kết thúc',
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
      width: 150,
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
                setSelectedPromotion(params.row);
                toggleDelete();
              }}
            />
          </div>
        );
      }
    }
  ];

  if (!promotions || promotions.length === 0) {
    return (
      <div className='flex flex-col gap-4'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Quản lý Promotion</h1>
          <button
            onClick={toggleAddModal}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Thêm Promotion
          </button>
        </div>
        <NullData title='Chưa có promotion nào được tạo' />
        <AddPromotionModal
          isOpen={isAddModalOpen}
          toggleOpen={toggleAddModal}
          products={products}
          categories={categories}
        />
      </div>
    );
  }

  return (
    <div className='max-w-[1150px] m-auto text-xl'>
      <div className='mb-4 mt-8 flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>Quản lý Promotion</h1>
        <button
          onClick={toggleAddModal}
          className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
        >
          Thêm Promotion
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
        {`Bạn có chắc chắn muốn xóa promotion "${selectedPromotion?.title}"? Hành động này không thể hoàn tác.`}
      </ConfirmDialog>

      <AddPromotionModal
        isOpen={isAddModalOpen}
        toggleOpen={toggleAddModal}
        products={products}
        categories={categories}
      />

      {selectedPromotion && (
        <AddPromotionModal
          isOpen={isEditModalOpen}
          toggleOpen={toggleEditModal}
          products={products}
          categories={categories}
          promotion={selectedPromotion}
          isEdit={true}
        />
      )}
    </div>
  );
};

export default ManagePromotionsClient;
