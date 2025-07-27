'use client';

import { MessageType } from '../../../../../types';

interface HighlightedMessageProps {
  message: MessageType;
  searchQuery: string;
  isHighlighted: boolean;
}

const HighlightedMessage: React.FC<HighlightedMessageProps> = ({
  message,
  searchQuery,
  isHighlighted
}) => {
  // Function to highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark
            key={index}
            className="bg-yellow-200 text-yellow-900 px-1 rounded"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isHighlighted 
          ? 'bg-blue-50 border-l-4 border-blue-500 shadow-md' 
          : ''
      }`}
      id={`message-${message.id}`}
    >
      {message.body && searchQuery ? (
        <span>{highlightText(message.body, searchQuery)}</span>
      ) : (
        <span>{message.body}</span>
      )}
    </div>
  );
};

export default HighlightedMessage;
