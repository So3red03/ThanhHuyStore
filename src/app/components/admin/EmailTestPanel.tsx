'use client';

import { useState } from 'react';
import { MdEmail, MdSend, MdCheckCircle, MdError, MdInfo } from 'react-icons/md';
import toast from 'react-hot-toast';

const EmailTestPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);
  const [emailConfig, setEmailConfig] = useState<any>(null);

  const checkEmailConfig = async () => {
    try {
      const response = await fetch('/api/test/email', {
        method: 'GET'
      });
      const data = await response.json();
      
      if (data.success) {
        setEmailConfig(data.config);
        toast.success('Email configuration loaded');
      } else {
        toast.error('Failed to load email configuration');
      }
    } catch (error) {
      console.error('Error checking email config:', error);
      toast.error('Error checking email configuration');
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          message: testMessage || 'Test email from admin panel'
        })
      });

      const data = await response.json();
      setLastResult(data);

      if (data.success) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error(`Failed to send email: ${data.details || data.error}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Error sending test email');
      setLastResult({
        success: false,
        error: 'Network error or server unavailable'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
      <div className='flex items-center gap-3 mb-6'>
        <MdEmail className='text-blue-600' size={24} />
        <h3 className='text-lg font-semibold text-gray-900'>Email Service Test</h3>
        <button
          onClick={checkEmailConfig}
          className='ml-auto px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
        >
          <MdInfo size={16} className='inline mr-1' />
          Check Config
        </button>
      </div>

      {/* Email Configuration Status */}
      {emailConfig && (
        <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <h4 className='font-medium text-blue-900 mb-2'>Email Configuration</h4>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-blue-700 font-medium'>SMTP Host:</span>
              <span className='ml-2 text-blue-600'>{emailConfig.smtpHost}</span>
            </div>
            <div>
              <span className='text-blue-700 font-medium'>SMTP Port:</span>
              <span className='ml-2 text-blue-600'>{emailConfig.smtpPort}</span>
            </div>
            <div>
              <span className='text-blue-700 font-medium'>SMTP User:</span>
              <span className='ml-2 text-blue-600'>{emailConfig.smtpUser}</span>
            </div>
            <div>
              <span className='text-blue-700 font-medium'>Password:</span>
              <span className='ml-2 text-blue-600'>
                {emailConfig.hasPassword ? '✅ Configured' : '❌ Not configured'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Form */}
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Test Email Address *
          </label>
          <input
            type='email'
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder='Enter email address to test'
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            disabled={isLoading}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Test Message (Optional)
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder='Custom test message (optional)'
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            disabled={isLoading}
          />
        </div>

        <button
          onClick={sendTestEmail}
          disabled={isLoading || !testEmail.trim()}
          className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
        >
          {isLoading ? (
            <>
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
              Sending...
            </>
          ) : (
            <>
              <MdSend size={16} />
              Send Test Email
            </>
          )}
        </button>
      </div>

      {/* Test Result */}
      {lastResult && (
        <div className='mt-6'>
          <h4 className='font-medium text-gray-900 mb-3'>Test Result</h4>
          <div
            className={`p-4 rounded-lg border ${
              lastResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className='flex items-center gap-2 mb-2'>
              {lastResult.success ? (
                <MdCheckCircle className='text-green-600' size={20} />
              ) : (
                <MdError className='text-red-600' size={20} />
              )}
              <span
                className={`font-medium ${
                  lastResult.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {lastResult.success ? 'Success' : 'Failed'}
              </span>
            </div>

            <div className='text-sm space-y-1'>
              <div>
                <span className='font-medium'>Message:</span>
                <span className='ml-2'>{lastResult.message || lastResult.error}</span>
              </div>

              {lastResult.details && (
                <div>
                  <span className='font-medium'>Details:</span>
                  <div className='ml-2 mt-1'>
                    {typeof lastResult.details === 'string' ? (
                      <span>{lastResult.details}</span>
                    ) : (
                      <pre className='text-xs bg-gray-100 p-2 rounded overflow-x-auto'>
                        {JSON.stringify(lastResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className='mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
        <h4 className='font-medium text-gray-900 mb-2'>Instructions</h4>
        <ul className='text-sm text-gray-600 space-y-1'>
          <li>• Use this panel to test if email service is working correctly</li>
          <li>• Check email configuration before sending test emails</li>
          <li>• Test emails will be sent using the configured SMTP settings</li>
          <li>• Check spam folder if test email is not received</li>
          <li>• Return/Exchange emails will use the same email service</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailTestPanel;
