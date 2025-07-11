import { CartProductType } from '@prisma/client';
import { formatPrice } from '../../../../utils/formatPrice';
import Image from 'next/image';

interface BestsSellingProductFormProps {
  item?: CartProductType;
}

const BestsSellingProductForm: React.FC<BestsSellingProductFormProps> = ({ item }) => {
  if (!item) return;
  return (
    <>
      <tr className='border-t'>
        <td className='py-2 flex gap-2 items-center'>
          <Image
            src={item.selectedImg || '/images/placeholder.jpg'}
            alt={item.name}
            width={40}
            height={40}
            onError={e => {
              e.currentTarget.src = '/images/placeholder.jpg';
            }}
          />
          <span>{item?.name}</span>
        </td>
        <td className='py-2 px-3 '>{item?.inStock}</td>
        {item ? <td className='py-2 '>{formatPrice(item.price || 0)}</td> : <td className='py-2 '>{formatPrice(0)}</td>}
      </tr>
    </>
  );
};

export default BestsSellingProductForm;
