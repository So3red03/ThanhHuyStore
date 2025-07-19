'use client';

import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
// import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import ActionBtn from '@/app/components/ActionBtn';
import { MdDelete, MdEdit, MdRemoveRedEye, MdPersonAdd } from 'react-icons/md';
import 'moment/locale/vi';
import { SafeUser } from '../../../../../types';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import Image from 'next/image';
import Link from 'next/link';
import { Button as MuiButton } from '@mui/material';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import AddUserModal from '../manage-users/AddUserModal';
import { hasPermission } from '@/app/utils/admin/permissionUtils';
import { PERMISSIONS } from '@/app/utils/admin/permissions';

interface ManageStaffClientProps {
  staffUsers: any[];
  currentUser: SafeUser | null | undefined;
}

const ManageStaffClient: React.FC<ManageStaffClientProps> = ({ staffUsers, currentUser }) => {
  const router = useRouter();
  const [isDelete, setIsDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [editStaffData, setEditStaffData] = useState<any>(null);

  // Check permissions
  const canCreateStaff = hasPermission(currentUser?.role || 'USER', PERMISSIONS.STAFF_CREATE);
  const canUpdateStaff = hasPermission(currentUser?.role || 'USER', PERMISSIONS.STAFF_UPDATE);
  const canDeleteStaff = hasPermission(currentUser?.role || 'USER', PERMISSIONS.STAFF_DELETE);
  const canViewStaff = hasPermission(currentUser?.role || 'USER', PERMISSIONS.STAFF_VIEW);

  // Calculate statistics
  const totalStaff = staffUsers.length;
  const adminStaff = staffUsers.filter(user => user.role === 'ADMIN').length;
  const regularStaff = staffUsers.filter(user => user.role === 'STAFF').length;
  const recentStaff = staffUsers.filter(user => {
    const userDate = new Date(user.createAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return userDate >= weekAgo;
  }).length;

  const handleDelete = async (id: string) => {
    setIsDelete(false);
    const deleteToastId = toast.loading('Đang xóa nhân viên...');

    try {
      await axios.delete(`/api/admin/staff/${id}`);
      toast.success('Xóa nhân viên thành công', { id: deleteToastId });
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra khi xóa nhân viên', { id: deleteToastId });
    }
  };

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const handleStaffAdded = () => {
    router.refresh(); // Refresh the page to show new staff
  };

  const handleOpenModal = (user: any) => {
    setSelectedUser(user);

    // Prepare edit data for AddStaffModal
    const editData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber
    };

    setEditStaffData(editData);
    setAddStaffModalOpen(true);
  };

  if (!canViewStaff) {
    return <NullData title='Bạn không có quyền xem danh sách nhân viên' />;
  }

  let rows: any = [];
  if (staffUsers) {
    rows = staffUsers.map((user: any) => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        createAt: formatDate(user.createAt),
        updateAt: formatDate(user.updateAt),
        lastLogin: user.lastLogin ? formatDate(user.lastLogin) : 'Chưa đăng nhập',
        emailVerified: user.emailVerified
      };
    });
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Nhân viên',
      width: 200,
      renderCell: params => {
        return (
          <div className='flex items-center justify-stretch gap-4 h-full'>
            <div className='relative h-[40px] w-[40px] rounded-full'>
              <Image
                src={params.row.image || '/no-avatar-2.jpg'}
                fill
                sizes='100%'
                className='rounded-full'
                alt={params.row.name}
              />
            </div>
            <Link href={`/admin/manage-users/view/${params.row.id}`}>{params.row.name}</Link>
          </div>
        );
      }
    },
    { field: 'email', headerName: 'Email', width: 210 },
    {
      field: 'role',
      headerName: 'Vai trò',
      width: 90,
      renderCell: params => {
        return params.row.role === 'ADMIN' ? (
          <span className='bg-red-200 text-rose-500 text-xs font-semibold px-2 py-1 rounded-full mt-4'>ADMIN</span>
        ) : (
          <span className='bg-blue-200 text-blue-500 text-xs font-semibold px-2 py-1 rounded-full mt-4'>STAFF</span>
        );
      }
    },
    { field: 'createAt', headerName: 'Ngày tạo', width: 200 },
    { field: 'updateAt', headerName: 'Ngày cập nhật', width: 200 },
    { field: 'lastLogin', headerName: 'Lần cuối đăng nhập', width: 200 },
    {
      field: 'action',
      headerName: '',
      width: 180,
      renderCell: params => {
        return (
          <div className='flex items-center justify-center gap-4 h-full'>
            {canUpdateStaff && (
              <ActionBtn
                icon={MdEdit}
                onClick={() => {
                  handleOpenModal(params.row);
                }}
              />
            )}
            {canDeleteStaff && params.row.id !== currentUser?.id && (
              <ActionBtn
                icon={MdDelete}
                onClick={() => {
                  setSelectedUser(params.row);
                  toggleDelete();
                }}
              />
            )}
            <ActionBtn
              icon={MdRemoveRedEye}
              onClick={() => {
                router.push(`/admin/manage-users/view/${params.row.id}`);
              }}
            />
          </div>
        );
      }
    }
  ];

  return (
    <>
      <div className='w-full m-auto text-xl mt-6'>
        {/* Header with Add Staff Button */}
        <div className='mb-4 mt-3 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'></h2>
          {canCreateStaff && (
            <MuiButton
              variant='contained'
              startIcon={<MdPersonAdd />}
              onClick={() => setAddStaffModalOpen(true)}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              Thêm nhân viên
            </MuiButton>
          )}
        </div>

        <div className='h-[600px] w-full'>
          <DataGrid
            rows={rows}
            columns={columns}
            className='py-5'
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 }
              }
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 }
              }
            }}
            pageSizeOptions={[10, 20, 30]}
            checkboxSelection
            disableRowSelectionOnClick
            disableColumnFilter
            disableDensitySelector
            disableColumnSelector
            sx={{
              border: '1px solid #e5e7eb',
              borderRadius: 2,
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #e5e7eb'
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8fafc', // slate-50
                borderBottom: '1px solid #e2e8f0'
              },
              '& .MuiDataGrid-toolbarContainer': {
                flexDirection: 'row-reverse',
                padding: '15px'
              },
              '& .MuiDataGrid-columnHeaderRow': {
                backgroundColor: '#f6f7fb'
              }
            }}
          />
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      <AddUserModal
        open={addStaffModalOpen}
        onClose={() => {
          setAddStaffModalOpen(false);
          setEditStaffData(null);
        }}
        onUserAdded={handleStaffAdded}
        editData={editStaffData}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={() => handleDelete(selectedUser?.id)}>
        <div>
          <h3>Xác nhận xóa nhân viên</h3>
          <p>{`Bạn có chắc chắn muốn xóa nhân viên "${selectedUser?.name}"? Hành động này không thể hoàn tác.`}</p>
        </div>
      </ConfirmDialog>
    </>
  );
};

export default ManageStaffClient;
