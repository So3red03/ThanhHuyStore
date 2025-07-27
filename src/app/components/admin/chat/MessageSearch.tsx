'use client';

import { useState, useEffect, useRef } from 'react';
import { MdSearch, MdClose, MdKeyboardArrowUp, MdKeyboardArrowDown, MdClear } from 'react-icons/md';
import { MessageType } from '../../../../../types';

interface MessageSearchProps {
  messages: MessageType[];
  isOpen: boolean;
  onClose: () => void;
  onHighlightMessage: (messageId: string) => void;
}

interface SearchResult {
  messageId: string;
  messageIndex: number;
  matchText: string;
  context: string;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ messages, isOpen, onClose, onHighlightMessage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      return;
    }

    setIsSearching(true);

    // Debounce search
    const timeoutId = setTimeout(() => {
      const results: SearchResult[] = [];
      const query = searchQuery.toLowerCase();

      messages.forEach((message, index) => {
        if (message.body && message.body.toLowerCase().includes(query)) {
          // Create context (surrounding text)
          const bodyLower = message.body.toLowerCase();
          const matchIndex = bodyLower.indexOf(query);
          const contextStart = Math.max(0, matchIndex - 20);
          const contextEnd = Math.min(message.body.length, matchIndex + query.length + 20);

          let context = message.body.substring(contextStart, contextEnd);
          if (contextStart > 0) context = '...' + context;
          if (contextEnd < message.body.length) context = context + '...';

          results.push({
            messageId: message.id,
            messageIndex: index,
            matchText: message.body.substring(matchIndex, matchIndex + query.length),
            context
          });
        }
      });

      setSearchResults(results);
      setCurrentResultIndex(0);
      setIsSearching(false);

      // Highlight first result
      if (results.length > 0) {
        onHighlightMessage(results[0].messageId);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, messages, onHighlightMessage]);

  // Navigate results
  const navigateResults = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0;
    } else {
      newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1;
    }

    setCurrentResultIndex(newIndex);
    onHighlightMessage(searchResults[newIndex].messageId);
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        navigateResults('prev');
      } else {
        navigateResults('next');
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(0);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 shadow-lg'>
      <div className='flex items-center gap-4 p-4'>
        {/* Search Icon */}
        <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md'>
          <MdSearch className='text-white' size={20} />
        </div>

        {/* Search Input */}
        <div className='flex-1 relative'>
          <input
            ref={inputRef}
            type='text'
            placeholder='Tìm kiếm tin nhắn...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className='w-full px-4 py-3 pr-10 border-2 border-white/50 rounded-xl focus:outline-none focus:border-blue-400 text-sm bg-white/80 backdrop-blur-sm shadow-sm placeholder-gray-500 transition-all duration-200'
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all'
            >
              <MdClear size={16} />
            </button>
          )}
        </div>

        {/* Results Counter */}
        {searchQuery && (
          <div className='bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-white/50'>
            {isSearching ? (
              <div className='flex items-center gap-2 text-blue-600'>
                <div className='w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
                <span className='text-sm font-medium'>Đang tìm...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <span className='text-sm font-bold text-blue-700'>
                {currentResultIndex + 1} / {searchResults.length}
              </span>
            ) : (
              <span className='text-sm font-medium text-red-600'>Không tìm thấy</span>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        {searchResults.length > 0 && (
          <div className='flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-white/50'>
            <button
              onClick={() => navigateResults('prev')}
              className='p-2 rounded-lg hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-all duration-200 group'
              title='Kết quả trước (Shift+Enter)'
            >
              <MdKeyboardArrowUp size={18} className='group-hover:scale-110 transition-transform' />
            </button>
            <button
              onClick={() => navigateResults('next')}
              className='p-2 rounded-lg hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-all duration-200 group'
              title='Kết quả tiếp theo (Enter)'
            >
              <MdKeyboardArrowDown size={18} className='group-hover:scale-110 transition-transform' />
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className='p-2 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 group bg-white/80 backdrop-blur-sm shadow-sm border border-white/50'
          title='Đóng (Esc)'
        >
          <MdClose size={18} className='group-hover:rotate-90 transition-all' />
        </button>
      </div>

      {/* Search Tips */}
      {!searchQuery && (
        <div className='px-4 pb-4'>
          <div className='text-xs text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-sm'>
            <div className='space-y-1 text-gray-600'>
              <div>
                • <kbd className='px-1 py-0.5 bg-gray-200 rounded text-xs'>Enter</kbd> - Kết quả tiếp theo
              </div>
              <div>
                • <kbd className='px-1 py-0.5 bg-gray-200 rounded text-xs'>Shift+Enter</kbd> - Kết quả trước
              </div>
              <div>
                • <kbd className='px-1 py-0.5 bg-gray-200 rounded text-xs'>Esc</kbd> - Đóng tìm kiếm
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
