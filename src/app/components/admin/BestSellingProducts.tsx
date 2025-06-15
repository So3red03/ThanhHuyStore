'use client';

import BestsSellingProductForm from '@/app/(admin)/admin/BestSellingProductsForm';

interface BestSellingProductsProps {
  uniqueProducts: any[];
}

const BestSellingProducts: React.FC<BestSellingProductsProps> = ({ uniqueProducts }) => {
  return (
    <div className='bg-white p-6 pb-7 rounded-lg border border-gray-200 mt-5'>
      <h2 className='text-gray-500 mb-4 font-semibold text-lg'>Sản phẩm bán chạy</h2>
      <div className='overflow-y-auto'>
        <table className='w-full h-full text-left'>
          <thead>
            <tr>
              <th className='py-2'>Sản phẩm</th>
              <th className='py-2 px-3'>SL</th>
              <th className='py-2'>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {uniqueProducts.map((item: any) => (
              <BestsSellingProductForm key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BestSellingProducts;
