'use client';

import { useState, useEffect } from 'react';
import { pusherClient } from '@/app/libs/pusher';

const PusherConnectionStatus = () => {
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [connectionCount, setConnectionCount] = useState<number>(0);

  useEffect(() => {
    // Listen to Pusher connection state changes
    const handleStateChange = (states: any) => {
      // Handle both string and object state changes
      const newState = typeof states === 'string' ? states : states?.current || 'unknown';
      setConnectionState(String(newState));
    };

    // Bind to connection state changes
    pusherClient.connection.bind('state_change', handleStateChange);

    // Set initial state safely
    const initialState = pusherClient.connection.state;
    setConnectionState(String(initialState || 'disconnected'));

    // Track connection count (rough estimate)
    const interval = setInterval(() => {
      try {
        // This is a rough estimate - Pusher doesn't expose exact connection count
        const channelCount = pusherClient.channels?.channels ? Object.keys(pusherClient.channels.channels).length : 0;
        setConnectionCount(channelCount);
      } catch (error) {
        console.warn('Error getting channel count:', error);
        setConnectionCount(0);
      }
    }, 5000);

    return () => {
      pusherClient.connection.unbind('state_change', handleStateChange);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'disconnected':
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'disconnected':
      case 'failed':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`border rounded-lg p-3 mb-4 ${getStatusColor(connectionState)}`}>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>{getStatusIcon(connectionState)}</span>
          <div>
            <h4 className='font-medium text-sm'>Pusher Connection</h4>
            <p className='text-xs opacity-75'>
              Status: {connectionState} | Channels: {connectionCount}
            </p>
          </div>
        </div>
        {connectionState === 'failed' && (
          <button
            onClick={() => pusherClient.connect()}
            className='px-2 py-1 text-xs bg-white rounded border hover:bg-gray-50'
          >
            Reconnect
          </button>
        )}
      </div>

      {connectionCount > 5 && (
        <div className='mt-2 text-xs text-orange-600'>
          ⚠️ High channel count ({connectionCount}). Consider refreshing if experiencing issues.
        </div>
      )}
    </div>
  );
};

export default PusherConnectionStatus;
