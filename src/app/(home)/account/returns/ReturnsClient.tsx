'use client';

import { SafeUser } from '../../../../../types';
import ReturnRequestList from '@/app/components/returns/ReturnRequestList';
import { MdAssignmentReturn, MdInfo } from 'react-icons/md';

interface ReturnsClientProps {
  currentUser: SafeUser;
}

const ReturnsClient: React.FC<ReturnsClientProps> = ({ currentUser }) => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MdAssignmentReturn className="text-2xl text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Yêu cầu đổi/trả hàng</h1>
        </div>
        <p className="text-gray-600">
          Quản lý các yêu cầu đổi/trả hàng của bạn
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <MdInfo className="text-blue-600 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <h3 className="font-medium mb-1">Chính sách đổi/trả hàng</h3>
            <ul className="space-y-1 text-blue-700">
              <li>• Thời gian: Trong vòng 7 ngày kể từ khi nhận hàng</li>
              <li>• Điều kiện: Sản phẩm còn nguyên vẹn, chưa sử dụng</li>
              <li>• Áp dụng: Chỉ với đơn hàng đã hoàn thành</li>
              <li>• Phí ship: Khách hàng chịu phí ship trả hàng (nếu có)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Return Requests List */}
      <ReturnRequestList isAdmin={false} />
    </div>
  );
};

export default ReturnsClient;
