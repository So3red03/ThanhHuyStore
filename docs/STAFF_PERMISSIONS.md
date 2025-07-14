# Hệ thống phân quyền STAFF - ThanhHuyStore

## Tổng quan

Hệ thống phân quyền 3-tier được thiết kế để quản lý quyền truy cập dựa trên vai trò:
- **USER**: Khách hàng - chỉ có quyền truy cập giao diện mua sắm
- **STAFF**: Nhân viên - có quyền quản lý đơn hàng, sản phẩm, khách hàng (hạn chế)
- **ADMIN**: Quản trị viên - có toàn quyền quản lý hệ thống

## Cấu trúc Permission

### Permission Categories

1. **PRODUCTS** - Quản lý sản phẩm
2. **ORDERS** - Quản lý đơn hàng
3. **USERS** - Quản lý khách hàng
4. **STAFF** - Quản lý nhân viên (ADMIN only)
5. **VOUCHERS** - Quản lý voucher & khuyến mãi
6. **ANALYTICS** - Báo cáo & thống kê
7. **SETTINGS** - Cài đặt hệ thống (ADMIN only)
8. **CONTENT** - Quản lý nội dung (banner, bài viết)
9. **SECURITY** - Bảo mật & kiểm toán (ADMIN only)
10. **CHAT** - Chăm sóc khách hàng

### Permission Matrix

| Permission | USER | STAFF | ADMIN |
|------------|------|-------|-------|
| **Products** |
| products:view | ❌ | ✅ | ✅ |
| products:create | ❌ | ❌ | ✅ |
| products:update | ❌ | ✅ | ✅ |
| products:delete | ❌ | ❌ | ✅ |
| products:bulk | ❌ | ❌ | ✅ |
| **Orders** |
| orders:view | ❌ | ✅ | ✅ |
| orders:view_all | ❌ | ✅ | ✅ |
| orders:update_status | ❌ | ✅ | ✅ |
| orders:cancel | ❌ | ✅ | ✅ |
| orders:refund | ❌ | ❌ | ✅ |
| **Users** |
| users:view | ❌ | ✅ | ✅ |
| users:create | ❌ | ❌ | ✅ |
| users:update | ❌ | ❌ | ✅ |
| users:delete | ❌ | ❌ | ✅ |
| users:manage_roles | ❌ | ❌ | ✅ |
| **Staff** |
| staff:view | ❌ | ❌ | ✅ |
| staff:create | ❌ | ❌ | ✅ |
| staff:update | ❌ | ❌ | ✅ |
| staff:delete | ❌ | ❌ | ✅ |
| staff:assign_permissions | ❌ | ❌ | ✅ |
| **Vouchers** |
| vouchers:view | ❌ | ✅ | ✅ |
| vouchers:create | ❌ | ✅ | ✅ |
| vouchers:update | ❌ | ✅ | ✅ |
| vouchers:delete | ❌ | ❌ | ✅ |
| **Analytics** |
| analytics:view_basic | ❌ | ✅ | ✅ |
| analytics:view_advanced | ❌ | ❌ | ✅ |
| reports:generate | ❌ | ✅ | ✅ |
| reports:export | ❌ | ❌ | ✅ |
| **Settings** |
| settings:view | ❌ | ❌ | ✅ |
| settings:update | ❌ | ❌ | ✅ |
| settings:system | ❌ | ❌ | ✅ |
| **Content** |
| banners:view | ❌ | ❌ | ✅ |
| banners:create | ❌ | ❌ | ✅ |
| banners:update | ❌ | ❌ | ✅ |
| banners:delete | ❌ | ❌ | ✅ |
| articles:view | ❌ | ✅ | ✅ |
| articles:create | ❌ | ✅ | ✅ |
| articles:update | ❌ | ✅ | ✅ |
| articles:delete | ❌ | ❌ | ✅ |
| **Security** |
| audit:view | ❌ | ❌ | ✅ |
| audit:export | ❌ | ❌ | ✅ |
| security:manage | ❌ | ❌ | ✅ |
| **Chat** |
| chat:view | ❌ | ✅ | ✅ |
| chat:respond | ❌ | ✅ | ✅ |
| chat:manage | ❌ | ✅ | ✅ |

## Implementation Details

### 1. Permission Constants
```typescript
// src/app/constants/permissions.ts
export const PERMISSIONS = {
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  // ... other permissions
};

export const ROLE_PERMISSIONS = {
  USER: [],
  STAFF: [/* staff permissions */],
  ADMIN: [/* all permissions */]
};
```

### 2. Permission Utilities
```typescript
// src/app/utils/permissions.ts
export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
};
```

### 3. Component Protection
```typescript
// Example usage in components
const canCreateProduct = hasPermission(currentUser?.role, PERMISSIONS.PRODUCTS_CREATE);

{canCreateProduct && (
  <Button onClick={handleCreateProduct}>
    Tạo sản phẩm
  </Button>
)}
```

### 4. API Protection
```typescript
// Example in API routes
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  
  if (!currentUser || !hasPermission(currentUser.role, PERMISSIONS.PRODUCTS_CREATE)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... API logic
}
```

### 5. Menu Filtering
```typescript
// src/app/utils/menuUtils.ts
export const getFilteredMenuItems = (userRole: Role): MenuItem[] => {
  // Filter menu items based on permissions
};
```

## Security Considerations

### 1. Defense in Depth
- **Client-side**: UI elements hidden based on permissions
- **Server-side**: API endpoints protected with permission checks
- **Database**: Role-based access control

### 2. Permission Validation
- All API endpoints validate permissions
- Menu items filtered based on role
- Components conditionally rendered

### 3. Audit Logging
- All permission-sensitive actions logged
- User role changes tracked
- Failed permission attempts recorded

## Staff Management Workflow

### 1. Creating Staff Users
1. Only ADMIN can create STAFF/ADMIN users
2. Email verification automatic for staff accounts
3. Default permissions assigned based on role
4. Audit log created for new staff creation

### 2. Managing Staff Permissions
1. ADMIN can view all staff members
2. ADMIN can modify staff roles and permissions
3. Staff cannot modify their own permissions
4. Permission changes logged for audit

### 3. Staff Access Control
1. Staff can access admin panel with limited features
2. Menu items filtered based on permissions
3. API endpoints protected by role checks
4. Unauthorized access attempts logged

## Usage Examples

### Checking Permissions in Components
```typescript
import { hasPermission, PERMISSIONS } from '@/app/constants/permissions';

const MyComponent = ({ currentUser }) => {
  const canViewOrders = hasPermission(currentUser?.role, PERMISSIONS.ORDERS_VIEW);
  const canCreateProducts = hasPermission(currentUser?.role, PERMISSIONS.PRODUCTS_CREATE);
  
  return (
    <div>
      {canViewOrders && <OrdersList />}
      {canCreateProducts && <CreateProductButton />}
    </div>
  );
};
```

### API Route Protection
```typescript
import { hasPermission, PERMISSIONS } from '@/app/constants/permissions';

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();
  
  if (!hasPermission(currentUser?.role, PERMISSIONS.ORDERS_VIEW)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Return orders data
}
```

### Menu Item Filtering
```typescript
const menuItems = getFilteredMenuItems(currentUser?.role);
// Returns only menu items user has permission to access
```

## Migration Notes

### Database Changes
1. Updated `Role` enum to include `STAFF`
2. No breaking changes to existing data
3. Existing `ADMIN` users retain full permissions
4. Existing `USER` accounts unaffected

### Code Changes
1. Added permission system with constants and utilities
2. Updated admin layout with permission checks
3. Modified sidebar to filter menu items
4. Created staff management interface
5. Added API endpoints for staff operations

### Deployment Checklist
- [ ] Run database migration to add STAFF role
- [ ] Update environment variables if needed
- [ ] Test permission system with different roles
- [ ] Verify audit logging functionality
- [ ] Test staff management workflows
