'use client';

import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { MdDelete, MdEdit, MdAdd } from 'react-icons/md';
import { Button as MuiButton } from '@mui/material';
import AddArticleModal from './AddArticleModal';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../../types';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import firebase from '../../../libs/firebase';

import 'moment/locale/vi';
import NullData from '@/app/components/NullData';
import Image from 'next/image';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import Link from 'next/link';
import { slugConvert } from '../../../utils/Slug';

type Article = {
  id: string;
  userId: string;
  title: string;
  image: string;
  content: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string | null; // Cập nhật với categoryId
  categoryName: string | null;
};

interface ManageArticlesClientProps {
  currentUser: SafeUser | null | undefined;
  articleData: any;
  articleCategories: any[];
}

const ManageArticlesClient: React.FC<ManageArticlesClientProps> = ({ currentUser, articleData, articleCategories }) => {
  const router = useRouter();
  const storage = getStorage(firebase);
  const [isDelete, setIsDelete] = useState(false);
  const [selectedArticle, setselectedArticle] = useState<Article | null>(null);
  const [addArticleModalOpen, setAddArticleModalOpen] = useState(false);
  const [editArticleData, setEditArticleData] = useState<any>(null);

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const handleOpenModal = (article: any) => {
    setselectedArticle(article);
    // Tìm danh mục đã chọn dựa trên categoryId
    const selectedCategory = cateOptions.find((category: any) => category.label === article.category);

    // Prepare edit data for AddArticleModal
    const editData = {
      id: article.id,
      title: article.title,
      content: article.content,
      image: article.image,
      categoryId: selectedCategory ? selectedCategory.value : article.categoryId
    };

    setEditArticleData(editData);
    setAddArticleModalOpen(true);
  };

  let rows: any = [];
  if (articleData) {
    rows = articleData.map((article: any) => {
      return {
        id: article.id,
        title: article.title,
        content: article.content,
        category: article.category?.name || 'Chưa có danh mục',
        image: article.image,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      };
    });
  }

  const columns: GridColDef[] = [
    {
      field: 'image',
      headerName: 'Ảnh bài viết',
      width: 120,
      renderCell: params => (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <Image alt='Ảnh sản phẩm' src={params.row.image} layout='fill' objectFit='contain' />
        </div>
      )
    },
    {
      field: 'title',
      headerName: 'Tên bài viết',
      width: 300,
      renderCell: params => (
        <Link
          className='text-[#212B36] hover:text-blue-500'
          href={`/article/${slugConvert(params.row.title)}-${params.row.id}`}
        >
          <h3 className='m-0'>{params.row.title}</h3>
        </Link>
      )
    },
    {
      field: 'category',
      headerName: 'Danh mục',
      width: 140,
      renderCell: params => {
        return <div>{params.row.category}</div>;
      }
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 200,
      renderCell: params => {
        return <div>{formatDate(params.row.createdAt)}</div>;
      }
    },
    {
      field: 'updatedAt',
      headerName: 'Ngày sửa',
      width: 200,
      renderCell: params => {
        return <div>{formatDate(params.row.updatedAt)}</div>;
      }
    },
    {
      field: 'action',
      headerName: '',
      width: 160,
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
                setselectedArticle(params.row);
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
    if (selectedArticle) {
      await handleDelete(selectedArticle.id, selectedArticle.image);
    }
    toggleDelete();
  };

  const handleDelete = async (id: string, image: any) => {
    toast('Đang xóa sản phẩm, xin chờ...');
    const handleImageDelete = async () => {
      try {
        if (image) {
          const imageRef = ref(storage, image);
          await deleteObject(imageRef);
        }
      } catch (error) {}
    };
    await handleImageDelete();

    await axios
      .delete(`/api/article/${id}`)
      .then(res => {
        toast.success('Xóa bài viết thành công');
        router.refresh();
      })
      .catch(error => {
        toast.error('Có lỗi xảy ra khi xóa bài viết');
        console.error(error);
      });
  };

  const cateOptions = Array.from(new Set(articleData.map((cate: any) => cate.categoryId))).map(id => {
    const category = articleData.find((cate: any) => cate.categoryId === id);
    return { label: category.category.name, value: category.categoryId };
  });

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
      <div className='w-full m-auto text-xl'>
        {/* Header with Add Article Button */}
        <div className='mb-4 mt-5 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'></h2>
          <MuiButton
            variant='contained'
            startIcon={<MdAdd />}
            onClick={() => setAddArticleModalOpen(true)}
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
            Thêm bài viết
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

      {isDelete && <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleConfirmDelete} />}

      {/* Add/Edit Article Modal */}
      <AddArticleModal
        isOpen={addArticleModalOpen}
        toggleOpen={() => {
          setAddArticleModalOpen(false);
          setEditArticleData(null);
        }}
        articleCategory={articleCategories}
        editData={editArticleData}
      />
    </>
  );
};

export default ManageArticlesClient;
