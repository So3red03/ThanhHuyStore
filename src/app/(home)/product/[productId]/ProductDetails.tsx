'use client';

import Button from '@/app/components/Button';
import ProductImage from '@/app/components/products/ProductImage';
import SetColor from '@/app/components/products/SetColor';
import SetQuantity from '@/app/components/products/SetQuantity';
import { Rating } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
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
  selectedImg: string; // URL of selected image
  quantity: number;
  price: number;
  inStock: number;
};

export type selectedImgType = {
  images: string[];
  // Extended properties for variant support
  displayLabel?: string;
  previewImage?: string;
  variant?: any; // Reference to the selected variant
  variantId?: string; // ID of the selected variant
  attributes?: Record<string, string>; // Selected attributes like {"color": "silver", "storage": "512gb"}
};

const Horizontal = () => {
  return <hr className='w-[60%] my-2' />;
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const router = useRouter();
  const { handleAddProductToCart, cartProducts } = useCart();
  const [isProductInCart, setIsProductInCart] = useState(false);

  // DEBUG: Log product data to understand structure
  console.log('🔍 ProductDetails received product:', product);
  console.log('🔍 Product type:', product.productType);
  console.log('🔍 Product images:', product.images);
  console.log('🔍 Product variants:', product.variants);

  // Helper function to create display label for variant
  const getVariantDisplayLabel = (attributes: Record<string, string> = {}): string => {
    const attributeValues = Object.values(attributes).filter(Boolean);
    return attributeValues.length > 0 ? attributeValues.join(' - ') : 'Biến thể';
  };

  // Helper function to get default image for both Simple and Variant products
  const getDefaultImage = () => {
    console.log('🖼️ getDefaultImage called for product type:', product.productType);

    // Handle Simple products - use new thumbnail/galleryImages structure
    if (product.productType === 'SIMPLE') {
      console.log('🖼️ Simple product - checking thumbnail and galleryImages');

      // Use thumbnail first, then gallery images as fallback
      if (product.thumbnail) {
        return {
          images: [product.thumbnail, ...(product.galleryImages || [])],
          displayLabel: 'Sản phẩm đơn'
        };
      } else if (product.galleryImages && product.galleryImages.length > 0) {
        return {
          images: product.galleryImages,
          displayLabel: 'Sản phẩm đơn'
        };
      }

      // Fallback to old images structure if new structure not available
      else if (product.images && product.images.length > 0) {
        console.log('🖼️ Fallback to old images structure:', product.images);
        if (product.images[0] && product.images[0].images && product.images[0].images.length > 0) {
          return {
            images: product.images[0].images,
            displayLabel: 'Sản phẩm đơn'
          };
        }
      }
    }
    // Handle Variant products - use new thumbnail/galleryImages structure
    else if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
      console.log('🖼️ Variant product - checking variants for images');

      // Try to find a variant with thumbnail or galleryImages
      const variantWithImage = product.variants.find((variant: any) => {
        return variant.thumbnail || (variant.galleryImages && variant.galleryImages.length > 0);
      });

      if (variantWithImage) {
        const images = [];

        // Add thumbnail first if available
        if (variantWithImage.thumbnail) {
          images.push(variantWithImage.thumbnail);
        }

        // Add gallery images
        if (variantWithImage.galleryImages && variantWithImage.galleryImages.length > 0) {
          images.push(...variantWithImage.galleryImages);
        }

        if (images.length > 0) {
          return {
            images,
            variantId: variantWithImage.id,
            attributes: variantWithImage.attributes,
            displayLabel: getVariantDisplayLabel(variantWithImage.attributes)
          };
        }
      }

      // Fallback to old images structure for variants
      else {
        const variantWithOldImages = product.variants.find((variant: any) => {
          return variant.images && Array.isArray(variant.images) && variant.images.length > 0;
        });

        if (variantWithOldImages && variantWithOldImages.images.length > 0) {
          // Check if images is array of strings (old format) or array of objects (new format)
          if (typeof variantWithOldImages.images[0] === 'string') {
            // Old format: images is array of URLs
            return {
              images: variantWithOldImages.images,
              variantId: variantWithOldImages.id,
              attributes: variantWithOldImages.attributes,
              displayLabel: getVariantDisplayLabel(variantWithOldImages.attributes)
            };
          } else {
            // New format: images is array of objects - COLLECT ALL IMAGES FROM ALL OBJECTS
            const allImages: string[] = [];

            for (const imageObj of variantWithOldImages.images) {
              if (imageObj && imageObj.images && Array.isArray(imageObj.images) && imageObj.images.length > 0) {
                allImages.push(...imageObj.images);
              }
            }

            if (allImages.length > 0) {
              return {
                images: allImages,
                variantId: variantWithOldImages.id,
                attributes: variantWithOldImages.attributes,
                displayLabel: getVariantDisplayLabel(variantWithOldImages.attributes)
              };
            }
          }
        }
      }

      // Fallback: check main product thumbnail/galleryImages for variant products
      if (product.thumbnail || (product.galleryImages && product.galleryImages.length > 0)) {
        const images = [];
        if (product.thumbnail) images.push(product.thumbnail);
        if (product.galleryImages) images.push(...product.galleryImages);

        return {
          images,
          displayLabel: 'Sản phẩm biến thể'
        };
      }

      // Final fallback: check old main product images structure
      else if (
        product.images &&
        product.images.length > 0 &&
        product.images[0].images &&
        product.images[0].images.length > 0
      ) {
        return {
          images: product.images[0].images,
          displayLabel: 'Sản phẩm biến thể'
        };
      }
    }

    // Final fallback
    return {
      images: ['/noavatar.png'],
      displayLabel: 'Không có ảnh'
    };
  };

  // Calculate stock based on product type
  const calculateStock = () => {
    if (product.productType === 'VARIANT' && product.variants && product.variants.length > 0) {
      // For variant products, calculate total stock from all variants
      return product.variants.reduce((total: number, variant: any) => {
        return total + (variant.stock || 0);
      }, 0);
    }
    // For simple products, use product.inStock
    return product.inStock || 0;
  };

  const totalStock = calculateStock();

  const [cartProduct, setCartProduct] = useState<CartProductType>({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.categoryId,
    selectedImg: getDefaultImage()?.images?.[0] || '/noavatar.png',
    quantity: 1,
    price: product.price,
    inStock: totalStock
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
      selectedImg: value.images?.[0] || '/noavatar.png'
    }));
  }, []);

  // const handleQtyIncrease = () => {
  // 	if (cartProduct.quantity == 99) return;
  // 	setCartProduct((prev) => {
  // 		return { ...prev, quantity: prev.quantity++ };
  // 	});
  // };

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
            <span className={totalStock > 0 ? 'text-teal-400' : 'text-[#d43232]'}>
              {totalStock > 0 ? 'Có sẵn' : 'Hết hàng'}
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
              {/* Only show SetColor for VARIANT products, not SIMPLE products */}
              {product.productType === 'VARIANT' && (
                <>
                  <div className='mt-4'>
                    <SetColor cartProduct={cartProduct} product={product} handleColorSelect={handleColorSelect} />
                  </div>
                  <Horizontal />
                </>
              )}
              {totalStock > 0 ? (
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
