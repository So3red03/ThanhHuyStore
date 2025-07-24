import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { redirect } from 'next/navigation';
import AdminSettingsClient from './AdminSettingsClient';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
  fastShippingFee?: number;
  shippingPerKm?: number;
  maxShippingDistance?: number;
  returnShippingPolicy?: any;
}

// Server Component - fetch fresh data every time
const AdminSettings = async () => {
  // Check authentication
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
    redirect('/');
  }

  // Fetch fresh settings from database
  let settings = await prisma.adminSettings.findFirst();

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.adminSettings.create({
      data: {
        // Notification settings
        discordNotifications: true,
        orderNotifications: true,
        pushNotifications: false,

        // System settings
        analyticsTracking: true,
        sessionTimeout: 30,

        // Automation settings
        lowStockAlerts: true,
        chatbotSupport: false,
        autoVoucherSuggestion: true,

        // Report settings
        dailyReports: true,
        reportInterval: 24,

        // Payment settings
        codPayment: true,
        momoPayment: true,
        stripePayment: false,

        // Email automation settings
        autoEmailMarketing: false,
        emailMarketingSchedule: 'daily',
        emailMarketingTime: '09:00',

        // Audit fields
        createdBy: currentUser.email,
        updatedBy: currentUser.email
      }
    });
  }

  // Convert to plain object for client component
  const settingsData: SettingsData = {
    discordNotifications: settings.discordNotifications,
    orderNotifications: settings.orderNotifications,
    pushNotifications: settings.pushNotifications,
    analyticsTracking: settings.analyticsTracking,
    sessionTimeout: settings.sessionTimeout,
    lowStockAlerts: settings.lowStockAlerts,
    chatbotSupport: settings.chatbotSupport,
    autoVoucherSuggestion: settings.autoVoucherSuggestion,
    dailyReports: settings.dailyReports,
    reportInterval: settings.reportInterval,
    codPayment: settings.codPayment,
    momoPayment: settings.momoPayment,
    stripePayment: settings.stripePayment,
    autoEmailMarketing: settings.autoEmailMarketing,
    emailMarketingSchedule: settings.emailMarketingSchedule,
    emailMarketingTime: settings.emailMarketingTime,
    // Shipping settings
    shopAddress: settings.shopAddress || undefined,
    shopProvince: settings.shopProvince || undefined,
    shopDistrict: settings.shopDistrict || undefined,
    shopWard: settings.shopWard || undefined,
    freeShippingThreshold: settings.freeShippingThreshold || undefined,
    baseShippingFee: settings.baseShippingFee || undefined,
    shippingPerKm: settings.shippingPerKm || undefined,
    returnShippingPolicy: settings.returnShippingPolicy || undefined
  };

  return <AdminSettingsClient initialSettings={settingsData} />;
};

export default AdminSettings;
