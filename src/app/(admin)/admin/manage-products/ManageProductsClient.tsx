'use client';

import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { Product } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { formatPrice } from '../../../../../utils/formatPrice';
import { MdCached, MdClose, MdDelete, MdDone, MdEdit, MdRefresh } from 'react-icons/md';
// TODO: Add back when soft delete is implemented: MdRestore, MdVisibility
import { useRouter } from 'next/navigation';
import { deleteObject, getStorage, ref } from 'firebase/storage';
import { SafeUser } from '../../../../../types';
import ActionBtn from '@/app/components/ActionBtn';
import axios from 'axios';
import toast from 'react-hot-toast';
import Status from '@/app/components/Status';
import firebase from '../../../libs/firebase';
import 'moment/locale/vi';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import { useEffect, useState } from 'react';
import SendNewProductEmail from '@/app/components/admin/SendNewProductEmail';
import Image from 'next/image';
import { Rating, Button as MuiButton, CircularProgress } from '@mui/material';
import { MdAdd } from 'react-icons/md';
import { FaDollarSign, FaRegBuilding, FaRegEnvelope, FaRegListAlt, FaRegWindowMaximize } from 'react-icons/fa';
import * as SlIcons from 'react-icons/sl';
import * as AiIcons from 'react-icons/ai';
import * as TbIcons from 'react-icons/tb';
import * as MdIcons from 'react-icons/md';
import Link from 'next/link';
import { slugConvert } from '../../../../../utils/Slug';
import AddProductModalNew from './AddProductModalNew';
import { set } from 'nprogress';

interface ManageProductsClientProps {
  products: Product[];
  currentUser: SafeUser | null | undefined;
  subCategories: any;
  parentCategories: any;
}

const ManageProductsClient: React.FC<ManageProductsClientProps> = ({
  products,
  currentUser,
  subCategories,
  parentCategories
}) => {
  const router = useRouter();
  const storage = getStorage(firebase);
  const [isOpen, setIsOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const Icons = { ...SlIcons, ...AiIcons, ...MdIcons, ...TbIcons };
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedProducts, setDeletedProducts] = useState<any[]>([]);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentProducts, setCurrentProducts] = useState(products);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [text, setText] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    reset,
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

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/product?admin=true');
      if (response.ok) {
        const data = await response.json();
        setCurrentProducts(data.products || data); // Handle both paginated and direct response
      } else {
        toast.error('Lỗi khi tải danh sách sản phẩm');
        router.refresh(); // Fallback to full page refresh
      }
    } catch (error) {
      toast.error('Lỗi khi làm mới danh sách sản phẩm');
      router.refresh(); // Fallback to full page refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  // TODO: Enable when soft delete is implemented
  // const fetchDeletedProducts = async () => {
  //   try {
  //     const response = await axios.get('/api/product/deleted');
  //     setDeletedProducts(response.data);
  //   } catch (error) {
  //     console.error('Error fetching deleted products:', error);
  //     toast.error('Lỗi khi tải sản phẩm đã xóa');
  //   }
  // };

  // const toggleShowDeleted = async () => {
  //   if (!showDeleted) {
  //     await fetchDeletedProducts();
  //   }
  //   setShowDeleted(!showDeleted);
  // };

  // const handleRestoreProduct = async (productId: string) => {
  //   try {
  //     await axios.patch(`/api/product/${productId}`, { action: 'restore' });
  //     toast.success('Khôi phục sản phẩm thành công');
  //     await fetchDeletedProducts(); // Refresh deleted products list
  //     router.refresh(); // Refresh main products list
  //   } catch (error) {
  //     console.error('Error restoring product:', error);
  //     toast.error('Lỗi khi khôi phục sản phẩm');
  //   }
  // };

  const onTextChange = (e: any) => {
    const newText = e.htmlValue;
    setText(newText);
    setCustomValue('description', newText); // Cập nhật giá trị description trong form
  };

  const handleOpenModal = async (product: Product) => {
    // For variant products, fetch full data from API to get complete variant info
    if (product.productType === 'VARIANT') {
      try {
        // Try variant API first
        let fullProductData;
        try {
          const variantResponse = await axios.get(`/api/product/variant/${product.id}`);
          fullProductData = variantResponse.data;
        } catch (variantError) {
          // Fallback to regular product API
          const regularResponse = await axios.get(`/api/product/simple/${product.id}`);
          fullProductData = regularResponse.data;
        }

        setEditingProduct(fullProductData);
      } catch (error) {
        // Fallback to original product data
        setEditingProduct(product);
      }
    } else {
      // For simple products, use existing data
      setEditingProduct(product);
    }

    setEditProductModalOpen(true);
  };

  // Lọc danh mục con dựa trên ID danh mục cha
  const filteredSubCategories = selectedParentCategoryId
    ? subCategories.filter((subCategory: any) => subCategory.parentId === selectedParentCategoryId)
    : [];

  const category = watch('category');

  // Use state for current products instead of props directly

  let rows: any = [];
  if (currentProducts?.length > 0) {
    rows = currentProducts?.map((product: any) => {
      // Tính điểm đánh giá của mỗi sản phẩm
      const productRating =
        product.reviews?.reduce((acc: number, item: any) => item.rating + acc, 0) / (product.reviews?.length || 1) || 0;
      // Tìm tên danh mục cha dựa vào parentId
      const subCategory = subCategories.find((sub: any) => sub.id === product.categoryId)?.name;
      const parentCategory = subCategories.find((sub: any) => sub.id === product.categoryId)?.parentId;
      // For variant products, calculate total stock and use base price or first variant price
      let displayPrice = product.price;
      let displayStock = product.inStock;

      if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
        // Use first variant price for display
        displayPrice = product.variants[0]?.price || 0;

        // Calculate total stock from all variants
        displayStock = product.variants.reduce((total: number, variant: any) => {
          return total + (variant.stock || 0);
        }, 0);
      }

      return {
        id: product.id,
        images: product.images, // Keep for backward compatibility
        thumbnail: product.thumbnail, // ✅ Add thumbnail
        galleryImages: product.galleryImages, // ✅ Add galleryImages
        name: product.name,
        price: displayPrice,
        categoryId: product.categoryId,
        parentId: parentCategory,
        subCategory: subCategory,
        rating: productRating,
        description: product.description,
        inStock: displayStock,
        isDeleted: product.isDeleted,
        deletedAt: product.deletedAt,
        deletedBy: product.deletedBy,
        productType: product.productType,
        variants: product.variants || [], // Include variants data
        // Include all original product data for editing
        brand: product.brand,
        priority: product.priority,
        productAttributes: product.productAttributes || []
      };
    });
  }

  // Define columns based on view mode
  const baseColumns: GridColDef[] = [
    {
      field: 'images',
      headerName: 'Ảnh SP',
      width: 80,
      renderCell: params => {
        const product = params.row;
        let imageSrc = '/noavatar.png'; // Default fallback

        // Đơn giản hóa logic: ưu tiên thumbnail, sau đó galleryImages[0]
        if (product.thumbnail) {
          imageSrc = product.thumbnail;
        } else if (product.galleryImages && product.galleryImages.length > 0) {
          imageSrc = product.galleryImages[0];
        } else if (product.variants && product.variants.length > 0) {
          // Với variant products, lấy ảnh từ variant đầu tiên có ảnh
          const firstVariantWithImage = product.variants.find(
            (variant: any) => variant.thumbnail || (variant.galleryImages && variant.galleryImages.length > 0)
          );
          if (firstVariantWithImage) {
            imageSrc = firstVariantWithImage.thumbnail || firstVariantWithImage.galleryImages[0];
          }
        }

        return (
          <Image
            src={imageSrc}
            alt='Ảnh sản phẩm'
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            onError={e => {
              e.currentTarget.src = '/noavatar.png';
            }}
          />
        );
      }
    },
    {
      field: 'name',
      headerName: 'Tên sản phẩm',
      width: 210,
      renderCell: params => (
        <Link
          className='text-[#212B36] hover:text-blue-500'
          href={`/product/${slugConvert(params.row.name)}-${params.row.id}`}
        >
          <h3 className='m-0'>{params.row.name}</h3>
        </Link>
      )
    },
    {
      field: 'price',
      headerName: 'Giá bán',
      width: 110,
      renderCell: params => {
        return <div className='font-bold text-slate-800'>{formatPrice(params.row.price)}</div>;
      }
    },
    { field: 'subCategory', headerName: 'Danh mục', width: 140 },
    {
      field: 'rating',
      headerName: 'Đánh giá',
      width: 130,
      renderCell: params => {
        return (
          <div className='flex items-center justify-center w-full h-full'>
            <Rating value={params.row.rating} readOnly precision={0.5} />
          </div>
        );
      }
    },
    { field: 'description', headerName: 'Mô tả', width: 170 },
    {
      field: 'inStock',
      headerName: 'Tồn kho',
      width: 80,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full'>
            {params.row.inStock > 0 ? (
              <Status text={params.row.inStock} bg='bg-teal-200' color='text-teal-700' />
            ) : (
              <Status text='Hết hàng' icon={MdClose} bg='bg-rose-200' color='text-rose-700' />
            )}
          </div>
        );
      }
    },
    {
      field: 'action',
      headerName: '',
      width: 170,
      renderCell: params => {
        // TODO: Add soft delete actions when implemented
        // For now, only show active product actions
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
                setSelectedProduct(params.row);
                toggleDelete();
              }}
            />
          </div>
        );
      }
    }
  ];

  // TODO: Add deleted info columns when soft delete is implemented
  // const deletedColumns: GridColDef[] = [
  //   {
  //     field: 'deletedAt',
  //     headerName: 'Ngày xóa',
  //     width: 150,
  //     renderCell: params => {
  //       return params.row.deletedAt ? new Date(params.row.deletedAt).toLocaleDateString('vi-VN') : '';
  //     }
  //   },
  //   {
  //     field: 'deletedBy',
  //     headerName: 'Người xóa',
  //     width: 150,
  //     renderCell: params => {
  //       return params.row.deletedBy || '';
  //     }
  //   }
  // ];

  // For now, just use base columns
  const columns = baseColumns;

  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      setIsDeleting(true);
      try {
        await handleDelete(selectedProduct.id, selectedProduct);
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Có lỗi xảy ra khi xóa sản phẩm');
      } finally {
        setIsDeleting(false);
        toggleDelete();
      }
    }
  };

  const handleDelete = async (id: string, productData: any) => {
    try {
      // Delete product from database (API will handle Firebase image deletion)
      const endpoint =
        productData.productType === 'VARIANT' ? `/api/product/variant/${id}` : `/api/product/simple/${id}`;

      await axios.delete(endpoint);
      toast.success('Xóa sản phẩm thành công');
      handleRefresh();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      throw error;
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    setIsLoading(true);

    // Determine endpoint based on product type
    const endpoint =
      data.productType === 'VARIANT' ? `/api/product/variant/${data.id}` : `/api/product/simple/${data.id}`;

    axios
      .put(endpoint, {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        inStock: Number(data.inStock),
        categoryId: data.categoryId
      })
      .then(() => {
        toast.success('Lưu thông tin thành công');
        router.refresh();
      })
      .catch(() => {
        toast.error('Có lỗi xảy ra khi lưu thông tin');
      })
      .finally(() => {
        setIsLoading(false);
        toggleOpen();
      });
  };

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
    return <NullData title='Từ chối đăng nhập' />;
  }
  const stats = [
    {
      title: 'Sản phẩm hiện có',
      count: products?.length,
      icon: <FaRegListAlt className='text-2xl text-gray-600' />,
      changeColor: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    // {
    // 	title: 'Doanh thu trực tiếp',
    // 	count: formatPrice(21.459),
    // 	change: '+29%',
    // 	description: '5k đơn',
    // 	icon: <FaRegBuilding className="text-2xl text-gray-600" />,
    // 	changeColor: 'text-green-500',
    // 	bgColor: 'bg-green-100',
    // },
    {
      title: 'Doanh thu trên website',
      count: 0,
      change: '0%',
      description: '0 đơn',
      icon: <FaRegWindowMaximize className='text-2xl text-gray-600' />,
      changeColor: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Khuyến mãi',
      count: 0,
      change: '-0%',
      description: '0 đơn',
      icon: <FaRegEnvelope className='text-2xl text-gray-600' />,
      changeColor: 'text-rose-500',
      bgColor: 'bg-red-100'
    }
  ];

  return (
    <>
      <div className='w-[78.5vw] m-auto text-xl mt-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-3 pr-0 border border-r-0 border-gray-200 rounded-lg'>
          {stats.map((stat, index) => (
            <div
              key={index}
              className='bg-white p-4 border-r border-r-gray-200 border-b border-b-gray-200 md:border-b-0'
            >
              <div className='flex justify-between'>
                <div className='flex flex-col gap-y-2'>
                  <h5 className='text-gray-500 text-sm'>{stat.title}</h5>
                  <div className='text-2xl'>{stat.count}</div>
                  <p className='text-gray-400 text-sm'>
                    {stat.description || ''}
                    {stat.change && (
                      <span
                        className={`ml-2 text-base font-semibold px-2 py-1 ${stat.bgColor} rounded-full ${stat.changeColor}`}
                      >
                        {stat.change}
                      </span>
                    )}
                  </p>
                </div>
                <div className='flex items-center justify-center h-12 w-12 rounded-md bg-gray-100 text-slate-700'>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Header with Add Product Button and Email Marketing */}
        <div className='mb-4 mt-5 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'>Danh sách sản phẩm</h2>
          <div className='flex gap-3'>
            <MuiButton
              onClick={() => setShowEmailModal(true)}
              startIcon={<FaRegEnvelope />}
              variant='outlined'
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#eff6ff'
                }
              }}
            >
              Email Marketing
            </MuiButton>
            <MuiButton
              onClick={() => setAddProductModalOpen(true)}
              startIcon={<MdAdd />}
              variant='contained'
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb'
                }
              }}
            >
              Thêm sản phẩm
            </MuiButton>
            <MuiButton
              variant='contained'
              startIcon={isRefreshing ? <CircularProgress size={16} color='inherit' /> : <MdRefresh />}
              onClick={handleRefresh}
              disabled={isRefreshing}
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
              {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </MuiButton>
          </div>
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
      {isDelete && (
        <ConfirmDialog
          isOpen={isDelete}
          handleClose={toggleDelete}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          loadingText='Đang xóa sản phẩm...'
        />
      )}

      {/* Add Product Modal */}
      <AddProductModalNew
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        subCategories={subCategories}
        parentCategories={parentCategories}
        onSuccess={() => {
          setAddProductModalOpen(false);
          handleRefresh();
        }}
      />

      {/* Edit Product Modal */}
      <AddProductModalNew
        isOpen={editProductModalOpen}
        onClose={() => {
          setEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        mode='edit'
        initialData={editingProduct}
        onSuccess={() => {
          setEditProductModalOpen(false);
          setEditingProduct(null);
          handleRefresh();
        }}
        parentCategories={parentCategories}
        subCategories={subCategories}
      />

      {/* Email Marketing Modal */}
      {showEmailModal && <SendNewProductEmail products={currentProducts} onClose={() => setShowEmailModal(false)} />}
    </>
  );
};

export default ManageProductsClient;
