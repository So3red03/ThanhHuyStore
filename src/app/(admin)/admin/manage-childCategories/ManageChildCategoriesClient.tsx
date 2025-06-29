'use client';

import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../../types';
import NullData from '@/app/components/NullData';
import Heading from '@/app/components/Heading';
import FormWarp from '@/app/components/FormWrap';
import AdminModal from '@/app/components/admin/AdminModal';
import Input from '@/app/components/inputs/Input';
import Button from '@/app/components/Button';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import ActionBtn from '@/app/components/ActionBtn';
import { MdDelete, MdEdit, MdAdd } from 'react-icons/md';
import { Button as MuiButton } from '@mui/material';
import AddProductChildCateModal from './AddProductChildCateModal';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Category } from '@prisma/client';
import { generateSlug } from '../../../../../utils/Articles';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';

interface ManageChildCategoriesClientProps {
  parentCategories: any;
  currentUser: SafeUser | null | undefined;
  subCategories: any;
}

const ManageChildCategoriesClient: React.FC<ManageChildCategoriesClientProps> = ({
  parentCategories,
  currentUser,
  subCategories
}) => {
  const router = useRouter();
  // TODO: Remove unused code
  /*
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FieldValues>();

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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [addChildCategoryModalOpen, setAddChildCategoryModalOpen] = useState(false);
  const [editChildCategoryData, setEditChildCategoryData] = useState<any>(null);

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const handleOpenModal = (category: any) => {
    setSelectedCategory(category);

    // Prepare edit data for AddProductChildCateModal
    const editData = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId
    };

    setEditChildCategoryData(editData);
    setAddChildCategoryModalOpen(true);
  };

  const cateOptions = parentCategories.map((cate: any) => ({
    label: cate.name,
    value: cate.id
  }));

  let rows: any = [];
  if (subCategories) {
    rows = subCategories.map((category: any) => {
      // Tìm tên danh mục cha dựa vào parentId
      const parentCategory =
        parentCategories.find((parent: any) => parent.id === category.parentId)?.name || 'Không có';
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentCategory,
        parentId: category.parentId,
        createdAt: formatDate(category.createdAt)
      };
    });
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên danh mục', width: 190 },
    { field: 'slug', headerName: 'Slug', width: 190 },
    { field: 'parentCategory', headerName: 'Danh mục cha', width: 150 },
    { field: 'createdAt', headerName: 'Ngày tạo', width: 230 },
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
                setSelectedCategory(params.row);
                toggleDelete();
              }}
            />
          </div>
        );
      }
    }
  ];

  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      await handleDelete(selectedCategory.id);
    }
    toggleDelete();
  };

  const handleDelete = async (id: string) => {
    toast('Đang xóa danh mục, xin chờ...');
    await axios
      .delete(`/api/category/${id}`)
      .then(res => {
        toast.success('Xóa danh mục thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi xóa danh mục');
        console.error(error);
      });
  };

  // TODO: Remove unused code
  /*
  const onSubmit: SubmitHandler<FieldValues> = data => {
    console.log(data);
    setIsLoading(true);
    axios
      .put(`/api/category/${data.id}`, {
        name: data.name,
        parentId: data.parentId,
        slug: data.slug
      })
      .then(() => {
        toast.success('Cập nhật thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi khi cập nhật');
      })
      .finally(() => {
        setIsLoading(false);
        toggleOpen();
      });
  };
  */

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
        {/* Header with Add Child Category Button */}
        <div className='mb-4 mt-5 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'>Quản lý danh mục con</h2>
          <MuiButton
            variant='contained'
            startIcon={<MdAdd />}
            onClick={() => setAddChildCategoryModalOpen(true)}
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
            Thêm danh mục con
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

      {/* Add/Edit Child Category Modal */}
      <AddProductChildCateModal
        isOpen={addChildCategoryModalOpen}
        toggleOpen={() => {
          setAddChildCategoryModalOpen(false);
          setEditChildCategoryData(null);
        }}
        parentCategory={parentCategories}
        editData={editChildCategoryData}
      />
    </>
  );
};

export default ManageChildCategoriesClient;
