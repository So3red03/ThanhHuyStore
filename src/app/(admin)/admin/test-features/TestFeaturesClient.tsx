'use client';

import { useState, useEffect } from 'react';
import { SafeUser } from '../../../../../types';
import { Button } from '@mui/material';
import ReturnRequestForm from '@/app/components/returns/ReturnRequestForm';
import ShippingTracker from '@/app/components/shipping/ShippingTracker';
import { toast } from 'react-hot-toast';

interface TestFeaturesClientProps {
  currentUser: SafeUser;
}

const TestFeaturesClient: React.FC<TestFeaturesClientProps> = ({ currentUser }) => {
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showShippingTracker, setShowShippingTracker] = useState(false);
  const [testOrderId, setTestOrderId] = useState('');
  const [testOrderCode, setTestOrderCode] = useState('');
  const [testShippingCode, setTestShippingCode] = useState('');
  const [sampleData, setSampleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cronStatus, setCronStatus] = useState<any>(null);
  const [cronLoading, setCronLoading] = useState(false);

  // Load sample data from database
  const loadSampleData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/get-sample-order');
      if (response.ok) {
        const data = await response.json();
        setSampleData(data);
        setTestOrderId(data.orderId);
        setTestOrderCode(data.orderCode);
        setTestShippingCode(data.shippingCode);
      } else {
        toast.error('Không thể tải dữ liệu mẫu');
      }
    } catch (error) {
      console.error('Error loading sample data:', error);
      toast.error('Lỗi khi tải dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  };

  // Load sample data on component mount
  useEffect(() => {
    loadSampleData();
    loadCronStatus();
  }, []);

  const handleTestReturnRequest = () => {
    if (!sampleData) {
      toast.error('Chưa có dữ liệu mẫu. Vui lòng thử lại!');
      return;
    }
    setShowReturnForm(true);
  };

  const handleTestShippingTracker = () => {
    if (!sampleData) {
      toast.error('Chưa có dữ liệu mẫu. Vui lòng thử lại!');
      return;
    }
    setShowShippingTracker(true);
  };

  const handleReturnSuccess = () => {
    setShowReturnForm(false);
    toast.success('Test: Yêu cầu đổi/trả đã được tạo thành công!');
  };

  // Test cron job functions
  const handleTestCronJob = async () => {
    setCronLoading(true);
    try {
      const response = await fetch('/api/test/cron-trigger', {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('✅ Cron job đã được trigger thành công!');
        console.log('Cron result:', data);
        loadCronStatus(); // Refresh status
      } else {
        toast.error('❌ Lỗi khi trigger cron job');
      }
    } catch (error) {
      console.error('Error triggering cron:', error);
      toast.error('❌ Lỗi khi gọi cron job');
    } finally {
      setCronLoading(false);
    }
  };

  const loadCronStatus = async () => {
    try {
      const response = await fetch('/api/test/cron-trigger');
      const data = await response.json();

      if (data.success) {
        setCronStatus(data);
      }
    } catch (error) {
      console.error('Error loading cron status:', error);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <h1 className='text-3xl font-bold mb-8 text-center'>🧪 Test Features - Returns, Shipping & Cron Jobs</h1>

      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8'>
        <div className='flex justify-between items-start'>
          <div>
            <h2 className='font-semibold text-yellow-800 mb-2'>⚠️ Lưu ý:</h2>
            <p className='text-yellow-700 text-sm'>
              Đây là trang test tính năng. Sau khi test xong và hài lòng về giao diện + nghiệp vụ, chúng ta sẽ xóa trang
              này và tích hợp vào hệ thống chính.
            </p>
          </div>
          <Button
            variant='outlined'
            onClick={loadSampleData}
            disabled={loading}
            size='small'
            sx={{
              borderColor: '#d97706',
              color: '#d97706',
              '&:hover': { borderColor: '#b45309', backgroundColor: '#fef3c7' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {loading ? '🔄' : '🔄 Reload Data'}
          </Button>
        </div>
      </div>

      {/* Cron Job Testing */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4 text-purple-600'>⏰ Test Cron Job - Discord Reports</h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <div className='bg-purple-50 p-4 rounded-lg'>
              <h3 className='font-medium text-purple-700 mb-2'>📊 Cron Job Status:</h3>
              <p className='text-sm text-purple-600 mb-2'>
                Current interval: <strong>5 minutes</strong> (for testing)
              </p>
              <p className='text-xs text-purple-500'>
                Server time:{' '}
                {cronStatus?.serverTime ? new Date(cronStatus.serverTime).toLocaleString('vi-VN') : 'Loading...'}
              </p>
            </div>

            <Button
              variant='contained'
              onClick={handleTestCronJob}
              disabled={cronLoading}
              fullWidth
              sx={{
                backgroundColor: '#7c3aed',
                '&:hover': { backgroundColor: '#6d28d9' },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5
              }}
            >
              {cronLoading ? '🔄 Triggering...' : '🚀 Trigger Cron Job Now'}
            </Button>
          </div>

          <div className='space-y-3'>
            <h3 className='font-medium text-gray-700'>📋 Latest Reports:</h3>
            <div className='bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto'>
              {cronStatus?.latestReports?.length > 0 ? (
                cronStatus.latestReports.map((report: any, index: number) => (
                  <div key={index} className='text-xs mb-2 p-2 bg-white rounded border'>
                    <div className='flex justify-between items-center'>
                      <span className={`font-medium ${report.success ? 'text-green-600' : 'text-red-600'}`}>
                        {report.success ? '✅' : '❌'} {report.type}
                      </span>
                      <span className='text-gray-500'>{new Date(report.createdAt).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    <div className='text-gray-600 mt-1'>Interval: {report.interval}h</div>
                  </div>
                ))
              ) : (
                <p className='text-gray-500 text-sm'>Chưa có báo cáo nào</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Returns Testing */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold mb-4 text-orange-600'>🔄 Test Đổi/Trả hàng</h2>

          <div className='space-y-4'>
            <div className='bg-gray-50 p-3 rounded-lg'>
              <h3 className='font-medium text-gray-700 mb-2'>Sample Data:</h3>
              {loading ? (
                <p className='text-sm text-gray-600'>🔄 Đang tải dữ liệu mẫu...</p>
              ) : sampleData ? (
                <>
                  <p className='text-sm text-gray-600'>Order ID: {sampleData.orderId}</p>
                  <p className='text-sm text-gray-600'>Order Code: {sampleData.orderCode}</p>
                  <p className='text-sm text-gray-600'>Status: {sampleData.status}</p>
                  <p className='text-sm text-gray-600'>Amount: {sampleData.amount.toLocaleString()} VND</p>
                  <p className='text-sm text-gray-600'>Customer: {sampleData.user.name}</p>
                </>
              ) : (
                <p className='text-sm text-red-600'>❌ Không thể tải dữ liệu mẫu</p>
              )}
            </div>

            <Button
              variant='contained'
              onClick={handleTestReturnRequest}
              fullWidth
              sx={{
                backgroundColor: '#ea580c',
                '&:hover': { backgroundColor: '#dc2626' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5
              }}
            >
              🧪 Test Return Request Form
            </Button>

            <div className='text-sm text-gray-500'>
              <p>
                <strong>Test cases:</strong>
              </p>
              <ul className='list-disc list-inside space-y-1 mt-2'>
                <li>Form validation</li>
                <li>File upload (images)</li>
                <li>Return type selection</li>
                <li>Reason input</li>
                <li>API integration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Shipping Testing */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-semibold mb-4 text-blue-600'>🚚 Test Vận chuyển</h2>

          <div className='space-y-4'>
            <div className='bg-gray-50 p-3 rounded-lg'>
              <h3 className='font-medium text-gray-700 mb-2'>Sample Data:</h3>
              {loading ? (
                <p className='text-sm text-gray-600'>🔄 Đang tải dữ liệu mẫu...</p>
              ) : sampleData ? (
                <>
                  <p className='text-sm text-gray-600'>Order ID: {sampleData.orderId}</p>
                  <p className='text-sm text-gray-600'>Shipping Code: {sampleData.shippingCode}</p>
                  <p className='text-sm text-gray-600'>Delivery Status: {sampleData.deliveryStatus || 'not_shipped'}</p>
                  <p className='text-sm text-gray-600'>Customer: {sampleData.user.name}</p>
                </>
              ) : (
                <p className='text-sm text-red-600'>❌ Không thể tải dữ liệu mẫu</p>
              )}
            </div>

            <Button
              variant='contained'
              onClick={handleTestShippingTracker}
              fullWidth
              sx={{
                backgroundColor: '#2563eb',
                '&:hover': { backgroundColor: '#1d4ed8' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5
              }}
            >
              🧪 Test Shipping Tracker
            </Button>

            <div className='text-sm text-gray-500'>
              <p>
                <strong>Test cases:</strong>
              </p>
              <ul className='list-disc list-inside space-y-1 mt-2'>
                <li>GHN API integration</li>
                <li>Tracking status display</li>
                <li>Timeline visualization</li>
                <li>Error handling</li>
                <li>Real-time updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results Section */}
      <div className='mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
        <h2 className='text-xl font-semibold mb-4 text-green-600'>✅ Test Results & Notes</h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h3 className='font-medium text-gray-700 mb-3'>Returns Feature:</h3>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 bg-gray-300 rounded'></span>
                <span>Form UI/UX</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 bg-gray-300 rounded'></span>
                <span>Validation logic</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 bg-gray-300 rounded'></span>
                <span>File upload</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 bg-gray-300 rounded'></span>
                <span>API integration</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className='font-medium text-gray-700 mb-3'>Shipping Feature:</h3>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 bg-gray-300 rounded'></span>
                <span>Tracker UI/UX</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 bg-gray-300 rounded'></span>
                <span>GHN API response</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 bg-gray-300 rounded'></span>
                <span>Status timeline</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-4 h-4 bg-gray-300 rounded'></span>
                <span>Error handling</span>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='text-blue-800 text-sm'>
            <strong>Ghi chú:</strong> Sau khi test xong, hãy đánh dấu ✅ vào các mục đã test thành công. Nếu có vấn đề,
            ghi chú lại để fix.
          </p>
        </div>
      </div>

      {/* Return Request Form Modal */}
      {showReturnForm && (
        <ReturnRequestForm
          orderId={testOrderId}
          orderCode={testOrderCode}
          onClose={() => setShowReturnForm(false)}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* Shipping Tracker Modal */}
      {showShippingTracker && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>🧪 Test Shipping Tracker</h2>
                <button
                  onClick={() => setShowShippingTracker(false)}
                  className='text-gray-500 hover:text-gray-700 text-2xl'
                >
                  ×
                </button>
              </div>

              <ShippingTracker orderCode={testShippingCode} orderId={testOrderId} showOrderInfo={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestFeaturesClient;
