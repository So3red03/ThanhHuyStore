'use client';

import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { ArticleCategory } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { Button as MuiButton } from '@mui/material';
import AddArticleCateModal from './AddArticleCateModal';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { formatDateNoTime } from '@/app/(home)/account/orders/OrdersClient';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { generateSlug } from '../../../../../utils/Articles';

const formatDateToInput = (date: Date | string) => {
  const d = new Date(date);
  const day = `0${d.getDate()}`.slice(-2);
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const year = d.getFullYear();
  return `${year}-${month}-${day}`; // Định dạng yyyy-MM-dd để set giá trị cho input
};

interface ManageArticlesCategoriesClientProps {
  currentUser: SafeUser | null | undefined;
  categoriesData: any;
}

const ManageArticlesCategoriesClient: React.FC<ManageArticlesCategoriesClientProps> = ({
  currentUser,
  categoriesData
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setselectedCategory] = useState<ArticleCategory | null>(null);
  const [addArticleCategoryModalOpen, setAddArticleCategoryModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
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

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const handleOpenModal = (product: any) => {
    setselectedCategory(product);
    const fieldsToSet = ['id', 'name', 'slug', 'icon', 'description', 'isActive'];
    fieldsToSet.forEach(field => setCustomValue(field, product[field]));
    toggleOpen();
  };

  let rows: any = [];
  if (categoriesData) {
    rows = categoriesData.map((category: any) => {
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt
      };
    });
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên danh mục', width: 150 },
    { field: 'slug', headerName: 'Slug', width: 130 },
    {
      field: 'icon',
      headerName: 'Icon',
      width: 50,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center w-full h-full'>
            {params.row.icon ? <div dangerouslySetInnerHTML={{ __html: params.row.icon }} className='w-6 h-6' /> : null}
          </div>
        );
      }
    },
    { field: 'description', headerName: 'Mô tả', width: 500 },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      width: 100,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full'>
            {params.row.isActive === true ? (
              <Status text='Hoạt động' bg='bg-green-200' color='text-green-700' />
            ) : (
              <Status text='Tạm dừng' bg='bg-rose-200' color='text-rose-700' />
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
                setselectedCategory(params.row);
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
    toast('Đang xóa sản phẩm, xin chờ...');

    await axios
      .delete(`/api/articleCategory/${id}`)
      .then(res => {
        toast.success('Xóa danh mục thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Xóa danh mục thất bại');
        console.error(error);
      });
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);
    await axios
      .put(`/api/articleCategory/${data.id}`, {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon
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

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [currentUser, router]);

  const handleSlugUpdate = () => {
    const nameValue = getValues('name'); // Lấy giá trị của input "name"
    if (nameValue) {
      const generatedSlug = generateSlug(nameValue);
      setValue('slug', generatedSlug); // Cập nhật giá trị trong form
    }
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <NullData title='Từ chối đăng nhập' />;
  }
  return (
    <>
      <div className='w-[78.5vw] m-auto text-xl'>
        {/* Header with Add Article Category Button */}
        <div className='mb-4 mt-5 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'>Quản lý danh mục bài viết</h2>
          <MuiButton
            variant='contained'
            startIcon={<MdAdd />}
            onClick={() => setAddArticleCategoryModalOpen(true)}
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
            Thêm danh mục bài viết
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
              border: '1px solid #e2e8f0',
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
      {/* Modal cập nhật sản phẩm  */}
      {isOpen && (
        <AdminModal isOpen={isOpen} handleClose={toggleOpen}>
          <FormWarp custom='!pt-8'>
            <Heading title='Cập nhật danh mục' center>
              <></>
            </Heading>
            <Input
              id='name'
              label='Tên danh mục'
              disabled={isLoading}
              register={register}
              errors={errors}
              defaultValue={selectedCategory?.name}
              required
            />
            <div className='flex justify-center items-center w-full gap-2'>
              <Input
                id='slug'
                label='Slug'
                disabled={isLoading}
                register={register}
                errors={errors}
                defaultValue={selectedCategory?.slug}
                required
              />
              <Button
                label='Đổi'
                small
                custom='!gap-1 !w-auto !h-full !text-xs lg:!text-base'
                icon={MdAdd}
                onClick={() => handleSlugUpdate()}
              />
            </div>
            <Input
              id='icon'
              label='Icon'
              disabled={isLoading}
              register={register}
              errors={errors}
              defaultValue={selectedCategory?.icon}
              required
            />
            <Input
              id='description'
              label='Mô tả'
              disabled={isLoading}
              register={register}
              errors={errors}
              defaultValue={selectedCategory?.description}
              required
            />
            {/* <Input
							id="isActive"
							label="Trạng thái"
							disabled={isLoading}
							type="combobox"
							register={register}
							errors={errors}
							defaultValue={selectedCategory?.isActive}
							options={['Hoạt động', 'Tạm dừng']}
							required
						/> */}
            <Button label='Lưu danh mục' onClick={handleSubmit(onSubmit)} isLoading={isLoading} />
          </FormWarp>
        </AdminModal>
      )}
      {isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}

      {/* Add Article Category Modal */}
      <AddArticleCateModal
        isOpen={addArticleCategoryModalOpen}
        toggleOpen={() => setAddArticleCategoryModalOpen(false)}
      />
    </>
  );
};

export default ManageArticlesCategoriesClient;
