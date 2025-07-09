'use client';

import Button from '@/app/components/Button';
import SetColor from '@/app/components/products/SetColor';
import SetQuantity from '@/app/components/products/SetQuantity';
import { Rating } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import ProductImage from '@/app/components/products/ProductImage';
import { useCart } from '../../../hooks/useCart';
import { useRouter } from 'next/navigation';
import { formatPrice } from '../../../../../utils/formatPrice';
import Image from 'next/image';
import { truncateText } from '../../../../../utils/truncateText';
import RelatedProducts from '../RelatedProducts';

interface ProductDetailsProps {
  product: any;
}

export type CartProductType = {
  id: string;
  name: string;
  description: string;
  category: string;
  selectedImg: selectedImgType;
  quantity: number;
  price: number;
  inStock: number;
};

export type selectedImgType = {
  color: string;
  colorCode: string;
  images: string[];
  // Extended properties for variant support
  displayLabel?: string;
  previewImage?: string;
  variant?: any; // Reference to the selected variant
};

const Horizontal = () => {
  return <hr className='w-[60%] my-2' />;
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const router = useRouter();
  const { handleAddProductToCart, cartProducts } = useCart();
  const [isProductInCart, setIsProductInCart] = useState(false);

  // Helper function to get default image for both Simple and Variant products
  const getDefaultImage = () => {
    // For variant products, get images from first variant
    if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant.images && firstVariant.images.length > 0) {
        console.log('🔍 ProductDetails variant.images:', firstVariant.images);

        // Check if images is array of strings (old format) or array of objects (new format)
        if (typeof firstVariant.images[0] === 'string') {
          // Old format: images is array of URLs
          console.log('📸 ProductDetails using old format');
          return {
            color: firstVariant.attributes?.color || firstVariant.attributes?.['màu-sắc'] || 'default',
            colorCode: getColorCode(firstVariant.attributes?.color || firstVariant.attributes?.['màu-sắc']),
            images: firstVariant.images
          };
        } else {
          // New format: images is array of objects - MERGE ALL IMAGES
          console.log('📸 ProductDetails using new format - merging images');
          const allImages: string[] = [];
          firstVariant.images.forEach((imageObj: any) => {
            if (imageObj && imageObj.images && Array.isArray(imageObj.images)) {
              allImages.push(...imageObj.images);
            }
          });

          if (allImages.length > 0) {
            return {
              color:
                firstVariant.attributes?.color ||
                firstVariant.attributes?.['màu-sắc'] ||
                firstVariant.images[0]?.color ||
                'default',
              colorCode:
                getColorCode(firstVariant.attributes?.color || firstVariant.attributes?.['màu-sắc']) ||
                firstVariant.images[0]?.colorCode ||
                '#6b7280',
              images: allImages
            };
          }
        }
      }
    }

    // For simple products or fallback
    if (product.images && product.images.length > 0) {
      return { ...product.images[0] };
    }

    // Final fallback
    return {
      color: 'default',
      colorCode: '#000000',
      images: ['/noavatar.png']
    };
  };

  // Helper function to get color code from color name
  const getColorCode = (colorName?: string): string => {
    const colorMap: { [key: string]: string } = {
      đỏ: '#ff0000',
      red: '#ff0000',
      xanh: '#0000ff',
      blue: '#0000ff',
      'xanh-lá': '#00ff00',
      green: '#00ff00',
      vàng: '#ffff00',
      yellow: '#ffff00',
      đen: '#000000',
      black: '#000000',
      trắng: '#ffffff',
      white: '#ffffff',
      xám: '#808080',
      gray: '#808080',
      hồng: '#ffc0cb',
      pink: '#ffc0cb',
      bgc: '#4285f4'
    };

    return colorMap[colorName?.toLowerCase() || ''] || '#000000';
  };

  const [cartProduct, setCartProduct] = useState<CartProductType>({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.categoryId,
    selectedImg: getDefaultImage(),
    quantity: 1,
    price: product.price,
    inStock: product.inStock
  });

  // Function to trigger chat box opening
  const handleOpenChat = () => {
    // Dispatch custom event to open chat box
    const event = new CustomEvent('openChatBox', {
      detail: {
        message: `Xin chào! Tôi muốn tư vấn về sản phẩm "${product.name}" hiện đang hết hàng. Khi nào có thể đặt hàng được ạ?`
      }
    });
    window.dispatchEvent(event);
  };

  // Check xem đã nhấn button chưa
  useEffect(() => {
    if (cartProducts) {
      const existsProduct = cartProducts.findIndex(cartProduct => cartProduct.id === product.id);
      if (existsProduct > -1) setIsProductInCart(true);
    }
  }, [cartProducts, product.id]);

  // Trung bình điểm rating
  const productRating =
    product.reviews.reduce((acc: number, item: any) => item.rating + acc, 0) / product.reviews.length;

  // Check color hiện tại và img thay đổi theo color đc select
  const handleColorSelect = useCallback((value: selectedImgType) => {
    setCartProduct(prev => ({
      ...prev,
      selectedImg: value
    }));
  }, []);

  // const handleQtyIncrease = () => {
  // 	if (cartProduct.quantity == 99) return;
  // 	setCartProduct((prev) => {
  // 		return { ...prev, quantity: prev.quantity++ };
  // 	});
  // };

  const [selectedProducts, setSelectedProducts] = useState<any>([]);

  const handleSelectProduct = (product: any) => {
    setSelectedProducts((prevSelected: any) => {
      if (prevSelected.includes(product)) {
        return prevSelected.filter((item: any) => item !== product);
      } else {
        return [...prevSelected, product];
      }
    });
  };

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-12 mt-6'>
        {/*Product Image */}
        <ProductImage cartProduct={cartProduct} />
        <div className='flex flex-col gap-1 text-slate-500 text-sm ml-0 lg:ml-16'>
          <h2 className='text-3xl font-semibold text-slate-700'>{product.name}</h2>
          <div className='flex items-center gap-2'>
            <Rating value={productRating} readOnly precision={0.5} />
            <div className='py-2'>({product.reviews.length}) Đánh giá</div>
          </div>
          <Horizontal />
          <div className='font-semibold text-2xl text-[#d43232]'>{formatPrice(product.price)}</div>
          <div className='mt-4'>
            <div className='flex items-center gap-2'>
              <Image
                src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAkFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDIYgjAAAAL3RSTlMAA+3v6dAPc27xFhIJoeV5PAwUfYD0qGhA1cuKh4I4m/PdwYRVRhm0Mfaek1wiHkHxqD0AAAGjSURBVEjHxZXZmsIgDEap1NZKxa2udV9mn+H9324qCc1gOqJX5sJP8D/lBD+jeFKpQu/T4f3xtTRVxf3hnfHMYLXuQNQR44iMk9vx1QSCcVpIjvB45uK5EMm4BStZqMb4yMVNmcMOIWvVEN/V4lka4e6wj0h2VH68xDi2sDiLGokRWY3qeLfEnO7kmza8nf7USIrIruzCzoni1SqagcWknzskd8jkZNcxxcFvCx/vwQsQDddnV+jQpZbelrD3+l1bT2EHACjZiQiZwbHvhT026kjjAVjtARHJJ3pV2gO4CA/Ard5frwN69fBxHoCH+l5fl05J2AOqtnoNXqUxdPQVQKrk5T2EA+LKi+4mEgxgj2R30wR4Xg4NASSCciEAvaj9IIBe2EgAIC+6mzDAYof5QwDGwwDXfBCYLzxABYAX+MVpu2BzhwFRmsHYhH60schaMYBsbH3gZDprNxATBpCNWW4EmzuySK4AspnB90gIDXcCyGYLNv8gCDAbKhq7+EdlAW7DkZZDLq+eTQCB4ja86F+H2QQRsgkjhWQ2QSTWYPOE+gXYtoxt56HlPQAAAABJRU5ErkJggg=='
                alt='test'
                width={24}
                height={24}
              />
              <span className='font-semibold'>Giao hàng:</span>
              <span>Ước tính từ 3-7 ngày làm việc</span>
            </div>
          </div>
          {/* Khoang cach  */}
          <div className='flex items-center gap-2 mt-4'>
            <Image
              src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAAXNSR0IArs4c6QAAAGxQTFRFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdCL/qgAAACN0Uk5TAAECBQcKDC8wNjdJUFFSVVaKjJGSpKfW2Nnc3uLj8vf4+f4zTbT9AAAAqElEQVRIx+2VQQ6CMBQFUbQiiIiCYoWCnfvf0YVKo9FSYogxMqu+9E3Sv/n1vG/gJ3mh1DHf+G79WHJDxg71aapp0dtJp5DyQNr5Hg3UWShEmDUAq455JVAF1xBUwGlmFRLgvLinoAHWViEHdiZmwN4qFMDSxBA4WAUFzE0UQP2iFpU4UEat4NSHshVw5DPh+WS9+XPhPaMwCqPwW8Kwu7X3uu/9oQzKBQJXW7+Qz1mDAAAAAElFTkSuQmCC'
              alt='ccc'
              width={24}
              height={24}
            />
            <span className='font-semibold'>Hàng hóa: </span>
            <span className={product.inStock ? 'text-teal-400' : 'text-[#d43232]'}>
              {product.inStock ? 'Có sẵn' : 'Hết hàng'}
            </span>
          </div>
          {isProductInCart ? (
            <>
              <Button
                outline
                custom='md:!w-[400px] mt-5'
                label='Xem giỏ hàng'
                onClick={() => {
                  router.push('/cart');
                }}
              />
            </>
          ) : (
            <>
              <div className='mt-4'>
                <SetColor cartProduct={cartProduct} product={product} handleColorSelect={handleColorSelect} />
              </div>
              <Horizontal />
              {product.inStock ? (
                <Button
                  custom='md:!w-[400px] mt-7'
                  label='Thêm vào giỏ hàng'
                  onClick={() => {
                    handleAddProductToCart(cartProduct);
                  }}
                />
              ) : (
                <Button custom='md:!w-[400px] mt-7' label='Tư vấn để đặt hàng' outline onClick={handleOpenChat} />
              )}
            </>
          )}
        </div>
      </div>

      {/* <RelatedProducts product={product} cartProduct={cartProduct} /> */}
    </>
  );
};

export default ProductDetails;
