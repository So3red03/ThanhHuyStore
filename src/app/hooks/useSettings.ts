import { useState, useEffect } from 'react';

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

const defaultSettings: SettingsData = {
  discordNotifications: true,
  orderNotifications: true,
  emailNotifications: true,
  pushNotifications: false,
  analyticsTracking: true,
  sessionTimeout: 30,
  lowStockAlerts: true,
  chatbotSupport: false,
  autoVoucherSuggestion: true,
  dailyReports: true,
  reportInterval: 24,
  codPayment: true,
  momoPayment: true,
  stripePayment: false
};

export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings từ API (database) trước, sau đó localStorage làm fallback
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Luôn thử fetch từ API trước (database là source of truth)
        try {
          const response = await fetch(`/api/settings?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.settings) {
              const dbSettings = { ...defaultSettings, ...data.settings };
              setSettings(dbSettings);
              // Sync localStorage với database
              localStorage.setItem('adminSettings', JSON.stringify(dbSettings));
              return; // Thành công, không cần localStorage
            }
          }
        } catch (apiError) {
          console.log('API settings not available, trying localStorage...');
        }

        // Fallback: Load từ localStorage nếu API không khả dụng
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsedSettings });
        } else {
          // Cuối cùng dùng default settings
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: Partial<SettingsData>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('adminSettings', JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  };

  // Get enabled payment methods
  const getEnabledPaymentMethods = () => {
    const methods = [];
    if (settings.codPayment) methods.push('cod');
    if (settings.momoPayment) methods.push('momo');
    if (settings.stripePayment) methods.push('stripe');
    return methods;
  };

  // Check if payment method is enabled
  const isPaymentMethodEnabled = (method: string) => {
    switch (method) {
      case 'cod':
        return settings.codPayment;
      case 'momo':
        return settings.momoPayment;
      case 'stripe':
        return settings.stripePayment;
      default:
        return false;
    }
  };

  // Get payment method display info
  const getPaymentMethodInfo = (method: string) => {
    const methods = {
      cod: {
        id: 'cod',
        name: 'Thanh toán khi giao hàng (COD)',
        icon: 'https://file.hstatic.net/200000636033/file/pay_2d752907ae604f08ad89868b2a5554da.png',
        enabled: settings.codPayment
      },
      momo: {
        id: 'momo',
        name: 'Thanh toán bằng Momo',
        icon: '/momo.png',
        enabled: settings.momoPayment
      },
      stripe: {
        id: 'stripe',
        name: 'Thanh toán bằng Stripe',
        icon: '/stripe-v2-svgrepo-com.svg',
        enabled: settings.stripePayment
      }
    };
    return methods[method as keyof typeof methods];
  };

  return {
    settings,
    isLoading,
    saveSettings,
    getEnabledPaymentMethods,
    isPaymentMethodEnabled,
    getPaymentMethodInfo
  };
};
