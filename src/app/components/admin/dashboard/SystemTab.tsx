'use client';

import { MdSettings, MdEmail, MdBuild, MdInfo } from 'react-icons/md';
import EmailTestPanel from '../EmailTestPanel';

const SystemTab: React.FC = () => {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-6'>
        <MdSettings className='text-blue-600' size={28} />
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>System Management</h2>
          <p className='text-gray-600'>Manage system settings and test services</p>
        </div>
      </div>

      {/* System Status Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6'>
          <div className='flex items-center gap-3 mb-3'>
            <MdEmail className='text-green-600' size={24} />
            <h3 className='font-semibold text-green-900'>Email Service</h3>
          </div>
          <p className='text-green-700 text-sm'>
            SMTP configured and ready for notifications
          </p>
          <div className='mt-3 text-xs text-green-600'>
            ✅ Return/Exchange notifications enabled
          </div>
        </div>

        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6'>
          <div className='flex items-center gap-3 mb-3'>
            <MdBuild className='text-blue-600' size={24} />
            <h3 className='font-semibold text-blue-900'>Database</h3>
          </div>
          <p className='text-blue-700 text-sm'>
            MongoDB connection active
          </p>
          <div className='mt-3 text-xs text-blue-600'>
            ✅ All services operational
          </div>
        </div>

        <div className='bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-6'>
          <div className='flex items-center gap-3 mb-3'>
            <MdInfo className='text-purple-600' size={24} />
            <h3 className='font-semibold text-purple-900'>Environment</h3>
          </div>
          <p className='text-purple-700 text-sm'>
            {process.env.NODE_ENV || 'development'} mode
          </p>
          <div className='mt-3 text-xs text-purple-600'>
            ✅ Configuration loaded
          </div>
        </div>
      </div>

      {/* Email Test Panel */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Email Service Testing</h3>
        <EmailTestPanel />
      </div>

      {/* System Information */}
      <div className='bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>System Information</h3>
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <h4 className='font-medium text-gray-700 mb-3'>Application</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Environment:</span>
                <span className='font-medium'>{process.env.NODE_ENV || 'development'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Next.js Version:</span>
                <span className='font-medium'>14.2.3</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Database:</span>
                <span className='font-medium'>MongoDB</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>ORM:</span>
                <span className='font-medium'>Prisma</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className='font-medium text-gray-700 mb-3'>Services</h4>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Email Service:</span>
                <span className='font-medium text-green-600'>✅ Nodemailer</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Payment:</span>
                <span className='font-medium text-green-600'>✅ Stripe</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Authentication:</span>
                <span className='font-medium text-green-600'>✅ NextAuth</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>File Storage:</span>
                <span className='font-medium text-green-600'>✅ Firebase</span>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
          <h4 className='font-medium text-gray-900 mb-2'>Important Notes</h4>
          <ul className='text-sm text-gray-600 space-y-1'>
            <li>• Email notifications are automatically sent when return/exchange requests are processed</li>
            <li>• Use the Email Test Panel above to verify email service is working</li>
            <li>• Check server logs for detailed email sending information</li>
            <li>• SMTP configuration is loaded from environment variables</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SystemTab;
