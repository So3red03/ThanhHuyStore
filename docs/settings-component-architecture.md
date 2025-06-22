# Settings Component Architecture

## 🏗️ **COMPONENT STRUCTURE**

Đã chia Settings page thành các components nhỏ, tái sử dụng được:

### **📁 Folder Structure:**
```
src/app/(admin)/admin/settings/
├── page.tsx                    # Main page (clean & simple)
└── components/
    ├── SettingsLayout.tsx      # Layout wrapper
    ├── SettingsSidebar.tsx     # Navigation sidebar
    ├── SettingsSection.tsx     # Section wrapper
    ├── SettingsSubSection.tsx  # Sub-section wrapper
    ├── ToggleSwitch.tsx        # Reusable toggle
    ├── SaveButton.tsx          # Save button
    ├── NotificationsSection.tsx # Notifications content
    ├── SystemSection.tsx       # System content
    ├── AutomationSection.tsx   # Automation content
    └── ReportsSection.tsx      # Reports content
```

## 🧩 **COMPONENT BREAKDOWN**

### **1. SettingsLayout.tsx**
```tsx
// Layout wrapper với header
- Header với icon và title
- Container styling
- Responsive layout
```

### **2. SettingsSidebar.tsx**
```tsx
// Navigation sidebar
- Menu items array
- Active state management
- Click handlers
- Icons và styling
```

### **3. ToggleSwitch.tsx**
```tsx
// Reusable toggle component
- Props: id, checked, onChange, title, description
- Consistent styling
- Accessibility support
- Disabled state
```

### **4. SettingsSection.tsx**
```tsx
// Section wrapper
- Props: title, description, children
- Consistent section styling
- Spacing management
```

### **5. SettingsSubSection.tsx**
```tsx
// Sub-section wrapper
- Props: title, icon, children, hasBorder
- Visual hierarchy
- Optional border separator
- Icon support
```

### **6. Content Sections**
```tsx
// NotificationsSection.tsx
- Discord notifications
- Order notifications
- Push notifications
- Email marketing

// SystemSection.tsx
- Security & session
- Analytics tracking
- Payment methods

// AutomationSection.tsx
- Low stock alerts
- Chatbot support
- Auto voucher suggestion

// ReportsSection.tsx
- Daily reports toggle
- Report interval selector
- Test button
- Info box
```

## 🔄 **REUSABILITY BENEFITS**

### **1. ToggleSwitch Component**
```tsx
// Sử dụng ở nhiều nơi
<ToggleSwitch
  id="discordNotifications"
  checked={settings.discordNotifications}
  onChange={() => onToggle('discordNotifications')}
  title="Thông báo Discord"
  description="Nhận thông báo qua Discord webhook"
/>
```

### **2. SettingsSubSection Component**
```tsx
// Tạo visual hierarchy
<SettingsSubSection
  title="Thông báo hệ thống"
  icon={MdNotifications}
  hasBorder={true}
>
  {/* Content */}
</SettingsSubSection>
```

### **3. Consistent Styling**
- Tất cả components dùng chung design system
- Spacing, colors, typography nhất quán
- Easy maintenance và updates

## 📊 **PROPS INTERFACE**

### **ToggleSwitch Props:**
```typescript
interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  disabled?: boolean;
}
```

### **Section Props:**
```typescript
interface NotificationsSectionProps {
  settings: SettingsData;
  onToggle: (key: keyof SettingsData) => void;
}

interface SystemSectionProps {
  settings: SettingsData;
  onToggle: (key: keyof Omit<SettingsData, 'sessionTimeout'>) => void;
  onSessionTimeoutChange: (value: number) => void;
}
```

## 🎯 **ADVANTAGES**

### **1. Maintainability**
- ✅ Mỗi component có responsibility riêng
- ✅ Easy to debug và fix issues
- ✅ Clear separation of concerns

### **2. Reusability**
- ✅ ToggleSwitch có thể dùng ở pages khác
- ✅ SettingsLayout có thể dùng cho settings khác
- ✅ Consistent UI patterns

### **3. Scalability**
- ✅ Dễ thêm sections mới
- ✅ Dễ thêm settings mới
- ✅ Component composition pattern

### **4. Testing**
- ✅ Test từng component riêng biệt
- ✅ Mock props dễ dàng
- ✅ Unit testing friendly

## 🔧 **USAGE EXAMPLES**

### **Thêm Setting Mới:**
```tsx
// Trong SystemSection.tsx
<ToggleSwitch
  id="newFeature"
  checked={settings.newFeature}
  onChange={() => onToggle('newFeature')}
  title="Tính năng mới"
  description="Mô tả tính năng mới"
/>
```

### **Thêm Section Mới:**
```tsx
// Tạo NewSection.tsx
const NewSection = ({ settings, onToggle }) => (
  <SettingsSection
    title="Section Mới"
    description="Mô tả section mới"
  >
    <ToggleSwitch ... />
  </SettingsSection>
);

// Trong page.tsx
{activeSection === 'new' && (
  <NewSection
    settings={settings}
    onToggle={handleToggle}
  />
)}
```

## 🚀 **FUTURE ENHANCEMENTS**

### **1. Form Validation**
- Add validation cho settings
- Error states cho components
- Form submission handling

### **2. Animation**
- Smooth transitions between sections
- Loading states
- Micro-interactions

### **3. Accessibility**
- ARIA labels
- Keyboard navigation
- Screen reader support

### **4. Theming**
- Dark mode support
- Custom color schemes
- CSS variables

## 📝 **BEST PRACTICES**

### **1. Component Design**
- ✅ Single responsibility principle
- ✅ Props interface clearly defined
- ✅ Default props when needed
- ✅ TypeScript for type safety

### **2. File Organization**
- ✅ Components trong folder riêng
- ✅ Naming convention nhất quán
- ✅ Export/import clean

### **3. State Management**
- ✅ Props drilling minimal
- ✅ State ở level phù hợp
- ✅ Event handlers clear

## ✅ **COMPLETED**

**Settings page đã được refactor thành component architecture hoàn chỉnh:**

- ✅ **10 components** tái sử dụng được
- ✅ **Clean separation** of concerns
- ✅ **TypeScript** interfaces đầy đủ
- ✅ **Consistent styling** across components
- ✅ **Easy maintenance** và scalability
- ✅ **Production ready** architecture

**Component architecture đã sẵn sàng cho development và maintenance!** 🎉
