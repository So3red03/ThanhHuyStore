'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

const TestClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const addTestResult = (result: any) => {
    setTestResults(prev => [result, ...prev]);
  };

  // Test basic Discord webhook
  const testBasicWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'basic' })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('✅ Basic webhook test thành công!');
        addTestResult({
          type: 'Basic Webhook',
          status: 'success',
          message: 'Message sent successfully',
          timestamp: new Date().toLocaleString('vi-VN')
        });
      } else {
        toast.error('❌ Basic webhook test thất bại!');
        addTestResult({
          type: 'Basic Webhook',
          status: 'error',
          message: result.error || 'Unknown error',
          timestamp: new Date().toLocaleString('vi-VN')
        });
      }
    } catch (error) {
      toast.error('❌ Lỗi kết nối!');
      addTestResult({
        type: 'Basic Webhook',
        status: 'error',
        message: 'Connection error',
        timestamp: new Date().toLocaleString('vi-VN')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test interactive buttons
  const testInteractiveButtons = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'interactive' })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('🎮 Interactive buttons test thành công!');
        addTestResult({
          type: 'Interactive Buttons',
          status: 'success',
          message: 'Buttons sent successfully',
          timestamp: new Date().toLocaleString('vi-VN'),
          messageId: result.messageId
        });
      } else {
        toast.error('❌ Interactive buttons test thất bại!');
        addTestResult({
          type: 'Interactive Buttons',
          status: 'error',
          message: result.error || 'Unknown error',
          timestamp: new Date().toLocaleString('vi-VN')
        });
      }
    } catch (error) {
      toast.error('❌ Lỗi kết nối!');
      addTestResult({
        type: 'Interactive Buttons',
        status: 'error',
        message: 'Connection error',
        timestamp: new Date().toLocaleString('vi-VN')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test production endpoint
  const testProductionEndpoint = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/discord/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('🚀 Production test thành công!');
        addTestResult({
          type: 'Production Test',
          status: 'success',
          message: 'Production message sent with buttons',
          timestamp: new Date().toLocaleString('vi-VN'),
          messageId: result.messageId
        });
      } else {
        toast.error('❌ Production test thất bại!');
        addTestResult({
          type: 'Production Test',
          status: 'error',
          message: result.error || 'Unknown error',
          timestamp: new Date().toLocaleString('vi-VN')
        });
      }
    } catch (error) {
      toast.error('❌ Lỗi kết nối!');
      addTestResult({
        type: 'Production Test',
        status: 'error',
        message: 'Connection error',
        timestamp: new Date().toLocaleString('vi-VN')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    toast.success('🧹 Đã xóa kết quả test');
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>🧪 Discord Integration Test</h1>
          <p className='text-gray-600 mt-2'>Test Discord webhooks và interactive buttons</p>
        </div>
        <span className='px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm'>🤖 Test Environment</span>
      </div>

      <hr className='border-gray-200' />

      {/* Instructions */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <div className='flex items-start space-x-3'>
          <span className='text-blue-500 text-lg'>💡</span>
          <div>
            <h3 className='font-medium text-blue-900 mb-2'>Hướng dẫn Test Interactive Buttons</h3>
            <div className='text-sm text-blue-800 space-y-1'>
              <p>
                <strong>1. Test Interactive Buttons:</strong> Gửi message với CONFIRM/CANCEL buttons qua Discord Bot
              </p>
              <p>
                <strong>2. Click buttons trong Discord:</strong> Buttons sẽ hoạt động và gửi response
              </p>
              <p>
                <strong>3. Xem kết quả:</strong> Message sẽ được update với kết quả test
              </p>
              <p className='text-green-600 font-medium'>
                ✅ Sử dụng Discord Bot API thay vì webhook để hỗ trợ interactive buttons!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center mb-3'>
            <span className='text-blue-500 mr-2'>💬</span>
            <h3 className='font-medium text-sm'>Basic Webhook</h3>
          </div>
          <p className='text-xs text-gray-600 mb-4'>Test basic Discord message</p>
          <button
            onClick={testBasicWebhook}
            disabled={isLoading}
            className='w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm'
          >
            📤 Test Basic
          </button>
        </div>

        <div className='bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center mb-3'>
            <span className='text-green-500 mr-2'>⚡</span>
            <h3 className='font-medium text-sm'>Interactive Buttons</h3>
          </div>
          <p className='text-xs text-gray-600 mb-4'>
            Test buttons với interactions
            <br />
            <span className='text-blue-600 font-medium'>✨ Buttons sẽ hoạt động và response!</span>
          </p>
          <button
            onClick={testInteractiveButtons}
            disabled={isLoading}
            className='w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm'
          >
            🎮 Test Buttons
          </button>
        </div>

        <div className='bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center mb-3'>
            <span className='text-purple-500 mr-2'>🔗</span>
            <h3 className='font-medium text-sm'>Production Test</h3>
          </div>
          <p className='text-xs text-gray-600 mb-4'>Test production endpoint</p>
          <button
            onClick={testProductionEndpoint}
            disabled={isLoading}
            className='w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm'
          >
            🚀 Test Production
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className='bg-white p-6 rounded-lg border border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h2 className='text-lg font-semibold flex items-center'>🕒 Test Results</h2>
            <p className='text-sm text-gray-600'>Kết quả các lần test Discord integration</p>
          </div>
          {testResults.length > 0 && (
            <button
              onClick={clearResults}
              className='px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50'
            >
              Clear Results
            </button>
          )}
        </div>

        {testResults.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <div className='text-4xl mb-4'>💬</div>
            <p>Chưa có kết quả test nào</p>
            <p className='text-sm'>Hãy chạy một test để xem kết quả</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <span className={`text-lg ${result.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {result.status === 'success' ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className='font-medium text-sm'>{result.type}</p>
                      <p className='text-xs text-gray-600'>{result.message}</p>
                      {result.messageId && <p className='text-xs text-blue-600'>Message ID: {result.messageId}</p>}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestClient;
