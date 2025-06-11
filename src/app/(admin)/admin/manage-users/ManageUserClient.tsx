'use client';

import { User } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdDelete, MdEdit, MdRemoveRedEye } from 'react-icons/md';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';
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
    await toast('Đang xóa tài khoản, xin chờ...');

    axios
      .delete(`/api/user/${id}`)
      .then(res => {
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
      .then(res => {
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
      title: 'Session',
      count: '21,459',
      change: '+29%',
      description: 'Tổng người dùng',
      icon: 'fa fa-user',
      iconColor: 'text-primary',
      changeColor: 'text-success'
    },
    {
      title: 'Paid Users',
      count: '4,567',
      change: '+18%',
      description: 'Last Week Analytics',
      icon: 'ri-user-add-line',
      iconColor: 'text-red-500',
      changeColor: 'text-success'
    },
    {
      title: 'Active Users',
      count: '19,860',
      change: '-14%',
      description: 'Last Week Analytics',
      icon: 'ri-user-follow-line',
      iconColor: 'text-green-500',
      changeColor: 'text-red-500'
    },
    {
      title: 'Pending Users',
      count: '237',
      change: '+42%',
      description: 'Last Week Analytics',
      icon: 'ri-user-search-line',
      iconColor: 'text-yellow-500',
      changeColor: 'text-success'
    }
  ];
  const roles = [
    { label: 'ADMIN', value: '1' },
    { label: 'USER', value: '2' }
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
        <div className='mb-4 mt-5' />
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
    </>
  );
};

export default ManageUserClient;
