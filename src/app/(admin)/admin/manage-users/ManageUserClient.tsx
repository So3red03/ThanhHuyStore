'use client';

import { Role, User } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdDelete, MdEdit, MdRemoveRedEye, MdBlock, MdLockOpen } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';

import 'moment/locale/vi';
import { SafeUser } from '../../../../../types';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import BlockUserModal from '@/app/components/admin/BlockUserModal';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import Image from 'next/image';
import Link from 'next/link';
import { Button as MuiButton, Chip } from '@mui/material';
import { MdPersonAdd } from 'react-icons/md';
import AddUserModal from './AddUserModal';

interface ManageUserClientProps {
  users: User[];
  currentUser: SafeUser | null | undefined;
}
const ManageUserClient: React.FC<ManageUserClientProps> = ({ users, currentUser }) => {
  const router = useRouter();
  const [isDelete, setIsDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<any>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState<User | null>(null);

  // Calculate statistics
  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.role === 'ADMIN').length;
  const regularUsers = users.filter(user => user.role === 'USER').length;
  const recentUsers = users.filter(user => {
    const userDate = new Date(user.createAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return userDate >= weekAgo;
  }).length;

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const handleUserAdded = () => {
    router.refresh(); // Refresh the page to show new user
  };

  const handleOpenModal = (user: any) => {
    setSelectedUser(user);

    // Prepare edit data for AddUserModal
    const editData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    setEditUserData(editData);
    setAddUserModalOpen(true);
  };

  // Handle block/unblock user
  const handleBlockUser = (user: User) => {
    setSelectedUserForBlock(user);
    setBlockModalOpen(true);
  };

  const handleBlockSuccess = () => {
    setBlockModalOpen(false);
    setSelectedUserForBlock(null);
    router.refresh(); // Refresh to show updated status
  };

  let rows: any = [];
  if (users) {
    rows = users.map((user: any) => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.hashedPassword,
        createAt: formatDate(user.createAt),
        updateAt: formatDate(user.updateAt),
        lastLogin: user.lastLogin ? formatDate(user.lastLogin) : 'Chưa đăng nhập',
        isBlocked: user.isBlocked,
        role: user.role
      };
    });
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Người dùng',
      width: 200,
      renderCell: params => {
        return (
          <div className='flex items-center justify-stretch gap-4 h-full'>
            <div className='relative h-[40px] w-[40px] rounded-full'>
              <Image src='/no-avatar-2.jpg' fill sizes='100%' className='rounded-full' alt={params.row.name} />
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
          <span className='bg-green-200 text-green-500 text-xs font-semibold px-2 py-1 rounded-full mt-4'>USER</span>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: params => {
        const isBlocked = params.row.isBlocked;
        return (
          <Chip
            label={isBlocked ? 'Đã khóa' : 'Hoạt động'}
            color={isBlocked ? 'error' : 'success'}
            variant='outlined'
            size='small'
            icon={isBlocked ? <MdBlock /> : <MdLockOpen />}
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-icon': {
                fontSize: '0.875rem'
              }
            }}
          />
        );
      }
    },
    // { field: 'password', headerName: 'Mật khẩu', width: 140 },
    { field: 'createAt', headerName: 'Ngày tạo', width: 200 },
    { field: 'updateAt', headerName: 'Ngày cập nhật', width: 200 },
    { field: 'lastLogin', headerName: 'Lần cuối đăng nhập', width: 200 },
    {
      field: 'action',
      headerName: '',
      width: 240,
      renderCell: params => {
        const isBlocked = params.row.isBlocked;
        const isCurrentUser = params.row.id === currentUser?.id;
        const isAdmin = params.row.role === 'ADMIN';
        const canBlock = !isCurrentUser && (currentUser?.role === 'ADMIN' || !isAdmin);

        return (
          <div className='flex items-center justify-center gap-2 h-full'>
            <ActionBtn
              icon={MdEdit}
              onClick={() => {
                handleOpenModal(params.row);
              }}
            />
            <ActionBtn
              icon={MdDelete}
              onClick={() => {
                setSelectedUser(params.row);
                toggleDelete();
              }}
            />
            <ActionBtn
              icon={MdRemoveRedEye}
              onClick={() => {
                router.push(`/admin/manage-users/view/${params.row.id}`);
              }}
            />
            {canBlock && (
              <div
                className={`${
                  isBlocked
                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                } transition-colors duration-200 rounded`}
              >
                <ActionBtn icon={isBlocked ? MdLockOpen : MdBlock} onClick={() => handleBlockUser(params.row)} />
              </div>
            )}
          </div>
        );
      }
    }
  ];

  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (selectedUser) {
      await handleDelete(selectedUser.id);
    }
    toggleDelete();
  };

  const handleDelete = async (id: string) => {
    toast('Đang xóa tài khoản, xin chờ...');

    axios
      .delete(`/api/user/${id}`)
      .then(() => {
        toast.success('Xóa tài khoản thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi xóa');
        console.error(error);
      });
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <NullData title='Từ chối đăng nhập' />;
  }

  return (
    <>
      <div className='w-full m-auto text-xl mt-6'>
        {/* Header with Add User Button */}
        <div className='mb-4 mt-3 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'></h2>
          <MuiButton
            variant='contained'
            startIcon={<MdPersonAdd />}
            onClick={() => setAddUserModalOpen(true)}
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
            Thêm người dùng
          </MuiButton>
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

      {isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}

      {/* Add/Edit User Modal */}
      <AddUserModal
        open={addUserModalOpen}
        onClose={() => {
          setAddUserModalOpen(false);
          setEditUserData(null);
        }}
        onUserAdded={handleUserAdded}
        editData={editUserData}
      />

      {/* Block/Unblock User Modal */}
      <BlockUserModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        user={selectedUserForBlock}
        onSuccess={handleBlockSuccess}
      />
    </>
  );
};

export default ManageUserClient;
