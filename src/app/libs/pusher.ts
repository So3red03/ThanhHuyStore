import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Khởi tạo Pusher trên máy chủ
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: 'ap1',
  useTLS: true
});
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
  cluster: 'ap1',
  enabledTransports: ['ws', 'wss'], // Prioritize WebSocket for faster connection
  disabledTransports: ['xhr_polling', 'xhr_streaming'], // Disable slower transports
  pongTimeout: 5000, // Reduced to 5 seconds for faster detection
  unavailableTimeout: 5000, // Reduced to 5 seconds for faster reconnection
  activityTimeout: 10000, // 10 seconds activity timeout
  forceTLS: true, // Force secure connection
  enableStats: false // Disable stats for better performance
});
