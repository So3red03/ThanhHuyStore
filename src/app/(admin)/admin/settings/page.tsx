'use client';

import { useState, useEffect } from 'react';
import {
  MdSettings,
  MdNotifications,
  MdEmail,
  MdSecurity,
  MdStorage,
  MdSmartToy,
  MdLocalOffer,
  MdAccessTime,
  MdAssessment,
  MdPayment
} from 'react-icons/md';
import toast from 'react-hot-toast';

interface SettingsData {
  discordNotifications: boolean;
  orderNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  analyticsTracking: boolean;
  sessionTimeout: number; // minutes
  lowStockAlerts: boolean;
  chatbotSupport: boolean;
  autoVoucherSuggestion: boolean;
  // Báo cáo thống kê
  dailyReports: boolean;
  reportInterval: number; // hours: 12, 24, 48
  // Phương thức thanh toán
  codPayment: boolean;
  momoPayment: boolean;
  stripePayment: boolean;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<SettingsData>({
    discordNotifications: true,
    orderNotifications: true,
    emailNotifications: true,
    pushNotifications: false,
    analyticsTracking: true,
    sessionTimeout: 30, // 30 minutes default
    lowStockAlerts: true,
    chatbotSupport: false,
    autoVoucherSuggestion: true,
    // Báo cáo thống kê
    dailyReports: true,
    reportInterval: 24, // 24 hours default
    // Phương thức thanh toán
    codPayment: true,
    momoPayment: true,
    stripePayment: false
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('notifications');
  const [testingReport, setTestingReport] = useState(false);

  // Load settings từ localStorage hoặc API
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings
  const handleSave = async () => {
    setLoading(true);
    try {
      // Lưu vào localStorage (có thể thay bằng API call)
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      toast.success('Cài đặt đã được lưu thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu cài đặt');
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
        body: JSON.stringify({ type: 'test' })
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
    { id: 'email', label: 'Email', icon: MdEmail },
    { id: 'security', label: 'Bảo mật', icon: MdSecurity },
    { id: 'system', label: 'Hệ thống', icon: MdStorage },
    { id: 'automation', label: 'Tự động hóa', icon: MdSmartToy },
    { id: 'reports', label: 'Báo cáo', icon: MdAssessment }
  ];

  return (
    <div className='min-h-screen bg-white p-6'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex gap-8 mt-5'>
          {/* Sidebar Menu */}
          <div className='w-64 bg-gray-50 rounded-lg shadow-sm p-6'>
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
          <div className='flex-1 bg-gray-50 rounded-lg shadow-sm p-8'>
            {activeSection === 'notifications' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Thông báo</h2>
                <p className='text-gray-600 mb-6'>Cấu hình cách bạn nhận thông báo.</p>

                <div className='space-y-6'>
                  <div className='border-b pb-6'>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>Thông báo Discord</h4>
                          <p className='text-sm text-gray-600'>Nhận thông báo qua Discord webhook</p>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={settings.discordNotifications}
                            onChange={() => handleToggle('discordNotifications')}
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>Thông báo đơn hàng</h4>
                          <p className='text-sm text-gray-600'>Nhận thông báo về đơn hàng mới và cập nhật đơn hàng</p>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={settings.orderNotifications}
                            onChange={() => handleToggle('orderNotifications')}
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>Thông báo đẩy</h4>
                          <p className='text-sm text-gray-600'>Nhận thông báo đẩy trên trình duyệt</p>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={settings.pushNotifications}
                            onChange={() => handleToggle('pushNotifications')}
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'email' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Thông báo Email</h2>
                <p className='text-gray-600 mb-6'>Quản lý tùy chọn email của bạn.</p>

                <div className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-medium'>Email marketing</h4>
                      <p className='text-sm text-gray-600'>Nhận email về sản phẩm mới, tính năng và nhiều hơn nữa</p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.emailNotifications}
                        onChange={() => handleToggle('emailNotifications')}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'system' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Cài đặt hệ thống</h2>
                <p className='text-gray-600 mb-6'>Cấu hình cài đặt toàn hệ thống và phương thức thanh toán.</p>

                <div className='space-y-6'>
                  {/* Analytics Section */}
                  <div className='border-b pb-6'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdStorage className='w-5 h-5' />
                      Phân tích & Theo dõi
                    </h3>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h4 className='font-medium'>Theo dõi phân tích</h4>
                        <p className='text-sm text-gray-600'>Bật theo dõi hành vi người dùng và phân tích</p>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={settings.analyticsTracking}
                          onChange={() => handleToggle('analyticsTracking')}
                          className='sr-only peer'
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Payment Methods Section */}
                  <div>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdPayment className='w-5 h-5' />
                      Phương thức thanh toán
                    </h3>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>Thanh toán khi nhận hàng (COD)</h4>
                          <p className='text-sm text-gray-600'>Cho phép khách hàng thanh toán khi nhận hàng</p>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={settings.codPayment}
                            onChange={() => handleToggle('codPayment')}
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>Ví điện tử MoMo</h4>
                          <p className='text-sm text-gray-600'>Thanh toán qua ví điện tử MoMo</p>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={settings.momoPayment}
                            onChange={() => handleToggle('momoPayment')}
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='font-medium'>Thẻ tín dụng/ghi nợ (Stripe)</h4>
                          <p className='text-sm text-gray-600'>Thanh toán bằng thẻ quốc tế qua Stripe</p>
                        </div>
                        <label className='relative inline-flex items-center cursor-pointer'>
                          <input
                            type='checkbox'
                            checked={settings.stripePayment}
                            onChange={() => handleToggle('stripePayment')}
                            className='sr-only peer'
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
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

            {activeSection === 'security' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Cài đặt bảo mật</h2>
                <p className='text-gray-600 mb-6'>Cấu hình bảo mật và cài đặt phiên làm việc.</p>

                <div className='space-y-6'>
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
                        <option value={15}>15 phút</option>
                        <option value={30}>30 phút</option>
                        <option value={60}>1 giờ</option>
                        <option value={120}>2 giờ</option>
                        <option value={240}>4 giờ</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'automation' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Cài đặt tự động hóa</h2>
                <p className='text-gray-600 mb-6'>Cấu hình các tính năng tự động và hỗ trợ AI.</p>

                <div className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-medium'>Cảnh báo tồn kho thấp</h4>
                      <p className='text-sm text-gray-600'>Nhận thông báo khi sản phẩm sắp hết hàng (≤10 sản phẩm)</p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.lowStockAlerts}
                        onChange={() => handleToggle('lowStockAlerts')}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-medium'>Hỗ trợ Chatbot</h4>
                      <p className='text-sm text-gray-600'>Bật chatbot AI để hỗ trợ khách hàng</p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.chatbotSupport}
                        onChange={() => handleToggle('chatbotSupport')}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-medium'>Đề xuất voucher tự động</h4>
                      <p className='text-sm text-gray-600'>Tự động đề xuất voucher cho khách hàng</p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.autoVoucherSuggestion}
                        onChange={() => handleToggle('autoVoucherSuggestion')}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'reports' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Báo cáo thống kê</h2>
                <p className='text-gray-600 mb-6'>Cấu hình báo cáo thống kê tự động qua Discord.</p>

                <div className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-medium'>Báo cáo hằng ngày</h4>
                      <p className='text-sm text-gray-600'>Gửi báo cáo thống kê kinh doanh qua Discord webhook</p>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={settings.dailyReports}
                        onChange={() => handleToggle('dailyReports')}
                        className='sr-only peer'
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

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

export default AdminSettings;
