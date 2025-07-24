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
  MdCheckCircle
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
    { id: 'automation', label: 'Tự động hóa', icon: MdSmartToy },
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
              <div>
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
                    <p className='text-sm text-gray-600 mb-4'>
                      Kiểm tra API cập nhật trạng thái đơn hàng và gửi thông báo Discord
                    </p>

                    {/* Load Orders Button */}
                    <div className='mb-4'>
                      <button
                        onClick={loadTestOrders}
                        className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2'
                      >
                        <MdAutorenew className='w-4 h-4' />
                        Tải đơn hàng
                      </button>
                    </div>

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
                        onClick={() => handleTestDeliveryAPI('in_transit')}
                        disabled={isTestingAPI || !selectedOrderId}
                        className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                      >
                        <MdLocalShipping className='w-4 h-4' />
                        {isTestingAPI ? 'Đang test...' : 'Đang giao hàng'}
                      </button>

                      {/* <button
                        onClick={() => handleTestDeliveryAPI('completed')}
                        disabled={isTestingAPI || !selectedOrderId}
                        className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                      >
                        <MdCheckCircle className='w-4 h-4' />
                        {isTestingAPI ? 'Đang test...' : 'Hoàn thành'}
                      </button> */}
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
                  <p className='text-gray-600 mb-4'>Tải và hoàn thành các đơn hàng đang trong quá trình vận chuyển.</p>

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

                    <div className='bg-orange-50 p-4 rounded-lg mt-4'>
                      <h5 className='font-medium text-orange-900 mb-2'>ℹ️ Hướng dẫn hoàn thành:</h5>
                      <ul className='text-sm text-orange-800 space-y-1'>
                        <li>• Chọn 1 đơn hàng có status CONFIRMED và deliveryStatus IN_TRANSIT</li>
                        <li>• Hệ thống sẽ cập nhật status thành COMPLETED và deliveryStatus thành DELIVERED</li>
                        <li>• Đơn hàng sẽ được đánh dấu là hoàn thành trong hệ thống</li>
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
                  {/* <ToggleSwitch
                    id='lowStockAlerts'
                    checked={settings.lowStockAlerts}
                    onChange={() => handleToggle('lowStockAlerts')}
                    title='Cảnh báo tồn kho thấp'
                    description='Nhận thông báo khi sản phẩm sắp hết hàng (≤10 sản phẩm)'
                  /> */}

                  <ToggleSwitch
                    id='chatbotSupport'
                    checked={settings.chatbotSupport}
                    onChange={() => handleToggle('chatbotSupport')}
                    title='Hỗ trợ Chatbot'
                    description='Bật chatbot AI để hỗ trợ khách hàng'
                  />
                  {/* 
                  <ToggleSwitch
                    id='autoVoucherSuggestion'
                    checked={settings.autoVoucherSuggestion}
                    onChange={() => handleToggle('autoVoucherSuggestion')}
                    title='Đề xuất voucher tự động'
                    description='Tự động đề xuất voucher cho khách hàng'
                  /> */}
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

                  {/* Shipping Fee Configuration */}
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center'>
                      <MdPayment className='mr-2 text-green-600' />
                      Cấu hình phí vận chuyển
                    </h3>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Ngưỡng freeship (VNĐ)</label>
                        <input
                          type='number'
                          value={settings.freeShippingThreshold || 500000}
                          onChange={e => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                          placeholder='500000'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        <p className='text-xs text-gray-500 mt-1'>Đơn hàng từ số tiền này sẽ được freeship</p>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Phí ship cơ bản (VNĐ)</label>
                        <input
                          type='number'
                          value={settings.baseShippingFee || 15000}
                          onChange={e => setSettings({ ...settings, baseShippingFee: Number(e.target.value) })}
                          placeholder='15000'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        <p className='text-xs text-gray-500 mt-1'>Phí ship tiêu chuẩn (2-3 ngày)</p>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Phí ship mỗi km (VNĐ)</label>
                        <input
                          type='number'
                          value={settings.shippingPerKm || 1500}
                          onChange={e => setSettings({ ...settings, shippingPerKm: Number(e.target.value) })}
                          placeholder='1500'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        <p className='text-xs text-gray-500 mt-1'>Phí bổ sung cho mỗi km &gt; 10km</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Calculation Preview */}
                  <div className='bg-blue-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-medium mb-4 flex items-center'>
                      <MdCheckCircle className='mr-2 text-blue-600' />
                      Xem trước tính phí
                    </h3>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                      <div className='bg-white p-4 rounded-lg'>
                        <h4 className='font-medium text-gray-700 mb-2'>Cùng quận (5km)</h4>
                        <p className='text-lg font-semibold text-green-600'>
                          {(settings.baseShippingFee || 15000).toLocaleString()}₫
                        </p>
                        <p className='text-xs text-gray-500 mt-2'>Phí cơ bản (không có phí khoảng cách)</p>
                      </div>

                      <div className='bg-white p-4 rounded-lg'>
                        <h4 className='font-medium text-gray-700 mb-2'>Khác quận (20km)</h4>
                        <p className='text-lg font-semibold text-orange-600'>
                          {(
                            (settings.baseShippingFee || 15000) +
                            10 * (settings.shippingPerKm || 1500)
                          ).toLocaleString()}
                          ₫
                        </p>
                        <p className='text-xs text-gray-500 mt-2'>
                          Cơ bản + 10km × {(settings.shippingPerKm || 1500).toLocaleString()}₫
                        </p>
                      </div>

                      <div className='bg-white p-4 rounded-lg'>
                        <h4 className='font-medium text-gray-700 mb-2'>Khác tỉnh (50km)</h4>
                        <p className='text-lg font-semibold text-red-600'>
                          {(
                            (settings.baseShippingFee || 15000) +
                            40 * (settings.shippingPerKm || 1500)
                          ).toLocaleString()}
                          ₫
                        </p>
                        <p className='text-xs text-gray-500 mt-2'>
                          Cơ bản + 40km × {(settings.shippingPerKm || 1500).toLocaleString()}₫
                        </p>
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
