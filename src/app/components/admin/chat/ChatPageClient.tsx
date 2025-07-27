'use client';

import { useState, useEffect } from 'react';
import { MessageType, SafeUser } from '../../../../../types';
import { ChatRoom, User } from '@prisma/client';
import Body from './Body';
import ChatForm from './ChatForm';
import Header from './Header';
import CustomerInfoPanel from './CustomerInfoPanel';
import MessageSearch from './MessageSearch';

interface ChatPageClientProps {
  conversation: ChatRoom & { users: User[] };
  messages: MessageType[];
  currentUser: SafeUser | null;
  chatRoomId: string;
}

const ChatPageClient: React.FC<ChatPageClientProps> = ({ conversation, messages, currentUser, chatRoomId }) => {
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F to open search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Esc to close search
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setHighlightedMessageId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const handleHighlightMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);

    // Scroll to highlighted message
    setTimeout(() => {
      const element = document.getElementById(`message-${messageId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  return (
    <div className='h-full flex'>
      {/* Main Chat Area */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Header */}
        <Header
          conversation={conversation}
          onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
          onToggleCustomerInfo={() => setIsCustomerPanelOpen(!isCustomerPanelOpen)}
        />

        {/* Message Search */}
        <MessageSearch
          messages={messages}
          isOpen={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false);
            setHighlightedMessageId(null);
          }}
          onHighlightMessage={handleHighlightMessage}
        />

        {/* Chat Body */}
        <Body
          Messages={messages}
          currentUser={currentUser}
          chatRoomId={chatRoomId}
          highlightedMessageId={highlightedMessageId}
          searchQuery={isSearchOpen ? '' : undefined} // Pass search query when needed
        />

        {/* Chat Form */}
        <ChatForm chatRoomId={chatRoomId} />
      </div>

      {/* Customer Info Panel */}
      <CustomerInfoPanel
        conversation={conversation}
        isOpen={isCustomerPanelOpen}
        onClose={() => setIsCustomerPanelOpen(false)}
      />
    </div>
  );
};

export default ChatPageClient;
