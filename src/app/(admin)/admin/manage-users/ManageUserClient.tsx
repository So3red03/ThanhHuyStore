'use client';

import { Role, User } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdDelete, MdEdit, MdRemoveRedEye } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';

import 'moment/locale/vi';
import { SafeUser } from '../../../../../types';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import Image from 'next/image';
import Link from 'next/link';
import { Button as MuiButton } from '@mui/material';
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
    // { field: 'password', headerName: 'Mật khẩu', width: 140 },
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
  const stats = [
    {
      title: 'Tổng người dùng',
      count: totalUsers.toLocaleString(),
      change: '+29%',
      description: 'Tổng số người dùng trong hệ thống',
      icon: 'fa fa-user',
      iconColor: 'text-blue-500',
      changeColor: 'text-green-500'
    },
    {
      title: 'Quản trị viên',
      count: adminUsers.toLocaleString(),
      change: '+18%',
      description: 'Số lượng quản trị viên',
      icon: 'ri-user-add-line',
      iconColor: 'text-red-500',
      changeColor: 'text-green-500'
    },
    {
      title: 'Người dùng thường',
      count: regularUsers.toLocaleString(),
      change: '-14%',
      description: 'Số lượng người dùng thường',
      icon: 'ri-user-follow-line',
      iconColor: 'text-green-500',
      changeColor: 'text-red-500'
    },
    {
      title: 'Người dùng mới',
      count: recentUsers.toLocaleString(),
      change: '+42%',
      description: 'Người dùng đăng ký trong 7 ngày qua',
      icon: 'ri-user-search-line',
      iconColor: 'text-yellow-500',
      changeColor: 'text-green-500'
    }
  ];

  return (
    <>
      <div className='w-full m-auto text-xl mt-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-3 pr-0 border border-r-0 border-gray-200 rounded-lg'>
          {stats.map((stat, index) => (
            <div
              key={index}
              className='bg-white p-4 border-r border-r-gray-200 border-b border-b-gray-200 md:border-b-0'
            >
              <div className='flex justify-between'>
                <div className='flex flex-col gap-y-2'>
                  <h5 className='text-gray-500 text-sm'>{stat.title}</h5>
                  <div className='text-2xl'>
                    {stat.count}
                    <span className={`ml-2 text-base font-medium ${stat.changeColor}`}>{stat.change}</span>
                  </div>
                  <p className='text-gray-400 text-sm'>{stat.description}</p>
                </div>
                <div
                  className={`flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 ${stat.iconColor}`}
                >
                  <i className={`${stat.icon} text-2xl`} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Header with Add User Button */}
        <div className='mb-4 mt-5 flex justify-between items-center'>
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
    </>
  );
};

export default ManageUserClient;
