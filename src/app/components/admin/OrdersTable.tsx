'use client';

import Status from '@/app/components/Status';
import { MdAccessTimeFilled, MdDone } from 'react-icons/md';
import { truncateText } from '../../../../utils/truncateText';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import NullData from '../NullData';

interface OrdersTableProps {
  orders: any[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return <NullData title='Không có đơn hàng nào' />;
  }

  return (
    <div className='bg-white pb-7 mt-5 mb-1 rounded-lg border border-gray-200'>
      <div className='flex justify-between items-center p-4'>
        <h2 className='text-gray-500 font-semibold text-lg'>Danh sách đơn hàng</h2>
        <input
          type='text'
          name=''
          id=''
          className='px-4 py-[10px] border focus:border-blue-500 rounded-lg focus:outline-blue-500'
          placeholder='Tìm kiếm'
        />
      </div>
      <div className='h-[43vh] overflow-y-auto'>
        <table className='w-full text-left'>
          <thead className='bg-[#F7F9FC]'>
            <tr>
              <th className='p-4'>Mã #</th>
              <th className='p-4'>Khách hàng</th>
              <th className='p-4'>Thời gian</th>
              <th className='p-4'>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr className='border-t' key={order.id}>
                <td className='py-2 px-4 text-blue-500'>{truncateText(order.id)}</td>
                <td className='py-2 px-4'>{order.user.name}</td>
                <td className='py-2 px-4'>{formatDate(order.createdAt)}</td>
                <td className='py-2 px-4'>
                  <span className={`flex justify-center items-center h-full`}>
                    {order.status === 'completed' ? (
                      <Status text='Thành công' icon={MdDone} bg='bg-green-300' color='text-gray-700' />
                    ) : (
                      <Status text='Đang chờ' icon={MdAccessTimeFilled} bg='bg-slate-200' color='text-slate-700' />
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;
