'use client';
import Link from 'next/link';
import { useCart } from '../../hooks/useCart';
import { useHydration } from '../../hooks/useHydration';
import { MdArrowBack } from 'react-icons/md';
import Button from '../../components/Button';
import ItemContent from './ItemContent';
import { formatPrice } from '../../../../utils/formatPrice';
import { useRouter } from 'next/navigation';
import { SafeUser } from '../../../../types';
import toast from 'react-hot-toast';
import DiscountComboBox from './DiscountCombobox';
import VoucherDisplay from './VoucherDisplay';
import { useEffect, useState } from 'react';

interface CartBuyClientProps {
  currentUser: SafeUser | null | undefined;
}

const CartBuyClient: React.FC<CartBuyClientProps> = ({ currentUser }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { cartProducts, cartTotalAmount, handleNextStep, setStep, discountAmount, shippingFee } = useCart();
  const { isHydrated } = useHydration();

  useEffect(() => {
    // Chỉ set step = 1 sau khi hydrated và nếu đang ở cart page
    if (isHydrated && window.location.pathname === '/cart') {
      setStep(1);
    }
  }, [isHydrated, setStep]);

  // Ràng buộc
  const handleCheckout = () => {
    setIsLoading(true);
    if (cartTotalAmount > 99000000) {
      toast.error('Tổng giá trị đơn hàng không được vượt quá 99tr VND');
      setIsLoading(false);
      return;
    }
    handleNextStep();
    setTimeout(() => {
      router.push('/cart/cartinfo');
      setIsLoading(false);
    }, 1000);
  };

  // Show loading while hydrating to prevent flash
  if (!isHydrated) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  return !cartProducts || cartProducts.length === 0 ? (
    <div className='flex flex-col items-center'>
      <div className='text-base lg:text-xl'>Giỏ hàng của bạn trống</div>
      <div>
        <Link href={'/'} className='text-slate-500 flex items-center gap-1 mt-2'>
          <MdArrowBack />
          <span className='text-base'>Bắt đầu mua sắm </span>
        </Link>
      </div>
    </div>
  ) : (
    <div className='bg-white p-2 rounded-lg mt-4'>
      {cartProducts.map(product => {
        return <ItemContent key={product.id} item={product} />;
      })}
      <div className='py-6 border-t border-b'>
        <DiscountComboBox />
        <VoucherDisplay />
      </div>
      <div className='flex flex-col mt-5 gap-4'>
        {discountAmount > 0 && (
          <div className='flex justify-between text-green-600'>
            <span className='font-bold'>Giảm giá:</span>
            <span className='font-semibold'>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className='flex justify-between '>
          <span className='font-bold'>Phí vận chuyển:</span>
          <span className='font-semibold'>{shippingFee > 0 ? formatPrice(shippingFee) : 'Tính khi chọn địa chỉ'}</span>
        </div>

        {/* Free shipping notification */}
        {cartTotalAmount >= 5000000 && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
            <p className='text-green-800 text-sm font-medium'>Đơn hàng của bạn được miễn phí vận chuyển!</p>
          </div>
        )}

        {/* Free shipping progress */}
        {cartTotalAmount < 5000000 && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
            <p className='text-blue-800 text-sm'>
              💡 Mua thêm {formatPrice(5000000 - cartTotalAmount)} để được miễn phí vận chuyển!
            </p>
          </div>
        )}

        <div className='flex justify-between'>
          <span className='font-bold'>Tổng tiền:</span>
          <span className='text-indigo-600 font-semibold text-xl'>{formatPrice(cartTotalAmount - discountAmount)}</span>
        </div>

        <div className='mt-5 pb-3'>
          <Button label='ĐẶT HÀNG NGAY' isLoading={isLoading} onClick={handleCheckout} />
        </div>
      </div>
    </div>
  );
};

export default CartBuyClient;
