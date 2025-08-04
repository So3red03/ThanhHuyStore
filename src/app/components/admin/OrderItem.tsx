import { CartProductType } from '@prisma/client';
import { truncateText } from '../../utils/truncateText';
import { formatPrice } from '../../utils/formatPrice';
import Image from 'next/image';

interface OrderItemProps {
  item: CartProductType;
}

const OrderItem: React.FC<OrderItemProps> = ({ item }) => {
  return (
    <div className='bg-white shadow-sm border'>
      <div className='p-4'>
        <div className='flex'>
          <div className='w-1/6 flex items-center justify-stretch'>
            <Image
              src={item.selectedImg || '/noavatar.png'}
              width={80}
              height={80}
              alt={item.name}
              onError={e => {
                e.currentTarget.src = '/noavatar.png';
              }}
            />
          </div>
          <div className='w-1/6 flex items-center justify-center'>
            <p className='text-gray-500 mb-0'>{truncateText(item.name)}</p>
          </div>
          <div className='w-1/6 flex items-center justify-center'>
            <p className='text-gray-500 text-sm mb-0'>-</p>
          </div>
          <div className='w-1/6 flex items-center justify-center'>
            <p className='text-gray-500 text-sm mb-0' />
          </div>
          <div className='w-1/6 flex items-center justify-center'>
            <p className='text-gray-500 text-sm mb-0'>{item.quantity}</p>
          </div>
          <div className='w-1/6 flex items-center justify-center'>
            <p className='text-gray-500 text-sm mb-0'>{formatPrice(item.price * item.quantity)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
