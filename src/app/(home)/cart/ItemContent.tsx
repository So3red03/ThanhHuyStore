'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '../../utils/formatPrice';
import { CartProductType } from '../product/[productId]/ProductDetails';
import { truncateText } from '../../utils/truncateText';
import SetQuantity from '../../components/products/SetQuantity';
import { useCart } from '../../hooks/useCart';
import { MdOutlineDeleteForever } from 'react-icons/md';
import { slugConvert } from '../../utils/Slug';

interface ItemContentProps {
  item: CartProductType;
}

const ItemContent: React.FC<ItemContentProps> = ({ item }) => {
  const { handleRemoveProductFromCart, handleCartQtyIncrease, handleCartQtyDecrease } = useCart();
  return (
    <div className='grid grid-cols-5 text-sm p-4 pt-0 px-0 mb-6 rounded-lg items-center'>
      <div className='col-span-2 justify-self-start flex gap-2 md:gap-4'>
        <Link href={`/product/${slugConvert(item.name)}-${item.id}`}>
          <div className='relative w-24 h-24 rounded-lg object-cover mr-4'>
            <Image
              src={item.selectedImg || item.thumbnail || '/noavatar.png'}
              alt={item.name}
              fill
              className='object-fill'
              sizes='100%'
              onError={e => {
                e.currentTarget.src = '/noavatar.png';
              }}
            />
          </div>
        </Link>
        <div className='text-lg font-semibold'>
          <Link href={`/product/${slugConvert(item.name)}-${item.id}`}>{truncateText(item.name)}</Link>
          <br />
          <div className='flex gap-2 mt-4'>
            <SetQuantity
              cartCounter={true}
              cartProduct={item}
              handleQtyIncrease={() => {
                handleCartQtyIncrease(item);
              }}
              handleQtyDecrease={() => {
                handleCartQtyDecrease(item);
              }}
            />
            <button
              className='text-slate-700 underline font-semibold border border-slate-300'
              style={{ padding: '4px 14px' }}
              onClick={() => {
                handleRemoveProductFromCart(item);
              }}
            >
              <MdOutlineDeleteForever size={20} />
            </button>
          </div>
        </div>
      </div>
      {/* <div className="justify-self-end">{item.selectedImg.color}</div> */}
      <div className='justify-self-end'></div>
      <div className='justify-self-center'></div>
      <div className='justify-self-end font-semibold pr-1 text-indigo-600 text-lg'>
        {formatPrice(item.price * item.quantity)}
      </div>
    </div>
  );
};

export default ItemContent;
