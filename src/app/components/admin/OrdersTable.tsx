'use client';

import Status from '@/app/components/Status';
import { MdAccessTimeFilled, MdDone, MdPictureAsPdf } from 'react-icons/md';
import { truncateText } from '../../../../utils/truncateText';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import NullData from '../NullData';

interface OrdersTableProps {
  orders: any[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  // Function to download PDF
  const downloadPDF = async (orderId: string, paymentIntentId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${paymentIntentId.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Không thể tải PDF. Vui lòng thử lại.');
    }
  };

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
              <th className='p-4'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => (
              <tr className='border-t' key={order.id}>
                <td className='py-2 px-4 text-blue-500'>{truncateText(order.id)}</td>
                <td className='py-2 px-4'>{order.user.name}</td>
                <td className='py-2 px-4'>{formatDate(order.createDate)}</td>
                <td className='py-2 px-4'>
                  <span className={`flex justify-center items-center h-full`}>
                    {order.status === 'completed' ? (
                      <Status text='Thành công' icon={MdDone} bg='bg-green-300' color='text-gray-700' />
                    ) : (
                      <Status text='Đang chờ' icon={MdAccessTimeFilled} bg='bg-slate-200' color='text-slate-700' />
                    )}
                  </span>
                </td>
                <td className='py-2 px-4'>
                  <button
                    onClick={() => downloadPDF(order.id, order.paymentIntentId)}
                    className='flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
                    title='Tải hóa đơn PDF'
                  >
                    <MdPictureAsPdf size={14} />
                    PDF
                  </button>
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
