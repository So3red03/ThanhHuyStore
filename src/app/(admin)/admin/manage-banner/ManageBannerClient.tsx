'use client';

import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { Banner } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdDelete, MdEdit, MdAdd } from 'react-icons/md';
import { Button as MuiButton } from '@mui/material';
import AddBannerModal from './AddBannerModal';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteObject, getStorage, ref } from 'firebase/storage';
import { SafeUser } from '../../../../../types';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import Status from '@/app/components/Status';
import firebase from '../../../libs/firebase';
import AdminModal from '@/app/components/admin/AdminModal';
import FormWarp from '@/app/components/FormWrap';
import Heading from '@/app/components/Heading';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import 'moment/locale/vi';
import NullData from '@/app/components/NullData';
import Image from 'next/image';
import { formatDateNoTime } from '@/app/(home)/account/orders/OrdersClient';
import ConfirmDialog from '@/app/components/ConfirmDialog';

const formatDateToInput = (date: Date | string) => {
  const d = new Date(date);
  const day = `0${d.getDate()}`.slice(-2);
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const year = d.getFullYear();
  return `${year}-${month}-${day}`; // Định dạng yyyy-MM-dd để set giá trị cho input
};

interface ManageBannerProps {
  currentUser: SafeUser | null | undefined;
  bannerData: any;
}

const ManageBanner: React.FC<ManageBannerProps> = ({ currentUser, bannerData }) => {
  const router = useRouter();
  // TODO: Remove unused code
  /*
  const storage = getStorage(firebase);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerImage, setBannerImage] = useState<File | string | null>(null);
  const [bannerResImage, setBannerResImage] = useState<File | string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FieldValues>({
    defaultValues: {
      id: '',
      name: '',
      description: '',
      image: '',
      imageResponsive: '',
      status: '',
      startDate: '',
      endDate: ''
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
  */

  const [isDelete, setIsDelete] = useState(false);
  const [selectedBanner, setselectedBanner] = useState<Banner | null>(null);
  const [addBannerModalOpen, setAddBannerModalOpen] = useState(false);
  const [editBannerData, setEditBannerData] = useState<any>(null);

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const handleOpenModal = (banner: any) => {
    setselectedBanner(banner);

    // Prepare edit data for AddBannerModal
    const editData = {
      id: banner.id,
      title: banner.name,
      description: banner.description,
      link: banner.link || '',
      image: banner.image,
      resImage: banner.imageResponsive,
      startDate: formatDateToInput(banner.startDate),
      endDate: formatDateToInput(banner.endDate),
      isActive: banner.status === 'active'
    };

    setEditBannerData(editData);
    setAddBannerModalOpen(true);
  };

  // TODO: Remove unused code
  /*
  useEffect(() => {
    if (selectedBanner) {
      setCustomValue('startDate', formatDateToInput(selectedBanner.startDate));
      setCustomValue('endDate', formatDateToInput(selectedBanner.endDate));
    }
  }, [selectedBanner]);
  */

  let rows: any = [];
  if (bannerData) {
    rows = bannerData.map((banner: any) => {
      return {
        id: banner.id,
        name: banner.name,
        description: banner.description,
        image: banner.image,
        imageResponsive: banner.imageResponsive,
        status: banner.status,
        startDate: banner.startDate,
        endDate: banner.endDate
      };
    });
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên sản phẩm', width: 130 },
    { field: 'description', headerName: 'Mô tả', width: 150 },
    {
      field: 'image',
      headerName: 'Ảnh quảng cáo',
      width: 110,
      renderCell: params => (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Image alt='Ảnh sản phẩm' src={params.row.image} layout='fill' objectFit='contain' />
        </div>
      )
    },
    {
      field: 'imageResponsive',
      headerName: 'Ảnh thu nhỏ',
      width: 110,
      renderCell: params => (
        <div style={{ width: '100%', height: '95%', position: 'relative' }}>
          <Image alt='Ảnh sản phẩm' src={params.row.imageResponsive} layout='fill' objectFit='contain' />
        </div>
      )
    },
    {
      field: 'startDate',
      headerName: 'Từ ngày',
      width: 170,
      renderCell: params => {
        return <div>{formatDateNoTime(params.row.startDate)}</div>;
      }
    },
    {
      field: 'endDate',
      headerName: 'Đến ngày',
      width: 170,
      renderCell: params => {
        return <div>{formatDateNoTime(params.row.endDate)}</div>;
      }
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 100,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full'>
            {params.row.status === 'Hoạt động' ? (
              <Status text={params.row.status} bg='bg-green-200' color='text-green-700' />
            ) : (
              <Status text={params.row.status} bg='bg-rose-200' color='text-rose-700' />
            )}
          </div>
        );
      }
    },
    {
      field: 'action',
      headerName: '',
      width: 200,
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
                setselectedBanner(params.row);
                toggleDelete();
              }}
            />
          </div>
        );
      }
    }
  ];

  // TODO: Remove unused code
  /*
  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (selectedBanner) {
      const images = [selectedBanner.imageResponsive, selectedBanner.image];
      await handleDelete(selectedBanner.id, images);
    }
    toggleDelete();
  };
  */

  // TODO: Remove unused code
  /*
  const handleDelete = async (id: string, images: any[]) => {
    toast('Đang xóa sản phẩm, xin chờ...');
    const handleImageDelete = async () => {
      try {
        for (const image of images) {
          if (image) {
            const imageRef = ref(storage, image);
            await deleteObject(imageRef);
          }
        }
      } catch (error) {
      }
    };
    await handleImageDelete();

    await axios
      .delete(`/api/banner/${id}`)
      .then(res => {
        toast.success('Xóa banner thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi xóa banner bên phía client');
        console.error(error);
      });
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);
    await axios
      .put(`/api/banner/${data.id}`, {
        name: data.name,
        description: data.description,
        status: data.staus
      })
      .then(res => {
        toast.success('Lưu thông tin thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi lưu thông tin');
      })
      .finally(() => {
        setIsLoading(false);
        toggleOpen();
      });
  };
  */

  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (selectedBanner) {
      toast('Đang xóa banner, xin chờ...');
      try {
        await axios.delete(`/api/banner/${selectedBanner.id}`);
        toast.success('Xóa banner thành công');
        router.refresh();
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa banner');
      }
    }
    toggleDelete();
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
      <div className='w-[78.5vw] m-auto text-xl'>
        {/* Header with Add Banner Button */}
        <div className='mb-4 mt-5 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'>Quản lý banner</h2>
          <MuiButton
            variant='contained'
            startIcon={<MdAdd />}
            onClick={() => setAddBannerModalOpen(true)}
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
            Thêm banner
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

      {/* Add/Edit Banner Modal */}
      <AddBannerModal
        isOpen={addBannerModalOpen}
        toggleOpen={() => {
          setAddBannerModalOpen(false);
          setEditBannerData(null);
        }}
        editData={editBannerData}
      />
    </>
  );
};

export default ManageBanner;
