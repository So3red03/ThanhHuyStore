'use client';

import { useState } from 'react';
import {
  MdQuickreply,
  MdExpandMore,
  MdExpandLess,
  MdShoppingCart,
  MdHelp,
  MdThumbUp,
  MdWarning,
  MdClose
} from 'react-icons/md';

interface QuickResponse {
  id: string;
  category: string;
  title: string;
  message: string;
  icon: React.ReactNode;
}

interface QuickResponsePanelProps {
  onSelectResponse: (message: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const quickResponses: QuickResponse[] = [
  // Greeting & Welcome
  {
    id: 'welcome',
    category: 'Chào hỏi',
    title: 'Chào mừng',
    message: 'Xin chào! Cảm ơn bạn đã liên hệ với ThanhHuy Store. Tôi có thể giúp gì cho bạn hôm nay?',
    icon: <MdThumbUp className='text-green-500' />
  },
  {
    id: 'thanks',
    category: 'Chào hỏi',
    title: 'Cảm ơn',
    message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ hỗ trợ bạn ngay bây giờ.',
    icon: <MdThumbUp className='text-green-500' />
  },

  // Order Related
  {
    id: 'order_status',
    category: 'Đơn hàng',
    title: 'Kiểm tra đơn hàng',
    message: 'Để kiểm tra trạng thái đơn hàng, bạn vui lòng cung cấp mã đơn hàng hoặc số điện thoại đặt hàng.',
    icon: <MdShoppingCart className='text-blue-500' />
  },
  {
    id: 'order_processing',
    category: 'Đơn hàng',
    title: 'Đơn hàng đang xử lý',
    message: 'Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ cập nhật trạng thái và gửi thông báo khi có tiến triển.',
    icon: <MdShoppingCart className='text-blue-500' />
  },
  {
    id: 'shipping_info',
    category: 'Đơn hàng',
    title: 'Thông tin vận chuyển',
    message: 'Thời gian giao hàng dự kiến là 2-3 ngày làm việc trong nội thành và 3-5 ngày cho các tỉnh khác.',
    icon: <MdShoppingCart className='text-blue-500' />
  },

  // Product Support
  {
    id: 'product_info',
    category: 'Sản phẩm',
    title: 'Thông tin sản phẩm',
    message: 'Bạn có thể xem thông tin chi tiết sản phẩm trên trang web hoặc cho tôi biết sản phẩm nào bạn quan tâm.',
    icon: <MdHelp className='text-purple-500' />
  },
  {
    id: 'warranty',
    category: 'Sản phẩm',
    title: 'Bảo hành',
    message:
      'Tất cả sản phẩm của chúng tôi đều có chế độ bảo hành chính hãng. Thời gian bảo hành tùy theo từng sản phẩm.',
    icon: <MdHelp className='text-purple-500' />
  },

  // Issues & Problems
  {
    id: 'technical_issue',
    category: 'Vấn đề',
    title: 'Sự cố kỹ thuật',
    message: 'Tôi hiểu vấn đề bạn đang gặp phải. Chúng tôi sẽ kiểm tra và hỗ trợ bạn giải quyết ngay.',
    icon: <MdWarning className='text-red-500' />
  },
  {
    id: 'refund_policy',
    category: 'Vấn đề',
    title: 'Chính sách hoàn tiền',
    message: 'Chúng tôi hỗ trợ hoàn tiền trong vòng 7 ngày nếu sản phẩm có lỗi từ nhà sản xuất hoặc không đúng mô tả.',
    icon: <MdWarning className='text-red-500' />
  },

  // Closing
  {
    id: 'anything_else',
    category: 'Kết thúc',
    title: 'Còn gì khác không?',
    message: 'Bạn còn cần hỗ trợ thêm gì nữa không? Tôi luôn sẵn sàng giúp đỡ bạn.',
    icon: <MdThumbUp className='text-green-500' />
  },
  {
    id: 'goodbye',
    category: 'Kết thúc',
    title: 'Tạm biệt',
    message: 'Cảm ơn bạn đã liên hệ với ThanhHuy Store. Chúc bạn một ngày tốt lành!',
    icon: <MdThumbUp className='text-green-500' />
  }
];

const QuickResponsePanel: React.FC<QuickResponsePanelProps> = ({ onSelectResponse, isOpen, onToggle }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Chào hỏi');

  // Group responses by category
  const categorizedResponses = quickResponses.reduce((acc, response) => {
    if (!acc[response.category]) {
      acc[response.category] = [];
    }
    acc[response.category].push(response);
    return acc;
  }, {} as Record<string, QuickResponse[]>);

  const categories = Object.keys(categorizedResponses);

  const handleResponseClick = (message: string) => {
    onSelectResponse(message);
    onToggle(); // Close panel after selection
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className='flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md group'
        title='Câu trả lời nhanh'
      >
        <MdQuickreply size={18} className='group-hover:scale-110 transition-transform' />
        <span className='hidden sm:inline'>Trả lời nhanh</span>
        <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1'></div>
      </button>
    );
  }

  return (
    <div className='bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-96 overflow-hidden flex flex-col backdrop-blur-sm'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center'>
            <MdQuickreply className='text-white' size={16} />
          </div>
          <h3 className='font-bold text-gray-900'>Câu trả lời nhanh</h3>
          <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
        </div>
        <button onClick={onToggle} className='p-2 hover:bg-white/60 rounded-full transition-all duration-200 group'>
          <MdClose size={16} className='text-gray-500 group-hover:text-gray-700 group-hover:rotate-90 transition-all' />
        </button>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        {categories.map(category => (
          <div key={category} className='border-b border-gray-100 last:border-b-0'>
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className='w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors'
            >
              <span className='font-medium text-gray-700'>{category}</span>
              {expandedCategory === category ? (
                <MdExpandLess className='text-gray-400' />
              ) : (
                <MdExpandMore className='text-gray-400' />
              )}
            </button>

            {expandedCategory === category && (
              <div className='pb-2'>
                {categorizedResponses[category].map(response => (
                  <button
                    key={response.id}
                    onClick={() => handleResponseClick(response.message)}
                    className='w-full flex items-start gap-3 p-3 mx-2 mb-1 hover:bg-blue-50 rounded-lg transition-colors text-left'
                  >
                    <div className='flex-shrink-0 mt-0.5'>{response.icon}</div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900 text-sm mb-1'>{response.title}</div>
                      <div className='text-xs text-gray-600 line-clamp-2'>{response.message}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickResponsePanel;
