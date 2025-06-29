'use client';

import { Role, User } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdDelete, MdEdit, MdRemoveRedEye } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminModal from '@/app/components/admin/AdminModal';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import FormWarp from '@/app/components/FormWrap';
import Heading from '@/app/components/Heading';
import 'moment/locale/vi';
import { SafeUser } from '../../../../../types';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import Image from 'next/image';
import Link from 'next/link';
import { Button as MuiButton } from '@mui/material';
import { MdPersonAdd } from 'react-icons/md';
import AddUserModal from '../../../components/admin/AddUserModal';

interface ManageUserClientProps {
  users: User[];
  currentUser: SafeUser | null | undefined;
}
const ManageUserClient: React.FC<ManageUserClientProps> = ({ users, currentUser }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);

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
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: {
      id: '',
      name: '',
      email: '',
      newPassword: '',
      role: ''
    }
  });

  // Hàm cập nhật giá trị id, value: label
  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const handleUserAdded = () => {
    router.refresh(); // Refresh the page to show new user
  };

  const handleOpenModal = (user: any) => {
    setSelectedUser(user);
    // Cập nhật giá trị lên defaultValues
    const fieldsToSet = ['id', 'name', 'email', 'role'];
    fieldsToSet.forEach(field => setCustomValue(field, user[field]));

    toggleOpen();
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

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);
    axios
      .put(`/api/user/${data.id}`, {
        name: data.name,
        email: data.email,
        newPassword: data.newPassword,
        role: data.role
      })
      .then(() => {
        toggleOpen();
        toast.success('Lưu thông tin thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi cập nhật thông tin');
        setIsLoading(false);
        console.error(error);
      })
      .finally(() => {
        setIsLoading(false);
        toggleOpen();
        setValue('newPassword', '');
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
  const roles = [
    { label: 'ADMIN', value: Role.ADMIN },
    { label: 'USER', value: Role.USER }
  ];

  return (
    <>
      <div className='w-[78.5vw] m-auto text-xl mt-6'>
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
          <h2 className='text-xl font-semibold text-gray-800'>Quản lý người dùng</h2>
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
              '& .MuiDataGrid-toolbarContainer': {
                flexDirection: 'row-reverse',
                padding: '15px'
              },
              '& .css-yrdy0g-MuiDataGrid-columnHeaderRow': {
                backgroundColor: '#F6F7FB !important'
              }
            }}
          />
        </div>
      </div>
      {selectedUser && (
        <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
          <FormWarp custom='!pt-8'>
            <Heading title='Cập nhật thông tin' center>
              <></>
            </Heading>
            <Input
              id='name'
              label='Tên người dùng'
              disabled={isLoading}
              register={register}
              errors={errors}
              defaultValue={selectedUser.name}
              required
            />
            <Input
              id='email'
              label='Email'
              disabled={true}
              register={register}
              errors={errors}
              defaultValue={selectedUser.email}
              required
            />
            <Input
              id='newPassword'
              label='Mật khẩu mới'
              disabled={isLoading}
              register={register}
              errors={errors}
              required
            />
            <Input
              id='role'
              label='Role'
              disabled={isLoading}
              type='combobox'
              register={register}
              errors={errors}
              defaultValue={selectedUser.role}
              options={roles}
              required
            />

            <Button label='Lưu thông tin' onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
          </FormWarp>
        </AdminModal>
      )}
      {isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}

      {/* Add User Modal */}
      <AddUserModal open={addUserModalOpen} onClose={() => setAddUserModalOpen(false)} onUserAdded={handleUserAdded} />
    </>
  );
};

export default ManageUserClient;
