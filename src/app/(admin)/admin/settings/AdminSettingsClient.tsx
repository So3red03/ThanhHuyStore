'use client';

import ToggleSwitch from '@/app/components/admin/settings/ToggleSwitch';
import PusherConnectionStatus from '@/app/components/admin/PusherConnectionStatus';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  MdNotifications,
  MdEmail,
  MdSecurity,
  MdStorage,
  MdSmartToy,
  MdAccessTime,
  MdAssessment,
  MdPayment
} from 'react-icons/md';

interface SettingsData {
  discordNotifications: boolean;
  orderNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  analyticsTracking: boolean;
  sessionTimeout: number;
  lowStockAlerts: boolean;
  chatbotSupport: boolean;
  autoVoucherSuggestion: boolean;
  dailyReports: boolean;
  reportInterval: number;
  codPayment: boolean;
  momoPayment: boolean;
  stripePayment: boolean;
}

interface AdminSettingsClientProps {
  initialSettings: SettingsData;
}

const AdminSettingsClient: React.FC<AdminSettingsClientProps> = ({ initialSettings }) => {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('notifications');
  const [testingReport, setTestingReport] = useState(false);

  // Save settings to database
  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings),
        cache: 'no-store' // Force no cache
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Cài đặt đã được lưu thành công!');
        // Force refresh to get latest data
        router.refresh();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra khi lưu cài đặt');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Không thể lưu cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof SettingsData) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSessionTimeoutChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      sessionTimeout: value
    }));
  };

  const handleReportIntervalChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      reportInterval: value
    }));
  };

  // Test Discord report
  const handleTestReport = async () => {
    setTestingReport(true);
    try {
      const response = await fetch('/api/admin/reports/discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'test' }),
        cache: 'no-store'
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Báo cáo test đã được gửi thành công!');
      } else {
        toast.error(result.error || 'Không thể gửi báo cáo test');
      }
    } catch (error) {
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setTestingReport(false);
    }
  };

  const menuItems = [
    { id: 'notifications', label: 'Thông báo', icon: MdNotifications },
    { id: 'system', label: 'Hệ thống', icon: MdStorage },
    { id: 'automation', label: 'Tự động hóa', icon: MdSmartToy },
    { id: 'reports', label: 'Báo cáo', icon: MdAssessment }
  ];

  return (
    <div className='min-h-screen bg-white p-6'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex gap-8 mt-12'>
          {/* Sidebar */}
          <div className='w-64 bg-white rounded-lg border border-b-gray-200 shadow-sm p-6'>
            <nav className='space-y-2'>
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className='w-5 h-5' />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className='flex-1 bg-white rounded-lg border border-b-gray-200 shadow-sm p-8'>
            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Thông báo & Email</h2>
                <p className='text-gray-600 mb-6'>Cấu hình cách bạn nhận thông báo và email.</p>

                <div className='space-y-6'>
                  {/* Discord & System Notifications */}
                  <div className='border-b pb-6'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdNotifications className='w-5 h-5' />
                      Thông báo hệ thống
                    </h3>

                    {/* Pusher Connection Status */}
                    <PusherConnectionStatus />

                    <div className='space-y-4'>
                      <ToggleSwitch
                        id='discordNotifications'
                        checked={settings.discordNotifications}
                        onChange={() => handleToggle('discordNotifications')}
                        title='Thông báo Discord'
                        description='Nhận thông báo qua Discord webhook'
                      />

                      <ToggleSwitch
                        id='orderNotifications'
                        checked={settings.orderNotifications}
                        onChange={() => handleToggle('orderNotifications')}
                        title='Thông báo đơn hàng'
                        description='Nhận thông báo về đơn hàng mới và cập nhật đơn hàng'
                      />

                      <ToggleSwitch
                        id='pushNotifications'
                        checked={settings.pushNotifications}
                        onChange={() => handleToggle('pushNotifications')}
                        title='Thông báo đẩy & Realtime'
                        description='Bật/tắt thông báo realtime qua Pusher và thông báo đẩy trên trình duyệt'
                      />
                    </div>
                  </div>

                  {/* Email Notifications */}
                  <div>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdEmail className='w-5 h-5' />
                      Email marketing
                    </h3>
                    <ToggleSwitch
                      id='emailNotifications'
                      checked={settings.emailNotifications}
                      onChange={() => handleToggle('emailNotifications')}
                      title='Email marketing'
                      description='Nhận email về sản phẩm mới, tính năng và nhiều hơn nữa'
                    />
                  </div>
                </div>
              </div>
            )}

            {/* System Section */}
            {activeSection === 'system' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Hệ thống & Bảo mật</h2>
                <p className='text-gray-600 mb-6'>Cấu hình hệ thống, bảo mật và phương thức thanh toán.</p>

                <div className='space-y-6'>
                  {/* Security Section */}
                  <div className='border-b pb-6'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdSecurity className='w-5 h-5' />
                      Bảo mật & Phiên làm việc
                    </h3>

                    <div className='flex items-center justify-between'>
                      <div>
                        <h4 className='font-medium'>Thời gian hết phiên</h4>
                        <p className='text-sm text-gray-600'>Tự động đăng xuất sau khi không hoạt động (phút)</p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <MdAccessTime className='w-5 h-5 text-gray-500' />
                        <select
                          value={settings.sessionTimeout}
                          onChange={e => handleSessionTimeoutChange(Number(e.target.value))}
                          className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          <option value={1}>1 phút</option>
                          <option value={15}>15 phút</option>
                          <option value={30}>30 phút</option>
                          <option value={60}>1 giờ</option>
                          <option value={120}>2 giờ</option>
                          <option value={240}>4 giờ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Section */}
                  <div className='border-b pb-6'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdStorage className='w-5 h-5' />
                      Phân tích & Theo dõi
                    </h3>
                    <ToggleSwitch
                      id='analyticsTracking'
                      checked={settings.analyticsTracking}
                      onChange={() => handleToggle('analyticsTracking')}
                      title='Theo dõi phân tích'
                      description='Bật theo dõi hành vi người dùng và phân tích'
                    />
                  </div>

                  {/* Payment Methods Section */}
                  <div>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdPayment className='w-5 h-5' />
                      Phương thức thanh toán
                    </h3>
                    <div className='space-y-4'>
                      <ToggleSwitch
                        id='codPayment'
                        checked={settings.codPayment}
                        onChange={() => handleToggle('codPayment')}
                        title='Thanh toán khi nhận hàng (COD)'
                        description='Cho phép khách hàng thanh toán khi nhận hàng'
                      />

                      <ToggleSwitch
                        id='momoPayment'
                        checked={settings.momoPayment}
                        onChange={() => handleToggle('momoPayment')}
                        title='Ví điện tử MoMo'
                        description='Thanh toán qua ví điện tử MoMo'
                      />

                      <ToggleSwitch
                        id='stripePayment'
                        checked={settings.stripePayment}
                        onChange={() => handleToggle('stripePayment')}
                        title='Thẻ tín dụng/ghi nợ (Stripe)'
                        description='Thanh toán bằng thẻ quốc tế qua Stripe'
                      />
                    </div>

                    <div className='bg-yellow-50 p-4 rounded-lg mt-4'>
                      <h5 className='font-medium text-yellow-900 mb-2'>⚠️ Lưu ý quan trọng:</h5>
                      <ul className='text-sm text-yellow-800 space-y-1'>
                        <li>• Tắt phương thức thanh toán sẽ ẩn nó khỏi trang checkout</li>
                        <li>• Đảm bảo ít nhất 1 phương thức được bật</li>
                        <li>• COD phù hợp cho thị trường Việt Nam</li>
                        <li>• MoMo cần cấu hình API key riêng</li>
                        <li>• Stripe phù hợp cho thanh toán quốc tế</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Automation Section */}
            {activeSection === 'automation' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Cài đặt tự động hóa</h2>
                <p className='text-gray-600 mb-6'>Cấu hình các tính năng tự động và hỗ trợ AI.</p>

                <div className='space-y-6'>
                  <ToggleSwitch
                    id='lowStockAlerts'
                    checked={settings.lowStockAlerts}
                    onChange={() => handleToggle('lowStockAlerts')}
                    title='Cảnh báo tồn kho thấp'
                    description='Nhận thông báo khi sản phẩm sắp hết hàng (≤10 sản phẩm)'
                  />

                  <ToggleSwitch
                    id='chatbotSupport'
                    checked={settings.chatbotSupport}
                    onChange={() => handleToggle('chatbotSupport')}
                    title='Hỗ trợ Chatbot'
                    description='Bật chatbot AI để hỗ trợ khách hàng'
                  />

                  <ToggleSwitch
                    id='autoVoucherSuggestion'
                    checked={settings.autoVoucherSuggestion}
                    onChange={() => handleToggle('autoVoucherSuggestion')}
                    title='Đề xuất voucher tự động'
                    description='Tự động đề xuất voucher cho khách hàng'
                  />
                </div>
              </div>
            )}

            {/* Reports Section */}
            {activeSection === 'reports' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Báo cáo thống kê</h2>
                <p className='text-gray-600 mb-6'>Cấu hình báo cáo thống kê tự động qua Discord.</p>

                <div className='space-y-6'>
                  <ToggleSwitch
                    id='dailyReports'
                    checked={settings.dailyReports}
                    onChange={() => handleToggle('dailyReports')}
                    title='Báo cáo hằng ngày'
                    description='Gửi báo cáo thống kê kinh doanh qua Discord webhook'
                  />

                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-medium'>Tần suất báo cáo</h4>
                      <p className='text-sm text-gray-600'>Chọn khoảng thời gian gửi báo cáo</p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <MdAccessTime className='w-5 h-5 text-gray-500' />
                      <select
                        value={settings.reportInterval}
                        onChange={e => handleReportIntervalChange(Number(e.target.value))}
                        className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        disabled={!settings.dailyReports}
                      >
                        <option value={0.033}>Mỗi 2 phút (Test)</option>
                        <option value={0.083}>Mỗi 5 phút (Test)</option>
                        <option value={0.167}>Mỗi 10 phút (Test)</option>
                        <option value={1}>Mỗi 1 giờ</option>
                        <option value={12}>Mỗi 12 giờ</option>
                        <option value={24}>Mỗi 24 giờ</option>
                        <option value={48}>Mỗi 48 giờ</option>
                        <option value={72}>Mỗi 72 giờ</option>
                        <option value={168}>Mỗi tuần</option>
                      </select>
                    </div>
                  </div>

                  <div className='bg-blue-50 p-4 rounded-lg'>
                    <h5 className='font-medium text-blue-900 mb-2'>Nội dung báo cáo bao gồm:</h5>
                    <ul className='text-sm text-blue-800 space-y-1'>
                      <li>• Số lượng đơn hàng mới</li>
                      <li>• Tổng doanh thu</li>
                      <li>• Đơn giao thành công</li>
                      <li>• Sản phẩm sắp hết hàng</li>
                      <li>• Top sản phẩm bán chạy</li>
                      <li>• Khách hàng mới đăng ký</li>
                      <li>• Tỷ lệ chuyển đổi</li>
                    </ul>

                    <div className='mt-4 pt-4 border-t border-blue-200'>
                      <button
                        onClick={handleTestReport}
                        disabled={testingReport}
                        className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm'
                      >
                        {testingReport ? 'Đang gửi...' : '🧪 Test báo cáo Discord'}
                      </button>
                      <p className='text-xs text-blue-700 mt-2'>
                        Gửi tin nhắn test để kiểm tra kết nối Discord webhook
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className='mt-8 pt-6 border-t'>
              <button
                onClick={handleSave}
                disabled={loading}
                className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {loading ? 'Đang lưu...' : 'Cập nhật cài đặt'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsClient;
