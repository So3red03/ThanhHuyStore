'use client';

import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { categories } from '../../../../../utils/Categories';
import { colors } from '../../../../../utils/Color';
import { Product } from '@prisma/client';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { formatPrice } from '../../../../../utils/formatPrice';
import { MdCached, MdClose, MdDelete, MdDone, MdEdit } from 'react-icons/md';
// TODO: Add back when soft delete is implemented: MdRestore, MdVisibility
import { useCallback, useEffect, useState } from 'react';
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
import SelectColor from '@/app/components/inputs/SelectColor';
import TextArea from '@/app/components/inputs/TextArea';
import CheckBox from '@/app/components/inputs/CheckBox';
import CategoryInput from '@/app/components/inputs/CategoryInput';
import 'moment/locale/vi';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import SendNewProductEmail from '@/app/components/admin/SendNewProductEmail';
import Image from 'next/image';
import { Editor } from 'primereact/editor';
import { Rating, Button as MuiButton } from '@mui/material';
import { MdAdd } from 'react-icons/md';
import { FaDollarSign, FaRegBuilding, FaRegEnvelope, FaRegListAlt, FaRegWindowMaximize } from 'react-icons/fa';
import * as SlIcons from 'react-icons/sl';
import * as AiIcons from 'react-icons/ai';
import * as TbIcons from 'react-icons/tb';
import * as MdIcons from 'react-icons/md';
import Link from 'next/link';
import { slugConvert } from '../../../../../utils/Slug';
import AddProductModalNew from './AddProductModalNew';

interface ManageProductsClientProps {
  products: any;
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

  const [text, setText] = useState('');
  // const [images, setImages] = useState<any[] | null>(products.images);

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

  const handleOpenModal = (product: any) => {
    setEditingProduct(product);
    setEditProductModalOpen(true);
  };

  // Lọc danh mục con dựa trên ID danh mục cha
  const filteredSubCategories = selectedParentCategoryId
    ? subCategories.filter((subCategory: any) => subCategory.parentId === selectedParentCategoryId)
    : [];

  const category = watch('category');

  // For now, just show active products
  const currentProducts = products || [];

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

      console.log('📊 Stock calculation debug:', {
        productId: product.id,
        productName: product.name,
        productType: product.productType,
        originalStock: product.inStock,
        variants: product.variants?.map((v: any) => ({ id: v.id, stock: v.stock }))
      });

      if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
        // Use base price if available, otherwise use first variant price
        displayPrice = product.basePrice || product.variants[0]?.price || 0;

        // Calculate total stock from all variants
        displayStock = product.variants.reduce((total: number, variant: any) => {
          console.log(`Adding variant ${variant.id} stock: ${variant.stock || 0}`);
          return total + (variant.stock || 0);
        }, 0);

        console.log('✅ Total calculated stock:', displayStock);
      }

      return {
        id: product.id,
        images: product.images,
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
        basePrice: product.basePrice,
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

        console.log('🖼️ Product image debug:', {
          productId: product.id,
          productName: product.name,
          productType: product.productType,
          images: product.images,
          variants: product.variants
        });

        // Handle Simple products
        if (product.productType === 'SIMPLE' && product.images && product.images.length > 0) {
          // Simple products: images structure is [{ color: 'default', colorCode: '#000000', images: ['url1', 'url2'] }]
          if (product.images[0] && product.images[0].images && product.images[0].images.length > 0) {
            imageSrc = product.images[0].images[0];
            console.log('✅ Simple product image found:', imageSrc);
          }
        }
        // Handle Variant products - get image from first variant
        else if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
          console.log('🔍 Searching for variant images...');
          console.log('🔍 All variants:', product.variants);

          // Try to find a variant with images
          const variantWithImage = product.variants.find((variant: any) => {
            console.log('Checking variant:', {
              id: variant.id,
              images: variant.images,
              imagesLength: variant.images?.length,
              imagesType: typeof variant.images
            });
            return variant.images && Array.isArray(variant.images) && variant.images.length > 0;
          });

          if (variantWithImage && variantWithImage.images.length > 0) {
            console.log('🔍 ManageProducts variant.images:', variantWithImage.images);

            // Check if images is array of strings (old format) or array of objects (new format)
            if (typeof variantWithImage.images[0] === 'string') {
              // Old format: images is array of URLs
              imageSrc = variantWithImage.images[0];
              console.log('✅ Variant image found (old format):', imageSrc);
            } else {
              // New format: images is array of objects - GET FIRST IMAGE FROM ANY OBJECT
              console.log('📸 ManageProducts using new format - finding first image');
              let foundImage = false;

              for (const imageObj of variantWithImage.images) {
                if (imageObj && imageObj.images && Array.isArray(imageObj.images) && imageObj.images.length > 0) {
                  imageSrc = imageObj.images[0];
                  console.log('✅ Variant image found (new format):', imageSrc);
                  foundImage = true;
                  break;
                }
              }

              if (!foundImage) {
                console.log('❌ No images found in any image object');
              }
            }
          }
          // Fallback: check main product images for variant products
          else if (
            product.images &&
            product.images.length > 0 &&
            product.images[0].images &&
            product.images[0].images.length > 0
          ) {
            imageSrc = product.images[0].images[0];
            console.log('✅ Fallback to main product image:', imageSrc);
          } else {
            console.log('❌ No images found for variant product');
            console.log('❌ Debug info:', {
              hasMainImages: !!product.images,
              mainImagesLength: product.images?.length,
              firstMainImage: product.images?.[0]
            });
          }
        }

        console.log('🎯 Final image src:', imageSrc);

        return (
          <Image
            src={imageSrc}
            alt='Ảnh sản phẩm'
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
            onError={e => {
              console.error('❌ Image load failed:', imageSrc);
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
      const imagesToDelete: string[] = [];

      // Handle different product types
      if (productData.productType === 'SIMPLE') {
        // Simple products: delete images from product.images
        if (Array.isArray(productData.images)) {
          productData.images.forEach((item: any) => {
            if (item.images && Array.isArray(item.images)) {
              imagesToDelete.push(...item.images);
            }
          });
        }
      } else if (productData.productType === 'VARIANT') {
        // Variant products: delete images from both main product and variants

        // Delete main product images (if any)
        if (Array.isArray(productData.images)) {
          productData.images.forEach((item: any) => {
            if (item.images && Array.isArray(item.images)) {
              imagesToDelete.push(...item.images);
            }
          });
        }

        // Delete variant images
        if (Array.isArray(productData.variants)) {
          productData.variants.forEach((variant: any) => {
            if (Array.isArray(variant.images)) {
              // Variant images structure: [{color, colorCode, images: [urls]}, ...]
              variant.images.forEach((imageGroup: any) => {
                if (imageGroup.images && Array.isArray(imageGroup.images)) {
                  imagesToDelete.push(...imageGroup.images);
                }
              });
            }
          });
        }
      }

      // Delete all collected images from Firebase
      if (imagesToDelete.length > 0) {
        console.log('Deleting images from Firebase:', imagesToDelete);
        const deletePromises = imagesToDelete.map(async (imageUrl: string) => {
          try {
            // Extract the path from the full Firebase URL
            const url = new URL(imageUrl);
            const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
            if (pathMatch) {
              const imagePath = decodeURIComponent(pathMatch[1]);
              const storageRef = ref(storage, imagePath);
              await deleteObject(storageRef);
              console.log(`Successfully deleted image: ${imagePath}`);
            }
          } catch (error) {
            console.error(`Error deleting image ${imageUrl}:`, error);
            // Continue with other deletions even if one fails
          }
        });
        await Promise.all(deletePromises);
      }

      // Delete product from database
      await axios.delete(`/api/product/${id}`);
      toast.success('Xóa sản phẩm thành công');
      router.refresh();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      throw error;
    }
  };

  const onSubmit: SubmitHandler<FieldValues> = async data => {
    console.log(data);
    setIsLoading(true);
    axios
      .put(`/api/product/${data.id}`, {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        inStock: Number(data.inStock),
        categoryId: data.categoryId
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

  if (!currentUser || currentUser.role !== 'ADMIN') {
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
  // const [images, setImages] = useState<ImageType[]>([]);
  // const [isProductCreated, setIsProductCreated] = useState(false);
  // useEffect(() => {
  // 	if (isProductCreated) {
  // 		reset();
  // 		setImages([]);
  // 		setText('');
  // 		setIsProductCreated(false);
  // 	}
  // }, [isProductCreated, reset, toggleOpen]);

  // useEffect(() => {
  // 	setCustomValue('images', images);
  // }, [images, setCustomValue]);

  // const addImageToState = useCallback((value: ImageType) => {
  // 	setImages((prev) => {
  // 		if (!prev) return [value];

  // 		// Kiểm tra xem màu sắc đã tồn tại trong mảng chưa
  // 		const existingImageIndex = prev.findIndex((item) => item.color === value.color);
  // 		if (existingImageIndex !== -1) {
  // 			// Cập nhật hình ảnh cho màu sắc đã tồn tại
  // 			const updatedImages = [...prev];
  // 			updatedImages[existingImageIndex] = {
  // 				...updatedImages[existingImageIndex],
  // 				image: [...(updatedImages[existingImageIndex].image || []), ...(value.image || [])],
  // 			};
  // 			return updatedImages;
  // 		} else {
  // 			// Thêm phần tử mới nếu màu sắc chưa tồn tại
  // 			return [...prev, value];
  // 		}
  // 	});
  // }, []);

  // const removeImageToState = useCallback((value: ImageType) => {
  // 	setImages((prev) => {
  // 		if (!prev) return [];

  // 		const existingImageIndex = prev.findIndex((item) => item.color === value.color);
  // 		if (existingImageIndex !== -1) {
  // 			const updatedImages = [...prev];
  // 			const remainingImages =
  // 				updatedImages[existingImageIndex].image?.filter((image) => !value.image?.includes(image)) || [];

  // 			// Nếu không còn hình ảnh nào cho màu sắc đó, xóa phần tử
  // 			if (remainingImages.length === 0) {
  // 				return updatedImages.filter((_, i) => i !== existingImageIndex);
  // 			} else {
  // 				updatedImages[existingImageIndex] = {
  // 					...updatedImages[existingImageIndex],
  // 					image: remainingImages,
  // 				};
  // 				return updatedImages;
  // 			}
  // 		}
  // 		return prev;
  // 	});
  // }, []);

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
        <div className='mb-4 mt-5'>
          <SendNewProductEmail products={products} />
        </div>

        {/* Header with Add Product Button */}
        <div className='mb-4 mt-5 flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-800'>Danh sách sản phẩm</h2>
          <MuiButton
            variant='contained'
            startIcon={<MdAdd />}
            onClick={() => setAddProductModalOpen(true)}
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
            Thêm sản phẩm
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
        onSuccess={() => router.refresh()}
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
          router.refresh();
          setEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        parentCategories={parentCategories}
        subCategories={subCategories}
      />
    </>
  );
};

export default ManageProductsClient;
