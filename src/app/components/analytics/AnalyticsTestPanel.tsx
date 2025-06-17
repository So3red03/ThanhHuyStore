'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AnalyticsTestPanel = () => {
  const [loading, setLoading] = useState(false);
  const [seedCount, setSeedCount] = useState(100);

  const handleSeedData = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/analytics/seed', {
        action: 'seed',
        count: seedCount
      });
      
      toast.success(`Đã tạo ${response.data.count} events thành công!`);
    } catch (error: any) {
      toast.error('Lỗi khi tạo dữ liệu: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả dữ liệu analytics?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/analytics/seed', {
        action: 'clear'
      });
      
      toast.success(`Đã xóa ${response.data.count} events!`);
    } catch (error: any) {
      toast.error('Lỗi khi xóa dữ liệu: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTestTracking = async () => {
    try {
      setLoading(true);
      
      // Test different event types
      const testEvents = [
        {
          eventType: 'PAGE_VIEW',
          path: '/test-page',
          metadata: { test: true }
        },
        {
          eventType: 'SEARCH',
          path: '/search',
          metadata: { searchTerm: 'test search', resultCount: 5 }
        }
      ];

      for (const event of testEvents) {
        await axios.post('/api/analytics/track', event);
      }
      
      toast.success('Đã test tracking thành công!');
    } catch (error: any) {
      toast.error('Lỗi khi test tracking: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Test Panel</h3>
      
      <div className="space-y-4">
        {/* Seed Data Section */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-2">Tạo dữ liệu mẫu</h4>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={seedCount}
              onChange={(e) => setSeedCount(Number(e.target.value))}
              min="10"
              max="1000"
              className="px-3 py-2 border border-gray-300 rounded-lg w-24"
            />
            <span className="text-sm text-gray-600">events</span>
            <button
              onClick={handleSeedData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo dữ liệu'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tạo dữ liệu analytics mẫu cho 30 ngày qua
          </p>
        </div>

        {/* Test Tracking Section */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-2">Test Tracking</h4>
          <button
            onClick={handleTestTracking}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Đang test...' : 'Test Event Tracking'}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Test gửi một số events mẫu
          </p>
        </div>

        {/* Clear Data Section */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Xóa dữ liệu</h4>
          <button
            onClick={handleClearData}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Đang xóa...' : 'Xóa tất cả'}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Xóa tất cả dữ liệu analytics (không thể hoàn tác)
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTestPanel;
