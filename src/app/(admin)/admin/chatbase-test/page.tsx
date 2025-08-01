'use client';

import React, { useState } from 'react';
import ChatBaseBot from '@/app/components/chat/ChatbaseBot';
import AdminChatbaseBot from '@/app/components/admin/AdminChatbaseBot';

/**
 * Chatbase Integration Test Page
 * Test both customer and admin chatbots
 */
export default function ChatbaseTestPage() {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'iframe'>('customer');
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const checkServiceStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch('/api/chatbase/chat');
      const data = await response.json();
      setServiceStatus(data);
    } catch (error) {
      console.error('Failed to check service status:', error);
      setServiceStatus({ error: 'Failed to check status' });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 p-4'>
      <div className='max-w-6xl mx-auto'>
        <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
          {/* Header */}
          <div className='bg-blue-600 text-white p-6'>
            <h1 className='text-2xl font-bold'>Chatbase Integration Test</h1>
            <p className='text-blue-100 mt-2'>Test customer and admin AI chatbots</p>
          </div>

          {/* Service Status */}
          <div className='p-6 border-b'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold'>Service Status</h2>
              <button
                onClick={checkServiceStatus}
                disabled={isCheckingStatus}
                className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300'
              >
                {isCheckingStatus ? 'Checking...' : 'Check Status'}
              </button>
            </div>

            {serviceStatus && (
              <div className='bg-gray-50 p-4 rounded-lg'>
                <pre className='text-sm overflow-auto'>{JSON.stringify(serviceStatus, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className='border-b'>
            <nav className='flex space-x-8 px-6'>
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Admin Bot (API)
              </button>
              <button
                onClick={() => setActiveTab('iframe')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'iframe'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer Bot (iFrame)
              </button>
            </nav>
          </div>

          {/* Chat Area */}
          <div className='h-[600px]'>
            {activeTab === 'admin' && (
              <div className='h-full p-6'>
                <div className='bg-green-50 p-4 rounded-lg mb-4'>
                  <h3 className='font-semibold text-green-800'>Admin Assistant Bot</h3>
                  <p className='text-green-600 text-sm'>
                    Test admin queries, business insights, and system management assistance
                  </p>
                </div>
                <div className='h-[480px] border rounded-lg'>
                  <AdminChatbaseBot />
                </div>
              </div>
            )}

            {activeTab === 'iframe' && (
              <div className='h-full p-6'>
                <div className='bg-purple-50 p-4 rounded-lg mb-4'>
                  <h3 className='font-semibold text-purple-800'>Customer Bot (iFrame)</h3>
                  <p className='text-purple-600 text-sm'>Original iframe implementation for comparison</p>
                </div>
                <div className='h-[480px] border rounded-lg'>
                  <ChatBaseBot useAPI={false} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
