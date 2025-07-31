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

        // AI Assistant Settings - Default values
        aiAssistantEnabled: true,
        aiMonitoringInterval: 120, // 2 minutes
        aiInfoMaxReminders: 1,
        aiInfoInterval: 240, // 4 hours
        aiWarningMaxReminders: 2,
        aiWarningInterval: 120, // 2 hours
        aiUrgentMaxReminders: 2,
        aiUrgentInterval: 60, // 1 hour
        aiCriticalMaxReminders: 3,
        aiCriticalInterval: 30, // 30 minutes
        aiBackoffMultiplier: 2.0,
        aiDismissThreshold: 2,
        aiDebugMode: false,

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
    // AI Assistant settings
    aiAssistantEnabled: settings.aiAssistantEnabled,
    aiMonitoringInterval: settings.aiMonitoringInterval,
    aiInfoMaxReminders: settings.aiInfoMaxReminders,
    aiInfoInterval: settings.aiInfoInterval,
    aiWarningMaxReminders: settings.aiWarningMaxReminders,
    aiWarningInterval: settings.aiWarningInterval,
    aiUrgentMaxReminders: settings.aiUrgentMaxReminders,
    aiUrgentInterval: settings.aiUrgentInterval,
    aiCriticalMaxReminders: settings.aiCriticalMaxReminders,
    aiCriticalInterval: settings.aiCriticalInterval,
    aiBackoffMultiplier: settings.aiBackoffMultiplier,
    aiDismissThreshold: settings.aiDismissThreshold,
    aiDebugMode: settings.aiDebugMode,
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
