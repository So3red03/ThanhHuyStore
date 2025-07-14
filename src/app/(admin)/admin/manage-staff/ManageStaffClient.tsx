'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
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
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import Image from 'next/image';
import Link from 'next/link';
import { Button as MuiButton, Chip } from '@mui/material';
import AddUserModal from '../manage-users/AddUserModal';
import { hasPermission, getRoleDisplayName } from '@/app/utils/admin/permissionUtils';
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
            <Link href={`/admin/manage-staff/view/${params.row.id}`}>{params.row.name}</Link>
          </div>
        );
      }
    },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'role',
      headerName: 'Vai trò',
      width: 120,
      renderCell: params => {
        const roleColor = params.row.role === 'ADMIN' ? 'error' : 'primary';
        return <Chip label={getRoleDisplayName(params.row.role)} color={roleColor} size='small' variant='outlined' />;
      }
    },
    { field: 'phoneNumber', headerName: 'Số điện thoại', width: 140 },
    {
      field: 'emailVerified',
      headerName: 'Email xác thực',
      width: 120,
      renderCell: params => {
        return (
          <Chip
            label={params.row.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
            color={params.row.emailVerified ? 'success' : 'warning'}
            size='small'
            variant='outlined'
          />
        );
      }
    },
    { field: 'createAt', headerName: 'Ngày tạo', width: 150 },
    { field: 'lastLogin', headerName: 'Đăng nhập cuối', width: 150 },
    {
      field: 'action',
      headerName: 'Thao tác',
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
                router.push(`/admin/manage-staff/view/${params.row.id}`);
              }}
            />
          </div>
        );
      }
    }
  ];

  return (
    <div className='max-w-[1150px] m-auto text-xl'>
      <div className='mb-4 mt-8'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-2xl font-bold text-slate-700'>Quản lý nhân viên</h1>
          {canCreateStaff && (
            <MuiButton
              variant='contained'
              startIcon={<MdPersonAdd />}
              onClick={() => {
                setEditStaffData(null);
                setAddStaffModalOpen(true);
              }}
              sx={{
                backgroundColor: '#2563eb',
                '&:hover': {
                  backgroundColor: '#1d4ed8'
                }
              }}
            >
              Thêm nhân viên
            </MuiButton>
          )}
        </div>

        {staffUsers && staffUsers.length > 0 ? (
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 }
                }
              }}
              pageSizeOptions={[5, 10, 20]}
              checkboxSelection={false}
              disableRowSelectionOnClick
            />
          </div>
        ) : (
          <NullData title='Không có nhân viên nào' />
        )}
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
    </div>
  );
};

export default ManageStaffClient;
