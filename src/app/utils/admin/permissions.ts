/**
 * Simple Function-Level Permissions for STAFF vs ADMIN
 *
 * Focus: What STAFF can/cannot DO, not what pages they can see
 */

// Simple permission constants for specific actions
export const PERMISSIONS = {
  // Destructive actions (ADMIN only)
  DELETE_PRODUCTS: 'delete_products',
  DELETE_ORDERS: 'delete_orders',
  DELETE_USERS: 'delete_users',
  CANCEL_ORDERS: 'cancel_orders',
  ORDERS_CANCEL: 'orders_cancel',
  ORDERS_UPDATE_STATUS: 'orders_update_status',

  // Inventory management (ADMIN only)
  MANAGE_INVENTORY: 'manage_inventory',
  UPDATE_STOCK: 'update_stock',

  // Staff management (ADMIN only)
  MANAGE_STAFF: 'manage_staff',
  STAFF_VIEW: 'staff_view',
  STAFF_CREATE: 'staff_create',
  STAFF_UPDATE: 'staff_update',
  STAFF_DELETE: 'staff_delete',
  CREATE_STAFF: 'create_staff',
  DELETE_STAFF: 'delete_staff',

  // User management (ADMIN only)
  DELETE_USERS_ACCOUNT: 'delete_users_account',
  UPDATE_USER_ROLES: 'update_user_roles',

  // System settings (ADMIN only)
  MANAGE_SETTINGS: 'manage_settings',
  UPDATE_SYSTEM_CONFIG: 'update_system_config',

  // Financial data (ADMIN only)
  VIEW_REVENUE_DETAILS: 'view_revenue_details',
  EXPORT_FINANCIAL_REPORTS: 'export_financial_reports',

  // Voucher management (ADMIN only)
  DELETE_VOUCHERS: 'delete_vouchers',
  UPDATE_VOUCHER_LIMITS: 'update_voucher_limits'
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role definitions
export type Role = 'USER' | 'STAFF' | 'ADMIN';

// Simple role-based permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Regular users - no admin permissions
  USER: [],

  // Staff - can view and create most things, but limited destructive/critical actions
  STAFF: [
    // No destructive permissions
    // No inventory management
    // No staff management
    // No user account deletion
    // No system settings
    // No financial details
    // No voucher deletion
  ],

  // Admin - full access to everything
  ADMIN: [
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.DELETE_ORDERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.CANCEL_ORDERS,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.ORDERS_UPDATE_STATUS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.UPDATE_STOCK,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DELETE,
    PERMISSIONS.CREATE_STAFF,
    PERMISSIONS.DELETE_STAFF,
    PERMISSIONS.DELETE_USERS_ACCOUNT,
    PERMISSIONS.UPDATE_USER_ROLES,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.UPDATE_SYSTEM_CONFIG,
    PERMISSIONS.VIEW_REVENUE_DETAILS,
    PERMISSIONS.EXPORT_FINANCIAL_REPORTS,
    PERMISSIONS.DELETE_VOUCHERS,
    PERMISSIONS.UPDATE_VOUCHER_LIMITS
  ]
};

/**
 * What STAFF CAN do:
 * ✅ View all admin pages
 * ✅ Create products, orders, users, articles, vouchers
 * ✅ Update products, orders, users, articles (basic info)
 * ✅ View reports and analytics (basic)
 * ✅ Chat support
 * ✅ Manage categories, banners
 *
 * What STAFF CANNOT do:
 * ❌ Delete products, orders, users
 * ❌ Cancel orders
 * ❌ Manage inventory/stock
 * ❌ Manage staff accounts
 * ❌ Delete user accounts or change roles
 * ❌ Access system settings
 * ❌ View detailed financial data
 * ❌ Delete vouchers or change limits
 */
