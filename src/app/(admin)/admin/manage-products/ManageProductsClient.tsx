'use client';

import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { Product } from '@prisma/client';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { formatPrice } from '../../../utils/formatPrice';
import {
  MdCached,
  MdClose,
  MdDelete,
  MdDone,
  MdEdit,
  MdRefresh,
  MdSearch,
  MdFilterList,
  MdRestore,
  MdVisibility,
  MdDownload
} from 'react-icons/md';
import { useRouter, useSearchParams } from 'next/navigation';
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
// Removed SendMarketingEmail import - now using separate page
import Image from 'next/image';
import {
  Rating,
  Button as MuiButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Box
} from '@mui/material';
import { MdAdd } from 'react-icons/md';
import { FaDollarSign, FaRegBuilding, FaRegEnvelope, FaRegListAlt, FaRegWindowMaximize } from 'react-icons/fa';
import * as SlIcons from 'react-icons/sl';
import * as AiIcons from 'react-icons/ai';
import * as TbIcons from 'react-icons/tb';
import * as MdIcons from 'react-icons/md';
import { ExcelExportService } from '@/app/utils/excelExport';
import Link from 'next/link';
import { slugConvert } from '../../../utils/Slug';
import AddProductModalNew from './AddProductModalNew';
import { set } from 'nprogress';

interface ManageProductsClientProps {
  products: Product[];
  currentUser: SafeUser | null | undefined;
  subCategories: any;
  parentCategories: any;
  orders?: any[]; // Add orders for calculating sold quantities
}

const ManageProductsClient: React.FC<ManageProductsClientProps> = ({
  products,
  currentUser,
  subCategories,
  parentCategories,
  orders = []
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isExporting, setIsExporting] = useState(false);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  // Removed showEmailModal state - now using router navigation

  // Enhanced search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState(products);

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
      // Fetch fresh product data from API
      const response = await fetch('/api/product?admin=true');
      if (response.ok) {
        const data = await response.json();
        const freshProducts = data.products || data;

        // Update current products with fresh data
        setCurrentProducts(freshProducts);

        toast.success('Đã làm mới danh sách sản phẩm');
        console.log('📦 Product data refreshed successfully');
      } else {
        toast.error('Lỗi khi tải danh sách sản phẩm');
        router.refresh(); // Fallback to full page refresh
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
      toast.error('Lỗi khi làm mới danh sách sản phẩm');
      router.refresh(); // Fallback to full page refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle Excel Export
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      // Use filtered products for export
      const productsToExport = showDeleted ? deletedProducts : filteredProducts;

      const fileName = ExcelExportService.exportProductsReport(productsToExport);
      toast.success(`Xuất Excel thành công: ${fileName}`);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Lỗi khi xuất file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const fetchDeletedProducts = async () => {
    try {
      const response = await fetch('/api/product?admin=true&onlyDeleted=true');
      if (response.ok) {
        const data = await response.json();
        setDeletedProducts(data.products || data);
      } else {
        toast.error('Lỗi khi tải sản phẩm đã xóa');
      }
    } catch (error) {
      console.error('Error fetching deleted products:', error);
      toast.error('Lỗi khi tải sản phẩm đã xóa');
    }
  };

  const toggleShowDeleted = async () => {
    if (!showDeleted) {
      await fetchDeletedProducts();
    }
    setShowDeleted(!showDeleted);
  };

  const handleRestoreProduct = async (productId: string) => {
    try {
      await axios.put(`/api/product/restore/${productId}`);
      toast.success('Khôi phục sản phẩm thành công');
      await fetchDeletedProducts(); // Refresh deleted products list
      await handleRefresh(); // Refresh main products list
    } catch (error) {
      console.error('Error restoring product:', error);
      toast.error('Lỗi khi khôi phục sản phẩm');
    }
  };

  const onTextChange = (e: any) => {
    const newText = e.htmlValue;
    setText(newText);
    setCustomValue('description', newText); // Cập nhật giá trị description trong form
  };

  // Enhanced filter logic
  const handleSearch = () => {
    let filtered = currentProducts;

    // Search by name or description
    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category (parent category)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => {
        // Tìm subcategory của product
        const subCategory = subCategories.find((sub: any) => sub.id === product.categoryId);
        // So sánh parentId của subcategory với categoryFilter
        return subCategory?.parentId === categoryFilter;
      });
    }

    // Filter by price range
    if (priceRangeFilter !== 'all') {
      filtered = filtered.filter(product => {
        const price = product.price || 0;
        switch (priceRangeFilter) {
          case 'under-1m':
            return price < 1000000;
          case '1m-5m':
            return price >= 1000000 && price < 5000000;
          case '5m-10m':
            return price >= 5000000 && price < 10000000;
          case '10m-20m':
            return price >= 10000000 && price < 20000000;
          case 'over-20m':
            return price >= 20000000;
          default:
            return true;
        }
      });
    }

    // Filter by stock status
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const inStock = product.inStock || 0;
        switch (stockFilter) {
          case 'in-stock':
            return inStock > 0;
          case 'low-stock':
            return inStock > 0 && inStock <= 10;
          case 'out-of-stock':
            return inStock === 0;
          default:
            return true;
        }
      });
    }

    // Filter by product type
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (productTypeFilter) {
          case 'simple':
            return product.productType === 'SIMPLE';
          case 'variant':
            return product.productType === 'VARIANT';
          default:
            return true;
        }
      });
    }

    setFilteredProducts(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPriceRangeFilter('all');
    setStockFilter('all');
    setProductTypeFilter('all');
    setFilteredProducts(products);
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
  const dataSource = showDeleted ? deletedProducts : filteredProducts;

  if (dataSource?.length > 0) {
    rows = dataSource?.map((product: any) => {
      // Tính điểm đánh giá của mỗi sản phẩm
      const productRating =
        product.reviews?.reduce((acc: number, item: any) => item.rating + acc, 0) / (product.reviews?.length || 1) || 0;
      // Tìm tên danh mục cha dựa vào parentId
      const subCategory = subCategories.find((sub: any) => sub.id === product.categoryId)?.name;

      // Tính số lượng đã bán = Tổng mua - Tổng trả (cho từng sản phẩm riêng lẻ)
      const totalPurchased = orders.reduce((total: number, order: any) => {
        // Chỉ tính orders đã hoàn thành
        if (order.status !== 'completed' || !order.products || !Array.isArray(order.products)) {
          return total;
        }

        const orderProduct = order.products.find((p: any) => p.id === product.id);
        return total + (orderProduct?.quantity || 0);
      }, 0);

      // Tính tổng số lượng đã trả cho sản phẩm này
      const totalReturned = orders.reduce((total: number, order: any) => {
        // Chỉ tính orders đã hoàn thành và có return requests
        if (order.status !== 'completed' || !order.returnRequests || !Array.isArray(order.returnRequests)) {
          return total;
        }

        // Tính tổng số lượng trả của sản phẩm này từ tất cả return requests đã completed
        const returnedQuantity = order.returnRequests.reduce((returnTotal: number, returnReq: any) => {
          if (returnReq.status !== 'COMPLETED' || !returnReq.items || !Array.isArray(returnReq.items)) {
            return returnTotal;
          }

          const returnedItem = returnReq.items.find((item: any) => item.productId === product.id);
          return returnTotal + (returnedItem?.quantity || 0);
        }, 0);

        return total + returnedQuantity;
      }, 0);

      // Số lượng thực tế đã bán = Tổng mua - Tổng trả
      const actualSold = Math.max(0, totalPurchased - totalReturned);
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
        totalPurchased: actualSold, // ✅ Số lượng thực tế đã bán (đã trừ trả hàng)
        createdAt: product.createdAt, // ✅ Add creation date
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
      field: 'totalPurchased',
      headerName: 'Đã bán',
      width: 90,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full'>
            <Status text={params.row.totalPurchased || 0} bg='bg-blue-200' color='text-blue-700' />
          </div>
        );
      }
    },
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
              <Status text='Hết hàng' bg='bg-rose-200' color='text-rose-700' />
            )}
          </div>
        );
      }
    },
    {
      field: 'priority',
      headerName: 'Ưu tiên',
      width: 80,
      renderCell: params => {
        const priority = params.row.priority || 0;
        return (
          <div className='flex justify-center items-center h-full'>
            <Status
              text={priority.toString()}
              bg={priority > 0 ? 'bg-orange-200' : 'bg-gray-200'}
              color={priority > 0 ? 'text-orange-700' : 'text-gray-700'}
            />
          </div>
        );
      }
    },
    {
      field: 'productType',
      headerName: 'Loại SP',
      width: 120,
      renderCell: params => {
        const isVariant = params.row.productType === 'VARIANT';
        const variantCount = params.row.variants?.length || 0;

        if (!isVariant) {
          return (
            <div className='flex justify-center items-center h-full'>
              <Status text='Đơn giản' bg='bg-green-200' color='text-green-700' />
            </div>
          );
        }

        // Variant products - clickable button to show variants (same size as Status component)
        return (
          <div className='flex justify-center items-center h-full'>
            <button
              onClick={e => {
                e.stopPropagation();
                setSelectedProduct(params.row);
                setShowVariantsModal(true);
              }}
              className='bg-blue-100 hover:bg-blue-200 text-blue-800 flex items-center gap-x-1 py-1.5 px-2 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer border border-blue-200 hover:border-blue-300'
              title='Click để xem chi tiết biến thể'
            >
              {variantCount} biến thể
            </button>
          </div>
        );
      }
    },
    {
      field: 'rating',
      headerName: 'TB rating',
      width: 130,
      renderCell: params => {
        return (
          <div className='flex items-center justify-center w-full h-full'>
            <Rating value={params.row.rating} readOnly precision={0.5} />
          </div>
        );
      }
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 120,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full'>
            <div className='text-gray-600 text-sm'>{new Date(params.row.createdAt).toLocaleDateString('vi-VN')}</div>
          </div>
        );
      }
    },
    {
      field: 'action',
      headerName: '',
      width: 170,
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
                setSelectedProduct(params.row);
                toggleDelete();
              }}
            />
          </div>
        );
      }
    }
  ];

  const deletedColumns: GridColDef[] = [
    {
      field: 'images',
      headerName: 'Ảnh SP',
      width: 80,
      renderCell: params => {
        // Helper function to get product image (handles both simple and variant products)
        const getProductImage = (product: any) => {
          // For simple products, use thumbnail or first gallery image
          if (product.productType === 'SIMPLE') {
            if (product.thumbnail) return product.thumbnail;
            if (product.galleryImages && product.galleryImages.length > 0) return product.galleryImages[0];
          }

          // For variant products, try to get image from first active variant
          if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
            const firstVariant = product.variants[0];
            if (firstVariant.thumbnail) return firstVariant.thumbnail;
            if (firstVariant.galleryImages && firstVariant.galleryImages.length > 0)
              return firstVariant.galleryImages[0];
          }

          // Fallback to product-level images
          if (product.thumbnail) return product.thumbnail;
          if (product.galleryImages && product.galleryImages.length > 0) return product.galleryImages[0];

          // Final fallback
          return '/noavatar.png';
        };

        return (
          <Image
            src={getProductImage(params.row)}
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
      width: 200,
      renderCell: params => (
        <div className='text-[#212B36]'>
          <h3 className='m-0'>{params.row.name}</h3>
        </div>
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
    { field: 'subCategory', headerName: 'Danh mục', width: 120 },
    {
      field: 'productType',
      headerName: 'Loại',
      width: 100,
      renderCell: params => {
        const isVariant = params.row.productType === 'VARIANT';
        const variantCount = params.row.variants?.length || 0;

        if (!isVariant) {
          return <div className='text-center text-xs font-medium text-gray-600'>Đơn giản</div>;
        }

        return <div className='text-center text-xs font-medium text-blue-600'>{variantCount} biến thể</div>;
      }
    },
    {
      field: 'priority',
      headerName: 'Ưu tiên',
      width: 70,
      renderCell: params => {
        return <div className='text-center'>{params.row.priority || 0}</div>;
      }
    },
    {
      field: 'inStock',
      headerName: 'Tồn kho',
      width: 80,
      renderCell: params => {
        return <div className='text-center'>{params.row.inStock || 0}</div>;
      }
    },
    {
      field: 'deletedAt',
      headerName: 'Ngày xóa',
      width: 120,
      renderCell: params => {
        return params.row.deletedAt ? new Date(params.row.deletedAt).toLocaleDateString('vi-VN') : '';
      }
    },
    {
      field: 'deletedBy',
      headerName: 'Người xóa',
      width: 120,
      renderCell: params => {
        return params.row.deletedBy || '';
      }
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 100,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full w-full'>
            <ActionBtn
              icon={MdRestore}
              onClick={() => {
                handleRestoreProduct(params.row.id);
              }}
            />
          </div>
        );
      }
    }
  ];

  // Use appropriate columns based on view mode
  const columns = showDeleted ? deletedColumns : baseColumns;

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
        categoryId: data.categoryId,
        priority: Number(data.priority || 0)
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

  // Auto-trigger search when filters change
  useEffect(() => {
    handleSearch();
  }, [searchTerm, categoryFilter, priceRangeFilter, stockFilter, productTypeFilter, currentProducts]);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Check for view=productId query parameter to auto-open product form
  useEffect(() => {
    if (searchParams && currentProducts.length > 0) {
      const viewProductId = searchParams.get('view');
      if (viewProductId) {
        // Find the product by ID
        const productToView = currentProducts.find(product => product.id === viewProductId);
        if (productToView) {
          // Auto-open the product modal
          handleOpenModal(productToView);

          // Clean up URL without triggering navigation
          const url = new URL(window.location.href);
          url.searchParams.delete('view');
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [searchParams, currentProducts]);

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
    return <NullData title='Từ chối đăng nhập' />;
  }
  return (
    <div className='w-full m-auto text-xl mt-6'>
      {/* Header */}
      <div className='px-6 py-5'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold text-gray-800'>Sản phẩm</h1>
            <Chip
              label={showDeleted ? `${deletedProducts.length} đã xóa` : `${filteredProducts.length} hiện có`}
              size='medium'
              sx={{
                backgroundColor: showDeleted ? '#fee2e2' : '#dbeafe',
                color: showDeleted ? '#dc2626' : '#1e40af',
                fontWeight: 600
              }}
            />
          </div>
          <div className='flex items-center gap-3'>
            <MuiButton
              variant='outlined'
              startIcon={isExporting ? <CircularProgress size={16} color='inherit' /> : <MdDownload />}
              onClick={handleExportExcel}
              disabled={isExporting}
              sx={{
                textTransform: 'none',
                borderColor: '#10b981',
                color: '#10b981',
                '&:hover': {
                  borderColor: '#059669',
                  backgroundColor: '#ecfdf5',
                  color: '#059669'
                },
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
            </MuiButton>
            <MuiButton
              onClick={toggleShowDeleted}
              startIcon={showDeleted ? <MdVisibility /> : <MdDelete />}
              variant={showDeleted ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                borderColor: showDeleted ? '#dc2626' : '#6b7280',
                color: showDeleted ? '#ffffff' : '#6b7280',
                backgroundColor: showDeleted ? '#dc2626' : 'transparent',
                transition: 'all 0.3s ease-in-out',
                transform: showDeleted ? 'scale(1.02)' : 'scale(1)',
                boxShadow: showDeleted ? '0 4px 12px rgba(220, 38, 38, 0.3)' : 'none',
                '&:hover': {
                  borderColor: showDeleted ? '#b91c1c' : '#4b5563',
                  backgroundColor: showDeleted ? '#b91c1c' : '#f9fafb',
                  transform: 'scale(1.05)',
                  boxShadow: showDeleted ? '0 6px 16px rgba(220, 38, 38, 0.4)' : '0 2px 8px rgba(107, 114, 128, 0.2)'
                },
                '& .MuiButton-startIcon': {
                  transition: 'transform 0.2s ease-in-out',
                  transform: showDeleted ? 'rotate(0deg)' : 'rotate(0deg)'
                }
              }}
            >
              {showDeleted ? (
                <span className='flex items-center gap-1'>
                  <span>Đang xem đã xóa</span>
                  <Chip
                    label={deletedProducts.length}
                    size='small'
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '0.7rem',
                      height: '18px'
                    }}
                  />
                </span>
              ) : (
                'Xem sản phẩm đã xóa'
              )}
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
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
            >
              {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </MuiButton>
          </div>
        </div>

        {/* Enhanced Search Form */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
            {/* Search Input */}
            <div className='lg:col-span-2'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Tìm kiếm</label>
              <TextField
                size='medium'
                placeholder='Tìm theo tên sản phẩm hoặc mô tả...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '&:hover': {
                      backgroundColor: '#f3f4f6'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        borderWidth: '2px'
                      }
                    }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <MuiButton
                        size='medium'
                        onClick={handleSearch}
                        startIcon={<MdSearch />}
                        variant='contained'
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          backgroundColor: '#3b82f6',
                          '&:hover': { backgroundColor: '#2563eb' }
                        }}
                      >
                        Tìm
                      </MuiButton>
                    </InputAdornment>
                  )
                }}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Danh mục</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '& .MuiOutlinedInput-root': {
                      '&:hover': {
                        backgroundColor: '#f3f4f6'
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff'
                      }
                    }
                  }}
                >
                  <MenuItem value='all'>Tất cả danh mục</MenuItem>
                  {parentCategories?.map((category: any) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Khoảng giá</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={priceRangeFilter}
                  onChange={e => setPriceRangeFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '& .MuiOutlinedInput-root': {
                      '&:hover': {
                        backgroundColor: '#f3f4f6'
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff'
                      }
                    }
                  }}
                >
                  <MenuItem value='all'>Tất cả giá</MenuItem>
                  <MenuItem value='under-1m'>Dưới 1 triệu</MenuItem>
                  <MenuItem value='1m-5m'>1 - 5 triệu</MenuItem>
                  <MenuItem value='5m-10m'>5 - 10 triệu</MenuItem>
                  <MenuItem value='10m-20m'>10 - 20 triệu</MenuItem>
                  <MenuItem value='over-20m'>Trên 20 triệu</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Trạng thái kho</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={stockFilter}
                  onChange={e => setStockFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '& .MuiOutlinedInput-root': {
                      '&:hover': {
                        backgroundColor: '#f3f4f6'
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff'
                      }
                    }
                  }}
                >
                  <MenuItem value='all'>Tất cả</MenuItem>
                  <MenuItem value='in-stock'>Còn hàng</MenuItem>
                  <MenuItem value='low-stock'>Sắp hết (≤10)</MenuItem>
                  <MenuItem value='out-of-stock'>Hết hàng</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Product Type Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Loại sản phẩm</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={productTypeFilter}
                  onChange={e => setProductTypeFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '& .MuiOutlinedInput-root': {
                      '&:hover': {
                        backgroundColor: '#f3f4f6'
                      },
                      '&.Mui-focused': {
                        backgroundColor: '#ffffff'
                      }
                    }
                  }}
                >
                  <MenuItem value='all'>Tất cả loại</MenuItem>
                  <MenuItem value='simple'>Sản phẩm đơn giản</MenuItem>
                  <MenuItem value='variant'>Sản phẩm biến thể</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-between items-center mt-6'>
            {(searchTerm ||
              categoryFilter !== 'all' ||
              priceRangeFilter !== 'all' ||
              stockFilter !== 'all' ||
              productTypeFilter !== 'all') && (
              <MuiButton
                variant='outlined'
                onClick={handleClearFilters}
                size='medium'
                startIcon={<MdFilterList />}
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  '&:hover': {
                    borderColor: '#dc2626',
                    backgroundColor: '#fef2f2'
                  }
                }}
              >
                Xóa bộ lọc
              </MuiButton>
            )}

            {/* Search Results Info */}
            {(searchTerm ||
              categoryFilter !== 'all' ||
              priceRangeFilter !== 'all' ||
              stockFilter !== 'all' ||
              productTypeFilter !== 'all') && (
              <div className='px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg'>
                <div className='text-sm font-medium text-green-800'>
                  <strong>Kết quả:</strong> {filteredProducts.length} sản phẩm
                  {filteredProducts.length === 0 && (
                    <span className='text-red-600 ml-2'>- Không tìm thấy sản phẩm nào phù hợp</span>
                  )}
                </div>
              </div>
            )}
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

      {/* Product Variants Modal */}
      {showVariantsModal && selectedProduct && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden'>
            {/* Modal Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>Biến thể sản phẩm</h2>
                <p className='text-sm text-gray-600 mt-1'>{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setShowVariantsModal(false)}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <MdClose size={24} className='text-gray-500' />
              </button>
            </div>

            {/* Modal Content */}
            <div className='p-6 overflow-y-auto max-h-[60vh]'>
              {(selectedProduct as any).variants && (selectedProduct as any).variants.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full border-collapse'>
                    <thead>
                      <tr className='border-b border-gray-200'>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>#</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Ảnh</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>SKU</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Thuộc tính</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Tồn kho</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Giá bán</th>
                        <th className='text-left py-3 px-4 font-semibold text-gray-700'>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedProduct as any).variants.map((variant: any, index: number) => {
                        // Parse attributes JSON to display
                        let attributesDisplay = 'N/A';
                        try {
                          if (variant.attributes && typeof variant.attributes === 'object') {
                            const attrs = Object.entries(variant.attributes)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ');
                            attributesDisplay = attrs || 'N/A';
                          }
                        } catch (e) {
                          attributesDisplay = 'N/A';
                        }

                        return (
                          <tr key={variant.id || index} className='border-b border-gray-100 hover:bg-gray-50'>
                            <td className='py-3 px-4 text-sm text-gray-600'>{index + 1}</td>
                            <td className='py-3 px-4'>
                              {variant.thumbnail || (variant.galleryImages && variant.galleryImages[0]) ? (
                                <Image
                                  src={variant.thumbnail || variant.galleryImages[0]}
                                  alt='Variant'
                                  width={40}
                                  height={40}
                                  className='rounded object-cover'
                                  onError={e => {
                                    e.currentTarget.src = '/noavatar.png';
                                  }}
                                />
                              ) : (
                                <div className='w-10 h-10 bg-gray-200 rounded flex items-center justify-center'>
                                  <span className='text-xs text-gray-500'>Không có</span>
                                </div>
                              )}
                            </td>
                            <td className='py-3 px-4 text-sm text-gray-700 font-mono'>{variant.sku || 'N/A'}</td>
                            <td className='py-3 px-4 text-sm text-gray-700'>
                              <div className='max-w-xs'>
                                <span className='text-xs bg-gray-100 px-2 py-1 rounded'>{attributesDisplay}</span>
                              </div>
                            </td>
                            <td className='py-3 px-4'>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (variant.stock || 0) > 10
                                    ? 'bg-green-100 text-green-800'
                                    : (variant.stock || 0) > 0
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {variant.stock || 0}
                              </span>
                            </td>
                            <td className='py-3 px-4 text-sm font-semibold text-gray-900'>
                              {formatPrice(variant.price || 0)}
                            </td>
                            <td className='py-3 px-4'>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  variant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {variant.isActive ? 'Hoạt động' : 'Tạm dừng'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='text-center py-8'>
                  <div className='text-gray-400 mb-2'>
                    <MdVisibility size={48} />
                  </div>
                  <p className='text-gray-600'>Không có biến thể nào</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProductsClient;
