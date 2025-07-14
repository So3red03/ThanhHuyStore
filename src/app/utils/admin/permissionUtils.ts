/**
 * Simple Permission Utilities for Function-Level Access Control
 */

import { ROLE_PERMISSIONS, Permission, Role } from './permissions';

/**
 * Check if a user role has a specific permission
 * @param userRole - The user's role
 * @param permission - The permission to check
 * @returns boolean - True if user has permission
 */
export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  
  return rolePermissions.includes(permission);
};

/**
 * Get display name for role
 * @param userRole - The user's role
 * @returns string - Display name
 */
export const getRoleDisplayName = (userRole: Role): string => {
  const roleNames = {
    USER: 'Khách hàng',
    STAFF: 'Nhân viên',
    ADMIN: 'Quản trị viên'
  };
  
  return roleNames[userRole] || 'Không xác định';
};

/**
 * Check if user is admin (for destructive actions)
 * @param userRole - The user's role
 * @returns boolean - True if user is admin
 */
export const isAdmin = (userRole: Role): boolean => {
  return userRole === 'ADMIN';
};

/**
 * Check if user is staff or admin (for general admin access)
 * @param userRole - The user's role
 * @returns boolean - True if user is staff or admin
 */
export const isStaffOrAdmin = (userRole: Role): boolean => {
  return userRole === 'STAFF' || userRole === 'ADMIN';
};

/**
 * Check if user can delete items (ADMIN only)
 * @param userRole - The user's role
 * @returns boolean - True if user can delete
 */
export const canDelete = (userRole: Role): boolean => {
  return userRole === 'ADMIN';
};

/**
 * Check if user can manage inventory (ADMIN only)
 * @param userRole - The user's role
 * @returns boolean - True if user can manage inventory
 */
export const canManageInventory = (userRole: Role): boolean => {
  return userRole === 'ADMIN';
};

/**
 * Check if user can manage staff (ADMIN only)
 * @param userRole - The user's role
 * @returns boolean - True if user can manage staff
 */
export const canManageStaff = (userRole: Role): boolean => {
  return userRole === 'ADMIN';
};

/**
 * Check if user can access system settings (ADMIN only)
 * @param userRole - The user's role
 * @returns boolean - True if user can access settings
 */
export const canAccessSettings = (userRole: Role): boolean => {
  return userRole === 'ADMIN';
};
