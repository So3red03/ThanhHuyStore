# Admin Notification System

## Overview
Professional notification system for admin panel with real-time updates, modern UX/UI design, and comprehensive message management.

## Key Components

### 1. NotificationSystem.tsx
Centralized notification management with:
- Real-time Pusher integration
- Smart notification queuing
- Auto-dismiss with hover pause
- Professional toast animations

### 2. NotificationToast.tsx
Professional notification toast component featuring:
- Type-based icons and colors (ORDER_PLACED, MESSAGE_RECEIVED, LOW_STOCK, etc.)
- Smooth slide-in animation from top-right
- Click to navigate functionality
- Progress bar with pause on hover
- Professional gradient backgrounds

### 3. MessageToast.tsx
Specialized message toast for chat notifications:
- Elegant chat-like design
- Sender avatar and name display
- Message preview with image indicator
- Click to open chat functionality
- Auto-dismiss with smooth animations

### 4. AdminNavNew.tsx
Enhanced admin navigation with:
- Real-time notification badge
- Real-time message badge with unread count
- Professional dropdown menus
- Integrated notification system

## Features

### ✅ Real-time Notifications
- **Pusher Integration**: Real-time updates via WebSocket
- **Smart Queuing**: Prevents notification spam
- **Auto-dismiss**: 6 seconds for notifications, 5 seconds for messages
- **Hover Pause**: Pause auto-dismiss on hover

### ✅ Professional UX/UI
- **Material Design**: Consistent with design system
- **Smooth Animations**: Slide-in transitions and hover effects
- **Type-based Styling**: Different colors/icons for different notification types
- **Progress Indicators**: Visual feedback for auto-dismiss timing

### ✅ Message Management
- **Unread Count**: Real-time badge updates
- **Mark as Read**: Bulk mark messages as read
- **Chat Integration**: Direct navigation to chat rooms
- **Image Support**: Visual indicators for image messages

### ✅ Notification Types
- `ORDER_PLACED`: New order notifications (blue gradient)
- `MESSAGE_RECEIVED`: Chat messages (green gradient)
- `LOW_STOCK`: Inventory alerts (orange gradient)
- `COMMENT_RECEIVED`: Article comments (purple gradient)
- `SYSTEM_ALERT`: System notifications (gray gradient)

## API Endpoints

### GET /api/notifications/messages
Fetch recent messages for admin with:
- Sender information
- Read status
- Conversation details
- Image indicators

### PUT /api/notifications/messages/mark-read
Mark all messages as read for current admin user

### GET /api/notifications
Fetch notifications for current user

### PUT /api/notifications/mark-all-read
Mark all notifications as read

## Pusher Channels

### admin-notifications
- Event: `notification`
- Payload: Notification data with type, title, message
- Triggers: Order placed, low stock, system alerts

### admin-messages
- Event: `new-message`
- Payload: Message data with sender, content, conversation
- Triggers: New chat messages from customers

## Usage Example

```tsx
import NotificationSystem from './NotificationSystem';

const AdminLayout = ({ currentUser }) => {
  return (
    <div>
      {/* Your admin layout */}
      <NotificationSystem currentUser={currentUser} />
    </div>
  );
};
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_key
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_pusher_secret
```

### Notification Settings
- **Duration**: Configurable auto-dismiss timing
- **Queue Size**: Unlimited with smart processing
- **Sound**: Optional sound notifications (can be enabled)
- **Position**: Top-right corner with responsive positioning

## Best Practices

### 1. Performance
- Efficient Pusher subscription management
- Smart component unmounting
- Minimal re-renders with proper state management

### 2. UX Guidelines
- Non-intrusive positioning
- Clear visual hierarchy
- Consistent interaction patterns
- Accessible design with proper ARIA labels

### 3. Error Handling
- Graceful fallbacks for network issues
- Proper cleanup on component unmount
- Error boundaries for toast components

## Future Enhancements

### Planned Features
- [ ] Sound notifications with user preferences
- [ ] Notification history panel
- [ ] Custom notification templates
- [ ] Push notifications for mobile
- [ ] Notification scheduling
- [ ] Advanced filtering and search

### Performance Optimizations
- [ ] Virtual scrolling for large notification lists
- [ ] Notification batching for high-volume scenarios
- [ ] Offline notification queuing
- [ ] Service worker integration

## Troubleshooting

### Common Issues
1. **Notifications not appearing**: Check Pusher connection and channel subscriptions
2. **Badge count incorrect**: Verify API endpoints and real-time updates
3. **Toast positioning**: Check z-index and responsive breakpoints
4. **Performance issues**: Monitor component re-renders and cleanup

### Debug Mode
Enable development mode to see queue status indicator:
```tsx
// Shows notification and message queue counts in bottom-left corner
{process.env.NODE_ENV === 'development' && <QueueStatusIndicator />}
```
