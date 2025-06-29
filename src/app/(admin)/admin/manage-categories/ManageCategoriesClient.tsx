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
import TextArea from '@/app/components/inputs/TextArea';
import { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import ActionBtn from '@/app/components/ActionBtn';
import { MdDelete, MdEdit, MdAdd } from 'react-icons/md';
import { Button as MuiButton } from '@mui/material';
import AddProductCateModal from './AddProductCateModal';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Category } from '@prisma/client';
import Image from 'next/image';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import firebase from '@/app/libs/firebase';
import * as SlIcons from 'react-icons/sl';
import * as AiIcons from 'react-icons/ai';
import * as TbIcons from 'react-icons/tb';
import * as MdIcons from 'react-icons/md';
import { generateSlug } from '../../../../../utils/Articles';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';

interface ManageCategoriesClientProps {
  categories: any;
  currentUser: SafeUser | null | undefined;
}

const ManageCategoriesClient: React.FC<ManageCategoriesClientProps> = ({ categories, currentUser }) => {
  const Icons = { ...SlIcons, ...AiIcons, ...MdIcons, ...TbIcons };
  const router = useRouter();
  // TODO: Remove unused code
  /*
  const storage = getStorage(firebase);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | string | null>(null);

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
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [editCategoryData, setEditCategoryData] = useState<any>(null);

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const handleOpenModal = (category: any) => {
    setSelectedCategory(category);

    // Prepare edit data for AddProductCateModal
    const editData = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image
    };

    setEditCategoryData(editData);
    setAddCategoryModalOpen(true);
  };

  let rows: any = [];
  if (categories) {
    rows = categories.map((category: any) => {
      return {
        id: category.id,
        image: category.image,
        icon: category.icon,
        name: category.name,
        slug: category.slug,
        description: category.description,
        createdAt: formatDate(category.createdAt),
        updatedAt: formatDate(category.updatedAt)
      };
    });
  }

  const columns: GridColDef[] = [
    {
      field: 'image',
      headerName: 'Ảnh danh mục',
      width: 130,
      renderCell: params => (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Image alt='Ảnh sản phẩm' src={params.row.image} layout='fill' objectFit='contain' />
        </div>
      )
    },
    {
      field: 'icon',
      headerName: 'Icon',
      width: 100,
      renderCell: params => {
        const IconComponent = Icons[params.row.icon as keyof typeof Icons];
        return (
          <div className='flex justify-center items-center w-full h-full'>
            {IconComponent ? <IconComponent size={24} /> : null}
          </div>
        );
      }
    },
    { field: 'name', headerName: 'Tên danh mục', width: 150 },
    { field: 'slug', headerName: 'Slug', width: 120 },
    { field: 'description', headerName: 'Mô tả', width: 150 },
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
      toast('Đang xóa danh mục, xin chờ...');
      try {
        await axios.delete(`/api/category/${selectedCategory.id}`);
        toast.success('Xóa danh mục thành công');
        router.refresh();
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa danh mục');
      }
    }
    toggleDelete();
  };

  // TODO: Remove unused code
  /*
  const handleDelete = async (id: string, image: any) => {
    toast('Đang xóa danh mục, xin chờ...');
    const handleImageDelete = async () => {
      try {
        if (image) {
          const imageRef = ref(storage, image);
          await deleteObject(imageRef);
        }
      } catch (error) {
        return console.log('Xóa ảnh thất bại');
      }
    };
    await handleImageDelete();

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

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    try {
      let newImageUrl = image || data.image; // Sử dụng ảnh mới từ form hoặc từ ảnh đã chọn

      // Kiểm tra và xử lý ảnh nếu có ảnh mới
      if (newImageUrl && newImageUrl !== data.image) {
        // Nếu có ảnh cũ, xóa ảnh cũ
        if (data.image) {
          await deleteOldImageFromFirebase(data.image); // Xóa ảnh cũ trong Firebase
        }

        // Tải ảnh mới lên Firebase
        newImageUrl = await uploadNewImageToFirebase(newImageUrl);

        console.log('Ảnh đã được tải lên thành công:', newImageUrl);
      }

      // Gọi API để cập nhật bài viết sau khi ảnh mới đã được xử lý
      await updateArticle(data, newImageUrl);

      toast.success('Bài viết cập nhật thành công!');
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xử lý ảnh hoặc cập nhật bài viết.');
      console.error(error);
    } finally {
      setIsLoading(false);
      toggleOpen();
    }
  };

  const deleteOldImageFromFirebase = async (imageUrl: string) => {
    try {
      const storage = getStorage(firebase);
      const imageRef = ref(storage, imageUrl);

      // Xóa ảnh khỏi Firebase Storage
      await deleteObject(imageRef);
      console.log('Đã xóa ảnh cũ khỏi Firebase.');
    } catch (error) {
      console.error('Lỗi khi xóa ảnh cũ khỏi Firebase:', error);
      throw error;
    }
  };

  const uploadNewImageToFirebase: any = async (imageFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(firebase);
      const fileName = new Date().getTime() + '-' + imageFile.name;
      const storageRef = ref(storage, `category/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        error => {
          console.error('Lỗi khi tải ảnh lên Firebase:', error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then(downloadURL => {
              console.log('Tải ảnh thành công: ', downloadURL);
              resolve(downloadURL);
            })
            .catch(error => {
              console.error('Lỗi khi lấy download URL:', error);
              reject(error);
            });
        }
      );
    });
  };
  //call API
  const updateArticle = async (data: FieldValues, newImageUrl: string) => {
    try {
      await axios.put(`/api/category/${data.id}`, {
        name: data.name,
        description: data.description,
        slug: data.slug,
        image: newImageUrl // Sử dụng URL ảnh mới
      });
    } catch (error) {
      toast.error('Có lỗi khi lưu danh mục');
      throw error;
    }
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
        {/* Header with Add Category Button */}
        <div className='mb-4 mt-5 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'>Quản lý danh mục</h2>
          <MuiButton
            variant='contained'
            startIcon={<MdAdd />}
            onClick={() => setAddCategoryModalOpen(true)}
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
            Thêm danh mục
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

      {/* Add/Edit Category Modal */}
      <AddProductCateModal
        isOpen={addCategoryModalOpen}
        toggleOpen={() => {
          setAddCategoryModalOpen(false);
          setEditCategoryData(null);
        }}
        editData={editCategoryData}
      />
    </>
  );
};

export default ManageCategoriesClient;
