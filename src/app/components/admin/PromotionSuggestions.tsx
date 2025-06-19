'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaLightbulb, FaDiscord, FaPlay, FaCheck, FaTimes } from 'react-icons/fa';

interface PromotionSuggestion {
  id: string;
  type: 'PRODUCT_VOUCHER' | 'CATEGORY_PROMOTION' | 'STOCK_CLEARANCE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  suggestedAction: string;
  data: {
    productId?: string;
    productName?: string;
    categoryId?: string;
    categoryName?: string;
    currentStock?: number;
    daysWithoutSale?: number;
    viewCount?: number;
    suggestedDiscount?: number;
    reasoning: string[];
  };
}

const PromotionSuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<PromotionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Load suggestions khi component mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/promotion-suggestions');
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data);
      } else {
        toast.error('Không thể tải gợi ý khuyến mãi');
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (sendDiscord: boolean = true) => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/admin/promotion-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyze',
          sendDiscord 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setSuggestions(data.data.suggestions);
      } else {
        toast.error('Lỗi khi chạy phân tích');
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      toast.error('Lỗi khi chạy phân tích');
    } finally {
      setAnalyzing(false);
    }
  };

  const testDiscord = async () => {
    try {
      const response = await fetch('/api/admin/promotion-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-discord' })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Discord webhook hoạt động bình thường!');
      } else {
        toast.error('Không thể kết nối Discord webhook');
      }
    } catch (error) {
      toast.error('Lỗi khi test Discord');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PRODUCT_VOUCHER': return '🎫';
      case 'CATEGORY_PROMOTION': return '🏷️';
      case 'STOCK_CLEARANCE': return '📦';
      default: return '💡';
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg border border-neutral-200'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <FaLightbulb className='text-2xl text-yellow-500' />
          <h2 className='text-xl font-semibold'>Gợi Ý Khuyến Mãi Tự Động</h2>
        </div>
        
        <div className='flex gap-2'>
          <button
            onClick={testDiscord}
            className='px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center gap-2 text-sm'
          >
            <FaDiscord />
            Test Discord
          </button>
          
          <button
            onClick={() => runAnalysis(false)}
            disabled={analyzing}
            className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2'
          >
            <FaPlay />
            {analyzing ? 'Đang phân tích...' : 'Chạy Phân Tích'}
          </button>
          
          <button
            onClick={() => runAnalysis(true)}
            disabled={analyzing}
            className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center gap-2'
          >
            <FaDiscord />
            {analyzing ? 'Đang gửi...' : 'Phân Tích + Discord'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
          <p className='mt-2 text-gray-500'>Đang tải gợi ý...</p>
        </div>
      )}

      {/* No Suggestions */}
      {!loading && suggestions.length === 0 && (
        <div className='text-center py-8 text-gray-500'>
          <FaLightbulb className='text-4xl mx-auto mb-4 opacity-50' />
          <p>Chưa có gợi ý khuyến mãi nào</p>
          <p className='text-sm'>Hãy chạy phân tích để tìm cơ hội tối ưu</p>
        </div>
      )}

      {/* Suggestions List */}
      {!loading && suggestions.length > 0 && (
        <div className='space-y-4'>
          <div className='text-sm text-gray-600 mb-4'>
            Tìm thấy <strong>{suggestions.length}</strong> gợi ý khuyến mãi
          </div>
          
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
              {/* Header */}
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-3'>
                  <span className='text-2xl'>{getTypeIcon(suggestion.type)}</span>
                  <div>
                    <h3 className='font-semibold text-gray-900'>{suggestion.title}</h3>
                    <p className='text-gray-600 text-sm'>{suggestion.description}</p>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                  {suggestion.priority}
                </span>
              </div>

              {/* Suggested Action */}
              <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mb-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <FaLightbulb className='text-blue-500' />
                  <span className='font-medium text-blue-900'>Hành động đề xuất:</span>
                </div>
                <p className='text-blue-800'>{suggestion.suggestedAction}</p>
              </div>

              {/* Details */}
              <div className='grid grid-cols-2 gap-4 mb-3 text-sm'>
                {suggestion.data.productName && (
                  <div>
                    <span className='font-medium'>Sản phẩm:</span>
                    <p className='text-gray-600'>{suggestion.data.productName}</p>
                  </div>
                )}
                
                {suggestion.data.categoryName && (
                  <div>
                    <span className='font-medium'>Danh mục:</span>
                    <p className='text-gray-600'>{suggestion.data.categoryName}</p>
                  </div>
                )}
                
                {suggestion.data.currentStock && (
                  <div>
                    <span className='font-medium'>Tồn kho:</span>
                    <p className='text-gray-600'>{suggestion.data.currentStock} sản phẩm</p>
                  </div>
                )}
                
                {suggestion.data.suggestedDiscount && (
                  <div>
                    <span className='font-medium'>Giảm giá đề xuất:</span>
                    <p className='text-gray-600'>{suggestion.data.suggestedDiscount}%</p>
                  </div>
                )}
              </div>

              {/* Reasoning */}
              <div className='border-t pt-3'>
                <span className='font-medium text-sm text-gray-700'>Lý do phân tích:</span>
                <ul className='mt-1 text-sm text-gray-600 space-y-1'>
                  {suggestion.data.reasoning.map((reason, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <span className='text-gray-400'>•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className='flex gap-2 mt-4 pt-3 border-t'>
                <button className='px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center gap-1'>
                  <FaCheck />
                  Thực hiện
                </button>
                <button className='px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 flex items-center gap-1'>
                  <FaTimes />
                  Bỏ qua
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromotionSuggestions;
