'use client';

import ToggleSwitch from '@/app/components/admin/settings/ToggleSwitch';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  MdNotifications,
  MdSecurity,
  MdStorage,
  MdSmartToy,
  MdAccessTime,
  MdAssessment,
  MdPayment,
  MdAutorenew,
  MdSend,
  MdLocalShipping,
  MdCheckCircle,
  MdChat
} from 'react-icons/md';
import { DeliveryStatus, Order, OrderStatus } from '@prisma/client';

interface SettingsData {
  discordNotifications: boolean;
  orderNotifications: boolean;
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
  // Email automation settings
  autoEmailMarketing: boolean;
  emailMarketingSchedule: string;
  emailMarketingTime: string;
  // Shipping settings
  shopAddress?: string;
  shopProvince?: string;
  shopDistrict?: string;
  shopWard?: string;
  freeShippingThreshold?: number;
  baseShippingFee?: number;
  shippingPerKm?: number;
  returnShippingPolicy?: any;
  // Zone-based shipping fees
  sameDistrictFee?: number;
  sameProvinceFee?: number;
  sameRegionFee?: number;
  crossRegionFee?: number;
  // AI Assistant settings
  aiAssistantEnabled: boolean;
  aiMonitoringInterval: number;
  aiInfoMaxReminders: number;
  aiInfoInterval: number;
  aiWarningMaxReminders: number;
  aiWarningInterval: number;
  aiUrgentMaxReminders: number;
  aiUrgentInterval: number;
  aiCriticalMaxReminders: number;
  aiCriticalInterval: number;
  aiBackoffMultiplier: number;
  aiDismissThreshold: number;
  aiDebugMode: boolean;
}

interface AdminSettingsClientProps {
  initialSettings: SettingsData;
}

const AdminSettingsClient: React.FC<AdminSettingsClientProps> = ({ initialSettings }) => {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('notifications');
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [testOrders, setTestOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [shippingOrders, setShippingOrders] = useState<any[]>([]);
  const [selectedShippingOrderId, setSelectedShippingOrderId] = useState<string>('');

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

  // Load test orders function
  const loadTestOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      console.log(data);
      // Filter orders with status 'confirmed' and deliveryStatus 'not_shipped'
      // API /api/orders trả về array trực tiếp, không có wrapper
      const eligibleOrders = Array.isArray(data)
        ? data.filter(
            (order: Order) =>
              order.status === OrderStatus.confirmed && order.deliveryStatus === DeliveryStatus.not_shipped
          )
        : [];
      console.log('Eligible orders:', eligibleOrders);
      setTestOrders(eligibleOrders);

      if (eligibleOrders.length === 0) {
        toast('Không có đơn hàng phù hợp để test (cần status: confirmed, deliveryStatus: not_shipped)', {
          icon: 'ℹ️'
        });
      } else {
        toast.success(`Tìm thấy ${eligibleOrders.length} đơn hàng phù hợp để test`);
      }
    } catch (error) {
      console.error('Error loading test orders:', error);
      toast.error('Lỗi khi tải danh sách đơn hàng');
    }
  };

  // Load shipping orders function
  const loadShippingOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      console.log(data);
      // Filter orders with status 'confirmed' and deliveryStatus 'in_transit'
      const eligibleOrders = Array.isArray(data)
        ? data.filter(
            (order: Order) =>
              order.status === OrderStatus.confirmed && order.deliveryStatus === DeliveryStatus.in_transit
          )
        : [];
      console.log('Shipping orders:', eligibleOrders);
      setShippingOrders(eligibleOrders);

      if (eligibleOrders.length === 0) {
        toast('Không có đơn hàng đang vận chuyển (cần status: confirmed, deliveryStatus: in_transit)', {
          icon: 'ℹ️'
        });
      } else {
        toast.success(`Tìm thấy ${eligibleOrders.length} đơn hàng đang vận chuyển`);
      }
    } catch (error) {
      console.error('Error loading shipping orders:', error);
      toast.error('Lỗi khi tải danh sách đơn hàng vận chuyển');
    }
  };

  // Test delivery API function
  const handleTestDeliveryAPI = async (action: 'in_transit' | 'completed') => {
    if (!selectedOrderId) {
      toast.error('Vui lòng chọn đơn hàng để test');
      return;
    }

    setIsTestingAPI(true);
    try {
      let updateData: any = {};

      if (action === 'in_transit') {
        // Chuyển sang đang vận chuyển
        updateData = {
          deliveryStatus: 'in_transit'
        };
      } else if (action === 'completed') {
        // Hoàn thành: status = completed, deliveryStatus = delivered
        updateData = {
          status: 'completed',
          deliveryStatus: 'delivered'
        };
      }

      // Add test flag to bypass validation
      updateData.isTest = true;

      const response = await fetch(`/api/orders/${selectedOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        const actionText = action === 'in_transit' ? 'đang vận chuyển' : 'hoàn thành';
        toast.success(`✅ Test thành công! Đơn hàng đã được cập nhật thành ${actionText}`);
        console.log('Test result:', result);

        // Reload orders after successful test
        await loadTestOrders();
        setSelectedOrderId('');
      } else {
        toast.error(`❌ Test thất bại: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Test API error:', error);
      toast.error('❌ Lỗi khi test API');
    } finally {
      setIsTestingAPI(false);
    }
  };

  // Complete shipping order function
  const handleCompleteShippingOrder = async () => {
    if (!selectedShippingOrderId) {
      toast.error('Vui lòng chọn đơn hàng để hoàn thành');
      return;
    }

    setIsTestingAPI(true);
    try {
      const updateData = {
        status: 'completed',
        deliveryStatus: 'delivered',
        isTest: true // Add test flag to bypass validation
      };

      const response = await fetch(`/api/orders/${selectedShippingOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('✅ Đơn hàng đã được hoàn thành thành công');

        // Reload shipping orders after successful completion
        await loadShippingOrders();
        setSelectedShippingOrderId('');
      } else {
        toast.error(`❌ Hoàn thành thất bại: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Complete shipping order error:', error);
      toast.error('❌ Lỗi khi hoàn thành đơn hàng');
    } finally {
      setIsTestingAPI(false);
    }
  };

  const menuItems = [
    { id: 'notifications', label: 'Thông báo', icon: MdNotifications },
    { id: 'system', label: 'Hệ thống', icon: MdStorage },
    { id: 'ai-assistant', label: 'AI Assistant', icon: MdSmartToy },
    { id: 'reports', label: 'Báo cáo', icon: MdAssessment },
    { id: 'shipping', label: 'Vận chuyển', icon: MdLocalShipping }
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

                  {/* Email Automation */}
                  <div className='border-t pt-6'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdAutorenew className='w-5 h-5' />
                      Tự động hóa Email
                    </h3>

                    <div className='space-y-4'>
                      <ToggleSwitch
                        id='autoEmailMarketing'
                        checked={settings.autoEmailMarketing}
                        onChange={() => handleToggle('autoEmailMarketing')}
                        title='Tự động gửi email sản phẩm mới'
                        description='Tự động gửi email thông báo sản phẩm mới đến khách hàng đã mua cùng danh mục'
                      />

                      {settings.autoEmailMarketing && (
                        <div className='ml-6 space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Tần suất gửi email</label>
                            <select
                              value={settings.emailMarketingSchedule}
                              onChange={e => setSettings(prev => ({ ...prev, emailMarketingSchedule: e.target.value }))}
                              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                              <option value='daily'>Hàng ngày</option>
                              <option value='weekly'>Hàng tuần</option>
                              <option value='monthly'>Hàng tháng</option>
                              <option value='newProduct'>Khi có sản phẩm mới</option>
                            </select>
                          </div>

                          {/* Chỉ hiển thị field thời gian khi không phải option "newProduct" */}
                          {settings.emailMarketingSchedule !== 'newProduct' && (
                            <div>
                              <label className='block text-sm font-medium text-gray-700 mb-2'>Thời gian gửi</label>
                              <input
                                type='time'
                                value={settings.emailMarketingTime}
                                onChange={e => setSettings(prev => ({ ...prev, emailMarketingTime: e.target.value }))}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                              />
                            </div>
                          )}

                          {/* Hiển thị thông tin khi chọn option "newProduct" */}
                          {settings.emailMarketingSchedule === 'newProduct' && (
                            <div className='p-3 bg-green-50 border border-green-200 rounded-md'>
                              <p className='text-sm text-green-800'>
                                <strong>📧 Gửi email ngay lập tức</strong>
                              </p>
                              <p className='text-xs text-green-600 mt-1'>
                                Email sẽ được gửi tự động mỗi khi có sản phẩm mới được thêm vào hệ thống
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Section */}
            {activeSection === 'system' && (
              <div className='border-t pt-6'>
                <h2 className='text-2xl font-semibold mb-2'>Hệ thống & Bảo mật</h2>
                <p className='text-gray-600 mb-6'>Cấu hình hệ thống, bảo mật và phương thức thanh toán.</p>

                <div className='space-y-6'>
                  {/* Security Section */}
                  {/* <div className='border-b pb-6'>
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
                  </div> */}

                  {/* Analytics Section */}
                  {/* <div className='border-b pb-6'>
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
                  </div> */}

                  {/* Chat bot Section */}
                  <div>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdChat className='w-5 h-5' />
                      Tính năng chat tư vấn & chat bot
                    </h3>
                    <div className='space-y-4'>
                      <ToggleSwitch
                        id='chatbotSupport'
                        checked={settings.chatbotSupport}
                        onChange={() => handleToggle('chatbotSupport')}
                        title='Hỗ trợ Chatbot'
                        description='Bật chatbot AI để hỗ trợ khách hàng'
                      />
                    </div>
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
                      </ul>
                    </div>
                  </div>

                  {/* Delivery API Testing Section */}
                  <div className='border-t pt-6'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdLocalShipping className='w-5 h-5' />
                      Test API Vận chuyển
                    </h3>

                    {/* Order Selection Dropdown */}
                    {testOrders.length > 0 && (
                      <div className='mb-4'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Chọn đơn hàng để test:</label>
                        <select
                          value={selectedOrderId}
                          onChange={e => setSelectedOrderId(e.target.value)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          <option value=''>-- Chọn đơn hàng --</option>
                          {testOrders.map(order => (
                            <option key={order.id} value={order.id}>
                              #{order.id.slice(-8)} - {order.user?.name || 'N/A'} - {order.amount?.toLocaleString()}đ
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Test Buttons */}
                    <div className='flex gap-3'>
                      <button
                        onClick={loadTestOrders}
                        className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2'
                      >
                        <MdAutorenew className='w-4 h-4' />
                        Tải đơn hàng
                      </button>
                      <button
                        onClick={() => handleTestDeliveryAPI('in_transit')}
                        disabled={isTestingAPI || !selectedOrderId}
                        className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                      >
                        <MdLocalShipping className='w-4 h-4' />
                        {isTestingAPI ? 'Đang test...' : 'Đang giao hàng'}
                      </button>
                    </div>

                    <div className='bg-blue-50 p-4 rounded-lg mt-4'>
                      <h5 className='font-medium text-blue-900 mb-2'>ℹ️ Hướng dẫn test:</h5>
                      <ul className='text-sm text-blue-800 space-y-1'>
                        <li>• Chọn 1 đơn hàng có status PENDING hoặc PROCESSING để test</li>
                        <li>• API sẽ cập nhật deliveryStatus và gửi thông báo Discord</li>
                        <li>• Kiểm tra Discord channel để xem thông báo</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Shipping Orders Completion Section */}
                <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6'>
                  <h4 className='text-lg font-semibold mb-4 text-gray-800'>🚚 Hoàn thành đơn hàng vận chuyển</h4>

                  {/* Shipping Order Selection Dropdown */}
                  {shippingOrders.length > 0 && (
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Chọn đơn hàng để hoàn thành:
                      </label>
                      <select
                        value={selectedShippingOrderId}
                        onChange={e => setSelectedShippingOrderId(e.target.value)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                      >
                        <option value=''>-- Chọn đơn hàng vận chuyển --</option>
                        {shippingOrders.map(order => (
                          <option key={order.id} value={order.id}>
                            #{order.id.slice(-8)} - {order.user?.name || 'N/A'} - {order.amount?.toLocaleString()}đ
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className='space-y-4'>
                    {/* Load Shipping Orders and Complete Buttons */}
                    <div className='flex gap-3'>
                      <button
                        onClick={loadShippingOrders}
                        className='flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
                      >
                        <MdAutorenew className='w-4 h-4' />
                        Tải đơn hàng vận chuyển
                      </button>

                      <button
                        onClick={handleCompleteShippingOrder}
                        disabled={isTestingAPI || !selectedShippingOrderId}
                        className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        {isTestingAPI ? (
                          <>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <MdCheckCircle className='w-4 h-4' />
                            Hoàn thành
                          </>
                        )}
                      </button>
                    </div>

                    <div className='bg-orange-50 p-4 rounded-lg mt-4'>
                      <h5 className='font-medium text-orange-900 mb-2'>ℹ️ Hướng dẫn hoàn thành:</h5>
                      <ul className='text-sm text-orange-800 space-y-1'>
                        <li>• Chọn 1 đơn hàng có status CONFIRMED và deliveryStatus IN_TRANSIT</li>
                        <li>• Hệ thống sẽ cập nhật status thành COMPLETED và deliveryStatus thành DELIVERED</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Reports Section */}
            {/* {activeSection === 'reports' && (
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
                    </ul>
                  </div>
                </div>
              </div>
            )} */}

            {/* Shipping Section */}
            {activeSection === 'shipping' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>Cấu hình vận chuyển</h2>
                <p className='text-gray-600 mb-6'>Cấu hình địa chỉ shop và phí vận chuyển động.</p>

                <div className='space-y-6'>
                  {/* Shop Address Configuration */}
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center'>
                      <MdLocalShipping className='mr-2 text-blue-600' />
                      Địa chỉ cửa hàng
                    </h3>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Địa chỉ đầy đủ</label>
                        <input
                          type='text'
                          value={settings.shopAddress || ''}
                          onChange={e => setSettings({ ...settings, shopAddress: e.target.value })}
                          placeholder='123 Đường ABC, Phường XYZ, Quận 1, TP.HCM'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Tỉnh/Thành phố</label>
                        <input
                          type='text'
                          value={settings.shopProvince || ''}
                          onChange={e => setSettings({ ...settings, shopProvince: e.target.value })}
                          placeholder='TP. Hồ Chí Minh'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Quận/Huyện</label>
                        <input
                          type='text'
                          value={settings.shopDistrict || ''}
                          onChange={e => setSettings({ ...settings, shopDistrict: e.target.value })}
                          placeholder='Quận 1'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Phường/Xã</label>
                        <input
                          type='text'
                          value={settings.shopWard || ''}
                          onChange={e => setSettings({ ...settings, shopWard: e.target.value })}
                          placeholder='Phường Bến Nghé'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Zone-based Shipping Fee Configuration */}
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center'>
                      <MdPayment className='mr-2 text-green-600' />
                      Cấu hình phí vận chuyển theo vùng
                    </h3>
                    {/* <p className='text-sm text-gray-600 mb-4'>
                      Bảng giá cạnh tranh theo chuẩn thị trường (GHTK/GHN). Phí ship được tính theo vùng địa lý thay vì
                      khoảng cách.
                    </p> */}

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Ngưỡng freeship (VNĐ)</label>
                        <input
                          type='number'
                          value={settings.freeShippingThreshold || 5000000}
                          onChange={e => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                          placeholder='5000000'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        <p className='text-xs text-gray-500 mt-1'>Đơn hàng từ số tiền này sẽ được freeship</p>
                      </div>
                    </div>

                    {/* Zone-based Pricing Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Cùng quận/huyện (VNĐ)</label>
                        <input
                          type='number'
                          value={settings.sameDistrictFee || 18000}
                          onChange={e => setSettings({ ...settings, sameDistrictFee: Number(e.target.value) })}
                          placeholder='18000'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        {/* <p className='text-xs text-gray-500 mt-1'>Giao trong 1 ngày</p> */}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Cùng tỉnh/thành (VNĐ)</label>
                        <input
                          type='number'
                          value={settings.sameProvinceFee || 22000}
                          onChange={e => setSettings({ ...settings, sameProvinceFee: Number(e.target.value) })}
                          placeholder='22000'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        {/* <p className='text-xs text-gray-500 mt-1'>Giao trong 2 ngày</p> */}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Cùng miền (VNĐ)</label>
                        <input
                          type='number'
                          value={settings.sameRegionFee || 28000}
                          onChange={e => setSettings({ ...settings, sameRegionFee: Number(e.target.value) })}
                          placeholder='28000'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        {/* <p className='text-xs text-gray-500 mt-1'>Giao trong 3 ngày</p> */}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Khác miền (VNĐ)</label>
                        <input
                          type='number'
                          value={settings.crossRegionFee || 38000}
                          onChange={e => setSettings({ ...settings, crossRegionFee: Number(e.target.value) })}
                          placeholder='38000'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        {/* <p className='text-xs text-gray-500 mt-1'>Giao trong 4 ngày</p> */}
                      </div>
                    </div>

                    {/* Zone Examples */}
                    <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <h4 className='text-sm font-medium text-blue-800 mb-2'>Ví dụ phân vùng:</h4>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700'>
                        <div>
                          <strong>Miền Bắc:</strong> Hà Nội, Hải Phòng, Quảng Ninh, Thái Nguyên...
                        </div>
                        <div>
                          <strong>Miền Trung:</strong> Đà Nẵng, Huế, Quảng Nam, Khánh Hòa...
                        </div>
                        <div>
                          <strong>Miền Nam:</strong> TP.HCM, Bình Dương, Đồng Nai, Cần Thơ...
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Zone-based Shipping Preview */}
                  <div className='bg-blue-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center'>
                      <MdCheckCircle className='mr-2 text-blue-600' />
                      Bảng giá theo vùng
                    </h3>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
                      <div className='bg-white p-4 rounded-lg border-l-4 border-green-500'>
                        <h4 className='font-medium text-gray-700 mb-2'>Cùng quận/huyện</h4>
                        <p className='text-lg font-semibold text-green-600'>
                          {(settings.sameDistrictFee || 18000).toLocaleString()}₫
                        </p>
                        <p className='text-xs text-gray-500 mt-2'>Giao trong 1 ngày</p>
                        <p className='text-xs text-green-600 mt-1'>Ví dụ: Quận 1 → Quận 3</p>
                      </div>

                      <div className='bg-white p-4 rounded-lg border-l-4 border-blue-500'>
                        <h4 className='font-medium text-gray-700 mb-2'>Cùng tỉnh/thành</h4>
                        <p className='text-lg font-semibold text-blue-600'>
                          {(settings.sameProvinceFee || 22000).toLocaleString()}₫
                        </p>
                        <p className='text-xs text-gray-500 mt-2'>Giao trong 2 ngày</p>
                        <p className='text-xs text-blue-600 mt-1'>Ví dụ: TP.HCM → Bình Dương</p>
                      </div>

                      <div className='bg-white p-4 rounded-lg border-l-4 border-orange-500'>
                        <h4 className='font-medium text-gray-700 mb-2'>Cùng miền</h4>
                        <p className='text-lg font-semibold text-orange-600'>
                          {(settings.sameRegionFee || 28000).toLocaleString()}₫
                        </p>
                        <p className='text-xs text-gray-500 mt-2'>Giao trong 3 ngày</p>
                        <p className='text-xs text-orange-600 mt-1'>Ví dụ: TP.HCM → Cần Thơ</p>
                      </div>

                      <div className='bg-white p-4 rounded-lg border-l-4 border-red-500'>
                        <h4 className='font-medium text-gray-700 mb-2'>Khác miền</h4>
                        <p className='text-lg font-semibold text-red-600'>
                          {(settings.crossRegionFee || 38000).toLocaleString()}₫
                        </p>
                        <p className='text-xs text-gray-500 mt-2'>Giao trong 4 ngày</p>
                        <p className='text-xs text-red-600 mt-1'>Ví dụ: TP.HCM → Hà Nội</p>
                      </div>
                    </div>
                  </div>

                  {/* Return Shipping Policy Configuration */}
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center'>
                      <MdLocalShipping className='mr-2 text-purple-600' />
                      Chính sách phí vận chuyển trả hàng
                    </h3>
                    <p className='text-sm text-gray-600 mb-4'>
                      Cấu hình ai chịu trách nhiệm phí vận chuyển khi khách hàng trả hàng theo từng lý do.
                    </p>

                    <div className='space-y-4'>
                      {/* Policy Display */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                          <h4 className='font-medium text-green-800 mb-2'>🏪 Cửa hàng chịu phí ship</h4>
                          <ul className='text-sm text-green-700 space-y-1'>
                            <li>• Hàng lỗi/hư hỏng (DEFECTIVE)</li>
                            <li>• Giao sai hàng (WRONG_ITEM)</li>
                            <li>• Hư hỏng trong vận chuyển (DAMAGED_SHIPPING)</li>
                          </ul>
                          <p className='text-xs text-green-600 mt-2'>Hoàn 100% tiền hàng, không phí xử lý</p>
                        </div>

                        <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                          <h4 className='font-medium text-orange-800 mb-2'>👤 Khách hàng chịu phí ship</h4>
                          <ul className='text-sm text-orange-700 space-y-1'>
                            <li>• Đổi ý không muốn mua (CHANGE_MIND)</li>
                            <li>• Sai kích thước (WRONG_SIZE)</li>
                            <li>• Không đúng mô tả (NOT_AS_DESCRIBED)</li>
                          </ul>
                          <p className='text-xs text-orange-600 mt-2'>Hoàn 90% tiền hàng, trừ 10% phí xử lý</p>
                        </div>
                      </div>

                      {/* Policy Note */}
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                        <div className='flex items-start gap-2'>
                          <MdCheckCircle className='text-blue-600 mt-0.5' size={16} />
                          <div className='text-sm text-blue-800'>
                            <p className='font-medium mb-1'>Lưu ý chính sách:</p>
                            <ul className='space-y-1 text-blue-700'>
                              <li>• Phí vận chuyển trả hàng được tính theo cùng công thức với phí giao hàng</li>
                              <li>• Trả hàng do lỗi khách hàng cần admin phê duyệt trước khi xử lý</li>
                              <li>• Phí xử lý 10% áp dụng cho các trường hợp khách hàng đổi ý</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Calculation Example */}
                      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                        <h4 className='font-medium text-yellow-800 mb-3'>Ví dụ tính toán chi tiết</h4>
                        <div className='text-sm text-yellow-800'>
                          <p className='font-medium mb-2'>Đơn hàng: 3,990,000₫ + 38,000₫ ship = 4,028,000₫</p>
                          <p className='font-medium mb-2 text-orange-700'>Trường hợp: Khách đổi ý không muốn mua</p>

                          <div className='bg-white rounded p-3 mt-2'>
                            <div className='space-y-1 text-xs'>
                              <div className='flex justify-between'>
                                <span>Giá trị hàng hóa:</span>
                                <span>3,990,000₫</span>
                              </div>
                              <div className='flex justify-between text-green-600'>
                                <span>Hoàn tiền hàng (90%):</span>
                                <span>+3,591,000₫</span>
                              </div>
                              <div className='flex justify-between text-red-600'>
                                <span>Phí xử lý (10%):</span>
                                <span>-399,000₫</span>
                              </div>
                              <div className='flex justify-between text-red-600'>
                                <span>Phí ship trả hàng:</span>
                                <span>-38,000₫</span>
                              </div>
                              <div className='border-t pt-1 mt-2 flex justify-between font-medium'>
                                <span>Khách nhận được:</span>
                                <span className='text-green-600'>3,154,000₫</span>
                              </div>
                              <div className='flex justify-between font-medium text-red-600'>
                                <span>Tổng mất:</span>
                                <span>874,000₫ (21.7%)</span>
                              </div>
                            </div>
                          </div>

                          <p className='text-xs text-yellow-700 mt-2'>
                            <strong>Lưu ý:</strong> Chính sách này giúp ngăn chặn việc khách hàng đổi ý tùy tiện và bảo
                            vệ lợi ích cửa hàng.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Assistant Section */}
            {activeSection === 'ai-assistant' && (
              <div>
                <h2 className='text-2xl font-semibold mb-2'>🤖 AI Assistant Settings</h2>
                <p className='text-gray-600 mb-6'>Cấu hình hệ thống AI Assistant để tối ưu thông báo và giảm spam.</p>

                <div className='space-y-6'>
                  {/* AI Assistant Enable/Disable */}
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdSmartToy className='w-5 h-5 text-blue-600' />
                      Trạng thái AI Assistant
                    </h3>
                    <ToggleSwitch
                      id='aiAssistantEnabled'
                      checked={settings.aiAssistantEnabled}
                      onChange={() => setSettings(prev => ({ ...prev, aiAssistantEnabled: !prev.aiAssistantEnabled }))}
                      title='Kích hoạt AI Assistant'
                      description='Bật/tắt hệ thống AI Assistant giám sát business events'
                    />
                  </div>

                  {/* Monitoring Interval */}
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdAccessTime className='w-5 h-5 text-green-600' />
                      Tần suất giám sát
                    </h3>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Kiểm tra mỗi (giây)</label>
                        <input
                          type='number'
                          min='30'
                          max='600'
                          value={settings.aiMonitoringInterval}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              aiMonitoringInterval: parseInt(e.target.value) || 120
                            }))
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        />
                        <p className='text-xs text-gray-500 mt-1'>
                          Khuyến nghị: 120 giây (2 phút). Quá thấp có thể gây lag.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reminder Settings by Priority */}
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdNotifications className='w-5 h-5 text-orange-600' />
                      Cài đặt nhắc nhở theo mức độ
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {/* INFO Level */}
                      <div className='border border-blue-200 rounded-lg p-4 bg-blue-50'>
                        <h4 className='font-medium text-blue-800 mb-3'>💡 INFO Level</h4>
                        <div className='space-y-3'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Số lần nhắc tối đa</label>
                            <input
                              type='number'
                              min='1'
                              max='5'
                              value={settings.aiInfoMaxReminders}
                              onChange={e =>
                                setSettings(prev => ({
                                  ...prev,
                                  aiInfoMaxReminders: parseInt(e.target.value) || 1
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Khoảng cách (phút)</label>
                            <input
                              type='number'
                              min='60'
                              max='1440'
                              value={settings.aiInfoInterval}
                              onChange={e =>
                                setSettings(prev => ({
                                  ...prev,
                                  aiInfoInterval: parseInt(e.target.value) || 240
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                            />
                          </div>
                        </div>
                      </div>

                      {/* WARNING Level */}
                      <div className='border border-yellow-200 rounded-lg p-4 bg-yellow-50'>
                        <h4 className='font-medium text-yellow-800 mb-3'>⚠️ WARNING Level</h4>
                        <div className='space-y-3'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Số lần nhắc tối đa</label>
                            <input
                              type='number'
                              min='1'
                              max='5'
                              value={settings.aiWarningMaxReminders}
                              onChange={e =>
                                setSettings(prev => ({
                                  ...prev,
                                  aiWarningMaxReminders: parseInt(e.target.value) || 2
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Khoảng cách (phút)</label>
                            <input
                              type='number'
                              min='30'
                              max='720'
                              value={settings.aiWarningInterval}
                              onChange={e =>
                                setSettings(prev => ({
                                  ...prev,
                                  aiWarningInterval: parseInt(e.target.value) || 120
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500'
                            />
                          </div>
                        </div>
                      </div>

                      {/* URGENT Level */}
                      <div className='border border-orange-200 rounded-lg p-4 bg-orange-50'>
                        <h4 className='font-medium text-orange-800 mb-3'>🚨 URGENT Level</h4>
                        <div className='space-y-3'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Số lần nhắc tối đa</label>
                            <input
                              type='number'
                              min='1'
                              max='5'
                              value={settings.aiUrgentMaxReminders}
                              onChange={e =>
                                setSettings(prev => ({
                                  ...prev,
                                  aiUrgentMaxReminders: parseInt(e.target.value) || 2
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Khoảng cách (phút)</label>
                            <input
                              type='number'
                              min='15'
                              max='360'
                              value={settings.aiUrgentInterval}
                              onChange={e =>
                                setSettings(prev => ({
                                  ...prev,
                                  aiUrgentInterval: parseInt(e.target.value) || 60
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500'
                            />
                          </div>
                        </div>
                      </div>

                      {/* CRITICAL Level */}
                      <div className='border border-red-200 rounded-lg p-4 bg-red-50'>
                        <h4 className='font-medium text-red-800 mb-3'>💀 CRITICAL Level</h4>
                        <div className='space-y-3'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Số lần nhắc tối đa</label>
                            <input
                              type='number'
                              min='1'
                              max='10'
                              value={settings.aiCriticalMaxReminders}
                              onChange={e =>
                                setSettings(prev => ({
                                  ...prev,
                                  aiCriticalMaxReminders: parseInt(e.target.value) || 3
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Khoảng cách (phút)</label>
                            <input
                              type='number'
                              min='5'
                              max='180'
                              value={settings.aiCriticalInterval}
                              onChange={e =>
                                setSettings(prev => ({
                                  ...prev,
                                  aiCriticalInterval: parseInt(e.target.value) || 30
                                }))
                              }
                              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500'
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center gap-2'>
                      <MdSecurity className='w-5 h-5 text-purple-600' />
                      Cài đặt nâng cao
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Hệ số tăng thời gian chờ</label>
                        <input
                          type='number'
                          min='1'
                          max='5'
                          step='0.1'
                          value={settings.aiBackoffMultiplier}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              aiBackoffMultiplier: parseFloat(e.target.value) || 2.0
                            }))
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500'
                        />
                        <p className='text-xs text-gray-500 mt-1'>Mỗi lần nhắc, thời gian chờ sẽ nhân với hệ số này</p>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Ngưỡng dismiss để dừng</label>
                        <input
                          type='number'
                          min='1'
                          max='5'
                          value={settings.aiDismissThreshold}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              aiDismissThreshold: parseInt(e.target.value) || 2
                            }))
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500'
                        />
                        <p className='text-xs text-gray-500 mt-1'>Sau X lần dismiss, hệ thống sẽ dừng nhắc nhở</p>
                      </div>
                    </div>
                    <div className='mt-4'>
                      <ToggleSwitch
                        id='aiDebugMode'
                        checked={settings.aiDebugMode}
                        onChange={() => setSettings(prev => ({ ...prev, aiDebugMode: !prev.aiDebugMode }))}
                        title='Debug Mode'
                        description='Bật để xem logs chi tiết trong console (chỉ dùng khi debug)'
                      />
                    </div>
                  </div>

                  {/* Enhanced Preview Section with Event Type Explanations */}
                  <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200'>
                    <h3 className='text-lg font-medium mb-6 flex items-center gap-2'>
                      <MdCheckCircle className='w-5 h-5 text-green-600' />
                      Tóm tắt cài đặt & Loại thông báo
                    </h3>

                    {/* System Status */}
                    <div className='mb-6 p-4 bg-white rounded-lg border border-gray-200'>
                      <h4 className='font-medium text-gray-800 mb-3'>🔧 Trạng thái hệ thống</h4>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Trạng thái:</span>
                          <span
                            className={
                              settings.aiAssistantEnabled ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                            }
                          >
                            {settings.aiAssistantEnabled ? '✅ Hoạt động' : '❌ Tắt'}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Giám sát mỗi:</span>
                          <span className='font-medium text-blue-600'>{settings.aiMonitoringInterval}s</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Debug mode:</span>
                          <span className={settings.aiDebugMode ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                            {settings.aiDebugMode ? '🐛 ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Alert Levels with Event Type Explanations */}
                    <div className='space-y-4'>
                      <h4 className='font-medium text-gray-800 mb-3'>📊 Cấu hình thông báo theo mức độ</h4>

                      {/* INFO Level */}
                      <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='text-blue-600 font-medium'>💡 INFO Level</span>
                            <span className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full'>
                              {settings.aiInfoMaxReminders} lần / {settings.aiInfoInterval}p
                            </span>
                          </div>
                        </div>
                        <p className='text-sm text-blue-700 mb-2'>
                          <strong>Thông báo về:</strong> Thông tin tổng quan, xu hướng tích cực, cập nhật không khẩn cấp
                        </p>
                        <div className='text-xs text-blue-600 space-y-1'>
                          <div>• 📈 Sales spike - Doanh số tăng đột biến</div>
                          <div>• 🎯 Khách hàng VIP mới - Có đơn hàng giá trị cao</div>
                          <div>• 📊 Báo cáo định kỳ - Tổng kết hiệu suất</div>
                        </div>
                      </div>

                      {/* WARNING Level */}
                      <div className='p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='text-yellow-600 font-medium'>⚠️ WARNING Level</span>
                            <span className='text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full'>
                              {settings.aiWarningMaxReminders} lần / {settings.aiWarningInterval}p
                            </span>
                          </div>
                        </div>
                        <p className='text-sm text-yellow-700 mb-2'>
                          <strong>Thông báo về:</strong> Vấn đề cần chú ý, xu hướng tiêu cực, cần hành động sớm
                        </p>
                        <div className='text-xs text-yellow-600 space-y-1'>
                          <div>• 📦 Tồn kho thấp - Sản phẩm còn 3-5 cái, cần nhập hàng</div>
                          <div>• � Doanh số giảm - So với tuần trước, cần review giá</div>
                        </div>
                      </div>

                      {/* URGENT Level */}
                      <div className='p-4 bg-orange-50 rounded-lg border border-orange-200'>
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='text-orange-600 font-medium'>🚨 URGENT Level</span>
                            <span className='text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full'>
                              {settings.aiUrgentMaxReminders} lần / {settings.aiUrgentInterval}p
                            </span>
                          </div>
                        </div>
                        <p className='text-sm text-orange-700 mb-2'>
                          <strong>Thông báo về:</strong> Vấn đề nghiêm trọng, cần xử lý trong vài giờ
                        </p>
                        <div className='text-xs text-orange-600 space-y-1'>
                          <div>• 📦 Tồn kho rất thấp - Chỉ còn 1-2 cái, NGUY CƠ HẾT HÀNG</div>
                          <div>• 💳 Lỗi thanh toán - Nhiều đơn bị failed, check payment gateway</div>
                        </div>
                      </div>

                      {/* CRITICAL Level */}
                      <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <span className='text-red-600 font-medium'>💀 CRITICAL Level</span>
                            <span className='text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full'>
                              {settings.aiCriticalMaxReminders} lần / {settings.aiCriticalInterval}p
                            </span>
                          </div>
                        </div>
                        <p className='text-sm text-red-700 mb-2'>
                          <strong>Thông báo về:</strong> Khẩn cấp! Cần xử lý ngay lập tức để tránh thiệt hại
                        </p>
                        <div className='text-xs text-red-600 space-y-1'>
                          <div>• 🚫 HẾT HÀNG - Tồn kho = 0, đang từ chối đơn hàng!</div>
                          <div>• ⚠️ Lỗi hệ thống - Website/thanh toán gặp sự cố</div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Tips */}
                    <div className='mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200'>
                      <h4 className='font-medium text-gray-800 mb-2 flex items-center gap-2'>💡 Gợi ý cấu hình</h4>
                      <div className='text-sm text-gray-600 space-y-1'>
                        <div>
                          • <strong>Cửa hàng nhỏ:</strong> INFO(1/8h), WARNING(1/4h), URGENT(2/2h), CRITICAL(3/1h)
                        </div>
                        <div>
                          • <strong>Cửa hàng lớn:</strong> INFO(2/4h), WARNING(3/2h), URGENT(3/1h), CRITICAL(5/30p)
                        </div>
                        <div>
                          • <strong>Testing:</strong> Tất cả levels 1 lần / 5 phút, Debug Mode ON
                        </div>
                      </div>
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
